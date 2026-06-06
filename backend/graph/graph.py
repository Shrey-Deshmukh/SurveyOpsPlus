# graph/graph.py
from langgraph.graph import StateGraph, END
from graph.state import SurveyState
from graph.nodes import load_knowledge_base, extract_tags, extract_tags_from_bytes, generate_report, evaluate_report, persist_to_db
from graph.edges import should_evaluate

def build_extract_features_graph() -> StateGraph:
    """
    Flow for /extract-features route:
    load_knowledge_base → extract_tags → persist_to_db
    """
    graph = StateGraph(SurveyState)

    graph.add_node("load_knowledge_base", load_knowledge_base)
    graph.add_node("extract_tags", extract_tags)
    graph.add_node("persist_to_db", persist_to_db)

    graph.set_entry_point("load_knowledge_base")
    graph.add_edge("load_knowledge_base", "extract_tags")
    graph.add_edge("extract_tags", "persist_to_db")
    graph.add_edge("persist_to_db", END)

    return graph.compile()


def build_generate_report_graph() -> StateGraph:
    """
    Flow for /generate-report route:
    load_knowledge_base → generate_report → [conditional] → evaluate_report → persist_to_db
    """
    graph = StateGraph(SurveyState)

    graph.add_node("load_knowledge_base", load_knowledge_base)
    graph.add_node("generate_report", generate_report)
    graph.add_node("evaluate_report", evaluate_report)
    graph.add_node("persist_to_db", persist_to_db)

    graph.set_entry_point("load_knowledge_base")
    graph.add_edge("load_knowledge_base", "generate_report")

    graph.add_conditional_edges(
        "generate_report",
        should_evaluate,
        {
            "evaluate": "evaluate_report",
            "persist": "persist_to_db"
        }
    )

    graph.add_edge("evaluate_report", "persist_to_db")
    graph.add_edge("persist_to_db", END)

    return graph.compile()

def build_extract_features_from_bytes_graph() -> StateGraph:
    graph = StateGraph(SurveyState)
    graph.add_node("load_knowledge_base", load_knowledge_base)
    graph.add_node("extract_tags_from_bytes", extract_tags_from_bytes)
    graph.add_node("persist_to_db", persist_to_db)
    graph.set_entry_point("load_knowledge_base")
    graph.add_edge("load_knowledge_base", "extract_tags_from_bytes")
    graph.add_edge("extract_tags_from_bytes", "persist_to_db")
    graph.add_edge("persist_to_db", END)
    return graph.compile()
