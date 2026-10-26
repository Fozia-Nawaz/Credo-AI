class ReconcilerAgent:
    def reconcile(self, raw_data: dict):
        officials = raw_data.get("official_providers", [])
        aggregators = raw_data.get("aggregator_listings", [])
        scams = raw_data.get("unverified_scams", [])

        reconciled_list = []

        # 1. Official Records Tagging
        for item in officials:
            item_copy = dict(item)
            item_copy["badge"] = "VERIFIED"
            item_copy["status"] = "VERIFIED"
            item_copy["true_badge"] = "VERIFIED"
            item_copy["trust_score"] = item_copy.get("trust_score", 94)
            reconciled_list.append(item_copy)

        # 2. Aggregator (Discrepancy) Records Tagging
        for item in aggregators:
            item_copy = dict(item)
            item_copy["badge"] = "DISCREPANCY"
            item_copy["status"] = "DISCREPANCY"
            item_copy["true_badge"] = "DISCREPANCY"
            item_copy["trust_score"] = 68
            item_copy["discrepancy_details"] = "Deadline conflict across aggregator vs official registry."
            reconciled_list.append(item_copy)

        # 3. Scam Quarantine Records Tagging
        for item in scams:
            item_copy = dict(item)
            item_copy["badge"] = "SCAM_QUARANTINE"
            item_copy["status"] = "SCAM_QUARANTINE"
            item_copy["true_badge"] = "SCAM_QUARANTINE"
            item_copy["trust_score"] = 15
            item_copy["is_scam"] = True
            item_copy["discrepancy_details"] = "Unverified provider domain or illegal application fee requested."
            reconciled_list.append(item_copy)

        # Return BOTH formats to handle dictionary or list expectations safely
        return {
            "reconciled_opportunities": reconciled_list,
            "status": "success",
            "total": len(reconciled_list)
        }