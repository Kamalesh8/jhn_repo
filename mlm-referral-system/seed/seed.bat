@echo off
setlocal

:: Load environment variables
for /f "usebackq tokens=1,2 delims==" %%i in ("%~dp0..\.env") do (
    if "%%i"=="VITE_FIREBASE_API_KEY" set "VITE_FIREBASE_API_KEY=%%j"
    if "%%i"=="VITE_FIREBASE_AUTH_DOMAIN" set "VITE_FIREBASE_AUTH_DOMAIN=%%j"
    if "%%i"=="VITE_FIREBASE_PROJECT_ID" set "VITE_FIREBASE_PROJECT_ID=%%j"
    if "%%i"=="VITE_FIREBASE_STORAGE_BUCKET" set "VITE_FIREBASE_STORAGE_BUCKET=%%j"
    if "%%i"=="VITE_FIREBASE_MESSAGING_SENDER_ID" set "VITE_FIREBASE_MESSAGING_SENDER_ID=%%j"
    if "%%i"=="VITE_FIREBASE_APP_ID" set "VITE_FIREBASE_APP_ID=%%j"
    if "%%i"=="VITE_FIREBASE_MEASUREMENT_ID" set "VITE_FIREBASE_MEASUREMENT_ID=%%j"
)

:: Run the seed script
node seed.mjs

endlocal
