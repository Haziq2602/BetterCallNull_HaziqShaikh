#!/usr/bin/env python3
"""
CyberGuard 2026 - Law Enforcement Personnel Provisioning CLI.
Inserts an investigator into the Supabase database with PBKDF2-HMAC-SHA256 hashing.
Usage:
  python scripts/provision_officer.py --username investigator_02 --badge INV-8910 --name "Sub-Insp. Priya Sharma" --password "cyberguard2026"
  python scripts/provision_officer.py --interactive
"""

import sys
import os
import argparse
import secrets
import hashlib
import time

# Ensure project root is in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from backend.auth import hash_password
from backend.core.supabase_client import supabase_gateway

def main():
    parser = argparse.ArgumentParser(description="Provision a new CyberGuard duty investigator.")
    parser.add_argument("--username", help="Unique investigator username (e.g. investigator_02)")
    parser.add_argument("--badge", help="Official badge ID (e.g. INV-8910)")
    parser.add_argument("--name", help="Officer full name (e.g. Sub-Insp. Priya Sharma)")
    parser.add_argument("--role", default="INVESTIGATOR", choices=["INVESTIGATOR", "CYBER_FORENSIC_EXPERT", "DUTY_SERGEANT", "LEAD_INVESTIGATOR", "SUPERINTENDENT"], help="Assigned duty role")
    parser.add_argument("--station", default="Cyber Crime Police Station, Mumbai", help="Station or division name")
    parser.add_argument("--email", default=None, help="Confidential official email")
    parser.add_argument("--phone", default=None, help="Confidential phone number")
    parser.add_argument("--password", help="Initial access passcode (min 6 chars)")
    parser.add_argument("--interactive", action="store_true", help="Run interactive prompt")

    args = parser.parse_args()

    if args.interactive or not (args.username and args.badge and args.name and args.password):
        print("=" * 65)
        print("CYBERGUARD: STATION COMMANDER PERSONNEL PROVISIONING TOOL")
        print("=" * 65)
        username = input("Investigator Username (e.g. investigator_02): ").strip()
        badge = input("Official Badge ID (e.g. INV-8910): ").strip()
        name = input("Officer Full Name: ").strip()
        role = input("Role [INVESTIGATOR / CYBER_FORENSIC_EXPERT / LEAD_INVESTIGATOR]: ").strip() or "INVESTIGATOR"
        station = input("Station [Cyber Crime Police Station, Mumbai]: ").strip() or "Cyber Crime Police Station, Mumbai"
        email = input("Confidential Email: ").strip() or None
        phone = input("Confidential Phone: ").strip() or None
        password = input("Initial Duty Passcode: ").strip()
    else:
        username = args.username.strip()
        badge = args.badge.strip()
        name = args.name.strip()
        role = args.role.strip()
        station = args.station.strip()
        email = args.email.strip() if args.email else None
        phone = args.phone.strip() if args.phone else None
        password = args.password.strip()

    if not username or not badge or not name or not password:
        print("[ERROR] Username, Badge, Name, and Passcode are strictly required.")
        sys.exit(1)

    if len(password) < 6:
        print("[ERROR] Passcode must be at least 6 characters.")
        sys.exit(1)

    print(f"\n[1/3] Hashing passcode with PBKDF2-HMAC-SHA256 (600,000 rounds)...")
    salt, hash_hex = hash_password(password)

    print(f"[2/3] Connecting to Supabase Cloud Database: {supabase_gateway.url}...")
    success = supabase_gateway.create_investigator(
        username=username,
        badge_id=badge,
        name=name,
        role=role,
        station=station,
        email=email,
        phone=phone,
        salt=salt,
        hash_hex=hash_hex
    )

    if success:
        supabase_gateway.log_audit_event(
            event_type="INVESTIGATOR_PROVISIONED_CLI",
            investigator_badge_id=badge,
            investigator_name=name,
            details={"username": username, "role": role, "station": station}
        )
        print(f"[3/3] Success! Officer '{name}' ({badge}) is officially provisioned in database.")
    else:
        print(f"[3/3] [WARNING] Could not insert into Supabase directly (check network/credentials).")
        print(f"       Generated Salt:     {salt}")
        print(f"       Password Hash (Hex): {hash_hex}")

    print("\n" + "=" * 65)
    print("PROVISIONED PERSONNEL SUMMARY:")
    print(f"  Login Username:   {username}")
    print(f"  Badge ID:         {badge}")
    print(f"  Officer Name:     {name}")
    print(f"  Role:             {role}")
    print(f"  Station:          {station}")
    print(f"  Confidential EM:  {email or 'Not Registered'}")
    print(f"  Confidential PH:  {phone or 'Not Registered'}")
    print(f"  Duty Status:      ACTIVE")
    print("=" * 65)

if __name__ == "__main__":
    main()

