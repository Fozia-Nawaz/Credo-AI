import time
from src.agents.planner import PlannerAgent
from src.agents.reconciler import ReconcilerAgent
from src.agents.trust_critic import TrustCriticAgent
from src.agents.reporter import ReporterAgent

class MultiAgentPipeline:
    def __init__(self):
        self.planner = PlannerAgent()
        self.reconciler = ReconcilerAgent()
        self.trust_critic = TrustCriticAgent()
        self.reporter = ReporterAgent()

    def run_pipeline_stream(self, user_profile: dict):
        """
        Executes 4-agent orchestration loop and YIELDS real-time trace events.
        Exposed for FastAPI Server-Sent Events (SSE) streaming.
        """
        all_logs = []

        # 1. PLANNER AGENT EXECUTION
        yield {"stage": "PLANNER", "message": "Parsing student profile criteria..."}
        plan_res = self.planner.plan(user_profile)
        all_logs.append(plan_res["reasoning"])
        yield {"stage": "PLANNER", "message": plan_res["reasoning"]}
        time.sleep(0.5)

        # 2. RECONCILER AGENT EXECUTION
        yield {"stage": "RECONCILER", "message": "Querying Zetaris multi-source tables (Official, Aggregator, Scams)..."}
        reconcile_res = self.reconciler.reconcile(plan_res["search_params"])
        for log in reconcile_res["logs"]:
            all_logs.append(log)
            yield {"stage": "RECONCILER", "message": log}
            time.sleep(0.3)

        # 3. TRUST CRITIC AGENT EXECUTION
        yield {"stage": "TRUST_CRITIC", "message": "Evaluating domain authenticity, fee traps, and assigning trust badges..."}
        critic_res = self.trust_critic.evaluate(reconcile_res)
        for log in critic_res["logs"]:
            all_logs.append(log)
            yield {"stage": "TRUST_CRITIC", "message": log}
            time.sleep(0.3)

        # 4. REPORTER AGENT EXECUTION
        yield {"stage": "REPORTER", "message": "Compiling evidence proofs and final JSON payload..."}
        final_report = self.reporter.generate_report(plan_res, critic_res, all_logs)
        
        yield {
            "stage": "COMPLETE",
            "message": "Pipeline execution complete.",
            "final_data": final_report
        }

    def run_pipeline_sync(self, user_profile: dict) -> dict:
        """
        Synchronous pipeline runner returning complete JSON payload at once.
        """
        generator = self.run_pipeline_stream(user_profile)
        final_payload = None
        for event in generator:
            if event["stage"] == "COMPLETE":
                final_payload = event["final_data"]
        return final_payload

# End-to-End Pipeline Verification Test
if __name__ == "__main__":
    print("🚀 Running End-to-End Credo AI Multi-Agent Pipeline Test...\n")
    pipeline = MultiAgentPipeline()
    
    sample_student = {
        "major": "Computer Science",
        "cgpa": 3.8,
        "target_country": "Pakistan / Global"
    }

    # Test Live Streaming Trace Generator
    for event in pipeline.run_pipeline_stream(sample_student):
        if event["stage"] != "COMPLETE":
            print(f"[{event['stage']}] {event['message']}")
        else:
            print("\n✅ Final JSON Report Summary:")
            print(f"Total Results: {event['final_data']['total_opportunities_found']}")
            for item in event['final_data']['results']:
                print(f" - [{item['badge']}] {item['title']} (Trust Score: {item['trust_score']}%)")