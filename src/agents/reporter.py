class ReporterAgent:
    def __init__(self):
        self.agent_name = "Reporter Agent"

    @staticmethod
    def _normalize_result(result: dict) -> dict:
        if not isinstance(result, dict):
            return result

        normalized = dict(result)
        normalized.setdefault("provider", normalized.get("official_record", {}).get("provider") if isinstance(normalized.get("official_record"), dict) else None)
        normalized.setdefault("funding", normalized.get("official_record", {}).get("funding") if isinstance(normalized.get("official_record"), dict) else normalized.get("funding"))
        normalized.setdefault("funding_amount", normalized.get("funding"))
        normalized.setdefault("official_record", normalized.get("official_record"))
        normalized.setdefault("aggregator_matches", normalized.get("aggregator_matches", []))
        normalized.setdefault("conflict_details", normalized.get("conflict_details", []))
        return normalized

    def generate_report(self, planner_out: dict, critic_out: dict, all_logs: list) -> dict:
        """
        Compiles structured JSON payload with final opportunity rankings and evidence logs.
        """
        results = critic_out.get("evaluated_results", [])
        normalized_results = [self._normalize_result(item) for item in results]

        sorted_results = sorted(normalized_results, key=lambda x: x.get("trust_score", 0), reverse=True)

        return {
            "status": "success",
            "search_summary": planner_out.get("search_params"),
            "total_opportunities_found": len(sorted_results),
            "results": sorted_results,
            "agent_reasoning_trace": all_logs
        }