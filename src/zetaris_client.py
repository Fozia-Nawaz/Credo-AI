import os
import requests
import pandas as pd

class ZetarisClient:
    def __init__(self):
        # Read environment variables from your existing .env
        self.sample_mode = os.getenv("SAMPLE_MODE", "true").lower() == "true"
        self.api_key = os.getenv("ZETARIS_API_KEY", "")
        # Uses your existing proxy URL or default endpoint
        self.endpoint = os.getenv("ZETARIS_ENDPOINT") or os.getenv("NIGHTSHIFT_PROXY_URL") or "http://localhost:8000/api/zetaris/query"
        self.data_dir = "data"

    def query_scholarships(self, major: str = "CS", min_cgpa: float = 3.5) -> dict:
        """
        Queries live Zetaris Federated REST Gateway when SAMPLE_MODE=false.
        Falls back seamlessly to local CSV datasets if API Key is missing or network fails.
        """
        if not self.sample_mode and self.api_key:
            print(f"[ZETARIS_GATEWAY] Attempting connection via {self.endpoint}...")
            try:
                headers = {
                    "Authorization": f"Bearer {self.api_key}",
                    "Content-Type": "application/json"
                }
                payload = {
                    "query_type": "scholarships_federated_search",
                    "parameters": {
                        "major": major,
                        "min_cgpa": float(min_cgpa)
                    }
                }
                
                response = requests.post(self.endpoint, json=payload, headers=headers, timeout=5)
                
                if response.status_code == 200:
                    data = response.json()
                    print("[ZETARIS_GATEWAY] Live gateway query successful!")
                    return {
                        "official_providers": data.get("official_providers", []),
                        "aggregator_listings": data.get("aggregator_listings", []),
                        "unverified_scams": data.get("unverified_scams", [])
                    }
                else:
                    print(f"[ZETARIS_GATEWAY_WARNING] API returned status {response.status_code}. Using local dataset fallback.")
            except Exception as e:
                print(f"[ZETARIS_GATEWAY_NOTICE] Network call skipped/failed ({e}). Serving via local dataset layer.")

        # Local CSV Engine Execution (Fallback & Sample Mode)
        print("[ZETARIS_ENGINE] Serving requests via Local Data Layer.")
        return self._fetch_from_local_csv(major, min_cgpa)

    def _fetch_from_local_csv(self, major: str, min_cgpa: float) -> dict:
        official_path = os.path.join(self.data_dir, "official_providers.csv")
        aggregator_path = os.path.join(self.data_dir, "aggregator_listings.csv")
        scam_path = os.path.join(self.data_dir, "unverified_scams.csv")

        cgpa_val = float(min_cgpa) if min_cgpa else 3.0
        search_term = str(major).strip().upper() if major else "ANY"

        def filter_dataset(file_path, is_scam_or_agg=False):
            if not os.path.exists(file_path):
                return []
            try:
                df = pd.read_csv(file_path)
                if not is_scam_or_agg:
                    matched_df = df[df['min_cgpa'] <= cgpa_val]
                    if search_term != "ANY":
                        matched_df = matched_df[
                            (matched_df['major'].str.upper().str.contains("COMP", na=False)) | 
                            (matched_df['major'].str.upper() == search_term) | 
                            (matched_df['major'].str.upper() == 'ANY')
                        ]
                    return matched_df.to_dict(orient='records')
                else:
                    return df.to_dict(orient='records')
            except Exception as e:
                print(f"[FETCH_ERROR] {file_path}: {e}")
                return []

        return {
            "official_providers": filter_dataset(official_path, is_scam_or_agg=False),
            "aggregator_listings": filter_dataset(aggregator_path, is_scam_or_agg=True),
            "unverified_scams": filter_dataset(scam_path, is_scam_or_agg=True)
        } 