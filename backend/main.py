import os
import joblib
from fastapi import FastAPI, HTTPException, APIRouter
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from backend.xai_service import XAIService
from backend.config import FRONTEND_URL, BASE_URL, PORT
xai_service = XAIService()

model = joblib.load("backend/linear_svm_model.pkl")
vectorizer = joblib.load("backend/tfidf_vectorizer.pkl")

app = FastAPI(title="Spam Detection System")
xai_service = XAIService()

# ── CORS setup ────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        FRONTEND_URL,
        os.getenv("FRONTEND_DEV_URL", "http://localhost:3000"),
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Prediction Model Input Schema ─────────────────────────────
class PredictIn(BaseModel):
    text: str
    type: str

# ── Prediction Route ──────────────────────────────────────────
@app.post("/predict")
def predict(body: PredictIn):
    try:
        # 1. Standard Prediction Logic
        vectorized_text = xai_service.vectorizer.transform([body.text])
        prediction = int(xai_service.model.predict(vectorized_text)[0])
        
        # 2. Use the new service class for the explanation
        explanation = xai_service.get_local_explanation(body.text)
        
        return {
            "prediction": prediction,
            "explanation": explanation
        }
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))
# ── Basic health check ────────────────────────────────────────
@app.get("/")
def root():
    return {
        "status": "ok",
        "message": "Spam Detection API is running",
        "base_url": BASE_URL,
    }

@app.get("/health")
def health():
    return {"status": "healthy"}

@app.get("/importance")
def get_importance():
    return {"global_importance": xai_service.get_global_importance()}
# -- EMAIL DATABASE ROUTES (Issue #13) -------------------------
from backend.emails import router as emails_router
# from backend.database import init_db # Uncomment if DB is set up

# init_db()
app.include_router(emails_router)

# ── Optional: run directly ─────────────────────────────────────
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host="0.0.0.0", port=PORT, reload=True)