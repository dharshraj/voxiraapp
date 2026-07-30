@echo off
cd /d "c:\Users\91637\VoxiraApp\selenium_model"
set PYTHONIOENCODING=utf-8
python -u audit\generate_report.py > reports\report_gen.log 2>&1
echo EXIT CODE: %ERRORLEVEL%
type reports\report_gen.log
