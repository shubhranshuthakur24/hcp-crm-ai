from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os
from sqlalchemy.orm import Session

# Load environment variables from the same directory as this file
load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))

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
    print(f"DEBUG: Received chat request: {request.message}")
    # Prepare initial state
    initial_interaction = InteractionState(**(request.interaction_state or {}))
    
    config = {"configurable": {"thread_id": request.thread_id}}
    
    # Run agent
    try:
        input_state = {
            "messages": [HumanMessage(content=request.message)],
            "interaction": initial_interaction
        }
        
        output = agent_app.invoke(input_state, config={**config, "recursion_limit": 50})
        
        # Extract last message and updated interaction state
        last_message = output["messages"][-1]
        
        print(f"DEBUG: Agent reply: {last_message.content}")
        return {
            "reply": last_message.content,
            "tool_calls": getattr(last_message, "tool_calls", []),
            "updated_interaction": output["interaction"].dict()
        }
    except Exception as e:
        import traceback
        print(f"ERROR: {str(e)}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
