from fastapi import FastAPI

app = FastAPI(
    title="Smriti AI Backend",
    version="1.0.0"
)

@app.get("/")
def root():
    return {"message": "Welcome to Smriti AI Backend 🚀"}