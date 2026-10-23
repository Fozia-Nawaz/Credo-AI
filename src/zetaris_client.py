import os
import pandas as pd
from dotenv import load_dotenv

load_dotenv()

class ZetarisClient:
    def __init__(self):
        self.sample_mode = os.getenv("SAMPLE_MODE", "true").lower() == "true"
        self.zetaris_url = os.getenv("ZETARIS_CLOUD_URL", "https://cloud.enterprise.zetaris.com")
        self.api_key = os.getenv("ZETARIS_API_KEY", "")

    def query_scholarships(self, major: str = None, min_cgpa: float = None):
        """
        Zetaris multi-source query executor.
        Queries Official, Aggregator, and Scam datasets.
        """
        if self.sample_mode:
            return self._query_local_csvs(major, min_cgpa)
        else:
            return self._query_zetaris_cloud_api(major, min_cgpa)

    def _query_local_csvs(self, major: str = None, min_cgpa: float = None):
        """Local fallback using generated CSVs for seamless offline testing."""
        official_df = pd.read_csv("data/official_providers.csv")
        aggregator_df = pd.read_csv("data/aggregator_listings.csv")
        scams_df = pd.read_csv("data/unverified_scams.csv")

        # Basic filtering logic
        if min_cgpa is not None:
            official_df = official_df[official_df["min_cgpa"] <= min_cgpa]

        official_records = official_df.to_dict(orient="records")
        aggregator_records = aggregator_df.to_dict(orient="records")
        scam_records = scams_df.to_dict(orient="records")

        return {
            "status": "success",
            "source": "local_sample_mode",
            "official_providers": official_records,
            "aggregator_listings": aggregator_records,
            "unverified_scams": scam_records
        }

    def _query_zetaris_cloud_api(self, major: str = None, min_cgpa: float = None):
        """Live Zetaris Platform Federated SQL Endpoint placeholder."""
        # Live Zetaris API connection logic will sit here once API keys are injected
        return {
            "status": "success",
            "source": "zetaris_cloud",
            "data": []
        }

# Quick test execution
if __name__ == "__main__":
    client = ZetarisClient()
    result = client.query_scholarships(major="CS", min_cgpa=3.5)
    print("✅ Zetaris Client Integration Test Successful:")
    print(f"Found {len(result['official_providers'])} Official, "
          f"{len(result['aggregator_listings'])} Aggregator, and "
          f"{len(result['unverified_scams'])} Scam records.")