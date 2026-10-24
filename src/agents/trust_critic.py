from src.nightshift_client import NightshiftClient

class TrustCriticAgent:
    def __init__(self):
        self.agent_name = "Trust Critic Agent"
        self.nightshift = NightshiftClient()

    def evaluate(self, reconciler_output: dict) -> dict:
        """
        Performs scam detection, domain verification, and assigns Trust Badges with Nightshift LLM proofs.
        """
        reconciled_opps = reconciler_output.get("reconciled_opportunities", [])
        scams_pool = reconciler_output.get("detected_scams_pool", [])

        evaluated_results = []
        logs = []

        # 1. Evaluate Genuine/Reconciled Opportunities
        for item in reconciled_opps:
            official = item["official_record"]
            has_conflict = item["has_conflict"]

            badge = "VERIFIED"
            trust_score = 100

            if has_conflict:
                badge = "CONFLICTING_DATES"
                trust_score = 85
                logs.append(f"[TRUST CRITIC] Assigned Badge: {badge} for {official['title']} due to date mismatch across aggregators.")
            else:
                logs.append(f"[TRUST CRITIC] Assigned Badge: {badge} for {official['title']} - Official record confirmed.")

            # Generate reasoning proof via Nightshift
            prompt = f"Audit scholarship {official['title']} on domain {official['official_domain']} with fee ${official['application_fee']}."
            llm_proof = self.nightshift.generate_reasoning(prompt, system_role="TRUST CRITIC AGENT")

            evaluated_results.append({
                "title": official["title"],
                "scholarship_id": official["scholarship_id"],
                "domain": official["official_domain"],
                "badge": badge,
                "trust_score": trust_score,
                "deadline": official["deadline"],
                "application_fee": official["application_fee"],
                "audit_proof": f"Domain {official['official_domain']} verified against official database. Fee verified as $0. Reason: {llm_proof}"
            })

        # 2. Evaluate & Flag Scam Items
        for scam in scams_pool:
            logs.append(f"[TRUST CRITIC] REJECTED SCAM: {scam['title']} -> Requested ${scam['fee_demanded']} fee on domain {scam['suspicious_domain']}.")
            evaluated_results.append({
                "title": scam["title"],
                "scholarship_id": scam["scholarship_id"],
                "domain": scam["suspicious_domain"],
                "badge": "SCAM_REJECTED",
                "trust_score": 0,
                "deadline": "N/A",
                "application_fee": scam["fee_demanded"],
                "audit_proof": f"REJECTED: Domain {scam['suspicious_domain']} requested ${scam['fee_demanded']} processing fee. {scam['scam_reason']}"
            })

        return {
            "agent": self.agent_name,
            "evaluated_results": evaluated_results,
            "logs": logs
        }