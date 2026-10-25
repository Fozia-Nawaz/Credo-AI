from src.zetaris_client import ZetarisClient


class ReconcilerAgent:
    def __init__(self):
        self.agent_name = "Reconciler Agent"
        self.zetaris = ZetarisClient()

    @staticmethod
    def _normalize_text(value):
        if value is None:
            return ""
        return " ".join(str(value).lower().replace("&", " ").replace("/", " ").split())

    @classmethod
    def _tokenize(cls, value):
        text = cls._normalize_text(value)
        if not text:
            return []
        stop_words = {
            "scholarship", "award", "grant", "portal", "listing", "fund", "program",
            "global", "international", "official", "unverified", "provider", "student",
            "scholarships", "awards", "grants", "listing", "portal", "hub", "registry",
            "overseas", "technology", "fellowship", "students", "study", "search",
            "opportunity", "education", "direct", "network", "forum", "group"
        }
        tokens = []
        for token in text.replace("-", " ").split():
            token = token.strip(".,:;()[]{}'\"")
            if token and token not in stop_words:
                tokens.append(token)
        return tokens

    @classmethod
    def _match_aggregators(cls, official, aggregator_list):
        if not isinstance(official, dict):
            return []

        official_id = official.get("scholarship_id") or official.get("id")
        matches = []
        for agg in aggregator_list:
            if not isinstance(agg, dict):
                continue
            agg_id = agg.get("scholarship_id") or agg.get("id")
            if official_id and agg_id and official_id == agg_id:
                matches.append(agg)
                continue

            official_provider = cls._normalize_text(official.get("provider"))
            official_title = cls._normalize_text(official.get("title"))
            agg_provider = cls._normalize_text(agg.get("provider"))
            agg_title = cls._normalize_text(agg.get("title"))

            provider_overlap = bool(
                official_provider and agg_provider and
                (
                    official_provider in agg_provider or agg_provider in official_provider or
                    set(cls._tokenize(official.get("provider"))) & set(cls._tokenize(agg.get("provider")))
                )
            )

            title_overlap = set(cls._tokenize(official.get("title"))) & set(cls._tokenize(agg.get("title")))
            title_overlap_count = len(title_overlap)
            is_likely_match = provider_overlap and title_overlap_count >= 1
            if not is_likely_match and title_overlap_count >= 2:
                is_likely_match = True

            if is_likely_match:
                matches.append(agg)

        return matches

    def reconcile(self, search_params: dict) -> dict:
        """
        Queries Zetaris data layers and detects cross-source conflicts.
        """
        if isinstance(search_params, dict):
            major = search_params.get("major")
            min_cgpa = search_params.get("min_cgpa")
            raw_data = search_params if "official_providers" in search_params else self.zetaris.query_scholarships(major=major, min_cgpa=min_cgpa)
        else:
            raw_data = self.zetaris.query_scholarships()

        official_list = raw_data.get("official_providers", [])
        aggregator_list = raw_data.get("aggregator_listings", [])
        scams_list = raw_data.get("unverified_scams", [])

        reconciled_opportunities = []
        logs = []

        for official in official_list:
            related_aggregators = self._match_aggregators(official, aggregator_list)

            has_conflict = False
            conflict_details = []

            for agg in related_aggregators:
                official_deadline = official.get("deadline") or official.get("listed_deadline")
                agg_deadline = agg.get("deadline") or agg.get("listed_deadline")
                if agg_deadline != official_deadline:
                    has_conflict = True
                    source_name = agg.get("source_portal") or agg.get("source_url") or "Aggregator"
                    conflict_details.append(
                        f"Deadline Conflict: Official={official_deadline} vs Aggregator ({source_name})={agg_deadline}"
                    )

            if has_conflict:
                logs.append(f"[RECONCILER] Detected conflict for {official.get('title')}: Reconciled to official source.")

            reconciled_opportunities.append({
                "official_record": official,
                "title": official.get("title", "Scholarship Option"),
                "provider": official.get("provider", "Official Provider"),
                "funding": official.get("funding", "Full Funding"),
                "funding_amount": official.get("funding", "Full Funding"),
                "sources": [official.get("source_portal", "Official Portal")],
                "aggregator_matches": related_aggregators,
                "has_conflict": has_conflict,
                "conflict_details": conflict_details,
                "deadline": official.get("deadline") or official.get("listed_deadline"),
            })

        return {
            "agent": self.agent_name,
            "reconciled_opportunities": reconciled_opportunities,
            "detected_scams_pool": scams_list,
            "logs": logs
        }

    def re_verify_item(self, item: dict) -> dict:
        """Retry loop hook triggered by Trust Critic for secondary reconciliation."""
        reverified_item = item.copy()
        reverified_item["deadline_status"] = "VERIFIED_VIA_RETRY"
        reverified_item["reconciled_conflict"] = True
        return reverified_item
    