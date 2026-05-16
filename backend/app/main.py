import hmac
import os
from datetime import datetime, timedelta
from typing import List


def hmac_compare(a: str, b: str) -> bool:
    """Constant-time string comparison wrapper."""
    try:
        return hmac.compare_digest(str(a or ""), str(b or ""))
    except Exception:
        return False

from fastapi import Depends, FastAPI, HTTPException, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from pydantic import BaseModel

from . import auth
try:
    from . import payflowly
except ImportError:
    payflowly = None
from .database import Base, engine, get_db
from .models import Animal, Telemetry, User
from .schemas import (
    AdminCreateUser,
    AdminDeviceRead,
    AnimalCreate,
    AnimalRead,
    RequestOtpPayload,
    TelemetryIn,
    TelemetryRead,
    TokenResponse,
    UserRead,
    VerifyOtpPayload,
)

Base.metadata.create_all(bind=engine)

app = FastAPI(title="SmartHerd API")

origins = [
    # Production domains
    "https://rightIotsa.com",
    "https://www.rightIotsa.com",
    "https://rightiotsa.com",
    "https://www.rightiotsa.com",
    "https://api.rightIotsa.com",
    "https://api.rightiotsa.com",
    # Future domain
    "https://Rightinsurtech.com",
    "https://www.Rightinsurtech.com",
    # Development
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="verify-otp")


def get_admin_email() -> str:
    # Default to the local dev test user if ADMIN_EMAIL is not set,
    # so /admin-portal works out of the box after dev test login.
    return os.getenv("ADMIN_EMAIL", "test@example.com")


def dev_test_login_enabled() -> bool:
    """Check whether dev test login/bypass is enabled.

    SECURITY: defaults to DISABLED. Must be explicitly opted-in for local dev
    by setting DEV_ENABLE_TEST_LOGIN=1 AND PRODUCTION!=1. In production the
    flag is ignored even if set, so a stray env value cannot unlock the
    auth bypass.
    """
    is_production = os.getenv("PRODUCTION", "1").lower() in {"1", "true", "yes"}
    if is_production:
        return False
    value = os.getenv("DEV_ENABLE_TEST_LOGIN", "0")
    return value.lower() in {"1", "true", "yes"}


def get_or_create_test_user(db: Session) -> User:
    """Ensure a test user (and basic data) exists for local development."""
    from datetime import datetime, timedelta
    from sqlalchemy import text
    
    # Use a syntactically valid, non-reserved domain so Pydantic/email-validator accepts it.
    email = os.getenv("DEV_TEST_USER_EMAIL", "test@example.com").lower()

    user = db.query(User).filter(User.email == email).first()
    if not user:
        user = User(full_name="Test User", email=email, is_active=True)
        db.add(user)
        db.commit()
        db.refresh(user)
    
    # Create demo animals for the test user if they don't exist
    demo_animals = [
        {"name": "خزامة", "species": "Camel", "imei": "DEMO_CAMEL_001", "lat": 24.7136, "lon": 46.6753},  # Riyadh
        {"name": "عنتر", "species": "Horse", "imei": "DEMO_HORSE_001", "lat": 24.7200, "lon": 46.6800},
        {"name": "شاهين", "species": "Falcon", "imei": "DEMO_FALCON_001", "lat": 24.7100, "lon": 46.6900},
    ]
    
    for demo in demo_animals:
        # Create animal if it doesn't exist
        existing = db.query(Animal).filter(Animal.device_imei == demo["imei"]).first()
        if not existing:
            animal = Animal(
                name=demo["name"],
                species=demo["species"],
                device_imei=demo["imei"],
                owner_id=user.id
            )
            db.add(animal)
            db.commit()
        
        # Always ensure telemetry exists (at least one record)
        telemetry_count = db.query(Telemetry).filter(Telemetry.device_imei == demo["imei"]).count()
        if telemetry_count == 0:
            telemetry = Telemetry(
                device_imei=demo["imei"],
                lat=demo["lat"],
                lng=demo["lon"],
                timestamp=datetime.utcnow()
            )
            db.add(telemetry)
            db.commit()
        
        # Create health data for Horse if it doesn't exist
        if demo["species"] == "Horse":
            health_count = db.execute(
                text("SELECT COUNT(*) FROM health_data WHERE device_imei = :imei"),
                {"imei": demo["imei"]}
            ).scalar()
            
            if health_count == 0:
                db.execute(
                    text("""
                    INSERT INTO health_data (device_imei, heart_rate, temperature, recorded_at)
                    VALUES (:imei, :heart_rate, :temperature, :recorded_at)
                    """),
                    {
                        "imei": demo["imei"],
                        "heart_rate": 85,
                        "temperature": 37.5,
                        "recorded_at": datetime.utcnow()
                    }
                )
                db.commit()

    return user


async def get_current_user(
    token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)
) -> User:
    payload = auth.decode_access_token(token)
    if not payload:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")

    user_id = payload.get("sub")
    if user_id is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token payload")

    user = db.query(User).filter(User.id == int(user_id)).first()
    if not user or not user.is_active:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Inactive user")
    return user


async def get_current_admin(user: User = Depends(get_current_user)) -> User:
    admin_email = get_admin_email()
    if not admin_email or user.email.lower() != admin_email.lower():
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin access required")
    return user


@app.post("/send-otp", status_code=204)
def request_otp(payload: RequestOtpPayload, db: Session = Depends(get_db)) -> None:
    """
    Request OTP for login/registration.
    Accepts either email or mobile number.
    If user doesn't exist, create a new user with the provided details.
    Endpoint: POST /send-otp
    """
    # Determine if input is email or mobile
    identifier = payload.email_or_mobile if hasattr(payload, 'email_or_mobile') and payload.email_or_mobile else payload.email
    
    # Check if identifier is email or mobile
    is_email = '@' in identifier
    
    if is_email:
        user = db.query(User).filter(User.email == identifier.lower()).first()
    else:
        # Normalize mobile number (remove spaces, dashes)
        normalized_mobile = identifier.replace(' ', '').replace('-', '')
        user = db.query(User).filter(User.mobile == normalized_mobile).first()
    
    if not user:
        # Create new user (registration)
        # For registration, we need email
        if not is_email and not payload.email:
            raise HTTPException(status_code=400, detail="Email is required for registration")
        
        user = User(
            email=payload.email.lower() if payload.email else identifier.lower(),
            full_name=payload.full_name,
            national_id=payload.national_id,
            mobile=payload.mobile if payload.mobile else (identifier if not is_email else None),
            city=payload.city,
            asset_type=payload.asset_type,
            is_active=True
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    else:
        # Update user info if provided (optional)
        if payload.full_name:
            user.full_name = payload.full_name
        if payload.national_id:
            user.national_id = payload.national_id
        if payload.mobile:
            user.mobile = payload.mobile
        if payload.city:
            user.city = payload.city
        if payload.asset_type:
            user.asset_type = payload.asset_type
        db.commit()
        if payload.city:
            user.city = payload.city
        if payload.asset_type:
            user.asset_type = payload.asset_type
        db.commit()

    try:
        auth.create_and_send_otp(db=db, user=user)
    except Exception as exc:  # noqa: BLE001
        # SECURITY: do not leak internal exception details (SMTP errors,
        # library messages, secret names) to unauthenticated callers.
        import logging
        logging.error("OTP send failed for user %s: %s", getattr(user, "id", "?"), exc)
        raise HTTPException(
            status_code=500,
            detail="Failed to send verification code. Please try again.",
        ) from exc


@app.post("/verify-otp", response_model=TokenResponse)
def verify_otp(payload: VerifyOtpPayload, db: Session = Depends(get_db)) -> TokenResponse:
    """
    Verify OTP code for login.
    Accepts either email or mobile number.
    """
    # Determine if input is email or mobile
    identifier = payload.email_or_mobile
    is_email = '@' in identifier
    
    if is_email:
        user = db.query(User).filter(User.email == identifier.lower()).first()
    else:
        # Normalize mobile number
        normalized_mobile = identifier.replace(' ', '').replace('-', '')
        user = db.query(User).filter(User.mobile == normalized_mobile).first()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if not auth.verify_otp_code(db=db, user=user, code=payload.code):
        raise HTTPException(status_code=400, detail="Invalid or expired code")

    is_admin = user.email.lower() == get_admin_email().lower()
    access_token = auth.create_access_token(
        data={"sub": str(user.id), "email": user.email, "is_admin": is_admin}
    )

    user_read = UserRead.model_validate(user)
    return TokenResponse(access_token=access_token, user=user_read, is_admin=is_admin)


@app.post("/dev/test-login", response_model=TokenResponse)
def dev_test_login(db: Session = Depends(get_db)) -> TokenResponse:
    """Development-only endpoint to bypass OTP and log in as a test user.

    Enabled by default for local runs; can be disabled with DEV_ENABLE_TEST_LOGIN=0.
    Auto-creates subscription for admin users.
    """
    if not dev_test_login_enabled():
        raise HTTPException(status_code=404, detail="Not found")

    user = get_or_create_test_user(db)
    is_admin = user.email.lower() == get_admin_email().lower()
    
    # Auto-create subscriptions for admin/test users
    if is_admin:
        # Check if admin already has subscriptions
        existing_sub = db.execute(
            text("SELECT id FROM subscriptions WHERE user_id = :user_id AND is_active = TRUE LIMIT 1"),
            {"user_id": user.id}
        ).fetchone()
        
        if not existing_sub:
            # Create all three plan subscriptions for admin
            start_date = datetime.utcnow()
            end_date = start_date + timedelta(days=365)
            
            for plan_id, price in [("CAMEL_ANNUAL", 495.0), ("HORSE_ANNUAL", 695.0), ("FALCON_ANNUAL", 995.0)]:
                db.execute(
                    text("""
                    INSERT INTO subscriptions (user_id, plan, price_sar, start_date, end_date, is_active)
                    VALUES (:user_id, :plan, :price, :start_date, :end_date, TRUE)
                    """),
                    {
                        "user_id": user.id,
                        "plan": plan_id,
                        "price": price,
                        "start_date": start_date,
                        "end_date": end_date
                    }
                )
            db.commit()
    
    access_token = auth.create_access_token(
        data={"sub": str(user.id), "email": user.email, "is_admin": is_admin}
    )
    user_read = UserRead.model_validate(user)
    return TokenResponse(access_token=access_token, user=user_read, is_admin=is_admin)


@app.post("/webhook/iot-data", status_code=201)
def ingest_iot_data(
    telemetry_in: TelemetryIn,
    request: Request,
    db: Session = Depends(get_db),
):
    # SECURITY: the webhook secret is REQUIRED. If unset we refuse the request
    # rather than fall through to an open endpoint that can be used to inject
    # arbitrary telemetry for any known device IMEI.
    expected_secret = os.getenv("IOT_WEBHOOK_SECRET", "").strip()
    if not expected_secret or len(expected_secret) < 16:
        raise HTTPException(status_code=503, detail="Webhook not configured")
    provided_secret = request.headers.get("X-Webhook-Secret")
    if not provided_secret or not hmac_compare(provided_secret, expected_secret):
        raise HTTPException(status_code=401, detail="Invalid webhook secret")

    animal = db.query(Animal).filter(Animal.device_imei == telemetry_in.device_imei).first()
    if not animal:
        raise HTTPException(status_code=404, detail="Unknown device IMEI")

    ts = telemetry_in.timestamp or datetime.utcnow()
    record = Telemetry(
        device_imei=telemetry_in.device_imei,
        lat=telemetry_in.lat,
        lng=telemetry_in.lng,
        battery=telemetry_in.battery,
        status=telemetry_in.status,
        timestamp=ts,
    )
    db.add(record)
    db.commit()
    db.refresh(record)

    return {"id": record.id}


@app.get("/me", response_model=UserRead)
def read_current_user(current_user: User = Depends(get_current_user)) -> User:
    return current_user


@app.get("/animals", response_model=List[AnimalRead])
def list_my_animals(
    current_user: User = Depends(get_current_user), db: Session = Depends(get_db)
) -> List[AnimalRead]:
    animals = db.query(Animal).filter(Animal.owner_id == current_user.id).all()
    result = []
    for animal in animals:
        # Get last telemetry timestamp for connectivity status
        last_telemetry = (
            db.query(Telemetry)
            .filter(Telemetry.device_imei == animal.device_imei)
            .order_by(Telemetry.timestamp.desc())
            .first()
        )
        animal_dict = {
            "id": animal.id,
            "name": animal.name,
            "species": animal.species,
            "device_imei": animal.device_imei,
            "last_seen_at": last_telemetry.timestamp if last_telemetry else None
        }
        result.append(AnimalRead.model_validate(animal_dict))
    return result


@app.get("/animals/{animal_id}/latest-telemetry", response_model=TelemetryRead)
def get_latest_telemetry(
    animal_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> TelemetryRead:
    animal = (
        db.query(Animal)
        .filter(Animal.id == animal_id, Animal.owner_id == current_user.id)
        .first()
    )
    if not animal:
        raise HTTPException(status_code=404, detail="Animal not found")

    record = (
        db.query(Telemetry)
        .filter(Telemetry.device_imei == animal.device_imei)
        .order_by(Telemetry.timestamp.desc())
        .first()
    )
    if not record:
        raise HTTPException(status_code=404, detail="No telemetry yet")

    return TelemetryRead.model_validate(record)


@app.get("/animals/{animal_id}/telemetry", response_model=List[TelemetryRead])
def list_telemetry(
    animal_id: int,
    limit: int = 10,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> List[TelemetryRead]:
    animal = (
        db.query(Animal)
        .filter(Animal.id == animal_id, Animal.owner_id == current_user.id)
        .first()
    )
    if not animal:
        raise HTTPException(status_code=404, detail="Animal not found")

    records = (
        db.query(Telemetry)
        .filter(Telemetry.device_imei == animal.device_imei)
        .order_by(Telemetry.timestamp.desc())
        .limit(limit)
        .all()
    )
    return [TelemetryRead.model_validate(r) for r in records]


@app.get("/telemetry/device/{imei}", response_model=List[TelemetryRead])
def get_telemetry_by_imei(
    imei: str,
    limit: int = 50,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> List[TelemetryRead]:
    """Get telemetry records by device IMEI"""
    # Verify user owns an animal with this IMEI
    animal = db.query(Animal).filter(
        Animal.device_imei == imei,
        Animal.owner_id == current_user.id
    ).first()
    
    if not animal:
        raise HTTPException(status_code=404, detail="Device not found or not owned by user")
    
    records = (
        db.query(Telemetry)
        .filter(Telemetry.device_imei == imei)
        .order_by(Telemetry.timestamp.desc())
        .limit(limit)
        .all()
    )
    
    return [
        TelemetryRead(
            id=r.id,
            device_imei=r.device_imei,
            lat=r.lat,
            lng=r.lng,
            battery=r.battery,
            status=r.status,
            timestamp=r.timestamp
        )
        for r in records
    ]


@app.post("/admin/users", response_model=UserRead)
def admin_create_user(
    payload: AdminCreateUser,
    admin: User = Depends(get_current_admin),  # noqa: ARG001
    db: Session = Depends(get_db),
) -> UserRead:
    existing = db.query(User).filter(User.email == payload.email.lower()).first()
    if existing:
        raise HTTPException(status_code=400, detail="User with this email already exists")

    user = User(
        full_name=payload.full_name,
        email=payload.email.lower(),
        is_active=payload.is_active,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return UserRead.model_validate(user)


@app.post("/admin/animals", response_model=AnimalRead)
def admin_register_animal(
    payload: AnimalCreate,
    admin: User = Depends(get_current_admin),  # noqa: ARG001
    db: Session = Depends(get_db),
) -> AnimalRead:
    owner = db.query(User).filter(User.email == payload.owner_email.lower()).first()
    if not owner:
        raise HTTPException(status_code=404, detail="Owner user not found")

    existing = db.query(Animal).filter(Animal.device_imei == payload.device_imei).first()
    if existing:
        raise HTTPException(status_code=400, detail="Device IMEI already registered")

    animal = Animal(
        owner_id=owner.id,
        name=payload.name,
        species=payload.species,
        device_imei=payload.device_imei,
    )
    db.add(animal)
    db.commit()
    db.refresh(animal)
    return AnimalRead.model_validate(animal)


@app.get("/admin/devices", response_model=List[AdminDeviceRead])
def admin_list_devices(
    admin: User = Depends(get_current_admin),  # noqa: ARG001
    db: Session = Depends(get_db),
) -> List[AdminDeviceRead]:
    animals = db.query(Animal).join(User).all()
    devices: List[AdminDeviceRead] = []
    for animal in animals:
        last_telemetry = (
            db.query(Telemetry)
            .filter(Telemetry.device_imei == animal.device_imei)
            .order_by(Telemetry.timestamp.desc())
            .first()
        )
        devices.append(
            AdminDeviceRead(
                device_imei=animal.device_imei,
                animal_name=animal.name,
                owner_email=animal.owner.email,
                species=animal.species,
                last_status=last_telemetry.status if last_telemetry else None,
                last_seen_at=last_telemetry.timestamp if last_telemetry else None,
            )
        )
    return devices


# ========== SUBSCRIPTION SYSTEM ==========

# Subscription schemas
class SubscriptionPlan(BaseModel):
    plan_id: str
    name_en: str
    name_ar: str
    price_sar: float
    features_en: List[str]
    features_ar: List[str]


class CreateSubscriptionRequest(BaseModel):
    plan_id: str


class SubscriptionResponse(BaseModel):
    id: int
    plan: str
    price_sar: float
    start_date: datetime
    end_date: datetime
    is_active: bool

    class Config:
        from_attributes = True


@app.get("/subscription/plans", response_model=List[SubscriptionPlan])
def get_subscription_plans() -> List[SubscriptionPlan]:
    """Get available subscription plans"""
    plans = [
        SubscriptionPlan(
            plan_id="CAMEL_ANNUAL",
            name_en="Camel Annual Plan",
            name_ar="باقة الإبل السنوية",
            price_sar=495.0,
            features_en=[
                "Comprehensive coverage for open and remote pastures",
                "Geo-fence breach alerts",
                "Periodic activity reports",
                "Real-time GPS monitoring",
                "12 months coverage"
            ],
            features_ar=[
                "تغطية شاملة للمراعي المفتوحة والنائية",
                "تنبيهات تجاوز السياج الجغرافي",
                "تقارير دورية",
                "مراقبة GPS مباشرة",
                "تغطية 12 شهراً"
            ]
        ),
        SubscriptionPlan(
            plan_id="HORSE_ANNUAL",
            name_en="Horse Annual Plan - Professional Choice",
            name_ar="باقة الخيل السنوية - الخيار الاحترافي",
            price_sar=695.0,
            features_en=[
                "Advanced analysis for athletic performance and physical effort",
                "Real-time heart rate monitoring",
                "Physical effort statistics",
                "Abnormal movement alerts",
                "12 months coverage"
            ],
            features_ar=[
                "تحليل متقدم للأداء الرياضي والجهد البدني",
                "مراقبة نبض القلب مباشرة",
                "إحصائيات الجهد البدني",
                "تنبيهات الحركة غير الطبيعية",
                "تغطية 12 شهراً"
            ]
        ),
        SubscriptionPlan(
            plan_id="FALCON_ANNUAL",
            name_en="Falcon Annual Plan",
            name_ar="باقة الصقور السنوية",
            price_sar=995.0,
            features_en=[
                "Ultra-precise tracking for speed and extreme altitudes",
                "Quick recovery mode",
                "3D terrain maps",
                "Flight pattern analysis",
                "Priority support",
                "12 months coverage"
            ],
            features_ar=[
                "تتبع فائق الدقة للسرعة والارتفاعات الشاهقة",
                "وضع الاسترداد السريع",
                "خرائط تضاريس ثلاثية الأبعاد",
                "تحليل أنماط الطيران",
                "دعم أولوية",
                "تغطية 12 شهراً"
            ]
        )
    ]
    return plans


@app.post("/subscription/subscribe", response_model=SubscriptionResponse)
def create_subscription(
    request: CreateSubscriptionRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> SubscriptionResponse:
    """Create a subscription for the current user (DEV/MOCK ONLY).

    SECURITY: this endpoint marks the subscription active with a fake
    MOCK_PAYMENT record and performs no real payment. It is gated behind the
    dev-only flag so it cannot be abused in production to obtain a free
    subscription. Production activation must go through the verified
    Moyasar / Payflowly webhook path.
    """
    if not dev_test_login_enabled():
        raise HTTPException(status_code=404, detail="Not found")

    # Validate plan_id
    valid_plans = {"CAMEL_ANNUAL": 495.0, "HORSE_ANNUAL": 695.0, "FALCON_ANNUAL": 995.0}
    if request.plan_id not in valid_plans:
        raise HTTPException(status_code=400, detail="Invalid plan")
    
    price = valid_plans[request.plan_id]
    start_date = datetime.utcnow()
    end_date = start_date + timedelta(days=365)
    
    # Create subscription using raw SQL (since we added the table dynamically)
    from sqlalchemy import text
    result = db.execute(
        text("""
        INSERT INTO subscriptions (user_id, plan, price_sar, start_date, end_date, is_active)
        VALUES (:user_id, :plan, :price_sar, :start_date, :end_date, :is_active)
        RETURNING id, plan, price_sar, start_date, end_date, is_active
        """),
        {
            "user_id": current_user.id,
            "plan": request.plan_id,
            "price_sar": price,
            "start_date": start_date,
            "end_date": end_date,
            "is_active": True
        }
    )
    db.commit()
    
    row = result.fetchone()
    
    # Create payment transaction record
    db.execute(
        text("""
        INSERT INTO payment_transactions (subscription_id, user_id, amount_sar, payment_method, transaction_status)
        VALUES (:sub_id, :user_id, :amount, :method, :status)
        """),
        {
            "sub_id": row[0],
            "user_id": current_user.id,
            "amount": price,
            "method": "MOCK_PAYMENT",
            "status": "SUCCESS"
        }
    )
    db.commit()
    
    return SubscriptionResponse(
        id=row[0],
        plan=row[1],
        price_sar=row[2],
        start_date=row[3],
        end_date=row[4],
        is_active=row[5]
    )


@app.get("/subscription/my-subscription")
def get_my_subscription(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get current user's active subscription"""
    from sqlalchemy import text
    result = db.execute(
        text("""
        SELECT id, plan, price_sar, start_date, end_date, is_active
        FROM subscriptions
        WHERE user_id = :user_id AND is_active = TRUE
        ORDER BY end_date DESC
        LIMIT 1
        """),
        {"user_id": current_user.id}
    )
    
    row = result.fetchone()
    if not row:
        return {"has_subscription": False}
    
    return {
        "has_subscription": True,
        "id": row[0],
        "plan": row[1],
        "price_sar": float(row[2]),
        "start_date": row[3].isoformat() if row[3] else None,
        "end_date": row[4].isoformat() if row[4] else None,
        "is_active": row[5]
    }


# ========== HEALTH MONITORING ENDPOINTS ==========

@app.get("/health/{imei}/latest")
def get_latest_health(
    imei: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get latest health data for a device — only for the device's owner."""
    from sqlalchemy import text

    # SECURITY: enforce object ownership. Without this check any authenticated
    # user could read another owner's device telemetry by guessing/iterating
    # IMEIs.
    animal = db.query(Animal).filter(
        Animal.device_imei == imei,
        Animal.owner_id == current_user.id,
    ).first()
    if not animal:
        raise HTTPException(status_code=404, detail="Device not found")

    result = db.execute(
        text("""
        SELECT heart_rate, temperature, recorded_at
        FROM health_data
        WHERE device_imei = :imei
        ORDER BY recorded_at DESC
        LIMIT 1
        """),
        {"imei": imei}
    )
    row = result.fetchone()
    
    if not row:
        return {"heart_rate": None, "temperature": 34.0, "status": "excellent"}
    
    heart_rate, temperature, recorded_at = row
    
    # DEMO MODE: Always return "excellent" status with static 34°C
    status = "excellent"
    demo_temperature = 34.0
    
    # Original logic (commented for demo):
    # status = "normal"
    # if heart_rate and heart_rate > 100:
    #     status = "high_stress"
    
    return {
        "heart_rate": heart_rate,
        "temperature": demo_temperature,  # Static 34°C for demo
        "recorded_at": recorded_at.isoformat() if recorded_at else None,
        "status": status  # Always "excellent"
    }


# ========== SIMULATION MODE (LIVE DEMO) ==========

import random
from math import cos, sin, radians

@app.post("/admin/simulation/start")
def start_simulation(
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Start simulation mode - updates GPS coordinates every 10 seconds"""
    # This is a trigger endpoint. The actual simulation runs client-side
    # or via a background task. Here we just verify admin access.
    return {"message": "Simulation mode activated", "status": "active"}


@app.post("/admin/simulation/update-location")
def simulate_movement(
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Update animal locations for simulation (called by frontend every 10s)"""
    
    animals = db.query(Animal).all()
    updated = []
    
    for animal in animals:
        # Get latest telemetry
        last_telemetry = (
            db.query(Telemetry)
            .filter(Telemetry.device_imei == animal.device_imei)
            .order_by(Telemetry.timestamp.desc())
            .first()
        )
        
        if last_telemetry:
            # Simulate movement: move animal slightly (0.001-0.005 degrees)
            # This is approximately 100-500 meters
            lat_offset = random.uniform(-0.003, 0.003)
            lng_offset = random.uniform(-0.003, 0.003)
            
            new_lat = last_telemetry.lat + lat_offset
            new_lng = last_telemetry.lng + lng_offset
            
            # Battery drains slowly
            new_battery = max(10, last_telemetry.battery - random.randint(0, 2))
            
            # Random status
            new_status = random.choice(["Moving", "Moving", "Resting"])
            
            # Create new telemetry point
            new_telemetry = Telemetry(
                device_imei=animal.device_imei,
                lat=new_lat,
                lng=new_lng,
                battery=new_battery,
                status=new_status,
                timestamp=datetime.utcnow()
            )
            db.add(new_telemetry)
            
            updated.append({
                "animal": animal.name,
                "imei": animal.device_imei,
                "new_location": {"lat": new_lat, "lng": new_lng},
                "battery": new_battery,
                "status": new_status
            })
    
    db.commit()
    
    return {
        "message": "Locations updated",
        "updated_count": len(updated),
        "animals": updated
    }

