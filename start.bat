@echo off
title VeriVision-AI Launcher
echo ===================================================
echo   VeriVision-AI Platform Bootstrapper
echo ===================================================
echo.

echo [1/3] Starting Backend Server (FastAPI + LangGraph)...
start "VeriVision Backend" cmd /k "cd backend && call venv\Scripts\activate && pip install -r requirements.txt && python -m uvicorn app.main:app --reload --port 8000"

echo [2/3] Starting Frontend Server (React + Vite)...
start "VeriVision Frontend" cmd /k "cd frontend && npm install && npm run dev"

echo.
echo [3/3] Waiting for servers to initialize...
timeout /t 5 /nobreak >nul

echo Launching application in Google Chrome...
start chrome http://localhost:5173 || start http://localhost:5173

echo.
echo ===================================================
echo   VeriVision-AI is now running!
echo   Frontend: http://localhost:5173
echo   Backend API: http://localhost:8000/docs
echo ===================================================
echo Press any key to exit this bootstrap window.
pause >nul
