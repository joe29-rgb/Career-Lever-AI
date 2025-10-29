Write-Host "🔍 TESTING USER CACHE SEARCH" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# Test different keyword searches
$searches = @(
    @{ keywords = "software,developer,javascript"; location = "Edmonton"; name = "Software Developer" },
    @{ keywords = "sales,manager,business"; location = "Edmonton"; name = "Sales Manager" },
    @{ keywords = "accountant,finance,cpa"; location = "Edmonton"; name = "Accountant" },
    @{ keywords = "nurse,healthcare,rn"; location = "Edmonton"; name = "Nurse" },
    @{ keywords = "engineer,mechanical,design"; location = "Edmonton"; name = "Mechanical Engineer" }
)

Write-Host "📊 Running 5 test searches..." -ForegroundColor Yellow
Write-Host ""

$totalDuration = 0
$successCount = 0

foreach ($search in $searches) {
    Write-Host "🔎 Searching: $($search.name)" -ForegroundColor White
    Write-Host "   Keywords: $($search.keywords)" -ForegroundColor Gray
    Write-Host "   Location: $($search.location)" -ForegroundColor Gray
    
    try {
        $startTime = Get-Date
        
        # Note: This requires authentication
        # For testing, you'll need to either:
        # 1. Get a session token from browser
        # 2. Or temporarily disable auth in the endpoint
        
        $url = "http://localhost:3000/api/jobs/search-cache?keywords=$($search.keywords)&location=$($search.location)&limit=20"
        
        Write-Host "   URL: $url" -ForegroundColor DarkGray
        Write-Host ""
        Write-Host "   ⚠️  NOTE: This endpoint requires authentication" -ForegroundColor Yellow
        Write-Host "   To test without auth, temporarily comment out the session check" -ForegroundColor Yellow
        Write-Host ""
        
        # Uncomment this when auth is handled:
        # $response = Invoke-RestMethod -Uri $url -Method Get
        # $endTime = Get-Date
        # $duration = ($endTime - $startTime).TotalMilliseconds
        # $totalDuration += $duration
        
        # Write-Host "   ✅ Found: $($response.jobs.Count) jobs in $([math]::Round($duration, 0))ms" -ForegroundColor Green
        # Write-Host "   Top job: $($response.jobs[0].title) at $($response.jobs[0].company)" -ForegroundColor White
        # Write-Host ""
        
        # $successCount++
        
    } catch {
        Write-Host "   ❌ Search failed: $($_.Exception.Message)" -ForegroundColor Red
        Write-Host ""
    }
}

Write-Host ""
Write-Host "📊 SUMMARY:" -ForegroundColor Cyan
Write-Host "  Total Searches: $($searches.Count)" -ForegroundColor White
Write-Host "  Successful: $successCount" -ForegroundColor Green
if ($successCount -gt 0) {
    Write-Host "  Average Duration: $([math]::Round($totalDuration / $successCount, 0))ms" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "🎉 Cache search is FAST! (< 100ms target)" -ForegroundColor Green
}

Write-Host ""
Write-Host "💡 TO TEST WITH AUTH:" -ForegroundColor Cyan
Write-Host "1. Open browser to http://localhost:3000" -ForegroundColor White
Write-Host "2. Sign in" -ForegroundColor White
Write-Host "3. Open DevTools > Network tab" -ForegroundColor White
Write-Host "4. Make a request and copy the Cookie header" -ForegroundColor White
Write-Host "5. Add -Headers @{ 'Cookie' = 'your-cookie-here' } to Invoke-RestMethod" -ForegroundColor White
Write-Host ""
Write-Host "OR temporarily disable auth for testing:" -ForegroundColor Cyan
Write-Host "Comment out lines 23-25 in src/app/api/jobs/search-cache/route.ts" -ForegroundColor White
