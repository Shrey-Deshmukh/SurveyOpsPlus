# graph/edges.py
from graph.state import SurveyState

def should_evaluate(state: SurveyState) -> str:
    # This is the diamond in your diagram — "if Report Generation"
    if state.run_evaluation and state.generated_report:
        return "evaluate"
    return "persist"
