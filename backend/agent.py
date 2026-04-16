import os
from typing import Annotated, List, TypedDict, Union, Dict, Any
from langgraph.graph import StateGraph, END
from langchain_groq import ChatGroq
from langchain_core.messages import BaseMessage, HumanMessage, AIMessage, SystemMessage, ToolMessage
from langchain_core.tools import tool
from langgraph.prebuilt import ToolNode
import json
from pydantic import BaseModel, Field

# Define State
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

def merge_interaction(current: InteractionState, update: Dict[str, Any]) -> InteractionState:
    data = current.dict()
    data.update(update)
    return InteractionState(**data)

class AgentState(TypedDict):
    messages: Annotated[List[BaseMessage], "Add message"]
    interaction: InteractionState
    current_hcp_id: Union[int, None]

# Groq LLM setup
GROQ_API_KEY = os.getenv("GROQ_API_KEY")

if GROQ_API_KEY:
    llm = ChatGroq(model="gemma2-9b-it", temperature=0)
else:
    class MockLLM:
        def bind_tools(self, tools): return self
        def invoke(self, messages, **kwargs):
            last_msg = messages[-1]
            content = last_msg.content.lower() if hasattr(last_msg, 'content') else ""
            
            if isinstance(last_msg, ToolMessage):
                return AIMessage(content="I've analyzed the interaction and updated the CRM record for you. You can see the details on the left.")
            
            tool_calls = []
            if "sarah" in content or "smith" in content:
                tool_calls.append({"name": "edit_interaction", "args": {"field": "hcp_name", "value": "Dr. Sarah Smith"}, "id": "t1"})
            if "lunch" in content:
                tool_calls.append({"name": "edit_interaction", "args": {"field": "interaction_type", "value": "Lunch Meeting"}, "id": "t2"})
            if "positive" in content:
                tool_calls.append({"name": "edit_interaction", "args": {"field": "sentiment", "value": "positive"}, "id": "t3"})
            
            # If no tools but content exists, just respond
            return AIMessage(content="I've processed your message. How else can I assist?", tool_calls=tool_calls)
    llm = MockLLM()

# Tools
@tool
def search_hcp(query: str):
    """Search for an HCP in the database."""
    return {"hcp_name": "Dr. Sarah Smith", "specialty": "Cardiology"}

@tool
def edit_interaction(field: str, value: str):
    """Update a specific field in the interaction state."""
    return {field: value}

@tool
def log_interaction(data: Dict[str, Any]):
    """Save the final interaction."""
    return {"status": "saved"}

tools = [search_hcp, edit_interaction, log_interaction]
tool_node = ToolNode(tools)

# Nodes
def call_model(state: AgentState):
    system_msg = SystemMessage(content="You are an AI CRM Assistant. Extract data and use tools to update the 'interaction' state.")
    response = llm.bind_tools(tools).invoke([system_msg] + state['messages'])
    return {"messages": [response]}

def process_tool_outputs(state: AgentState):
    # Search history for ToolMessages and update interaction state
    new_interaction = state['interaction']
    for msg in reversed(state['messages']):
        if isinstance(msg, ToolMessage):
            try:
                res = json.loads(msg.content)
                if isinstance(res, dict):
                    # Simple merge logic for demo
                    new_interaction = merge_interaction(new_interaction, res)
            except:
                pass
        else:
            if not isinstance(msg, AIMessage): break
            
    return {"interaction": new_interaction}

# Build Graph
workflow = StateGraph(AgentState)
workflow.add_node("agent", call_model)
workflow.add_node("tools", tool_node)
workflow.add_node("processor", process_tool_outputs)

workflow.set_entry_point("agent")

def route(state: AgentState):
    if state['messages'][-1].tool_calls:
        return "tools"
    return END

workflow.add_conditional_edges("agent", route)
workflow.add_edge("tools", "processor")
workflow.add_edge("processor", "agent")

agent_app = workflow.compile()
