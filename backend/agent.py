from typing import Annotated, List, TypedDict, Union, Dict, Any
import json
from pydantic import BaseModel
from dotenv import load_dotenv
import os

load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))
from langgraph.graph import StateGraph, END
from langgraph.graph.message import add_messages
from langchain_groq import ChatGroq
from langchain_core.messages import BaseMessage, HumanMessage, AIMessage, SystemMessage, ToolMessage
from langchain_core.tools import tool
from langgraph.prebuilt import ToolNode

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

class AgentState(TypedDict):
    # Use add_messages to ensure history is preserved and appended
    messages: Annotated[List[BaseMessage], add_messages]
    interaction: InteractionState

# --- Tool Definitions ---
@tool
def search_hcp(query: str):
    """Search for an HCP in the database."""
    return {"hcp_name": "Dr. Sarah Smith", "specialty": "Cardiology"}

@tool
def edit_interaction(field: str, value: str):
    """Update a specific field in the interaction state. 
    Fields: hcp_name, interaction_type, date, time, attendees, topics_discussed, materials_shared, sentiment, outcomes.
    """
    return {field: value}

@tool
def add_materials(material_name: str):
    """Record promotional materials shared during the interaction."""
    return {"materials_shared": material_name}

@tool
def create_followup(task: str, date: str):
    """Schedule a follow-up task or meeting."""
    return {"outcomes": f"Follow-up: {task} on {date}"}

@tool
def log_interaction():
    """Finalize and save the interaction record."""
    return {"status": "saved"}

tools = [search_hcp, edit_interaction, add_materials, create_followup, log_interaction]
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

    system_msg = SystemMessage(content=(
        "You are an AI-First CRM Assistant. Update the form state based on user input.\n\n"
        f"CURRENT FORM STATE: {interaction.json()}\n\n"
        "1. Capture information using 'edit_interaction'.\n"
        "2. If info is already in the 'CURRENT FORM STATE', do NOT call the tool again.\n"
        "3. Once finished, provide a short summary and STOP."
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

agent_app = workflow.compile()
