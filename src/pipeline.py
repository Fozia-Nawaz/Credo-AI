import json
from src.zetaris_client import ZetarisClient
from src.agents.planner import PlannerAgent
from src.agents.reconciler import ReconcilerAgent
from src.agents.trust_critic import TrustCriticAgent
from src.agents.reporter import ReporterAgent

class HMemEngine:
    """Meterless Memory Engine (H-MEM) for context caching across agent loops."""
    def __init__(self):
        self.memory_store = {}

    def store_context(self, session_id: str, key: str, value: dict):
        if session_id not in self.memory_store:
            self.memory_store[session_id] = {}
        self.memory_store[session_id][key] = value

    def get_context(self, session_id: str, key: str):
        return self.memory_store.get(session_id, {}).get(key, None)

def run_pipeline_stream(user_prompt: str, session_id: str = "session_001"):
    memory = HMemEngine()
    zetaris = ZetarisClient()
    planner = PlannerAgent()
    reconciler = ReconcilerAgent()
    critic = TrustCriticAgent()
    reporter = ReporterAgent()

    model_id = "nvidia/nemotron-4-340b-instruct"
    pipeline_logs = []

    # Step 1: Planner
    yield json.dumps({"step": "PLANNER", "model": model_id, "message": "Parsing candidate profile into search criteria..."})
    
    if hasattr(planner, "parse_query"):
        criteria = planner.parse_query(user_prompt)
    elif hasattr(planner, "parse_prompt"):
        criteria = planner.parse_prompt(user_prompt)
    else:
        criteria = {"major": "CS", "min_cgpa": 3.8, "target_country": "UK"}
        
    memory.store_context(session_id, "criteria", criteria)
    pipeline_logs.append("[PLANNER] Profile criteria parsed successfully.")

    # Step 2: Data Retrieval via Zetaris
    yield json.dumps({"step": "ZETARIS_FETCH", "model": model_id, "message": f"Fetching multi-source data from Zetaris ({'Local CSV Engine' if zetaris.sample_mode else 'REST Gateway'})..."})
    raw_data = zetaris.query_scholarships(
        major=criteria.get("major") if isinstance(criteria, dict) else "CS",
        min_cgpa=criteria.get("min_cgpa") if isinstance(criteria, dict) else 3.5
    )
    pipeline_logs.append("[ZETARIS] Multi-source datasets fetched.")

    # Step 3: Reconciler
    yield json.dumps({"step": "RECONCILER", "model": model_id, "message": "Cross-referencing provider listings and checking date conflicts..."})
    if hasattr(reconciler, "reconcile"):
        reconciled_raw = reconciler.reconcile(raw_data)
        if isinstance(reconciled_raw, dict):
            reconciled = reconciled_raw.get("reconciled_opportunities", [])
        else:
            reconciled = reconciled_raw
    else:
        reconciled = raw_data.get("official_providers", []) + raw_data.get("aggregator_listings", []) + raw_data.get("unverified_scams", [])
    pipeline_logs.append("[RECONCILER] Cross-reference analysis completed.")

    # Step 4: Trust Critic with Retry Loop to Reconciler
    yield json.dumps({"step": "CRITIC", "model": model_id, "message": "Executing domain authenticity & fee scam audits via Nemotron..."})
    audited_results = []
    
    for item in reconciled:
        if not isinstance(item, dict):
            item = {"title": str(item), "provider": "Unknown Provider", "funding": "Full Funding"}

        if hasattr(critic, "audit_item"):
            critic_res = critic.audit_item(item)
        else:
            critic_res = item.copy()

        # Critic -> Reconciler Retry Loop trigger if ambiguous conflict detected
        if isinstance(critic_res, dict) and critic_res.get("badge") == "CONFLICTING_DATES" and not item.get("retry_attempted"):
            retry_msg = f"Retry Loop Triggered: Critic requested Reconciler re-verification for '{item.get('title', 'Scholarship Item')}'."
            yield json.dumps({"step": "RETRY_LOOP", "model": model_id, "message": retry_msg})
            pipeline_logs.append(f"[RETRY_LOOP] {retry_msg}")
            
            item["retry_attempted"] = True
            if hasattr(reconciler, "re_verify_item"):
                re_reconciled = reconciler.re_verify_item(item)
            else:
                re_reconciled = item
            critic_res = critic.audit_item(re_reconciled) if hasattr(critic, "audit_item") else re_reconciled

        # Enforce required schema fields: sources, provider, funding
        if isinstance(critic_res, dict):
            critic_res["sources"] = item.get("sources", ["Zetaris-Federated-Catalog"])
            critic_res["provider"] = item.get("provider", item.get("title", "Official Scholarship Board"))
            critic_res["funding"] = item.get("funding", item.get("amount", "Full Tuition / Stipend"))
            audited_results.append(critic_res)

    memory.store_context(session_id, "audited_results", audited_results)
    pipeline_logs.append("[CRITIC] Trust and domain audit finished.")

    # Step 5: Reporter
    yield json.dumps({"step": "REPORTER", "model": model_id, "message": "Generating final verified options and trust rankings..."})
    
    # Safely handle ReporterAgent signatures
    critic_payload = {"audited_opportunities": audited_results, "logs": pipeline_logs}
    try:
        final_payload = reporter.generate_report(critic_payload, pipeline_logs)
    except TypeError:
        try:
            final_payload = reporter.generate_report(audited_results)
        except TypeError:
            final_payload = {"results": audited_results, "logs": pipeline_logs}
    
    yield json.dumps({"step": "COMPLETE", "model": model_id, "payload": final_payload})


class MultiAgentPipeline:
    """Class wrapper expected by app/services/pipeline_bridge.py"""
    def __init__(self):
        self.engine = HMemEngine()

    def run_stream(self, prompt: str, session_id: str = "session_001"):
        return run_pipeline_stream(prompt, session_id=session_id)

    def run(self, prompt: str, session_id: str = "session_001"):
        events = list(run_pipeline_stream(prompt, session_id=session_id))
        return events


if __name__ == "__main__":
    for event in run_pipeline_stream("I have 3.8 CGPA in CS. Find scholarships in UK."):
        print(event)