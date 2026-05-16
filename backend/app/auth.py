import hashlib
import os
import secrets
from datetime import datetime, timedelta
from typing import Optional, Tuple

from jose import JWTError, jwt
from sqlalchemy.orm import Session

from .email_utils import send_otp_email
from .models import OtpCode, User

# Try to import Authentica integration
try:
    from .authentica import send_otp_via_authentica, verify_otp_via_authentica, should_use_testing_mode as authentica_testing_mode
    AUTHENTICA_AVAILABLE = True
except ImportError:
    AUTHENTICA_AVAILABLE = False


def generate_otp_code() -> str:
    # SECURITY: use a CSPRNG (secrets) rather than the Mersenne Twister
    # `random` module so OTP codes cannot be predicted from observed values.
    return f"{secrets.randbelow(1_000_000):06d}"


def hash_code(code: str) -> str:
    return hashlib.sha256(code.encode("utf-8")).hexdigest()


def create_and_send_otp(db: Session, user: User, use_authentica: bool = True) -> None:
    """
    Create and send OTP code to user.
    
    Args:
        db: Database session
        user: User object
        use_authentica: If True, use Authentica API; if False, use email
    """
    # Check if we're using Authentica API
    if use_authentica and AUTHENTICA_AVAILABLE and not authentica_testing_mode():
        # Use Authentica API for OTP
        code = f"{secrets.randbelow(1_000_000):06d}"  # 6-digit CSPRNG OTP
        code_hash = hash_code(code)
        expires_at = datetime.utcnow() + timedelta(minutes=5)
        
        # Store OTP in database
        otp = OtpCode(user_id=user.id, code_hash=code_hash, expires_at=expires_at, is_used=False)
        db.add(otp)
        db.commit()
        db.refresh(otp)
        
        # Send OTP via Authentica
        try:
            result = send_otp_via_authentica(
                phone=user.mobile if user.mobile else None,
                email=user.email,
                method="sms" if user.mobile else "email",
                custom_otp=code
            )
            
            if result.get("success"):
                print(f"[AUTHENTICA] OTP sent successfully to {user.mobile or user.email}")
            else:
                print(f"[AUTHENTICA] Failed to send OTP: {result.get('message')}")
                # Fallback to email
                send_otp_email(to_email=user.email, code=code, full_name=user.full_name)
        except Exception as e:
            print(f"[AUTHENTICA] Error: {e}")
            # Fallback to email
            send_otp_email(to_email=user.email, code=code, full_name=user.full_name)
    else:
        # Use original email-based OTP (for testing or fallback)
        # SECURITY: the master/testing OTP shortcut is ONLY allowed when the
        # process is explicitly NOT in production. In production it is ignored
        # even if the variable is somehow set, so a leaked dev value cannot
        # become a master password.
        is_production = os.getenv("PRODUCTION", "1").lower() in {"1", "true", "yes"}
        testing_otp = "" if is_production else os.getenv("DEV_TESTING_OTP", "")

        if testing_otp:
            # Use the fixed testing code (e.g., "1234") — dev only
            code = testing_otp
            print(f"[DEV MODE] Using fixed testing OTP for {user.email}")
        else:
            # Generate cryptographically secure 6-digit code
            code = f"{secrets.randbelow(1_000_000):06d}"
        
        code_hash = hash_code(code)
        expires_at = datetime.utcnow() + timedelta(minutes=5)

        otp = OtpCode(user_id=user.id, code_hash=code_hash, expires_at=expires_at, is_used=False)
        db.add(otp)
        db.commit()
        db.refresh(otp)

        # Try to send email, but if it fails (no email server configured), just log and continue
        try:
            send_otp_email(to_email=user.email, code=code, full_name=user.full_name)
            print(f"[AUTH] OTP email sent successfully to {user.email}")
        except Exception as e:
            # Email sending failed - this is OK for testing/development
            print(f"[AUTH] Failed to send OTP email to {user.email}: {e}")
            print(f"[AUTH] User can still login with the OTP code: {code if testing_otp else '(generated but not sent)'}")
            if not testing_otp:
                # If email fails and no testing OTP is set, provide helpful message
                print("[AUTH] HINT: Set DEV_TESTING_OTP=1234 environment variable to use a fixed testing code")


def verify_otp_code(db: Session, user: User, code: str) -> bool:
    now = datetime.utcnow()
    code_hash = hash_code(code)

    otp = (
        db.query(OtpCode)
        .filter(
            OtpCode.user_id == user.id,
            OtpCode.code_hash == code_hash,
            OtpCode.is_used.is_(False),
            OtpCode.expires_at >= now,
        )
        .order_by(OtpCode.created_at.desc())
        .first()
    )

    if not otp:
        return False

    otp.is_used = True
    db.add(otp)
    db.commit()
    return True


def get_jwt_settings() -> Tuple[str, str, int]:
    secret_key = os.getenv("JWT_SECRET_KEY", "")
    # SECURITY: never fall back to a placeholder. A weak or known secret allows
    # an attacker to forge valid tokens and impersonate any user.
    if not secret_key or len(secret_key) < 32 or secret_key.lower() in {
        "change_me",
        "change_me_to_a_strong_random_secret_key_32_chars",
        "your-secret-key-change-in-production",
    }:
        raise RuntimeError(
            "JWT_SECRET_KEY is missing, too short, or a known placeholder. "
            "Set a cryptographically-random value (openssl rand -hex 32) in the "
            "deployment environment before starting the server."
        )
    algorithm = os.getenv("JWT_ALGORITHM", "HS256")
    expire_minutes = int(os.getenv("JWT_ACCESS_TOKEN_EXPIRE_MINUTES", "60"))
    return secret_key, algorithm, expire_minutes


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    secret_key, algorithm, default_expire_minutes = get_jwt_settings()

    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=default_expire_minutes)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, secret_key, algorithm=algorithm)
    return encoded_jwt


def decode_access_token(token: str) -> Optional[dict]:
    secret_key, algorithm, _ = get_jwt_settings()
    try:
        payload = jwt.decode(token, secret_key, algorithms=[algorithm])
        return payload
    except JWTError:
        return None

