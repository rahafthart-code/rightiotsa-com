"""
Payflowly Payment Integration for Right Platform
"""

import os
import hmac
import hashlib
from typing import Dict, Optional

# Payflowly Configuration
PAYFLOWLY_API_KEY = os.getenv("PAYFLOWLY_API_KEY", "")
PAYFLOWLY_SECRET_KEY = os.getenv("PAYFLOWLY_SECRET_KEY", "")
PAYFLOWLY_APP_NAME = "Right"
PAYFLOWLY_BASE_URL = "https://payflowly.com/api"


def generate_payment_link(
    amount: float,
    user_email: str,
    user_name: str,
    plan_name: str,
    user_id: int,
    redirect_url: str = "https://right.app/dashboard"
) -> str:
    """
    Generate a Payflowly payment link for a subscription.
    
    Args:
        amount: Payment amount in SAR
        user_email: Customer email
        user_name: Customer name
        plan_name: Subscription plan name
        user_id: User ID for webhook identification
        redirect_url: URL to redirect after successful payment
        
    Returns:
        Payment link URL
    """
    
    # For development/testing, return a mock payment link
    if not PAYFLOWLY_API_KEY:
        # Mock payment link for testing
        mock_link = f"http://localhost:8000/payment/mock?amount={amount}&email={user_email}&plan={plan_name}&user_id={user_id}"
        return mock_link
    
    # Production: Generate actual Payflowly link
    # Note: Replace with actual Payflowly API integration
    payment_data = {
        "app_name": PAYFLOWLY_APP_NAME,
        "amount": amount,
        "currency": "SAR",
        "customer_email": user_email,
        "customer_name": user_name,
        "description": f"{plan_name} - Right Livestock Tracking",
        "redirect_url": redirect_url,
        "webhook_url": f"{os.getenv('WEBHOOK_BASE_URL', 'https://right.app')}/webhook/payflowly",
        "metadata": {
            "user_id": user_id,
            "plan_name": plan_name,
            "platform": "Right"
        }
    }
    
    # TODO: Implement actual Payflowly API call
    # response = requests.post(f"{PAYFLOWLY_BASE_URL}/payment", json=payment_data)
    # return response.json()["payment_url"]
    
    return f"https://payflowly.com/pay/{PAYFLOWLY_APP_NAME}/{user_id}"


def verify_webhook_signature(payload: str, signature: str) -> bool:
    """
    Verify Payflowly webhook signature to ensure authenticity.
    
    Args:
        payload: Raw webhook payload
        signature: Signature from Payflowly headers
        
    Returns:
        True if signature is valid
    """
    
    if not PAYFLOWLY_SECRET_KEY:
        # For development/testing, accept all webhooks
        return True
    
    expected_signature = hmac.new(
        PAYFLOWLY_SECRET_KEY.encode(),
        payload.encode(),
        hashlib.sha256
    ).hexdigest()
    
    return hmac.compare_digest(expected_signature, signature)


def process_payment_success(webhook_data: Dict) -> Dict:
    """
    Process successful payment webhook from Payflowly.
    
    Args:
        webhook_data: Webhook payload from Payflowly
        
    Returns:
        Processed payment information
    """
    
    return {
        "user_id": webhook_data.get("metadata", {}).get("user_id"),
        "amount": webhook_data.get("amount"),
        "currency": webhook_data.get("currency", "SAR"),
        "plan_name": webhook_data.get("metadata", {}).get("plan_name"),
        "transaction_id": webhook_data.get("transaction_id"),
        "status": "completed"
    }
