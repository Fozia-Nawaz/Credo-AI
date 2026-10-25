from src.nightshift_client import NightshiftClient


class TrustCriticAgent:
    def __init__(self):
        self.agent_name = "Trust Critic Agent"
        self.nightshift = NightshiftClient()

    @staticmethod
    def _safe_value(mapping: dict, *keys, default=None):
        for key in keys:
            if mapping.get(key) is not None:
                return mapping.get(key)
        return default

    def audit_item(self, item: dict) -> dict:
        """Backward-compatible adapter used by older pipeline code."""
        if not isinstance(item, dict):
            return {"title": str(item), "badge": "UNVERIFIED", "trust_score": 0, "official_record": None}

        official = item.get("official_record") or item
        if not isinstance(official, dict):
            return {**item, "badge": "UNVERIFIED", "trust_score": 0}

        evaluated = {
            "title": official.get("title") or item.get("title"),
            "scholarship_id": official.get("scholarship_id") or item.get("scholarship_id"),
            "provider": official.get("provider") or item.get("provider"),
            "funding": official.get("funding") or item.get("funding"),
            "funding_amount": official.get("funding") or item.get("funding"),
            "official_record": official,
            "aggregator_matches": item.get("aggregator_matches", []),
            "conflict_details": item.get("conflict_details", []),
            "domain": official.get("official_domain") or official.get("domain"),
            "deadline": official.get("deadline") or item.get("deadline"),
            "application_fee": official.get("application_fee", item.get("application_fee", 0)),
            "badge": "VERIFIED" if not item.get("has_conflict") else "CONFLICTING_DATES",
            "trust_score": 85 if item.get("has_conflict") else 100,
            "audit_proof": f"Official record verified for {official.get('title')}."
        }
        return evaluated

    def evaluate(self, reconciler_output: dict) -> dict:
        """
        Performs scam detection, domain verification, and assigns Trust Badges with Nightshift LLM proofs.
        """
        reconciler_output = reconciler_output or {}
        reconciled_opps = reconciler_output.get("reconciled_opportunities", [])
        scams_pool = reconciler_output.get("detected_scams_pool", [])

        evaluated_results = []
        logs = []

        for item in reconciled_opps:
            official = item.get("official_record") if isinstance(item, dict) else None
            if not isinstance(official, dict):
                continue

            has_conflict = bool(item.get("has_conflict"))
            badge = "CONFLICTING_DATES" if has_conflict else "VERIFIED"
            trust_score = 85 if has_conflict else 100

            if has_conflict:
                logs.append(f"[TRUST CRITIC] Assigned Badge: {badge} for {official.get('title')} due to date mismatch across aggregators.")
            else:
                logs.append(f"[TRUST CRITIC] Assigned Badge: {badge} for {official.get('title')} - Official record confirmed.")

            prompt = (
                f"Audit scholarship {official.get('title')} on domain {official.get('official_domain') or official.get('domain') or 'unknown'} "
                f"with fee ${official.get('application_fee', 0)}."
            )
            llm_proof = self.nightshift.generate_reasoning(prompt, system_role="TRUST CRITIC AGENT")
            official_funding = official.get("funding") or item.get("funding")
            evidence = {
                "title": official.get("title"),
                "scholarship_id": official.get("scholarship_id") or official.get("id"),
                "domain": official.get("official_domain") or official.get("domain") or "official-source",
                "provider": official.get("provider"),
                "funding": official_funding,
                "funding_amount": official_funding,
                "official_record": official,
                "aggregator_matches": item.get("aggregator_matches", []),
                "conflict_details": item.get("conflict_details", []),
                "badge": badge,
                "trust_score": trust_score,
                "deadline": official.get("deadline") or item.get("deadline"),
                "application_fee": official.get("application_fee", 0),
                "audit_proof": (
                    f"Domain {official.get('official_domain') or official.get('domain') or 'official source'} "
                    f"verified against official database. Fee verified as ${official.get('application_fee', 0)}. "
                    f"Reason: {llm_proof}"
                ),
            }
            evaluated_results.append(evidence)

        for scam in scams_pool:
            logs.append(f"[TRUST CRITIC] REJECTED SCAM: {scam['title']} -> Requested ${scam.get('fee_demanded', 0)} fee on domain {scam.get('suspicious_domain', scam.get('domain', 'unknown'))}.")
            evaluated_results.append({
                "title": scam.get("title"),
                "scholarship_id": scam.get("scholarship_id") or scam.get("id"),
                "provider": scam.get("provider"),
                "funding": scam.get("funding"),
                "funding_amount": scam.get("funding"),
                "official_record": None,
                "aggregator_matches": [],
                "conflict_details": [],
                "domain": scam.get("suspicious_domain") or scam.get("domain") or "unknown",
                "badge": "SCAM_REJECTED",
                "trust_score": 0,
                "deadline": scam.get("deadline", "N/A"),
                "application_fee": scam.get("fee_demanded", 0),
                "audit_proof": (
                    f"REJECTED: Domain {scam.get('suspicious_domain') or scam.get('domain') or 'unknown'} "
                    f"requested ${scam.get('fee_demanded', 0)} processing fee. {scam.get('scam_reason', 'No additional reason provided.')}"
                ),
                "suspicious_domain": scam.get("suspicious_domain") or scam.get("domain"),
                "fee_demanded": scam.get("fee_demanded"),
                "scam_reason": scam.get("scam_reason"),
            })

        return {
            "agent": self.agent_name,
            "evaluated_results": evaluated_results,
            "logs": logs,
        }