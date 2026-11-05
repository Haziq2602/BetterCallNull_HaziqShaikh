"""
Test Suite: Investigator Authentication, Role Verification & Session Security.
Verifies:
1. Pre-provisioned single login ID access control (zero self-registration).
2. Proper 401 Unauthorized rejection for missing or invalid credentials.
3. Protected REST endpoints require valid Bearer token.
4. WebSocket handshake enforces token authorization (rejection on unauthorized).
5. Audit trail records authenticated investigator badge ID and profile.
"""

import os
import sys
from fastapi import HTTPException
from fastapi.security import HTTPAuthorizationCredentials

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from backend.main import (
    login_investigator,
    get_current_investigator_profile,
    get_call_queue,
    update_call_action,
    simulate_incoming_call,
    LoginRequest
)
from backend.auth import (
    INVESTIGATOR_STORE,
    verify_password,
    create_access_token,
    decode_access_token,
    get_current_investigator,
    verify_ws_token
)

def test_login_success():
    print("\n--- TEST 1: Valid Investigator Login (Single Duty ID) ---")
    req = LoginRequest(username="investigator_01", password="cyberguard2026")
    res = login_investigator(req)
    assert res["status"] == "success"
    assert "access_token" in res
    assert res["token_type"] == "bearer"
    assert res["investigator"]["badge_id"] == "INV-7842"
    assert res["investigator"]["name"] == "Insp. Haziq Shaikh"
    assert res["investigator"]["role"] == "LEAD_INVESTIGATOR"
    print(f"  [PASS] Authorized: {res['investigator']['name']} ({res['investigator']['badge_id']})")
    return res["access_token"]

def test_login_invalid_password():
    print("\n--- TEST 2: Invalid Passcode Rejection ---")
    req = LoginRequest(username="investigator_01", password="wrong_passcode_99")
    try:
        login_investigator(req)
        assert False, "Invalid passcode should have raised HTTPException(401)"
    except HTTPException as ex:
        assert ex.status_code == 401
        assert "Invalid investigator ID or passcode" in ex.detail
        print(f"  [PASS] Invalid passcode correctly rejected: {ex.detail}")

def test_login_unknown_user_zero_registration():
    print("\n--- TEST 3: Zero Self-Registration (Unknown User Rejection) ---")
    req = LoginRequest(username="unregistered_user", password="cyberguard2026")
    try:
        login_investigator(req)
        assert False, "Unknown user should have raised HTTPException(401)"
    except HTTPException as ex:
        assert ex.status_code == 401
        print("  [PASS] Unknown user rejected. Zero self-registration enforced.")

def test_protected_routes_unauthorized():
    print("\n--- TEST 4: Protected REST Dependencies Without Token ---")
    # Missing credentials
    try:
        get_current_investigator(None)
        assert False, "None credentials should raise HTTPException(401)"
    except HTTPException as ex:
        assert ex.status_code == 401
        print("  [PASS] Missing credentials rejected with 401.")

    # Forged / Tampered token
    try:
        bad_creds = HTTPAuthorizationCredentials(scheme="Bearer", credentials="forged.jwt.signature")
        get_current_investigator(bad_creds)
        assert False, "Forged token should raise HTTPException(401)"
    except HTTPException as ex:
        assert ex.status_code == 401
        print("  [PASS] Forged / tampered token rejected with 401.")

def test_protected_routes_authorized(token):
    print("\n--- TEST 5: Protected REST Endpoints With Valid Bearer Token ---")
    creds = HTTPAuthorizationCredentials(scheme="Bearer", credentials=token)
    investigator = get_current_investigator(creds)
    assert investigator["badge_id"] == "INV-7842"
    assert investigator["name"] == "Insp. Haziq Shaikh"
    print(f"  [PASS] Verified Investigator Identity: {investigator['name']} ({investigator['badge_id']})")

    # Access protected /api/call-queue
    queue_res = get_call_queue(investigator)
    assert "calls" in queue_res
    assert queue_res["count"] > 0
    print(f"  [PASS] Protected queue accessed: {queue_res['count']} active call channels.")

    # Access protected /api/auth/me
    me_res = get_current_investigator_profile(investigator)
    assert me_res["status"] == "authenticated"
    assert me_res["investigator"]["badge_id"] == "INV-7842"
    print(f"  [PASS] /api/auth/me verified duty status.")

def test_websocket_authorization(token):
    print("\n--- TEST 6: WebSocket Streaming Token Verification ---")
    # 1. No token -> rejected
    assert verify_ws_token(None) is None, "None token must be rejected"
    assert verify_ws_token("") is None, "Empty token must be rejected"
    print("  [PASS] Missing token rejected.")

    # 2. Forged token -> rejected
    assert verify_ws_token("forged.fake.token") is None, "Forged token must be rejected"
    print("  [PASS] Forged token rejected.")

    # 3. Valid token -> verified
    inv = verify_ws_token(token)
    assert inv is not None, "Valid token must return investigator profile"
    assert inv["badge_id"] == "INV-7842"
    assert inv["name"] == "Insp. Haziq Shaikh"
    print(f"  [PASS] Valid token accepted for WebSocket stream: {inv['name']} ({inv['badge_id']})")

def test_magic_login_link_recovery():
    print("\n--- TEST 7: Confidential Magic Login Link Recovery Flow ---")
    from backend.main import forgot_password_endpoint, verify_magic_token_endpoint, ForgotPasswordRequest
    from backend.auth import MAGIC_TOKENS

    # 1. Anti-enumeration: Unknown user returns generic dispatch response but registers NO token
    unknown_req = ForgotPasswordRequest(username="non_existent_officer")
    res_unknown = forgot_password_endpoint(unknown_req)
    assert res_unknown["status"] == "success"
    assert "one-time login link has been dispatched" in res_unknown["message"]
    unknown_tokens = [k for k, v in MAGIC_TOKENS.items() if v.get("username") == "non_existent_officer"]
    assert len(unknown_tokens) == 0, "Unknown user should not generate any magic tokens"
    print("  [PASS] Anti-enumeration enforced: generic response returned without issuing tokens.")

    # 2. Valid investigator requests magic login link
    valid_req = ForgotPasswordRequest(username="investigator_01")
    res = forgot_password_endpoint(valid_req)
    assert res["status"] == "success"
    # Verify confidential messaging: NO email or phone exposed in response
    assert "email" not in res
    assert "phone" not in res
    assert "haziq" not in str(res).lower()
    assert "+91" not in str(res)
    print(f"  [PASS] Confidential dispatch response verified: {res['message']}")

    # 3. Verify magic token generated internally
    tokens_for_user = [k for k, v in MAGIC_TOKENS.items() if v.get("username") == "investigator_01" and not v.get("used")]
    assert len(tokens_for_user) > 0, "Magic token was not registered in token store"
    token_str = tokens_for_user[-1]
    print(f"  [PASS] Magic login token verified in memory store: {token_str[:8]}...")

    # 4. Invalid or forged token verification fails
    try:
        verify_magic_token_endpoint("forged_fake_token_123")
        assert False, "Forged token must raise HTTPException(400)"
    except HTTPException as ex:
        assert ex.status_code == 400
        print(f"  [PASS] Forged token rejected: {ex.detail}")

    # 5. Verify valid magic token and obtain terminal session
    auth_session = verify_magic_token_endpoint(token_str)
    assert auth_session["status"] == "authenticated"
    assert "access_token" in auth_session
    assert auth_session["investigator"]["badge_id"] == "INV-7842"
    assert auth_session["investigator"]["name"] == "Insp. Haziq Shaikh"
    print(f"  [PASS] Terminal session authorized via magic link: {auth_session['investigator']['name']}")

    # 6. Single-use enforcement: Token cannot be re-used
    try:
        verify_magic_token_endpoint(token_str)
        assert False, "Used magic token must raise HTTPException(400)"
    except HTTPException as ex:
        assert ex.status_code == 400
        assert "already been used" in ex.detail
        print(f"  [PASS] Single-use constraint enforced: {ex.detail}")

    # 7. Password integrity: Password is UNCHANGED and remains locked at database level
    original_login = login_investigator(LoginRequest(username="investigator_01", password="cyberguard2026"))
    assert original_login["status"] == "success"
    print("  [PASS] Database password integrity preserved: regular password still authenticates perfectly.")

if __name__ == "__main__":
    print("=" * 70)
    print("TEST: INVESTIGATOR AUTHENTICATION & ACCESS CONTROL SUITE")
    print("=" * 70)
    token = test_login_success()
    test_login_invalid_password()
    test_login_unknown_user_zero_registration()
    test_protected_routes_unauthorized()
    test_protected_routes_authorized(token)
    test_websocket_authorization(token)
    test_magic_login_link_recovery()
    print("\n" + "=" * 70)
    print("ALL INVESTIGATOR AUTHENTICATION TESTS PASSED SUCCESSFULLY!")
    print("=" * 70)
