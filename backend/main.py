from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.routes import metrics, inference

app = FastAPI(
    title="Smart Hospital Federated Learning API",
    description="Backend API exposing frozen Phase 1-9 research artifacts and live EdgeMLP inference.",
    version="10.2.0"
)

# Allow localhost for React Vite default port
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(metrics.router)
app.include_router(inference.router)

@app.get("/api/health")
def health_check():
    return {
        "status": "ok",
        "service": "smart-hospital-federated-learning-api",
        "phase": "10.2"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host="127.0.0.1", port=8000, reload=True)
