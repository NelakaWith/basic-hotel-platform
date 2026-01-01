@echo off
setlocal

rem Launch API dev server
start "api-dev" cmd /k "cd /d %~dp0api && npm run dev"

rem Launch Client dev server
start "client-dev" cmd /k "cd /d %~dp0client && npm run dev"

endlocal
