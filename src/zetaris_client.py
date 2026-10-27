import os
import re
import uuid
import requests
import pandas as pd
from urllib.parse import urlparse
 
try:  # optional: load .env automatically if python-dotenv is installed
    from dotenv import load_dotenv, find_dotenv
    load_dotenv(find_dotenv(usecwd=True), override=True)
except Exception:
    pass
 
MAX_OFFICIAL = 50     # official records returned per search
MAX_AGGREGATOR = 50   # aggregator listings for the same major
MAX_SCAMS = 50        # scam listings for the same major
 
# The majors that actually exist in the Zetaris tables (plus "ANY" for general scholarships).
KNOWN_MAJORS = [
    "COMPUTER SCIENCE", "AI", "DATA SCIENCE", "MEDICAL",
    "ENGINEERING", "BUSINESS", "HUMANITIES",
]
 
# Words a student might type, mapped to the majors that exist in the data.
ALIASES = {
    # Computer Science
    "CS": "COMPUTER SCIENCE", "COMPUTING": "COMPUTER SCIENCE", "COMPUTER": "COMPUTER SCIENCE",
    "SOFTWARE ENGINEERING": "COMPUTER SCIENCE", "SOFTWARE": "COMPUTER SCIENCE",
    "INFORMATION TECHNOLOGY": "COMPUTER SCIENCE", "IT": "COMPUTER SCIENCE",
    "CYBERSECURITY": "COMPUTER SCIENCE", "CYBER SECURITY": "COMPUTER SCIENCE",
    # AI
    "ARTIFICIAL INTELLIGENCE": "AI", "MACHINE LEARNING": "AI", "ML": "AI",
    "DEEP LEARNING": "AI", "ROBOTICS": "AI",
    # Data Science
    "DS": "DATA SCIENCE", "DATA": "DATA SCIENCE", "DATA ANALYTICS": "DATA SCIENCE",
    "STATISTICS": "DATA SCIENCE", "MATHEMATICS": "DATA SCIENCE", "MATH": "DATA SCIENCE",
    # Medical / life sciences
    "MEDICINE": "MEDICAL", "MEDICAL SCIENCES": "MEDICAL", "HEALTH": "MEDICAL",
    "BIOLOGY": "MEDICAL", "BIOTECHNOLOGY": "MEDICAL", "BIOCHEMISTRY": "MEDICAL",
    "PHARMACY": "MEDICAL", "NURSING": "MEDICAL", "PUBLIC HEALTH": "MEDICAL",
    "MBBS": "MEDICAL", "DENTISTRY": "MEDICAL", "LIFE SCIENCES": "MEDICAL",
    # Engineering
    "EE": "ENGINEERING", "ELECTRICAL ENGINEERING": "ENGINEERING",
    "MECHANICAL ENGINEERING": "ENGINEERING", "CIVIL ENGINEERING": "ENGINEERING",
    "CHEMICAL ENGINEERING": "ENGINEERING", "ELECTRONICS": "ENGINEERING",
    # Business
    "BUSINESS ADMINISTRATION": "BUSINESS", "MBA": "BUSINESS", "BBA": "BUSINESS",
    "ECONOMICS": "BUSINESS", "FINANCE": "BUSINESS", "ACCOUNTING": "BUSINESS",
    "MARKETING": "BUSINESS", "MANAGEMENT": "BUSINESS",
    # Humanities
    "ARTS": "HUMANITIES", "SOCIAL SCIENCES": "HUMANITIES", "ENGLISH": "HUMANITIES",
    "LITERATURE": "HUMANITIES", "HISTORY": "HUMANITIES", "LAW": "HUMANITIES",
    "PSYCHOLOGY": "HUMANITIES", "SOCIOLOGY": "HUMANITIES", "EDUCATION": "HUMANITIES",
    "POLITICAL SCIENCE": "HUMANITIES", "PHILOSOPHY": "HUMANITIES",
}
 
 
class ZetarisClient:
    """Reads scholarship data from Zetaris (SAMPLE_MODE=false) or from the local CSV files.
 
    After every query, `last_source` says where the data really came from:
    "zetaris_live", "local_csv_fallback" or "local_csv_sample_mode".
    If Zetaris failed, `last_error` says why. Both are also included in the returned dict.
    All credentials come from environment variables.
    """
 
    def __init__(self):
        self.sample_mode = os.getenv("SAMPLE_MODE", "true").lower() == "true"
        self.api_key = os.getenv("ZETARIS_API_KEY", "")
        # e.g. http://localhost:8888/api/v1.0/sql-editor/sqls/run-query
        self.endpoint = os.getenv("ZETARIS_ENDPOINT") or os.getenv("ZETARIS_API_URL") or os.getenv("ZETARIS_URL") or ""
        self.org_id = os.getenv("ZETARIS_ORG_ID", "1")
        self.database = os.getenv("ZETARIS_DATABASE", "CREDO_AI_DB")
        self.data_dir = "data"
        self.last_source = "local_csv_sample_mode" if self.sample_mode else "unknown"
        self.last_error = ""
 
    # ---------- public ----------
    def query_scholarships(self, major: str = "COMPUTER SCIENCE", min_cgpa: float = 3.5) -> dict:
        major_clean = self._clean_major(major)
        cgpa = self._num(min_cgpa, 3.0)
        print(f"[ZETARIS] query: major={major_clean!r} (input={major!r}), cgpa={cgpa}")
 
        if not self.sample_mode:
            if not (self.api_key and self.endpoint):
                self.last_error = "ZETARIS_API_KEY or ZETARIS_ENDPOINT is not set"
            else:
                try:
                    print(f"[ZETARIS_GATEWAY] Attempting connection via {self.endpoint}...")
                    data = self._query_live(major_clean, cgpa)
                    self.last_source = "zetaris_live"
                    self.last_error = ""
                    data["source"] = self.last_source
                    print("[ZETARIS_GATEWAY] Live gateway query successful!")
                    print(
                        "[ZETARIS] live query OK: "
                        f"{len(data['official_providers'])} official, "
                        f"{len(data['aggregator_listings'])} aggregator, "
                        f"{len(data['unverified_scams'])} scams"
                    )
                    return data
                except Exception as exc:
                    self.last_error = str(exc)
            print(f"[ZETARIS_GATEWAY_WARNING] {self.last_error}. Using local dataset fallback.")
            print("[ZETARIS_ENGINE] Serving requests via Local Data Layer.")
            self.last_source = "local_csv_fallback"
        else:
            self.last_source = "local_csv_sample_mode"
            self.last_error = ""
 
        data = self._query_local(major_clean, cgpa)
        data["source"] = self.last_source
        data["fallback_reason"] = self.last_error
        return data
 
    # ---------- live Zetaris ----------
    def _query_live(self, major: str, cgpa: float) -> dict:
        # Only a number goes into the SQL; the major is matched in Python (no SQL injection risk).
        db = self.database
        with requests.Session() as session:
            officials = self._run_sql(
                session, f"SELECT * FROM {db}.official_providers WHERE CAST(min_cgpa AS DOUBLE) <= {cgpa}"
            )
            aggregators = self._run_sql(session, f"SELECT * FROM {db}.aggregator_listings")
            scams = self._run_sql(session, f"SELECT * FROM {db}.unverified_scams")
        return self._select(officials, aggregators, scams, major)
 
    def _run_sql(self, session, sql: str) -> list:
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "X-Org-ID": self.org_id,
            "X-Request-ID": str(uuid.uuid4()),
            "Content-Type": "application/json",
        }
        body = {"queryId": str(uuid.uuid4()), "sql": sql, "source": "SqlEditor", "limit": 1000}
        response = session.post(self.endpoint, json=body, headers=headers, timeout=15)
        if response.status_code != 200:
            detail = (response.text or "")[:200].replace("\n", " ")
            raise RuntimeError(f"Zetaris returned HTTP {response.status_code}: {detail}")
        payload = response.json()
        names, rows = payload.get("headers"), payload.get("data")
        if not isinstance(names, list) or not isinstance(rows, list):
            raise RuntimeError("Unrecognised Zetaris response format")
        return [dict(zip(names, row)) for row in rows]
 
    # ---------- local CSV (sample mode and fallback) ----------
    def _query_local(self, major: str, cgpa: float) -> dict:
        officials = [
            r for r in self._read_csv("official_providers.csv")
            if self._num(r.get("min_cgpa"), 0.0) <= cgpa
        ]
        return self._select(
            officials,
            self._read_csv("aggregator_listings.csv"),
            self._read_csv("unverified_scams.csv"),
            major,
        )
 
    def _read_csv(self, name: str) -> list:
        path = os.path.join(self.data_dir, name)
        if not os.path.exists(path):
            print(f"[ZETARIS] missing file: {path}")
            return []
        try:
            df = pd.read_csv(path)
            return df.astype(object).where(df.notna(), None).to_dict(orient="records")
        except Exception as exc:
            print(f"[ZETARIS] could not read {path}: {exc}")
            return []
 
    # ---------- shared selection ----------
    def _select(self, officials, aggregators, scams, major: str) -> dict:
        def matches(row, allow_any: bool) -> int:
            m = str(row.get("major") or "").strip().upper()
            if major == "ANY" or m == major:
                return 2
            if allow_any and m in ("", "ANY"):
                return 1
            return 0
 
        def prepare(rows):
            out = []
            for row in rows:
                item = dict(row)
                item["min_cgpa"] = self._num(item.get("min_cgpa"), 0.0)
                item["trust_score"] = self._num(item.get("trust_score"), 0.0)
                item["is_scam"] = str(item.get("is_scam")).strip().lower() == "true"
                item["scholarship_id"] = item.get("id")  # for code that expects this name
                # The cards show "Source" from item["domain"]; build it from whichever link column exists.
                link = str(item.get("official_link") or item.get("source_url") or item.get("suspicious_url") or "")
                host = urlparse(link if "://" in link else "//" + link).netloc.lower()
                host = host[4:] if host.startswith("www.") else host
                item["domain"] = item.get("domain") or host or None
                item["source_domain"] = item["domain"]
                out.append(item)
            return out
 
        def pick(rows, limit, allow_any):
            scored = [(matches(r, allow_any), r) for r in prepare(rows)]
            scored = [(s, r) for s, r in scored if s > 0]
            scored.sort(key=lambda x: (x[0], x[1]["trust_score"]), reverse=True)
            return [r for _, r in scored[:limit]]
 
        return {
            "status": "success",
            "source": self.last_source,
            # General ("ANY") scholarships are valid for every student, so officials include them.
            "official_providers": pick(officials, MAX_OFFICIAL, allow_any=True),
            # Aggregators and scams are shown only for the student's own field.
            "aggregator_listings": pick(aggregators, MAX_AGGREGATOR, allow_any=False),
            "unverified_scams": pick(scams, MAX_SCAMS, allow_any=False),
        }
 
    # ---------- helpers ----------
    @staticmethod
    def _clean_major(major) -> str:
        text = re.sub(r"[^A-Za-z0-9 &/\-]", "", str(major or "")).strip().upper()
        text = re.sub(r"\s+", " ", text)
        if not text:
            return "ANY"
        if text in KNOWN_MAJORS:
            return text
        if text in ALIASES:
            return ALIASES[text]
        # Phrase contains a known major or alias as whole words, e.g. "MOLECULAR BIOLOGY".
        for known in KNOWN_MAJORS:
            if re.search(rf"\b{re.escape(known)}\b", text):
                return known
        for alias in sorted(ALIASES, key=len, reverse=True):
            if len(alias) > 3 and re.search(rf"\b{re.escape(alias)}\b", text):
                return ALIASES[alias]
        return text
 
    @staticmethod
    def _num(value, default: float) -> float:
        try:
            return float(value)
        except (TypeError, ValueError):
            return default