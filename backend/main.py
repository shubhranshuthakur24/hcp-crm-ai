from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
import os
from dotenv import load_dotenv

from .database import SessionLocal, init_db, HCP, Interaction
from .schemas import ChatRequest, HCPResponse
from .agent import agent_app, InteractionState
from langchain_core.messages import HumanMessage

load_dotenv()

app = FastAPI(title="AI-First HCP CRM API")

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

@app.post("/chat")
async def chat(request: ChatRequest):
    # Prepare initial state
    initial_interaction = InteractionState(**(request.interaction_state or {}))
    
    config = {"configurable": {"thread_id": request.thread_id}}
    
    # Run agent
    try:
        input_state = {
            "messages": [HumanMessage(content=request.message)],
            "interaction": initial_interaction
        }
        
        output = agent_app.invoke(input_state, config=config)
        
        # Extract last message and updated interaction state
        last_message = output["messages"][-1]
        
        return {
            "reply": last_message.content,
            "tool_calls": getattr(last_message, "tool_calls", []),
            "updated_interaction": output["interaction"].dict()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
