@echo off
REM Siya ECOS FX collector (local, Korean IP) - GitHub cloud IP is blocked by ECOS.
REM Scheduled by Windows Task Scheduler. --days 10 overlaps to backfill misses via UPSERT.
REM Call siya python directly (avoids conda-activate flakiness in batch).
REM PYTHONIOENCODING=utf-8 avoids cp949 emoji crash on final print.

set PYTHONIOENCODING=utf-8
cd /d C:\projects\stock-analyzer
C:\Users\easte\.conda\envs\siya\python.exe src\data\collectors\collect_fx.py --days 10 >> logs\fx_local.log 2>&1
