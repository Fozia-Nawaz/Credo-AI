class PlannerAgent:
    def __init__(self):
        self.agent_name = "Planner Agent"

    def plan(self, user_profile: dict) -> dict:
        """
        Parses user input profile and constructs normalized search parameters.
        """
        raw_major = user_profile.get("major", "CS")
        raw_cgpa = float(user_profile.get("cgpa", 0.0))
        target_country = user_profile.get("target_country", "Any")

        # Standardizing criteria
        search_params = {
            "major": raw_major.strip().upper(),
            "min_cgpa": raw_cgpa,
            "target_country": target_country,
            "filter_scams": True
        }

        reasoning = f"[PLANNER] Parsed profile criteria -> Major: {search_params['major']}, CGPA: {search_params['min_cgpa']}"

        return {
            "agent": self.agent_name,
            "status": "success",
            "search_params": search_params,
            "reasoning": reasoning
        }