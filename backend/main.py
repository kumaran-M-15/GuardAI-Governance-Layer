import os
import json
import time
from typing import List, Optional
from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy.orm import Session
from presidio_analyzer import AnalyzerEngine, PatternRecognizer, Pattern
from presidio_analyzer.nlp_engine import NlpEngineProvider
from presidio_anonymizer import AnonymizerEngine
import google.generativeai as genai
from dotenv import load_dotenv

import models
from database import engine, get_db

# Load environment variables (API Keys)
load_dotenv()

# Configure Real LLM (Gemini)
# Using os.getenv with a fallback string ensures it won't crash Python
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)
    llm_model = genai.GenerativeModel('gemini-3.6-flash')
else:
    llm_model = None
    print("WARNING: GEMINI_API_KEY not found. Falling back to simulated LLM.")

# Initialize database
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="GuardAI Backend")

# Setup CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Allow all origins for prototype
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Presidio
print("Initializing Presidio Analyzer...")
provider = NlpEngineProvider(nlp_configuration={
    "nlp_engine_name": "spacy",
    "models": [{"lang_code": "en", "model_name": "en_core_web_sm"}]
})
nlp_engine = provider.create_engine()
analyzer = AnalyzerEngine(nlp_engine=nlp_engine, supported_languages=["en"])

# --- NEW: Custom Logic for Indian Phone Numbers ---
indian_phone_pattern = Pattern(name="indian_phone", regex=r"\b[6-9]\d{9}\b", score=0.8)
phone_recognizer = PatternRecognizer(supported_entity="PHONE_NUMBER", patterns=[indian_phone_pattern])
analyzer.registry.add_recognizer(phone_recognizer)
# --------------------------------------------------

print("Initializing Presidio Anonymizer...")
anonymizer = AnonymizerEngine()

# Pydantic models
class ChatRequest(BaseModel):
    prompt: str
    user_id: str = "guest"

class ChatResponse(BaseModel):
    original_prompt: str
    masked_prompt: str
    detected_entities: List[str]
    llm_response: str

class LogResponse(BaseModel):
    id: int
    timestamp: str
    user_id: str
    original_text: str
    masked_text: str
    detected_entities: str
    processing_time_ms: float

@app.post("/api/chat", response_model=ChatResponse)
def chat_endpoint(request: ChatRequest, db: Session = Depends(get_db)):
    start_time = time.time()
    
    # Analyze the prompt for PII
    results = analyzer.analyze(text=request.prompt, entities=None, language='en')
    
    # Extract detected entity types
    entity_types = list(set([res.entity_type for res in results]))
    
    # Anonymize the prompt
    anonymized_result = anonymizer.anonymize(
        text=request.prompt,
        analyzer_results=results
    )
    masked_text = anonymized_result.text
    
    # Calculate processing time
    processing_time_ms = (time.time() - start_time) * 1000
    
    # Log the transaction
    entities_json = json.dumps(entity_types)
    new_log = models.AuditLog(
        user_id=request.user_id,
        original_text=request.prompt,
        masked_text=masked_text,
        detected_entities=entities_json,
        processing_time_ms=processing_time_ms
    )
    db.add(new_log)
    db.commit()
    db.refresh(new_log)
    
    # --- NEW: Real LLM Integration ---
    try:
        if llm_model:
            # Send the SAFE, MASKED text to the real LLM
            response = llm_model.generate_content(
                f"You are a helpful assistant. Reply to this prompt naturally: {masked_text}"
            )
            llm_response = response.text
        else:
            llm_response = f"I am a simulated LLM. I processed your request based on the following input: '{masked_text}'. Everything looks secure!"
    except Exception as e:
        llm_response = f"Error communicating with LLM: {str(e)}. But your data was successfully masked!"
    # ---------------------------------
    
    return ChatResponse(
        original_prompt=request.prompt,
        masked_prompt=masked_text,
        detected_entities=entity_types,
        llm_response=llm_response
    )

@app.get("/api/stats")
def get_stats(db: Session = Depends(get_db)):
    logs = db.query(models.AuditLog).all()
    
    total_prompts = len(logs)
    pii_incidents = sum(1 for log in logs if json.loads(log.detected_entities))
    avg_latency = sum(log.processing_time_ms for log in logs) / total_prompts if total_prompts > 0 else 0
    
    # Calculate risk breakdown
    risk_counts = {}
    for log in logs:
        entities = json.loads(log.detected_entities)
        for entity in entities:
            risk_counts[entity] = risk_counts.get(entity, 0) + 1
            
    risk_breakdown = [{"name": k, "value": v} for k, v in risk_counts.items()]
    
    return {
        "total_prompts_scanned": total_prompts,
        "pii_incidents_blocked": pii_incidents,
        "average_latency_ms": round(avg_latency, 2),
        "risk_breakdown": risk_breakdown
    }

@app.get("/api/logs")
def get_logs(db: Session = Depends(get_db)):
    logs = db.query(models.AuditLog).order_by(models.AuditLog.timestamp.desc()).all()
    return logs