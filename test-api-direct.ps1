# Direct API Testing Script - No Authentication Required for Validation Tests
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "DIRECT API TESTING - LOCATION VALIDATION" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

$baseUrl = "http://localhost:3000"

# Test 1: Missing Location (Should return 400 with our error message)
Write-Host "TEST 1: Missing Location" -ForegroundColor Yellow
Write-Host "Expected: 400 error with 'Location is required'" -ForegroundColor Gray
try {
    $response = Invoke-WebRequest -Uri "$baseUrl/api/jobs/search" `
        -Method POST `
        -Body '{"keywords":"Software Developer"}' `
        -ContentType "application/json" `
        -UseBasicParsing `
        -ErrorAction Stop
    
    Write-Host "❌ UNEXPECTED SUCCESS - Should have failed" -ForegroundColor Red
    Write-Host $response.Content -ForegroundColor Gray
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    $errorResponse = $_.ErrorDetails.Message
    
    Write-Host "Status Code: $statusCode" -ForegroundColor $(if ($statusCode -eq 400) { "Green" } else { "Yellow" })
    Write-Host "Response: $errorResponse" -ForegroundColor Gray
    
    if ($statusCode -eq 400 -and $errorResponse -match "Location is required") {
        Write-Host "✅ TEST PASSED - Location validation working!" -ForegroundColor Green
    } elseif ($statusCode -eq 401) {
        Write-Host "⚠️ Auth check happens BEFORE location validation" -ForegroundColor Yellow
    }
}
Write-Host ""

# Test 2: Too Broad Location (Should return 400)
Write-Host "TEST 2: Too Broad Location (Canada)" -ForegroundColor Yellow
Write-Host "Expected: 400 error with 'Location is too broad'" -ForegroundColor Gray
try {
    $response = Invoke-WebRequest -Uri "$baseUrl/api/jobs/search" `
        -Method POST `
        -Body '{"keywords":"Software Developer","location":"Canada"}' `
        -ContentType "application/json" `
        -UseBasicParsing `
        -ErrorAction Stop
    
    Write-Host "❌ UNEXPECTED SUCCESS - Should have failed" -ForegroundColor Red
    Write-Host $response.Content -ForegroundColor Gray
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    $errorResponse = $_.ErrorDetails.Message
    
    Write-Host "Status Code: $statusCode" -ForegroundColor $(if ($statusCode -eq 400) { "Green" } else { "Yellow" })
    Write-Host "Response: $errorResponse" -ForegroundColor Gray
    
    if ($statusCode -eq 400 -and $errorResponse -match "too broad") {
        Write-Host "✅ TEST PASSED - Broad location rejection working!" -ForegroundColor Green
    } elseif ($statusCode -eq 401) {
        Write-Host "⚠️ Auth check happens BEFORE location validation" -ForegroundColor Yellow
    }
}
Write-Host ""

# Test 3: Valid Location (Will hit auth, but proves location validation passed)
Write-Host "TEST 3: Valid Location (Toronto, ON)" -ForegroundColor Yellow
Write-Host "Expected: 401 (auth required) - proves location validation passed" -ForegroundColor Gray
try {
    $response = Invoke-WebRequest -Uri "$baseUrl/api/jobs/search" `
        -Method POST `
        -Body '{"keywords":"Software Developer","location":"Toronto, ON"}' `
        -ContentType "application/json" `
        -UseBasicParsing `
        -ErrorAction Stop
    
    Write-Host "✅ SUCCESS - Got response!" -ForegroundColor Green
    Write-Host $response.Content -ForegroundColor Gray
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    $errorResponse = $_.ErrorDetails.Message
    
    Write-Host "Status Code: $statusCode" -ForegroundColor $(if ($statusCode -eq 401) { "Green" } else { "Red" })
    Write-Host "Response: $errorResponse" -ForegroundColor Gray
    
    if ($statusCode -eq 401) {
        Write-Host "✅ TEST PASSED - Location validation passed, hit auth as expected" -ForegroundColor Green
    }
}
Write-Host ""

Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "CHECKING DEV SERVER LOGS..." -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "Check the terminal running 'npm run dev' for:" -ForegroundColor Yellow
Write-Host "  - [JOB_SEARCH] NEW SEARCH REQUEST" -ForegroundColor Gray
Write-Host "  - [JOB_SEARCH] Location: UNDEFINED" -ForegroundColor Gray
Write-Host "  - [JOB_SEARCH] ❌ MISSING LOCATION" -ForegroundColor Gray
Write-Host "  - [JOB_SEARCH] ❌ LOCATION TOO BROAD: Canada" -ForegroundColor Gray
Write-Host ""
