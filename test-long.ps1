Write-Host "Starting job download test (with longer timeout)..." -ForegroundColor Cyan
Write-Host ""

try {
    $response = Invoke-RestMethod -Uri "http://localhost:3000/api/cron/test-prefetch" -Method Get -TimeoutSec 300
    
    Write-Host "✅ Test completed successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Results:" -ForegroundColor Cyan
    Write-Host "  Total Searches: $($response.summary.totalSearches)" -ForegroundColor White
    Write-Host "  Successful: $($response.summary.successfulSearches)" -ForegroundColor Green
    Write-Host "  Failed: $($response.summary.failedSearches)" -ForegroundColor $(if ($response.summary.failedSearches -eq 0) { "Green" } else { "Red" })
    Write-Host "  Total Jobs Found: $($response.summary.totalJobsFound)" -ForegroundColor Yellow
    Write-Host "  Average per Search: $($response.summary.averageJobsPerSearch)" -ForegroundColor Yellow
    Write-Host ""
    
    Write-Host "Detailed Results:" -ForegroundColor Cyan
    foreach ($search in $response.results.searches) {
        $status = if ($search.success) { "✅" } else { "❌" }
        Write-Host "  $status $($search.keywords): $($search.jobCount) jobs" -ForegroundColor $(if ($search.success) { "Green" } else { "Red" })
    }
    
    Write-Host ""
    $response | ConvertTo-Json -Depth 10 | Out-File "test-results-full.json"
    Write-Host "Full response saved to: test-results-full.json" -ForegroundColor Gray
    
} catch {
    Write-Host "❌ Test failed!" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
}
