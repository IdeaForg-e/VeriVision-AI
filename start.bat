@echo off
setlocal

title VERIVISION-AI Launcher

set "ROOT=%~dp0"
set "BACKEND_DIR=%ROOT%backend"
set "FRONTEND_DIR=%ROOT%frontend"
set "BACKEND_PY=%BACKEND_DIR%\venv\Scripts\python.exe"

echo.
echo =====================================================
echo   VERIVISION-AI - Development Server Launcher
echo =====================================================
echo.

if not exist "%BACKEND_DIR%\app\main.py" (
  echo [ERROR] Backend app not found at "%BACKEND_DIR%\app\main.py"
  pause
  exit /b 1
)

if not exist "%FRONTEND_DIR%\package.json" (
  echo [ERROR] Frontend package.json not found at "%FRONTEND_DIR%\package.json"
  pause
  exit /b 1
)

if not exist "%BACKEND_PY%" (
  echo [WARN] Backend virtual environment was not found.
  echo        Expected: "%BACKEND_PY%"
  echo        Falling back to system Python.
  set "BACKEND_PY=python"
)

if not exist "%FRONTEND_DIR%\node_modules" (
  echo [ERROR] Frontend dependencies are missing.
  echo        Run this once:
  echo        cd frontend
  echo        npm install
  pause
  exit /b 1
)

"%BACKEND_PY%" -c "import fastapi, uvicorn" >nul 2>nul
if errorlevel 1 (
  echo [ERROR] Backend Python dependencies are missing.
  echo        Run this once:
  echo        "%BACKEND_PY%" -m pip install -r "%BACKEND_DIR%\requirements.txt"
  echo.
  echo        If full install is slow, install the core server deps first:
  echo        "%BACKEND_PY%" -m pip install fastapi "uvicorn[standard]" sqlalchemy pydantic python-multipart "python-jose[cryptography]" "passlib[bcrypt]" bcrypt python-dotenv requests opencv-python-headless scikit-image reportlab jinja2 matplotlib pillow langgraph email-validator
  pause
  exit /b 1
)

echo [1/2] Starting backend on http://localhost:8000
start "VERIVISION-AI Backend" cmd /k "cd /d "%BACKEND_DIR%" && "%BACKEND_PY%" -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000"

echo [2/2] Starting frontend on http://localhost:5173
start "VERIVISION-AI Frontend" cmd /k "cd /d "%FRONTEND_DIR%" && npm run dev -- --host 127.0.0.1 --port 5173"

echo.
echo Waiting for servers to initialize...
timeout /t 5 /nobreak >nul

echo Launching application in Google Chrome...
if exist "%ProgramFiles%\Google\Chrome\Application\chrome.exe" (
    start "" "%ProgramFiles%\Google\Chrome\Application\chrome.exe" "http://localhost:5173"
) else if exist "%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe" (
    start "" "%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe" "http://localhost:5173"
) else if exist "%LocalAppData%\Google\Chrome\Application\chrome.exe" (
    start "" "%LocalAppData%\Google\Chrome\Application\chrome.exe" "http://localhost:5173"
) else (
    start http://localhost:5173
)

echo.
echo Both servers are launching in separate windows.
echo.
echo Backend:  http://localhost:8000
echo API docs: http://localhost:8000/docs
echo Frontend: http://localhost:5173
echo.
echo Keep the two server windows open while developing.
echo Press any key to close this launcher window.
pause >nul

endlocal
