@echo off
set SOURCE=C:\Users\admin\projects\fullstack\agentflow-pro
set DEST=F:\backup\agentflow-pro
echo Backing up agentflow-pro to %DEST%...
xcopy "%SOURCE%" "%DEST%" /E /I /H /Y
echo Done.
