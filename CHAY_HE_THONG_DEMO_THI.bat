@echo off
chcp 65001 >nul
title KHOI DONG HE THONG DEMO LIENG MOBILE - VKU 2026
echo =====================================================================
echo    HE THONG LIENG MOBILE - SAN SANG BAO VE DO AN QLDA (VKU)
echo =====================================================================
echo Dang khoi dong toan bo he thong (Backend, AI, Web, Mobile, Cloudflare)...
echo.

cd /d "D:\DU_AN_WEB\lieng-mobile-qtda"

:: 1. Backend Laravel 8080
start "1. Backend API (:8080)" cmd /k "cd backend && php -S 0.0.0.0:8080 -t public server.php"

:: 2. AutoGrade AI 8091
start "2. AutoGrade AI (:8091)" cmd /k "cd autograde-service && .venv\Scripts\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8091"

:: 3. Assistant RAG AI 8090
start "3. Assistant AI (:8090)" cmd /k "cd assistant-service && .venv\Scripts\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8090"

:: 4. Frontend Vite 5173
start "4. Web Frontend (:5173)" cmd /k "cd frontend && npm run dev -- --host 0.0.0.0 --port 5173 --strictPort"

:: 5. Mobile Web 8085
start "5. Mobile Web (:8085)" cmd /k "npx serve -s mobile-expo\dist -l 8085"

:: Cho cac service khoi dong 3 giay
timeout /t 3 /nobreak >nul

:: 6. Cloudflare Tunnel Web
start "6. Cloudflare Tunnel Web" cmd /k "C:\Users\phamb\.gemini\antigravity\scratch\cloudflared.exe tunnel --url http://127.0.0.1:5173"

:: 7. Cloudflare Tunnel Mobile
start "7. Cloudflare Tunnel Mobile" cmd /k "C:\Users\phamb\.gemini\antigravity\scratch\cloudflared.exe tunnel --url http://127.0.0.1:8085"

echo.
echo =====================================================================
echo DA KHOI DONG XONG TAT CA CAC DICH VU!
echo Xem cua so 'Cloudflare Tunnel' de lay link https://...trycloudflare.com
echo Hoac truy cap truc tiep cuc bo:
echo   - Web Admin POS: http://localhost:5173
echo   - Mobile B2C:    http://localhost:8085
echo   - AutoGrade AI:  http://localhost:8091/docs
echo =====================================================================
pause
