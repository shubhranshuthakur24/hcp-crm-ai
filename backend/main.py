from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os
import logging
import asyncio
from sqlalchemy.orm import Session
from sqlalchemy import func

# Load environment variables from the same directory as this file
load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))

from .database import SessionLocal, init_db, HCP, Interaction
from .schemas import ChatRequest, HCPResponse, LogInteractionRequest
from .agent import agent_app, InteractionState
from langchain_core.messages import HumanMessage

load_dotenv()

app = FastAPI(title="AI-First HCP CRM API")
logger = logging.getLogger(__name__)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize DB on startup
@app.on_event("startup")
def startup():
    init_db()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@app.get("/hcps", response_model=list[HCPResponse])
def get_hcps(db: Session = Depends(get_db)):
    return db.query(HCP).all()

@app.post("/log_interaction")
async def log_interaction_endpoint(request: LogInteractionRequest, db: Session = Depends(get_db)):
    data = request.data
    try:
        hcp_name = str((data or {}).get("hcp_name", "")).strip()
        if not hcp_name:
            raise HTTPException(status_code=400, detail="HCP name is required.")

        # Reuse existing HCP if possible; create a new one when not found.
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

        interaction_id = (data or {}).get("interaction_id")
        interaction = None
        if interaction_id:
            try:
                interaction = (
                    db.query(Interaction)
                    .filter(Interaction.id == int(interaction_id))
                    .first()
                )
            except (TypeError, ValueError):
                interaction = None

        is_update = interaction is not None
        if not interaction:
            interaction = Interaction(hcp_id=hcp.id)
            db.add(interaction)

        interaction.hcp_id = hcp.id
        interaction.date = data.get("date")
        interaction.time = data.get("time")
        interaction.interaction_type = data.get("interaction_type")
        interaction.attendees = data.get("attendees")
        interaction.topics_discussed = data.get("topics_discussed")
        interaction.materials_shared = data.get("materials_shared")
        interaction.sentiment = data.get("sentiment", "neutral")
        interaction.outcomes = data.get("outcomes")
        interaction.samples_distributed = data.get("samples_distributed")
        interaction.follow_up_actions = data.get("follow_up_actions")

        db.commit()
        return {
            "status": "updated" if is_update else "saved_to_db",
            "interaction_id": interaction.id,
            "hcp_id": hcp.id,
            "hcp_name": hcp.name,
        }
    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        logger.exception("Failed to save interaction")
        raise HTTPException(status_code=500, detail="Failed to save interaction.")

@app.post("/chat")
async def chat(request: ChatRequest):
    logger.info(
        "Chat request received",
        extra={
            "thread_id": request.thread_id,
            "message_length": len(request.message or ""),
        },
    )
    # Prepare initial state
    initial_interaction = InteractionState(**(request.interaction_state or {}))
    
    config = {"configurable": {"thread_id": request.thread_id}}
    
    # Run agent
    try:
        input_state = {
            "messages": [HumanMessage(content=request.message)],
            "interaction": initial_interaction
        }
        
        output = await asyncio.to_thread(
            agent_app.invoke,
            input_state,
            {**config, "recursion_limit": 50},
        )
        
        # Extract last message and updated interaction state
        last_message = output["messages"][-1]
        
        return {
            "reply": last_message.content,
            "tool_calls": getattr(last_message, "tool_calls", []),
            "updated_interaction": output["interaction"].model_dump()
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Chat processing failed")
        error_text = str(e)
        status_code = getattr(e, "status_code", None)
        if not isinstance(status_code, int):
            status_code = 429 if "rate limit" in error_text.lower() else 500
        raise HTTPException(status_code=status_code, detail=error_text)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
