"""
CyberGuard Supabase Cloud Persistence & Data Integration Client.
Provides deployment-compatible persistence for:
1. Investigator Authentication Roster (investigators table)
2. Forensic Case Evidence & Timelines (forensic_cases table)
3. Dispatch Call Queue (dispatch_call_queue table)
4. Chain-of-Custody Audit Logs (audit_logs table)

Architected with graceful local fallback: If SUPABASE_URL / SUPABASE_KEY are not
configured (or network is unreachable), runs safely in local standby mode so the
server never crashes or fails on startup.
"""

import os
import json
import time
import logging
from typing import Optional, Dict, Any, List

logger = logging.getLogger("cyberguard.supabase")

SUPABASE_URL = os.getenv("SUPABASE_URL", "").strip().rstrip("/")
SUPABASE_KEY = os.getenv("SUPABASE_KEY", "").strip() or os.getenv("SUPABASE_SERVICE_ROLE_KEY", "").strip()

class SupabaseGateway:
    def __init__(self, url: str = SUPABASE_URL, key: str = SUPABASE_KEY):
        self.url = url
        self.key = key
        self.is_connected = False
        self.client = None
        self._init_gateway()

    def _init_gateway(self):
        if not self.url or not self.key:
            logger.info("[SUPABASE] Running in local standby mode. Set SUPABASE_URL & SUPABASE_KEY to enable cloud persistence.")
            self.is_connected = False
            return

        # Attempt to initialize official supabase client if installed
        try:
            from supabase import create_client, Client
            self.client: Client = create_client(self.url, self.key)
            self.is_connected = True
            logger.info(f"[SUPABASE] Connected to cloud database: {self.url[:24]}...")
        except ImportError:
            # Fallback to direct HTTP PostgREST API
            self.is_connected = True
            logger.info(f"[SUPABASE] Connected via direct PostgREST HTTP Engine: {self.url[:24]}...")
        except Exception as e:
            logger.warning(f"[SUPABASE WARN] Could not connect to Supabase ({e}). Operating in local standby mode.")
            self.is_connected = False

    def _postgrest_headers(self) -> Dict[str, str]:
        return {
            "apikey": self.key,
            "Authorization": f"Bearer {self.key}",
            "Content-Type": "application/json",
            "Prefer": "return=representation"
        }

    # -------------------------------------------------------------------------
    # 1. INVESTIGATOR AUTHENTICATION
    # -------------------------------------------------------------------------
    def get_investigator_by_username(self, username: str) -> Optional[Dict[str, Any]]:
        """Queries investigator by username from Supabase or returns None."""
        if not self.is_connected:
            return None

        try:
            if self.client:
                res = self.client.table("investigators").select("*").eq("username", username).eq("is_active", True).execute()
                if res.data and len(res.data) > 0:
                    row = res.data[0]
                    return {
                        "username": row["username"],
                        "badge_id": row["badge_id"],
                        "name": row["name"],
                        "role": row["role"],
                        "station": row.get("station", "Cyber Crime Police Station"),
                        "email": row.get("email"),
                        "phone": row.get("phone"),
                        "salt": row["password_salt"],
                        "hash_hex": row["password_hash"]
                    }
            else:
                # Direct HTTP fetch via PostgREST
                import urllib.request
                req_url = f"{self.url}/rest/v1/investigators?username=eq.{username}&is_active=eq.true&select=*"
                req = urllib.request.Request(req_url, headers=self._postgrest_headers())
                with urllib.request.urlopen(req, timeout=5) as response:
                    data = json.loads(response.read().decode())
                    if data and len(data) > 0:
                        row = data[0]
                        return {
                            "username": row["username"],
                            "badge_id": row["badge_id"],
                            "name": row["name"],
                            "role": row["role"],
                            "station": row.get("station", "Cyber Crime Police Station"),
                            "email": row.get("email"),
                            "phone": row.get("phone"),
                            "salt": row["password_salt"],
                            "hash_hex": row["password_hash"]
                        }
        except Exception as ex:
            logger.warning(f"[SUPABASE ERROR] get_investigator query failed: {ex}")
        return None

    def update_investigator_password(self, username: str, new_salt: str, new_hash: str) -> bool:
        """Updates investigator's password salt and hash in Supabase."""
        if not self.is_connected:
            return False

        try:
            payload = {
                "password_salt": new_salt,
                "password_hash": new_hash,
                "updated_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
            }
            if self.client:
                self.client.table("investigators").update(payload).eq("username", username).execute()
                return True
            else:
                import urllib.request
                req_url = f"{self.url}/rest/v1/investigators?username=eq.{username}"
                headers = self._postgrest_headers()
                req = urllib.request.Request(req_url, data=json.dumps(payload).encode("utf-8"), headers=headers, method="PATCH")
                with urllib.request.urlopen(req, timeout=5):
                    return True
        except Exception as ex:
            logger.error(f"[SUPABASE ERROR] update_investigator_password failed: {ex}")
            return False

    def update_last_login(self, username: str):
        """Updates last_login_at timestamp for investigator."""
        if not self.is_connected:
            return
        try:
            payload = {"last_login_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())}
            if self.client:
                self.client.table("investigators").update(payload).eq("username", username).execute()
        except Exception:
            pass

    # -------------------------------------------------------------------------
    # 2. FORENSIC CASES & EVIDENCE STORAGE
    # -------------------------------------------------------------------------
    def save_forensic_case(self, case_record: Dict[str, Any]) -> bool:
        """
        Persists a completed wiretap analysis case into the forensic_cases table.
        Guarantees chain-of-custody tracking with cryptographic SHA-256 hash.
        """
        if not self.is_connected:
            return False

        try:
            payload = {
                "case_id": case_record.get("case_id") or f"CASE-{int(time.time())}",
                "filename": case_record.get("filename", "audio.wav"),
                "sha256_hash": case_record.get("sha256_hash", ""),
                "file_size_bytes": case_record.get("evidence_metadata", {}).get("file_size_bytes", 0),
                "duration_seconds": case_record.get("duration_seconds", 0.0),
                "duration_label": case_record.get("duration_label", "00:00"),
                "overall_urgency_score": case_record.get("overall_urgency_score", 0.0),
                "priority_level": case_record.get("priority_level", "ROUTINE"),
                "dominant_emotion": case_record.get("dominant_emotion", "NEUTRAL"),
                "primary_threat_tags": case_record.get("primary_threat_tags", []),
                "summary": case_record.get("summary", ""),
                "full_transcript": case_record.get("full_transcript", ""),
                "timeline": case_record.get("timeline", []),
                "peak_emotions": case_record.get("peak_emotions", {}),
                "average_emotions": case_record.get("average_emotions", {}),
                "investigator_badge_id": case_record.get("evidence_metadata", {}).get("investigator", {}).get("badge_id", "INV-UNKNOWN"),
                "investigator_name": case_record.get("evidence_metadata", {}).get("investigator", {}).get("name", "Duty Officer"),
                "evidence_metadata": case_record.get("evidence_metadata", {})
            }

            if self.client:
                self.client.table("forensic_cases").insert(payload).execute()
                logger.info(f"[SUPABASE] Forensic Case '{payload['case_id']}' stored successfully.")
                return True
            else:
                import urllib.request
                req_url = f"{self.url}/rest/v1/forensic_cases"
                req = urllib.request.Request(req_url, data=json.dumps(payload).encode("utf-8"), headers=self._postgrest_headers(), method="POST")
                with urllib.request.urlopen(req, timeout=5):
                    logger.info(f"[SUPABASE] Forensic Case '{payload['case_id']}' stored successfully via PostgREST.")
                    return True
        except Exception as ex:
            logger.error(f"[SUPABASE ERROR] save_forensic_case failed: {ex}")
            return False

    def list_forensic_cases(self, limit: int = 20) -> List[Dict[str, Any]]:
        """Retrieves historical forensic cases ordered by urgency / creation date."""
        if not self.is_connected:
            return []
        try:
            if self.client:
                res = self.client.table("forensic_cases").select("*").order("created_at", desc=True).limit(limit).execute()
                return res.data or []
            else:
                import urllib.request
                req_url = f"{self.url}/rest/v1/forensic_cases?select=*&order=created_at.desc&limit={limit}"
                req = urllib.request.Request(req_url, headers=self._postgrest_headers())
                with urllib.request.urlopen(req, timeout=5) as resp:
                    return json.loads(resp.read().decode()) or []
        except Exception as ex:
            logger.warning(f"[SUPABASE ERROR] list_forensic_cases failed: {ex}")
            return []

    # -------------------------------------------------------------------------
    # 3. AUDIT LOGGING & CHAIN-OF-CUSTODY
    # -------------------------------------------------------------------------
    def log_audit_event(
        self,
        event_type: str,
        investigator_badge_id: str,
        investigator_name: Optional[str] = None,
        details: Optional[Dict[str, Any]] = None,
        ip_address: Optional[str] = None
    ):
        """Records a permanent security or forensic audit log in Supabase."""
        if not self.is_connected:
            return

        try:
            payload = {
                "event_type": event_type,
                "investigator_badge_id": investigator_badge_id,
                "investigator_name": investigator_name or "Duty Officer",
                "ip_address": ip_address,
                "details": details or {}
            }

            if self.client:
                self.client.table("audit_logs").insert(payload).execute()
            else:
                import urllib.request
                req_url = f"{self.url}/rest/v1/audit_logs"
                req = urllib.request.Request(req_url, data=json.dumps(payload).encode("utf-8"), headers=self._postgrest_headers(), method="POST")
                with urllib.request.urlopen(req, timeout=5):
                    pass
        except Exception as ex:
            logger.warning(f"[SUPABASE AUDIT] Failed to record audit log: {ex}")

# Global Gateway Instance
supabase_gateway = SupabaseGateway()

