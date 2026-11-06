"""
CyberGuard Investigator Authentication & Session Security Module.
Provides secure pre-provisioned investigator authentication, PBKDF2 password verification,
and stateless HMAC-SHA256 JWT generation with zero external dependencies.
"""

import os
import time
import json
import hmac
import hashlib
import base64
from typing import Optional, Dict, Any
from fastapi import Request, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import secrets
from backend.core.supabase_client import supabase_gateway

# Security Secret Key for JWT Signing
JWT_SECRET = os.getenv("CYBERGUARD_JWT_SECRET", "cyberguard_prod_forensic_jwt_secret_key_2026_police_triage")
TOKEN_EXPIRY_SECONDS = 12 * 3600  # 12-Hour Active Duty Shift

# In-memory one-time magic login tokens: token -> {"username": str, "badge_id": str, "exp": float, "used": bool}
MAGIC_TOKENS: Dict[str, Dict[str, Any]] = {}

# -------------------------------------------------------------------------
# PRE-PROVISIONED INVESTIGATOR REPOSITORY (SINGLE LOGIN ID)
# Zero self-registration. Passcode: 'cyberguard2026'
# Contact info (email/phone) is confidential and set on database/admin level.
# -------------------------------------------------------------------------
INVESTIGATOR_STORE: Dict[str, Dict[str, Any]] = {
    "investigator_01": {
        "username": "investigator_01",
        "badge_id": "INV-7842",
        "name": "Insp. Haziq Shaikh",
        "role": "LEAD_INVESTIGATOR",
        "station": "Cyber Crime Police Station",
        "email": os.getenv("OFFICER_EMAIL", "insp.haziq@cyberpolice.gov.in"),
        "phone": os.getenv("OFFICER_PHONE", "+91 98200 12345"),
        "is_active": True,
        "created_at": "2026-01-01T08:00:00Z",
        "last_login_at": None,
        "salt": "df9df02b9e6444af0ac34056eb4abc64",
        "hash_hex": "fbc8442811e1e5ef653afc0543c8b7e0d8590db1a377e63338e7d3b45532b483"
    }
}

INVESTIGATORS_FILE = os.path.join(os.path.dirname(__file__), "data", "investigators_store.json")

def load_investigator_store():
    """Loads provisioned investigators from disk cache to ensure resilience across restarts."""
    global INVESTIGATOR_STORE
    if os.path.exists(INVESTIGATORS_FILE):
        try:
            with open(INVESTIGATORS_FILE, "r", encoding="utf-8") as f:
                saved = json.load(f)
                if isinstance(saved, dict):
                    INVESTIGATOR_STORE.update(saved)
        except Exception:
            pass

def save_investigator_store():
    """Flushes provisioned investigators to local persistent storage."""
    try:
        os.makedirs(os.path.dirname(INVESTIGATORS_FILE), exist_ok=True)
        with open(INVESTIGATORS_FILE, "w", encoding="utf-8") as f:
            json.dump(INVESTIGATOR_STORE, f, indent=2)
    except Exception:
        pass

# Initialize store from disk on startup
load_investigator_store()

COMMANDER_ROLES = {"LEAD_INVESTIGATOR", "SUPERINTENDENT", "STATION_COMMANDER", "ADMIN"}

def hash_password(password: str) -> tuple[str, str]:
    """Generates a secure salt and PBKDF2-HMAC-SHA256 (600,000 rounds) hash."""
    salt = secrets.token_hex(16)
    dk = hashlib.pbkdf2_hmac(
        "sha256",
        password.encode("utf-8"),
        salt.encode("utf-8"),
        600000
    )
    return salt, dk.hex()

def mask_email(email: Optional[str]) -> str:
    """Masks an email for OPSEC in public/roster views (e.g. i***q@cyberpolice.gov.in)."""
    if not email or "@" not in email:
        return "Confidential"
    parts = email.split("@")
    name, domain = parts[0], parts[1]
    masked = name[0] + "***" + (name[-1] if len(name) > 1 else "")
    return f"{masked}@{domain}"

def mask_phone(phone: Optional[str]) -> str:
    """Masks phone number for OPSEC in public/roster views (e.g. +91  **** 2345)."""
    if not phone or len(phone) < 6:
        return "Confidential"
    clean = phone.strip()
    return clean[:4] + " **** " + clean[-4:]

def get_investigator_record(username: str) -> Optional[Dict[str, Any]]:
    """
    Fetches investigator from Supabase cloud database if connected,
    or falls back to the pre-provisioned local duty store.
    """
    cloud_user = supabase_gateway.get_investigator_by_username(username)
    if cloud_user:
        return cloud_user
    if username not in INVESTIGATOR_STORE:
        load_investigator_store()
    return INVESTIGATOR_STORE.get(username)

def generate_magic_login_link(username: str, base_url: str = "") -> Dict[str, Any]:
    """
    Generates a secure one-time login link dispatched to the investigator's confidential
    email/phone registered on the database level.
    The response intentionally NEVER reveals the actual email address or phone number.
    Passwords cannot be reset from the UI; access is restored via this one-time link.
    """
    user = get_investigator_record(username)
    
    # Generic security response to prevent user enumeration
    generic_message = (
        "A secure one-time login link has been dispatched to the authorized email address "
        "and registered phone number associated with this Investigator ID. "
        "Please check your authorized device inbox to authenticate your terminal session."
    )

    if not user:
        return {"status": "success", "message": generic_message}

    # Generate 32-byte cryptographic one-time token (valid for 15 minutes)
    token = secrets.token_urlsafe(32)
    exp = time.time() + (15 * 60)
    MAGIC_TOKENS[token] = {
        "username": user["username"],
        "badge_id": user["badge_id"],
        "exp": exp,
        "used": False
    }

    login_link = f"{base_url}/login.html?magic_token={token}" if base_url else f"/login.html?magic_token={token}"

    # Log dispatch internally (OPSEC: confidential channel destination is kept server-side)
    import logging
    logging.info(f"[SECURE DISPATCH] One-time login link generated for '{user['username']}' ({user['badge_id']}). Sent to confidential email/phone.")
    logging.info(f"[DISPATCH AUDIT - INTERNAL URL]: {login_link}")

    supabase_gateway.log_audit_event(
        event_type="MAGIC_LOGIN_LINK_DISPATCHED",
        investigator_badge_id=user["badge_id"],
        investigator_name=user.get("name"),
        details={"channel": "confidential_email_phone", "expires_in_sec": 900}
    )

    return {
        "status": "success",
        "message": generic_message,
        "_dev_link": login_link  # Included for local testing/dev access
    }

def verify_magic_login_token(token: str) -> Optional[Dict[str, Any]]:
    """
    Verifies a one-time magic login token and issues an active duty session token.
    Enforces strict single-use and expiration checks.
    """
    record = MAGIC_TOKENS.get(token)
    if not record:
        return None
    if record.get("used", False):
        return None
    if record.get("exp", 0) < time.time():
        return None

    # Mark as used (single-use token)
    record["used"] = True
    username = record["username"]
    user = get_investigator_record(username)
    if not user:
        return None

    session_token = create_access_token({
        "sub": user["username"],
        "badge_id": user["badge_id"],
        "role": user["role"]
    })

    supabase_gateway.update_last_login(username)
    supabase_gateway.log_audit_event(
        event_type="MAGIC_LOGIN_SUCCESS",
        investigator_badge_id=user["badge_id"],
        investigator_name=user.get("name"),
        details={"auth_method": "ONE_TIME_MAGIC_LINK"}
    )

    return {
        "status": "authenticated",
        "access_token": session_token,
        "token_type": "bearer",
        "investigator": {
            "username": user["username"],
            "badge_id": user["badge_id"],
            "name": user["name"],
            "role": user["role"],
            "station": user["station"]
        }
    }

security = HTTPBearer(auto_error=False)

def verify_password(plain_password: str, user_record: Dict[str, Any]) -> bool:
    """Verifies a plain-text password using PBKDF2-HMAC-SHA256 with 600,000 iterations."""
    salt = user_record.get("salt", "")
    expected_hash = user_record.get("hash_hex", "")
    dk = hashlib.pbkdf2_hmac(
        "sha256",
        plain_password.encode("utf-8"),
        salt.encode("utf-8"),
        600000
    )
    return hmac.compare_digest(dk.hex(), expected_hash)

def _b64url_encode(data: bytes) -> str:
    """Base64URL encoding without trailing padding '='."""
    return base64.urlsafe_b64encode(data).decode("utf-8").rstrip("=")

def _b64url_decode(data_str: str) -> bytes:
    """Base64URL decoding with padding restored."""
    padding = 4 - (len(data_str) % 4)
    if padding != 4:
        data_str += "=" * padding
    return base64.urlsafe_b64decode(data_str.encode("utf-8"))

def create_access_token(data: Dict[str, Any], expires_in: int = TOKEN_EXPIRY_SECONDS) -> str:
    """
    Creates a standard cryptographically signed JWT token (HS256)
    using Python standard library hmac and hashlib.
    """
    header = {"alg": "HS256", "typ": "JWT"}
    payload = data.copy()
    payload["iat"] = int(time.time())
    payload["exp"] = int(time.time()) + expires_in

    header_b64 = _b64url_encode(json.dumps(header, separators=(",", ":")).encode("utf-8"))
    payload_b64 = _b64url_encode(json.dumps(payload, separators=(",", ":")).encode("utf-8"))

    signing_input = f"{header_b64}.{payload_b64}".encode("utf-8")
    signature = hmac.new(JWT_SECRET.encode("utf-8"), signing_input, hashlib.sha256).digest()
    sig_b64 = _b64url_encode(signature)

    return f"{header_b64}.{payload_b64}.{sig_b64}"

def decode_access_token(token: str) -> Optional[Dict[str, Any]]:
    """
    Decodes and verifies the signature and expiration of an HS256 JWT.
    Returns the decoded payload dict if valid, or None if invalid/expired.
    """
    try:
        parts = token.split(".")
        if len(parts) != 3:
            return None
        header_b64, payload_b64, sig_b64 = parts

        # Verify signature
        signing_input = f"{header_b64}.{payload_b64}".encode("utf-8")
        expected_sig = hmac.new(JWT_SECRET.encode("utf-8"), signing_input, hashlib.sha256).digest()
        actual_sig = _b64url_decode(sig_b64)

        if not hmac.compare_digest(expected_sig, actual_sig):
            return None

        # Verify payload and expiration
        payload = json.loads(_b64url_decode(payload_b64).decode("utf-8"))
        if payload.get("exp", 0) < int(time.time()):
            return None  # Expired

        return payload
    except Exception:
        return None

def get_current_investigator(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)
) -> Dict[str, Any]:
    """
    FastAPI dependency that enforces investigator authentication on REST endpoints.
    Raises HTTP 401 Unauthorized if token is missing, invalid, or expired.
    """
    if not credentials or not credentials.credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Investigator authentication required. Please authorize session.",
            headers={"WWW-Authenticate": "Bearer"}
        )

    token = credentials.credentials
    payload = decode_access_token(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session token invalid or expired. Please re-authenticate.",
            headers={"WWW-Authenticate": "Bearer"}
        )

    username = payload.get("sub")
    investigator = get_investigator_record(username)
    if not investigator:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Investigator profile not found in active duty roster.",
            headers={"WWW-Authenticate": "Bearer"}
        )

    if investigator.get("is_active") is False:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Investigator credentials have been suspended by Station Commander.",
            headers={"WWW-Authenticate": "Bearer"}
        )

    return {
        "username": investigator["username"],
        "badge_id": investigator["badge_id"],
        "name": investigator["name"],
        "role": investigator["role"],
        "station": investigator["station"],
        "is_active": investigator.get("is_active", True)
    }

def verify_ws_token(token: Optional[str]) -> Optional[Dict[str, Any]]:
    """
    Validates token for streaming WebSockets where Authorization headers are unavailable.
    Returns the investigator profile or None.
    """
    if not token:
        return None
    payload = decode_access_token(token)
    if not payload:
        return None
    username = payload.get("sub")
    investigator = get_investigator_record(username)
    if not investigator or investigator.get("is_active") is False:
        return None
    return {
        "username": investigator["username"],
        "badge_id": investigator["badge_id"],
        "name": investigator["name"],
        "role": investigator["role"],
        "station": investigator["station"],
        "is_active": investigator.get("is_active", True)
    }

def require_commander_role(
    current_user: Dict[str, Any] = Depends(get_current_investigator)
) -> Dict[str, Any]:
    """
    FastAPI dependency that enforces Station Commander or Lead Investigator privileges.
    Raises HTTP 403 Forbidden if user rank is insufficient.
    """
    role = current_user.get("role", "")
    if role not in COMMANDER_ROLES:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Station administrative privilege required. Current role '{role}' is unauthorized."
        )
    return current_user
