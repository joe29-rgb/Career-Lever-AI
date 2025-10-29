Write-Host "Checking MongoDB for job sources..." -ForegroundColor Cyan

# You'll need to run these commands in MongoDB Compass or mongo shell:
Write-Host ""
Write-Host "Run these commands in MongoDB:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Count total jobs:" -ForegroundColor Green
Write-Host "   db.globaljobscaches.countDocuments()" -ForegroundColor White
Write-Host ""
Write-Host "2. Count by source:" -ForegroundColor Green
Write-Host "   db.globaljobscaches.aggregate([{ `$group: { _id: '`$source', count: { `$sum: 1 } } }])" -ForegroundColor White
Write-Host ""
Write-Host "3. Sample jobs:" -ForegroundColor Green
Write-Host "   db.globaljobscaches.find().limit(5)" -ForegroundColor White
Write-Host ""
