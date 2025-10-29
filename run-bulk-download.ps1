Write-Host "Starting bulk download..." -ForegroundColor Cyan

$response = Invoke-RestMethod -Uri "http://localhost:3000/api/cron/bulk-download-jobs" -Method Get -Headers @{ "Authorization" = "Bearer dev-secret" } -TimeoutSec 600

Write-Host "SUCCESS!" -ForegroundColor Green
$response | ConvertTo-Json -Depth 5
