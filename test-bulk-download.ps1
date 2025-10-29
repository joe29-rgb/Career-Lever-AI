Write-Host "🚀 TESTING BULK JOB DOWNLOAD" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "📍 Location: Edmonton, AB (150km radius)" -ForegroundColor Yellow
Write-Host "🔌 Sources: Google Jobs, Active Jobs DB, JSearch, Adzuna" -ForegroundColor Yellow
Write-Host "⏱️  Expected time: 5-10 minutes" -ForegroundColor Yellow
Write-Host "📊 Expected jobs: 8,000-10,000" -ForegroundColor Yellow
Write-Host ""

$startTime = Get-Date

try {
    Write-Host "Calling bulk download endpoint..." -ForegroundColor White
    
    $response = Invoke-RestMethod -Uri "http://localhost:3000/api/cron/bulk-download-jobs" `
        -Method Get `
        -Headers @{ "Authorization" = "Bearer dev-secret" } `
        -TimeoutSec 600
    
    $endTime = Get-Date
    $duration = ($endTime - $startTime).TotalSeconds
    
    Write-Host ""
    Write-Host "✅ BULK DOWNLOAD COMPLETE!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📊 RESULTS:" -ForegroundColor Cyan
    Write-Host "  Total Cities: $($response.results.total)" -ForegroundColor White
    Write-Host "  Success: $($response.results.success)" -ForegroundColor Green
    Write-Host "  Failed: $($response.results.failed)" -ForegroundColor $(if ($response.results.failed -eq 0) { "Green" } else { "Red" })
    Write-Host "  Total Jobs: $($response.results.totalJobs)" -ForegroundColor Yellow
    Write-Host "  New Jobs: $($response.results.newJobs)" -ForegroundColor Green
    Write-Host "  Updated Jobs: $($response.results.updatedJobs)" -ForegroundColor Blue
    Write-Host "  Duration: $([math]::Round($duration, 2)) seconds" -ForegroundColor White
    Write-Host ""
    
    if ($response.results.errors.Count -gt 0) {
        Write-Host "⚠️  ERRORS:" -ForegroundColor Red
        foreach ($err in $response.results.errors) {
            Write-Host "  - $err" -ForegroundColor Red
        }
        Write-Host ""
    }
    
    Write-Host "💾 Saving full response to bulk-download-results.json..." -ForegroundColor Gray
    $response | ConvertTo-Json -Depth 10 | Out-File "bulk-download-results.json"
    
    Write-Host ""
    Write-Host "🎉 SUCCESS! Jobs are now cached in MongoDB!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next step: Test user search endpoint" -ForegroundColor Cyan
    Write-Host "Run: .\test-user-search.ps1" -ForegroundColor White
    
} catch {
    Write-Host ""
    Write-Host "❌ BULK DOWNLOAD FAILED!" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    Write-Host "Troubleshooting:" -ForegroundColor Yellow
    Write-Host "  1. Is dev server running? (npm run dev)" -ForegroundColor White
    Write-Host "  2. Is MongoDB connected?" -ForegroundColor White
    Write-Host "  3. Is RAPIDAPI_KEY set in .env.local?" -ForegroundColor White
    Write-Host "  4. Check server logs for errors" -ForegroundColor White
}
