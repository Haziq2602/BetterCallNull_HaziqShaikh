import sys
import os
import pytest
import numpy as np

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from backend.main import (
    provision_investigator_endpoint,
    list_investigators_endpoint,
    login_investigator,
    LoginRequest,
    ProvisionInvestigatorRequest
)
from backend.auth import (
    INVESTIGATOR_STORE,
    load_investigator_store,
    save_investigator_store,
    get_investigator_record,
    verify_password
)
from backend.core.forensic_analyzer import load_audio_to_16k_mono

def test_provision_officer_persistence_and_login():
    """Verifies provisioning an officer, disk persistence, and immediate login capability."""
    import time
    test_uname = f"officer_test_{int(time.time())}"
    commander = {
        "username": "investigator_01",
        "badge_id": "INV-7842",
        "name": "Insp. Haziq Shaikh",
        "role": "LEAD_INVESTIGATOR"
    }

    req = ProvisionInvestigatorRequest(
        username=test_uname,
        badge_id="INV-3321",
        name="Sub-Insp. Priya Sharma",
        role="INVESTIGATOR",
        station="Cyber Crime Police Station",
        email="priya.sharma@police.gov.in",
        phone="+91 98765 43210",
        password="priyapassword2026"
    )

    res = provision_investigator_endpoint(req, commander=commander)
    assert res["status"] == "success"
    assert res["investigator"]["username"] == test_uname

    # Verify present in get_investigator_record
    rec = get_investigator_record(test_uname)
    assert rec is not None
    assert rec["badge_id"] == "INV-3321"
    assert verify_password("priyapassword2026", rec)

    # Verify login succeeds
    login_res = login_investigator(LoginRequest(username=test_uname, password="priyapassword2026"))
    assert "access_token" in login_res
    assert login_res["investigator"]["username"] == test_uname

    # Verify appears in roster
    roster_res = list_investigators_endpoint(commander=commander)
    roster_usernames = [inv["username"] for inv in roster_res["investigators"]]
    assert test_uname in roster_usernames

def test_load_audio_resilience():
    """Verifies that empty or corrupt audio does not crash load_audio_to_16k_mono."""
    # Empty bytes
    out_empty = load_audio_to_16k_mono(b"")
    assert isinstance(out_empty, np.ndarray)
    assert len(out_empty) == 0

    # None
    out_none = load_audio_to_16k_mono(None)
    assert isinstance(out_none, np.ndarray)
    assert len(out_none) == 0

    # Corrupt random bytes
    out_corrupt = load_audio_to_16k_mono(b"RIFFrandomgarbagebytesthatarenotvalidwav")
    assert isinstance(out_corrupt, np.ndarray)
    assert len(out_corrupt) == 0
