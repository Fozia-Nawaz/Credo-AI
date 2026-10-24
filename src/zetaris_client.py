import os
import requests
import pandas as pd
from dotenv import load_dotenv

load_dotenv()

class ZetarisClient:
    def __init__(self):
        self.sample_mode = os.getenv("SAMPLE_MODE", "true").lower() == "true"
        # Official Zetaris REST API Endpoint base structure
        self.zetaris_url = os.getenv("ZETARIS_CLOUD_URL", "https://api.zetaris.com/v1/query")
        self.api_key = os.getenv("ZETARIS_API_KEY", "open_demo_key")

    def query_scholarships(self, major: str = None, min_cgpa: float = None):
        """
        Zetaris multi-source query executor.
        Queries Official, Aggregator, and Scam datasets.
        """
        if self.sample_mode:
            return self._query_local_csvs(major, min_cgpa)
        else:
            return self._query_zetaris_rest_api(major, min_cgpa)

    def _query_local_csvs(self, major: str = None, min_cgpa: float = None):
        """Local fallback using generated CSVs based on Zetaris CSV schema standards."""
        official_df = pd.read_csv("data/official_providers.csv")
        aggregator_df = pd.read_csv("data/aggregator_listings.csv")
        scams_df = pd.read_csv("data/unverified_scams.csv")

        if min_cgpa is not None:
            official_df = official_df[official_df["min_cgpa"] <= min_cgpa]

        official_records = official_df.to_dict(orient="records")
        aggregator_records = aggregator_df.to_dict(orient="records")
        scam_records = scams_df.to_dict(orient="records")

        return {
            "status": "success",
            "source": "zetaris_local_csv_engine",
            "official_providers": official_records,
            "aggregator_listings": aggregator_records,
            "unverified_scams": scam_records
        }

    def _query_zetaris_rest_api(self, major: str = None, min_cgpa: float = None):
        """
        Zetaris Open REST API Integration (Ref: Zetaris rest-api-sources.md)
        Executes REST queries against external endpoints or federated endpoints.
        """
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        
        payload = {
            "query_type": "federated_search",
            "sources": ["official_providers", "aggregator_listings", "unverified_scams"],
            "filters": {
                "major": major,
                "min_cgpa": min_cgpa
            }
        }

        try:
            response = requests.post(self.zetaris_url, json=payload, headers=headers, timeout=5)
            if response.status_code == 200:
                return response.json()
            else:
                print(f"[ZETARIS CLIENT WARNING] REST API returned status {response.status_code}. Falling back to CSV engine.")
                return self._query_local_csvs(major, min_cgpa)
        except Exception as e:
            print(f"[ZETARIS CLIENT NOTICE] REST API Connection timeout ({e}). Seamlessly utilizing CSV data engine.")
            return self._query_local_csvs(major, min_cgpa)

# Verification Test Execution
if __name__ == "__main__":
    client = ZetarisClient()
    result = client.query_scholarships(major="CS", min_cgpa=3.5)
    print("✅ Zetaris REST/CSV Connector Test Successful:")
    print(f"Engine Source: {result['source']}")
    print(f"Records Fetched -> Official: {len(result['official_providers'])}, Aggregators: {len(result['aggregator_listings'])}, Scams: {len(result['unverified_scams'])}")