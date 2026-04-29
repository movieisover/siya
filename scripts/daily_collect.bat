@echo off
REM ============================================================
REM Siya Daily Data Collection
REM Run via Windows Task Scheduler, weekdays at 16:30
REM ============================================================

REM Force UTF-8 encoding to handle emoji in Python output
chcp 65001 > nul 2>&1
set PYTHONIOENCODING=utf-8

set CONDA_PATH=C:\ProgramData\anaconda3
set PROJECT_PATH=C:\projects\stock-analyzer
set COLLECTOR_PATH=%PROJECT_PATH%\src\data\collectors
set LOG_DIR=%PROJECT_PATH%\logs

if not exist "%LOG_DIR%" mkdir "%LOG_DIR%"

set LOGFILE=%LOG_DIR%\daily_%date:~0,4%%date:~5,2%%date:~8,2%.log

echo ============================================================ >> "%LOGFILE%" 2>&1
echo START: %date% %time% >> "%LOGFILE%" 2>&1
echo ============================================================ >> "%LOGFILE%" 2>&1

call "%CONDA_PATH%\Scripts\activate.bat" "%CONDA_PATH%"
call conda activate siya

cd /d "%COLLECTOR_PATH%"

echo [%time%] daily_update.py start >> "%LOGFILE%" 2>&1
python daily_update.py >> "%LOGFILE%" 2>&1
echo [%time%] daily_update.py done (exit: %ERRORLEVEL%) >> "%LOGFILE%" 2>&1

echo [%time%] collect_disclosures.py start >> "%LOGFILE%" 2>&1
python collect_disclosures.py >> "%LOGFILE%" 2>&1
echo [%time%] collect_disclosures.py done (exit: %ERRORLEVEL%) >> "%LOGFILE%" 2>&1

echo ============================================================ >> "%LOGFILE%" 2>&1
echo DONE: %date% %time% >> "%LOGFILE%" 2>&1
echo ============================================================ >> "%LOGFILE%" 2>&1

exit /b 0
