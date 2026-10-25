import pandas as pd
import os

class ZetarisClient:
    def __init__(self):
        self.sample_mode = os.getenv("SAMPLE_MODE", "true").lower() == "true"
        self.data_dir = "data"

    def query_scholarships(self, major: str = "CS", min_cgpa: float = 3.5):
        """Fetches dynamic multi-source data across federated CSV source files in Zetaris Data Layer."""
        official_path = os.path.join(self.data_dir, "official_providers.csv")
        aggregator_path = os.path.join(self.data_dir, "aggregator_listings.csv")
        scam_path = os.path.join(self.data_dir, "unverified_scams.csv")

        cgpa_val = float(min_cgpa) if min_cgpa else 3.0
        major_filter = str(major).strip().upper() if major else "ANY"

        def filter_dataset(file_path, is_scam_or_agg=False):
            if not os.path.exists(file_path):
                return []
            try:
                df = pd.read_csv(file_path)
                # Apply CGPA filter mainly to official providers; for scams/aggregators include all matching major
                if not is_scam_or_agg:
                    matched_df = df[df['min_cgpa'] <= cgpa_val]
                else:
                    matched_df = df

                if major_filter != "ANY":
                    matched_df = matched_df[
                        (matched_df['major'].str.upper() == major_filter) | 
                        (matched_df['major'].str.upper() == 'ANY')
                    ]
                return matched_df.to_dict(orient='records')
            except Exception as e:
                print(f"[ZETARIS_FETCH_ERROR] {file_path}: {e}")
                return []

        return {
            "official_providers": filter_dataset(official_path, is_scam_or_agg=False),
            "aggregator_listings": filter_dataset(aggregator_path, is_scam_or_agg=True),
            "unverified_scams": filter_dataset(scam_path, is_scam_or_agg=True)
        }