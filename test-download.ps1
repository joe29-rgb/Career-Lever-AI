Write-Host "Starting job download test for Edmonton, AB..." -ForegroundColor Cyan
Write-Host "Location: Edmonton, AB" -ForegroundColor Yellow
Write-Host "Radius: 150 km" -ForegroundColor Yellow
Write-Host "Expected time: 30-45 seconds" -ForegroundColor Yellow
Write-Host ""

try {
    $response = Invoke-RestMethod -Uri "http://localhost:3000/api/cron/test-prefetch" -Method Get -TimeoutSec 120
    
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
    Write-Host "Full response saved to: test-results.json" -ForegroundColor Gray
    $response | ConvertTo-Json -Depth 10 | Out-File "test-results.json"
    
} catch {
    Write-Host "❌ Test failed!" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    Write-Host "Troubleshooting:" -ForegroundColor Yellow
    Write-Host "  1. Make sure dev server is running (npm run dev)" -ForegroundColor White
    Write-Host "  2. Check if MongoDB is connected" -ForegroundColor White
    Write-Host "  3. Verify Perplexity API credentials" -ForegroundColor White
}
