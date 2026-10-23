from src.zetaris_client import ZetarisClient

class ReconcilerAgent:
    def __init__(self):
        self.agent_name = "Reconciler Agent"
        self.zetaris = ZetarisClient()

    def reconcile(self, search_params: dict) -> dict:
        """
        Queries Zetaris data layers and detects cross-source conflicts.
        """
        major = search_params.get("major")
        min_cgpa = search_params.get("min_cgpa")

        raw_data = self.zetaris.query_scholarships(major=major, min_cgpa=min_cgpa)

        official_list = raw_data.get("official_providers", [])
        aggregator_list = raw_data.get("aggregator_listings", [])
        scams_list = raw_data.get("unverified_scams", [])

        reconciled_opportunities = []
        logs = []

        for official in official_list:
            sch_id = official["scholarship_id"]
            # Find matching aggregator records
            related_aggregators = [a for a in aggregator_list if a["scholarship_id"] == sch_id]
            
            has_conflict = False
            conflict_details = []

            for agg in related_aggregators:
                if agg["listed_deadline"] != official["deadline"]:
                    has_conflict = True
                    conflict_details.append(
                        f"Deadline Conflict: Official={official['deadline']} vs Aggregator ({agg['source_portal']})={agg['listed_deadline']}"
                    )
            
            if has_conflict:
                logs.append(f"[RECONCILER] Detected conflict for {official['title']}: Reconciled to official source.")

            reconciled_opportunities.append({
                "official_record": official,
                "aggregator_matches": related_aggregators,
                "has_conflict": has_conflict,
                "conflict_details": conflict_details
            })

        return {
            "agent": self.agent_name,
            "reconciled_opportunities": reconciled_opportunities,
            "detected_scams_pool": scams_list,
            "logs": logs
        }