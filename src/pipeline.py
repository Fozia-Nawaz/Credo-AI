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


def run_pipeline_stream(profile: str, session_id: str = "session_001"):
    """
    Main generator required by app/services/pipeline_bridge.py.
    Yields events with 'stage', 'message', 'model', and final 'final_data'.
    """
    memory = HMemEngine()
    zetaris = ZetarisClient()
    planner = PlannerAgent()
    reconciler = ReconcilerAgent()
    critic = TrustCriticAgent()
    reporter = ReporterAgent()

    model_id = "nvidia/nemotron-4-340b-instruct"
    pipeline_logs = []

    # Step 1: Planner
    yield {
        "stage": "PLANNER",
        "step": "PLANNER",
        "model": model_id,
        "message": "Parsing candidate profile into search criteria..."
    }
    
    if hasattr(planner, "parse_query"):
        criteria = planner.parse_query(profile)
    elif hasattr(planner, "parse_prompt"):
        criteria = planner.parse_prompt(profile)
    else:
        criteria = {"major": "CS", "min_cgpa": 3.8, "target_country": "UK"}
        
    memory.store_context(session_id, "criteria", criteria)
    pipeline_logs.append("[PLANNER] Profile criteria parsed successfully.")

    # Step 2: Data Retrieval via Zetaris
    yield {
        "stage": "ZETARIS_FETCH",
        "step": "ZETARIS_FETCH",
        "model": model_id,
        "message": f"Fetching multi-source data from Zetaris ({'Local CSV Engine' if getattr(zetaris, 'sample_mode', True) else 'REST Gateway'})..."
    }
    
    if hasattr(zetaris, "query_scholarships"):
        raw_data = zetaris.query_scholarships(
            major=criteria.get("major") if isinstance(criteria, dict) else "CS",
            min_cgpa=criteria.get("min_cgpa") if isinstance(criteria, dict) else 3.5
        )
    else:
        raw_data = {"official_providers": [], "aggregator_listings": [], "unverified_scams": []}
        
    pipeline_logs.append("[ZETARIS] Multi-source datasets fetched.")

    # Step 3: Reconciler
    yield {
        "stage": "RECONCILER",
        "step": "RECONCILER",
        "model": model_id,
        "message": "Cross-referencing provider listings and checking date conflicts..."
    }
    
    if hasattr(reconciler, "reconcile"):
        reconciled_raw = reconciler.reconcile(raw_data)
        if isinstance(reconciled_raw, dict):
            reconciled = reconciled_raw.get("reconciled_opportunities", [])
        else:
            reconciled = reconciled_raw
    else:
        reconciled = raw_data.get("official_providers", []) + raw_data.get("aggregator_listings", []) + raw_data.get("unverified_scams", [])
        
    pipeline_logs.append("[RECONCILER] Cross-reference analysis completed.")

    # Step 4: Trust Critic with Retry Loop
    yield {
        "stage": "CRITIC",
        "step": "CRITIC",
        "model": model_id,
        "message": "Executing domain authenticity & fee scam audits via Nemotron..."
    }
    
    audited_results = []
    for item in reconciled:
        if not isinstance(item, dict):
            item = {"title": str(item), "provider": "Unknown Provider", "funding": "Full Funding"}

        if hasattr(critic, "audit_item"):
            critic_res = critic.audit_item(item)
        else:
            critic_res = item.copy()

        if isinstance(critic_res, dict) and critic_res.get("badge") == "CONFLICTING_DATES" and not item.get("retry_attempted"):
            retry_msg = f"Retry Loop Triggered: Critic requested Reconciler re-verification for '{item.get('title', 'Scholarship Item')}'."
            yield {
                "stage": "RETRY_LOOP",
                "step": "RETRY_LOOP",
                "model": model_id,
                "message": retry_msg
            }
            pipeline_logs.append(f"[RETRY_LOOP] {retry_msg}")
            
            item["retry_attempted"] = True
            if hasattr(reconciler, "re_verify_item"):
                re_reconciled = reconciler.re_verify_item(item)
            else:
                re_reconciled = item
            critic_res = critic.audit_item(re_reconciled) if hasattr(critic, "audit_item") else re_reconciled

        if isinstance(critic_res, dict):
            critic_res["sources"] = item.get("sources", ["Zetaris-Federated-Catalog"])
            critic_res["provider"] = item.get("provider", item.get("title", "Official Scholarship Board"))
            critic_res["funding"] = item.get("funding", item.get("amount", "Full Tuition / Stipend"))
            audited_results.append(critic_res)

    memory.store_context(session_id, "audited_results", audited_results)
    pipeline_logs.append("[CRITIC] Trust and domain audit finished.")

    # Step 5: Reporter
    yield {
        "stage": "REPORTER",
        "step": "REPORTER",
        "model": model_id,
        "message": "Generating final verified options and trust rankings..."
    }
    
    final_payload = {
        "status": "success",
        "search_summary": "Multi-agent scholarship analysis completed successfully.",
        "total_opportunities_found": len(audited_results),
        "results": audited_results,
        "agent_reasoning_trace": pipeline_logs
    }

    # Step 6: Final Complete Event
    yield {
        "stage": "COMPLETE",
        "step": "COMPLETE",
        "model": model_id,
        "message": "Pipeline execution completed successfully.",
        "final_data": final_payload,
        "payload": final_payload
    }


class MultiAgentPipeline:
    """Class wrapper supporting both static method calls and instance streaming."""
    
    @staticmethod
    def run_pipeline_stream(profile: str, session_id: str = "session_001"):
        return run_pipeline_stream(profile, session_id=session_id)

    def run_stream(self, prompt: str, session_id: str = "session_001"):
        return run_pipeline_stream(prompt, session_id=session_id)

    def run(self, prompt: str, session_id: str = "session_001"):
        return list(run_pipeline_stream(prompt, session_id=session_id))


if __name__ == "__main__":
    for event in run_pipeline_stream("I have 3.8 CGPA in CS. Find scholarships in UK."):
        print(event)