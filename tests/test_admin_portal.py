"""
Test Suite: Station Commander Admin Portal, RBAC & Investigator Lifecycle.
Verifies:
1. Role-based access control: Only Commander roles can access /api/admin endpoints.
2. Listing all provisioned investigators with masked confidential contact data.
3. Provisioning a new investigator with salted PBKDF2-HMAC-SHA256 password.
4. Newly provisioned investigator successfully logging in.
5. Kill switch: Station Commander suspending an investigator badge.
6. Immediate enforcement: Suspended investigator blocked from login and REST routes.
7. Commander re-activating the investigator.
8. Commander dispatching one-time magic login link for emergency recovery.
"""

import os
import sys
from fastapi import HTTPException
from fastapi.security import HTTPAuthorizationCredentials

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from backend.main import (
    login_investigator,
    list_investigators_endpoint,
    provision_investigator_endpoint,
    toggle_investigator_status_endpoint,
    admin_dispatch_magic_link_endpoint,
    list_admin_audit_logs_endpoint,
    LoginRequest,
    ProvisionInvestigatorRequest,
    UpdateInvestigatorStatusRequest
)
from backend.auth import (
    INVESTIGATOR_STORE,
    create_access_token,
    get_current_investigator,
    require_commander_role
)

def test_admin_rbac_enforcement():
    print("\n--- TEST 1: Station Commander RBAC Enforcement ---")
    # 1. Regular investigator without commander rank
    regular_officer = {
        "username": "junior_officer_09",
        "badge_id": "INV-1100",
        "name": "Constable Rao",
        "role": "INVESTIGATOR"
    }
    try:
        require_commander_role(regular_officer)
        assert False, "Regular investigator should have raised HTTPException(403)"
    except HTTPException as ex:
        assert ex.status_code == 403
        print(f"  [PASS] Regular investigator rejected with 403: {ex.detail}")

    # 2. Lead Investigator / Commander has access
    commander_officer = {
        "username": "investigator_01",
        "badge_id": "INV-7842",
        "name": "Insp. Haziq Shaikh",
        "role": "LEAD_INVESTIGATOR"
    }
    verified_comm = require_commander_role(commander_officer)
    assert verified_comm["badge_id"] == "INV-7842"
    print(f"  [PASS] Lead Investigator authorized: {verified_comm['name']} ({verified_comm['role']})")
    return commander_officer

def test_list_investigators(commander):
    print("\n--- TEST 2: Listing Duty Roster with Masked Contact OPSEC ---")
    res = list_investigators_endpoint(commander=commander)
    assert res["status"] == "success"
    assert res["count"] >= 1
    investigators = res["investigators"]
    inv01 = next((i for i in investigators if i["username"] == "investigator_01"), None)
    assert inv01 is not None
    assert inv01["badge_id"] == "INV-7842"
    assert "@" in inv01["email_masked"]
    assert "***" in inv01["email_masked"]
    print(f"  [PASS] Roster retrieved ({res['count']} officers). Masked email: {inv01['email_masked']}")

def test_provision_new_investigator(commander):
    print("\n--- TEST 3: Provisioning New Investigator via Commander API ---")
    req = ProvisionInvestigatorRequest(
        username="investigator_test_99",
        badge_id="INV-9901",
        name="Sub-Insp. Arjun Deshmukh",
        role="INVESTIGATOR",
        station="Cyber Crime Police Station, Pune Division",
        email="arjun.deshmukh@cyberpolice.gov.in",
        phone="+919876543210",
        password="testpassword2026"
    )
    res = provision_investigator_endpoint(req=req, commander=commander)
    assert res["status"] == "success"
    assert res["investigator"]["badge_id"] == "INV-9901"
    print(f"  [PASS] Officer provisioned: {res['investigator']['name']} ({res['investigator']['badge_id']})")

    # Verify duplicate prevention
    try:
        provision_investigator_endpoint(req=req, commander=commander)
        assert False, "Duplicate username should have raised HTTPException(409)"
    except HTTPException as ex:
        assert ex.status_code == 409
        print(f"  [PASS] Duplicate username correctly rejected with 409.")

def test_new_investigator_login():
    print("\n--- TEST 4: Login Verification for Newly Provisioned Officer ---")
    login_req = LoginRequest(username="investigator_test_99", password="testpassword2026")
    res = login_investigator(login_req)
    assert res["status"] == "success"
    assert res["investigator"]["badge_id"] == "INV-9901"
    assert "access_token" in res
    print(f"  [PASS] New officer logged in successfully: {res['investigator']['name']}")
    return res["access_token"]

def test_suspend_investigator(commander, officer_token):
    print("\n--- TEST 5: Kill Switch: Suspending Investigator Badge ---")
    # 1. Commander suspends officer
    status_req = UpdateInvestigatorStatusRequest(is_active=False)
    res = toggle_investigator_status_endpoint("investigator_test_99", req=status_req, commander=commander)
    assert res["status"] == "success"
    assert res["is_active"] is False
    print(f"  [PASS] Officer 'investigator_test_99' suspended.")

    # 2. Prevent self-suspension by commander
    try:
        toggle_investigator_status_endpoint("investigator_01", req=status_req, commander=commander)
        assert False, "Commander self-suspension should have raised HTTPException(400)"
    except HTTPException as ex:
        assert ex.status_code == 400
        print(f"  [PASS] Commander self-suspension correctly blocked.")

    # 3. Suspended officer CANNOT log in
    try:
        login_investigator(LoginRequest(username="investigator_test_99", password="testpassword2026"))
        assert False, "Suspended officer login should have raised HTTPException(403)"
    except HTTPException as ex:
        assert ex.status_code == 403
        assert "suspended" in ex.detail.lower()
        print(f"  [PASS] Suspended officer login rejected with 403: {ex.detail}")

    # 4. Existing active token is REJECTED
    try:
        creds = HTTPAuthorizationCredentials(scheme="Bearer", credentials=officer_token)
        get_current_investigator(creds)
        assert False, "Suspended officer token should have raised HTTPException(403)"
    except HTTPException as ex:
        assert ex.status_code == 403
        print(f"  [PASS] Existing JWT immediately revoked upon suspension: {ex.detail}")

def test_reactivate_investigator(commander):
    print("\n--- TEST 6: Reactivating Suspended Officer ---")
    status_req = UpdateInvestigatorStatusRequest(is_active=True)
    res = toggle_investigator_status_endpoint("investigator_test_99", req=status_req, commander=commander)
    assert res["status"] == "success"
    assert res["is_active"] is True
    print(f"  [PASS] Officer reactivated.")

    # Login works again
    login_res = login_investigator(LoginRequest(username="investigator_test_99", password="testpassword2026"))
    assert login_res["status"] == "success"
    print(f"  [PASS] Officer can authenticate again after reactivation.")

def test_commander_dispatch_magic_link(commander):
    print("\n--- TEST 7: Commander Dispatches One-Time Magic Login Link ---")
    res = admin_dispatch_magic_link_endpoint("investigator_test_99", commander=commander)
    assert res["status"] == "success"
    assert "one-time login link dispatched" in res["message"].lower()
    print(f"  [PASS] Emergency login link dispatched by Commander: {res['message']}")

def test_audit_logs(commander):
    print("\n--- TEST 8: Administrative Security Audit Trail Retrieval ---")
    res = list_admin_audit_logs_endpoint(limit=10, commander=commander)
    assert res["status"] == "success"
    assert "logs" in res
    print(f"  [PASS] Security audit logs retrieved ({res['count']} events).")

if __name__ == "__main__":
    print("=" * 70)
    print("TEST: STATION COMMANDER PORTAL & PERSONNEL LIFECYCLE SUITE")
    print("=" * 70)
    commander = test_admin_rbac_enforcement()
    test_list_investigators(commander)
    test_provision_new_investigator(commander)
    officer_token = test_new_investigator_login()
    test_suspend_investigator(commander, officer_token)
    test_reactivate_investigator(commander)
    test_commander_dispatch_magic_link(commander)
    test_audit_logs(commander)
    print("\n" + "=" * 70)
    print("ALL STATION COMMANDER ADMIN TESTS PASSED SUCCESSFULLY!")
    print("=" * 70)

