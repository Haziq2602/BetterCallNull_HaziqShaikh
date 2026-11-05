"""
Pytest Shared Fixtures for CyberGuard Test Suites.
Provides reusable authentication tokens and commander profiles
so pytest fixture injection works correctly across all test files.
"""

import os
import sys
import pytest

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from backend.auth import (
    create_access_token,
    require_commander_role,
    INVESTIGATOR_STORE
)
from backend.main import (
    login_investigator,
    provision_investigator_endpoint,
    LoginRequest,
    ProvisionInvestigatorRequest
)


@pytest.fixture(scope="session")
def commander():
    """
    Returns a Station Commander investigator profile dict.
    Used by admin portal tests that require commander-level RBAC.
    """
    return {
        "username": "investigator_01",
        "badge_id": "INV-7842",
        "name": "Insp. Haziq Shaikh",
        "role": "LEAD_INVESTIGATOR",
        "station": "Cyber Crime Police Station",
        "is_active": True
    }


@pytest.fixture(scope="session")
def token():
    """
    Returns a valid JWT bearer token for investigator_01.
    Used by auth tests that require an authenticated session.
    """
    res = login_investigator(LoginRequest(username="investigator_01", password="cyberguard2026"))
    return res["access_token"]


@pytest.fixture(scope="session")
def officer_token(commander):
    """
    Provisions a fresh test officer (investigator_test_99) if not already present,
    logs them in, and returns their bearer token.
    Used by suspend/reactivate tests that need a secondary officer token.
    """
    # Provision test officer only if not already in store
    if "investigator_test_99" not in INVESTIGATOR_STORE:
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
        provision_investigator_endpoint(req=req, commander=commander)

    res = login_investigator(LoginRequest(username="investigator_test_99", password="testpassword2026"))
    return res["access_token"]

