"""
Authentica API Integration for OTP Verification
Official API: https://api.authentica.sa/api/v2
Documentation: https://portal.authentica.sa
"""

import os
import requests
from typing import Optional, Dict, Any

# Authentica API Configuration
AUTHENTICA_API_BASE = "https://api.authentica.sa/api/v2"
AUTHENTICA_API_KEY = os.getenv("AUTHENTICA_API_KEY", "YOUR_AUTHENTICA_API_KEY_HERE")

# OTP Configuration
DEFAULT_OTP_METHOD = "sms"  # Options: "sms", "whatsapp", "email"
DEFAULT_TEMPLATE_ID = 1  # Use template ID from Authentica dashboard


def format_phone_international(phone: str) -> str:
    """
    Convert Saudi mobile number to international format.
    Examples:
        0501234567 → +966501234567
        966501234567 → +966501234567
        +966501234567 → +966501234567
    """
    # Remove spaces and dashes
    phone = phone.replace(' ', '').replace('-', '')
    
    # If starts with 0, replace with +966
    if phone.startswith('0'):
        return f"+966{phone[1:]}"
    
    # If starts with 966 but no +, add +
    if phone.startswith('966'):
        return f"+{phone}"
    
    # If already has +, return as is
    if phone.startswith('+'):
        return phone
    
    # Default: assume it's Saudi and add +966
    return f"+966{phone}"


def send_otp_via_authentica(
    phone: Optional[str] = None,
    email: Optional[str] = None,
    method: Optional[str] = None,
    custom_otp: Optional[str] = None,
    template_id: Optional[int] = None
) -> Dict[str, Any]:
    """
    Send OTP using Authentica API v2.
    
    Args:
        phone: Mobile number (required for SMS/WhatsApp)
        email: Email address (required for email method)
        method: "sms", "whatsapp", or "email" (defaults to DEFAULT_OTP_METHOD)
        custom_otp: Optional custom OTP code (default: auto-generated)
        template_id: Template ID from Authentica dashboard (default: 1)
    
    Returns:
        Dict with success status and message
    
    Raises:
        Exception if API call fails
    """
    # Use environment variable or default
    method = method or DEFAULT_OTP_METHOD
    template_id = template_id or DEFAULT_TEMPLATE_ID
    
    # Prepare request payload
    payload = {
        "method": method,
        "template_id": template_id
    }
    
    # Add phone if provided (for SMS/WhatsApp)
    if phone:
        payload["phone"] = format_phone_international(phone)
    
    # Add email if provided (for email method or fallback)
    if email:
        if method == "email":
            payload["email"] = email
        else:
            # Use email as fallback
            payload["fallback_email"] = email
    
    # Add custom OTP if provided
    if custom_otp:
        payload["otp"] = custom_otp
    
    # Prepare headers
    headers = {
        "X-Authorization": AUTHENTICA_API_KEY,
        "Accept": "application/json",
        "Content-Type": "application/json"
    }
    
    # Make API request
    try:
        response = requests.post(
            f"{AUTHENTICA_API_BASE}/send-otp",
            json=payload,
            headers=headers,
            timeout=10
        )
        
        # Check response
        if response.status_code == 200:
            data = response.json()
            return {
                "success": True,
                "message": data.get("message", "OTP sent successfully"),
                "data": data.get("data")
            }
        elif response.status_code == 401:
            return {
                "success": False,
                "message": "Unauthorized - Check AUTHENTICA_API_KEY",
                "error": "Invalid API Key"
            }
        else:
            return {
                "success": False,
                "message": f"API Error: {response.status_code}",
                "error": response.text
            }
    
    except requests.RequestException as e:
        return {
            "success": False,
            "message": "Failed to connect to Authentica API",
            "error": str(e)
        }


def verify_otp_via_authentica(
    phone: Optional[str] = None,
    email: Optional[str] = None,
    otp: str = None
) -> Dict[str, Any]:
    """
    Verify OTP using Authentica API v2.
    
    Args:
        phone: Mobile number in international format
        email: Email address
        otp: OTP code entered by user (required)
    
    Returns:
        Dict with verification status
    
    Raises:
        Exception if API call fails
    """
    if not otp:
        return {
            "success": False,
            "message": "OTP code is required"
        }
    
    # Prepare request payload
    payload = {
        "otp": otp
    }
    
    # Add phone if provided
    if phone:
        payload["phone"] = format_phone_international(phone)
    
    # Add email if provided
    if email:
        payload["email"] = email
    
    # Prepare headers
    headers = {
        "X-Authorization": AUTHENTICA_API_KEY,
        "Accept": "application/json",
        "Content-Type": "application/json"
    }
    
    # Make API request
    try:
        response = requests.post(
            f"{AUTHENTICA_API_BASE}/verify-otp",
            json=payload,
            headers=headers,
            timeout=10
        )
        
        # Check response
        if response.status_code == 200:
            data = response.json()
            return {
                "success": data.get("status", True),
                "message": data.get("message", "OTP verified successfully")
            }
        elif response.status_code == 401:
            return {
                "success": False,
                "message": "Unauthorized - Check AUTHENTICA_API_KEY"
            }
        else:
            return {
                "success": False,
                "message": "Invalid or expired OTP"
            }
    
    except requests.RequestException as e:
        return {
            "success": False,
            "message": "Failed to connect to Authentica API",
            "error": str(e)
        }


def get_balance() -> Dict[str, Any]:
    """
    Get current balance from Authentica API.
    
    Returns:
        Dict with balance information
    """
    headers = {
        "X-Authorization": AUTHENTICA_API_KEY,
        "Accept": "application/json"
    }
    
    try:
        response = requests.get(
            f"{AUTHENTICA_API_BASE}/balance",
            headers=headers,
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json()
            return {
                "success": True,
                "balance": data.get("data", {}).get("balance", 0),
                "message": data.get("message", "Balance retrieved successfully")
            }
        else:
            return {
                "success": False,
                "message": "Failed to retrieve balance"
            }
    
    except requests.RequestException as e:
        return {
            "success": False,
            "message": f"API Error: {str(e)}"
        }


# Testing function (uses fixed OTP if AUTHENTICA_API_KEY not set)
def should_use_testing_mode() -> bool:
    """Check if we should use testing mode (no real API calls)."""
    return AUTHENTICA_API_KEY == "YOUR_AUTHENTICA_API_KEY_HERE" or os.getenv("DEV_TESTING_OTP")
