Write-Host "Testing Google Jobs API only..." -ForegroundColor Cyan

# Temporarily test with just Google Jobs
$testUrl = "http://localhost:3000/api/cron/test-google-jobs"

Write-Host "Calling test endpoint..." -ForegroundColor Yellow

try {
    $response = Invoke-RestMethod -Uri $testUrl -Method Get -Headers @{ "Authorization" = "Bearer dev-secret" } -TimeoutSec 60
    
    Write-Host "SUCCESS!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Results:" -ForegroundColor Cyan
    $response | ConvertTo-Json -Depth 5
    
} catch {
    Write-Host "FAILED!" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
}
