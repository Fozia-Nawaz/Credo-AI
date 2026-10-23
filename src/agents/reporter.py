class ReporterAgent:
    def __init__(self):
        self.agent_name = "Reporter Agent"

    def generate_report(self, planner_out: dict, critic_out: dict, all_logs: list) -> dict:
        """
        Compiles structured JSON payload with final opportunity rankings and evidence logs.
        """
        results = critic_out.get("evaluated_results", [])

        # Sort: Verified first, then Conflicting, then Rejected Scams at bottom
        sorted_results = sorted(results, key=lambda x: x["trust_score"], reverse=True)

        return {
            "status": "success",
            "search_summary": planner_out.get("search_params"),
            "total_opportunities_found": len(sorted_results),
            "results": sorted_results,
            "agent_reasoning_trace": all_logs
        }