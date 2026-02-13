@echo off
echo Initializing Git...
"C:\Program Files\Git\cmd\git.exe" init
"C:\Program Files\Git\cmd\git.exe" config user.email "user@solarcare.app"
"C:\Program Files\Git\cmd\git.exe" config user.name "SolarCare User"
"C:\Program Files\Git\cmd\git.exe" add .
"C:\Program Files\Git\cmd\git.exe" commit -m "Initial commit of SolarCare app"
"C:\Program Files\Git\cmd\git.exe" remote add origin https://github.com/YashPatil188/solarcare.git
"C:\Program Files\Git\cmd\git.exe" branch -M main
echo Pushing to GitHub...
"C:\Program Files\Git\cmd\git.exe" push -u origin main
echo Done!
pause
