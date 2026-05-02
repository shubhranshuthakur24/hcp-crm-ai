from typing import Annotated, List, TypedDict, Any
import json
from pydantic import BaseModel, Field
from dotenv import load_dotenv
import os

load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))
from langgraph.graph import StateGraph, END
from langgraph.graph.message import add_messages
from langchain_groq import ChatGroq
from langchain_core.messages import BaseMessage, HumanMessage, SystemMessage, ToolMessage
from langchain_core.tools import tool
from langgraph.prebuilt import ToolNode
from langgraph.checkpoint.memory import InMemorySaver
from sqlalchemy import func

from .database import SessionLocal, HCP, Interaction

# --- State Definitions ---
class InteractionState(BaseModel):
    hcp_name: str = ""
    interaction_type: str = ""
    date: str = ""
    time: str = ""
    attendees: str = ""
    topics_discussed: str = ""
    materials_shared: str = ""
    sentiment: str = "neutral"
    outcomes: str = ""
    samples_distributed: str = ""
    follow_up_actions: str = ""
    suggested_follow_ups: List[str] = Field(default_factory=list)

class AgentState(TypedDict):
    # Use add_messages to ensure history is preserved and appended
    messages: Annotated[List[BaseMessage], add_messages]
    interaction: InteractionState

# --- Tool Definitions ---
@tool
def search_hcp(query: str):
    """Search for an HCP in the database by name."""
    db = SessionLocal()
    hcps = db.query(HCP).filter(HCP.name.ilike(f"%{query}%")).all()
    db.close()
    if hcps:
        if len(hcps) == 1:
            hcp = hcps[0]
            return {
                "hcp_name": hcp.name,
                "specialty": hcp.specialty,
                "organization": hcp.organization,
                "hcp_id": hcp.id
            }
        else:
            return {
                "matches": [{"name": h.name, "specialty": h.specialty, "org": h.organization, "id": h.id} for h in hcps],
                "error": "Multiple matches found. Please ask for clarification."
            }
    return {"error": "HCP not found"}

@tool
def edit_interaction(field: str, value: Any):
    """Update a specific field in the interaction state. 
    Valid fields: hcp_name, interaction_type, date, time, attendees, topics_discussed, materials_shared, samples_distributed, sentiment, outcomes, follow_up_actions, suggested_follow_ups.
    Note: Tool will automatically handle date/time formatting.
    """
    processed_value = value
    
    # Auto-format date if the field is date
    if field == "date" and isinstance(value, str) and value:
        try:
            from dateutil import parser
            processed_value = parser.parse(value).strftime("%Y-%m-%d")
        except:
            pass # Keep original if parsing fails
            
    # Auto-format time if the field is time
    if field == "time" and isinstance(value, str) and value:
        try:
            from dateutil import parser
            processed_value = parser.parse(value).strftime("%H:%M")
        except:
            pass
            
    return {field: processed_value}

@tool
def add_materials(material_name: str):
    """Record promotional materials shared during the interaction."""
    return {"materials_shared": material_name}

@tool
def create_followup(task: str, date: str):
    """Schedule a follow-up task or meeting."""
    return {"follow_up_actions": f"Task: {task} on {date}"}

@tool
def get_hcp_insights(hcp_id):
    """Retrieve past interaction history and insights for a specific HCP. 
    Use this to understand doctor preferences, past rejections, or recurring topics.
    Args:
        hcp_id: The ID of the HCP (integer or string)
    """
    db = SessionLocal()
    try:
        # Robust conversion to handle string IDs from LLM
        numeric_id = int(str(hcp_id))
        past_interactions = db.query(Interaction).filter(Interaction.hcp_id == numeric_id).order_by(Interaction.created_at.desc()).limit(5).all()
        if not past_interactions:
            return {"insight": "No past interaction history found for this HCP."}
        
        history = []
        for idx, inter in enumerate(past_interactions):
            history.append(f"Interaction {idx+1}: Date: {inter.date}, Type: {inter.interaction_type}, Outcomes: {inter.outcomes}, Materials: {inter.materials_shared}")
        
        # Example derived insight logic
        insight_summary = "\n".join(history)
        return {
            "past_history": history,
            "derived_insights": f"Summary of last {len(history)} visits: Focus has been on {past_interactions[0].topics_discussed}. Review past outcomes for price or efficacy concerns."
        }
    except Exception as e:
        return {"error": str(e)}
    finally:
        db.close()

@tool
def summarize_interaction(data: dict):
    """Generate a professional summary of the current interaction to be used as Key Outcomes and Follow-up Actions."""
    return {
        "outcomes": f"SUMMARY: {data.get('topics_discussed', '')} discussed.",
        "follow_up_actions": data.get('follow_up_actions', 'No specific follow-up scheduled yet.')
    }

@tool
def log_interaction(data: dict):
    """Finalize and save the interaction record to the database. 
    Pass the entire current interaction state as 'data'.
    """
    db = SessionLocal()
    try:
        hcp_name = str((data or {}).get("hcp_name", "")).strip()
        if not hcp_name:
            return {"error": "Cannot log interaction: hcp_name is required."}

        # Reuse existing HCP if possible; create when missing.
        hcp = (
            db.query(HCP)
            .filter(func.lower(HCP.name) == hcp_name.lower())
            .first()
        )
        if not hcp:
            hcp = HCP(
                name=hcp_name,
                specialty="Unknown",
                organization="Unknown",
                location="Unknown",
            )
            db.add(hcp)
            db.flush()

        new_interaction = Interaction(
            hcp_id=hcp.id,
            date=data.get("date"),
            time=data.get("time"),
            interaction_type=data.get("interaction_type"),
            attendees=data.get("attendees"),
            topics_discussed=data.get("topics_discussed"),
            materials_shared=data.get("materials_shared"),
            sentiment=data.get("sentiment", "neutral"),
            outcomes=data.get("outcomes"),
            samples_distributed=data.get("samples_distributed"),
            follow_up_actions=data.get("follow_up_actions")
        )
        db.add(new_interaction)
        db.commit()
        return {"status": "saved_to_db", "interaction_id": new_interaction.id}
    except Exception as e:
        db.rollback()
        return {"error": f"Failed to save: {str(e)}"}
    finally:
        db.close()

tools = [search_hcp, get_hcp_insights, edit_interaction, add_materials, create_followup, summarize_interaction, log_interaction]
tool_node = ToolNode(tools)

# --- LLM Setup ---
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
llm = ChatGroq(model="llama-3.3-70b-versatile", temperature=0, groq_api_key=GROQ_API_KEY)

# --- Node Logic ---
def call_model(state: AgentState):
    # Sync interaction state from ToolMessages in history before calling model
    interaction = state['interaction']
    for msg in reversed(state['messages']):
        if isinstance(msg, ToolMessage):
            try:
                res = json.loads(msg.content)
                if isinstance(res, dict):
                    # Update state from tool output
                    for k, v in res.items():
                        if hasattr(interaction, k):
                            setattr(interaction, k, v)
            except: pass
        elif isinstance(msg, HumanMessage):
            break

    missing_required_fields = []
    required_fields = {
        "hcp_name": interaction.hcp_name,
        "interaction_type": interaction.interaction_type,
        "date": interaction.date,
        "time": interaction.time,
        "topics_discussed": interaction.topics_discussed,
    }
    for field_name, field_value in required_fields.items():
        if not str(field_value or "").strip():
            missing_required_fields.append(field_name)

    system_msg = SystemMessage(content=(
        "You are an AI-First CRM Assistant. Your goal is to help log an HCP interaction while being context-aware.\n\n"
        f"CURRENT FORM STATE: {interaction.json()}\n\n"
        f"MISSING REQUIRED FIELDS: {missing_required_fields}\n\n"
        "PROCESS:\n"
        "1. Acknowledge what was captured from the latest user message in one short sentence.\n"
        "2. If an HCP is identified but you don't have their history, use 'get_hcp_insights' to understand preferences and past behavior.\n"
        "3. Capture details using 'edit_interaction' and other tools. IMPORTANT: Format dates as YYYY-MM-DD and times as HH:MM.\n"
        "4. Ask conversational follow-up questions for missing fields. Ask at most 1-2 questions per turn.\n"
        "5. Prioritize asking for: interaction type, where the meeting happened (store in attendees if needed), and brochures/materials shared.\n"
        "6. For sentiment, map to exactly one of: 'positive', 'neutral', or 'negative'.\n"
        "7. ALWAYS suggest 2-3 specific 'suggested_follow_ups' based on the conversation (e.g., '+ Schedule follow-up in 2 weeks', '+ Send PDF'). Use the 'edit_interaction' tool to update this field with a LIST of strings.\n"
        "8. Use 'summarize_interaction' only after required fields are present or the user explicitly says they are done.\n"
        "9. End each reply with either follow-up question(s) or a concise completion summary."
    ))
    
    response = llm.bind_tools(tools).invoke([system_msg] + state['messages'])
    return {"messages": [response], "interaction": interaction}

# --- Graph Definition ---
workflow = StateGraph(AgentState)

workflow.add_node("agent", call_model)
workflow.add_node("tools", tool_node)

workflow.set_entry_point("agent")

def route(state: AgentState):
    last_msg = state['messages'][-1]
    if hasattr(last_msg, "tool_calls") and last_msg.tool_calls:
        return "tools"
    return END

workflow.add_conditional_edges("agent", route)
workflow.add_edge("tools", "agent")

# Enable per-thread conversation persistence in-process.
checkpointer = InMemorySaver()
agent_app = workflow.compile(checkpointer=checkpointer)
