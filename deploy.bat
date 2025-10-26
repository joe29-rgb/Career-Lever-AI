@echo off
echo Installing dependencies...
call npm install
echo.
echo Staging files...
git add .
echo.
echo Committing...
git commit -m "feat: Implement robust 3-tier PDF extraction (pdf-parse -> pdfjs-dist -> ASCII)"
echo.
echo Pushing to GitHub...
git push origin main
echo.
echo Done!
pause

