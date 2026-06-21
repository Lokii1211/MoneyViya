"""
Auth routes — OTP-based authentication via WhatsApp
"""
from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel
from datetime import datetime
import hashlib
import secrets
import os

router = APIRouter(prefix="/api/v2/auth", tags=["auth"])

# In-memory OTP store (use Redis in production)
otp_store = {}

# OTP expiry in seconds
OTP_EXPIRY = 300


# ---------- Pydantic models ----------

class OTPSendPayload(BaseModel):
    phone: str

class OTPVerifyPayload(BaseModel):
    phone: str
    otp: str


# ---------- Helpers ----------

def _normalize_phone(phone: str) -> str:
    """Ensure phone has +91 prefix."""
    phone = phone.strip().replace(" ", "").replace("-", "")
    if not phone.startswith("+"):
        phone = "+91" + phone
    return phone


def _hash_password(password: str, salt: str) -> str:
    """SHA-256 hash with per-user salt."""
    return hashlib.sha256((salt + password).encode()).hexdigest()


def _generate_otp() -> str:
    """Cryptographically random 6-digit OTP."""
    return str(secrets.randbelow(900000) + 100000)


# ---------- Endpoints ----------

@router.post("/send-otp")
async def send_otp(payload: OTPSendPayload):
    """Generate OTP and send via WhatsApp Cloud API."""
    phone = _normalize_phone(payload.phone)
    otp = _generate_otp()

    otp_store[phone] = {
        "otp": otp,
        "expires": datetime.now().timestamp() + OTP_EXPIRY,
    }

    otp_message = (
        f"\U0001f510 *Viya Login OTP*\n\n"
        f"Your verification code is: *{otp}*\n\n"
        f"⏰ This code expires in 5 minutes.\n"
        f"⚠️ Do not share this code with anyone!"
    )

    # Send via WhatsApp Cloud API
    try:
        from services.whatsapp_cloud_service import whatsapp_cloud_service

        if whatsapp_cloud_service.is_available():
            clean = phone.replace("+", "")
            whatsapp_cloud_service.send_text_message(clean, otp_message)
            return {"success": True, "message": "OTP sent to your WhatsApp", "phone": phone}
    except Exception as e:
        print(f"[AUTH] WhatsApp send failed: {e}")

    # WhatsApp unavailable — surface error (no demo bypass)
    raise HTTPException(
        status_code=503,
        detail="WhatsApp service unavailable. Please try again later.",
    )


@router.post("/verify-otp")
async def verify_otp(payload: OTPVerifyPayload):
    """Verify OTP and return user data."""
    phone = _normalize_phone(payload.phone)
    otp = payload.otp.strip()

    stored = otp_store.get(phone)

    if not stored:
        raise HTTPException(status_code=400, detail="OTP not found. Please request a new one.")

    if datetime.now().timestamp() > stored["expires"]:
        del otp_store[phone]
        raise HTTPException(status_code=400, detail="OTP expired. Please request a new one.")

    if stored["otp"] != otp:
        raise HTTPException(status_code=400, detail="Invalid OTP. Please try again.")

    # OTP verified — clean up
    del otp_store[phone]

    # Get or create user
    from database.user_repository import user_repo

    user = user_repo.ensure_user(phone)

    token = secrets.token_hex(32)

    return {
        "success": True,
        "token": token,
        "message": "Login successful!",
        "user": {
            "phone": phone,
            "name": user.get("name", "User"),
            "onboarding_complete": user.get("onboarding_complete", False),
        },
    }
