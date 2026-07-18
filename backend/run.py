import uvicorn
import os

if __name__ == "__main__":
    # Launch uvicorn server on port 8000
    print("Starting VeriVision-AI API server...")
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
