import os
import pandas as pd

# Data directory exist karti hai ya nahi verify karein
os.makedirs("data", exist_ok=True)

# 1. Official Providers Dataset (Ground Truth)
official_data = [
    {
        "scholarship_id": "SCH_001",
        "title": "HEC Overseas Scholarship 2026",
        "provider": "Higher Education Commission Pakistan",
        "official_domain": "hec.gov.pk",
        "eligible_majors": "CS, EE, Data Science, AI",
        "min_cgpa": 3.0,
        "deadline": "2026-11-30",
        "application_fee": 0,
        "is_official": True
    },
    {
        "scholarship_id": "SCH_002",
        "title": "Fulbright Master's and PhD Program",
        "provider": "USEFP",
        "official_domain": "usefp.org",
        "eligible_majors": "All Majors, Linguistics, CS, Social Sciences",
        "min_cgpa": 3.2,
        "deadline": "2026-12-15",
        "application_fee": 0,
        "is_official": True
    },
    {
        "scholarship_id": "SCH_003",
        "title": "Chevening UK Scholarship",
        "provider": "UK Government",
        "official_domain": "chevening.org",
        "eligible_majors": "CS, Software Engineering, AI, Business",
        "min_cgpa": 2.8,
        "deadline": "2026-11-05",
        "application_fee": 0,
        "is_official": True
    }
]

# 2. Aggregator Listings Dataset (Conflicting Data)
aggregator_data = [
    {
        "scholarship_id": "SCH_001",
        "title": "HEC Foreign Phd & Master Grants 2026",
        "source_portal": "PakScholarshipsPortal.com",
        "source_domain": "pakscholarshipsportal.com",
        "listed_deadline": "2026-11-15",  # Conflict! Official is Nov 30
        "listed_min_cgpa": 3.2,            # Conflict! Official is 3.0
        "notes": "Third-party community blog post with outdated dates."
    },
    {
        "scholarship_id": "SCH_002",
        "title": "US Fulbright Scholarship Pakistan Loop",
        "source_portal": "GlobalGrantsHub.net",
        "source_domain": "globalgrantshub.net",
        "listed_deadline": "2026-12-01",  # Conflict! Official is Dec 15
        "listed_min_cgpa": 3.2,
        "notes": "Aggregator listing updated 2 months ago."
    }
]

# 3. Unverified Scams Dataset (Phishing & Fee Traps)
scam_data = [
    {
        "scam_id": "SCAM_101",
        "scholarship_id": "SCH_001",
        "title": "HEC Fully Funded Direct Grant - Fast Track Approval",
        "suspicious_domain": "hec-scholarship-apply-now.xyz",
        "fake_portal_url": "https://hec-scholarship-apply-now.xyz/register",
        "fee_demanded": 15,
        "fee_currency": "USD",
        "scam_reason": "Non-institutional .xyz domain requesting $15 processing fee for free government scheme."
    },
    {
        "scam_id": "SCAM_102",
        "scholarship_id": "SCH_002",
        "title": "Fulbright Fast-Track Guarantee Fee Portal",
        "suspicious_domain": "usefp-fulbright-grant.top",
        "fake_portal_url": "https://usefp-fulbright-grant.top/pay-fee",
        "fee_demanded": 25,
        "fee_currency": "USD",
        "scam_reason": "Fake domain requiring $25 documentation review fee."
    }
]

# Convert to DataFrames and export to CSV
df_official = pd.DataFrame(official_data)
df_aggregator = pd.DataFrame(aggregator_data)
df_scams = pd.DataFrame(scam_data)

df_official.to_csv("data/official_providers.csv", index=False)
df_aggregator.to_csv("data/aggregator_listings.csv", index=False)
df_scams.to_csv("data/unverified_scams.csv", index=False)

print("✅ Successfully generated all 3 Datasets in /data folder:")
print("   - data/official_providers.csv")
print("   - data/aggregator_listings.csv")
print("   - data/unverified_scams.csv")