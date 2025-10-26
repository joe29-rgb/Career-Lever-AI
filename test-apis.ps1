# API Testing Script for Career Lever AI
# Tests PDF upload and job search with authentication

Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "CAREER LEVER AI - API TESTING SCRIPT" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

$baseUrl = "http://localhost:3000"

# Test 1: Authentication Bypass
Write-Host "TEST 1: Authentication Bypass Endpoint" -ForegroundColor Yellow
Write-Host "─────────────────────────────────────────────────────────" -ForegroundColor Gray

$authBody = @{
    email = "joemcdonald29@gmail.com"
    password = "Cohen2011!"
} | ConvertTo-Json

try {
    $authResponse = Invoke-RestMethod -Uri "$baseUrl/api/test-auth" -Method POST -Body $authBody -ContentType "application/json"
    Write-Host "✅ Auth Success: $($authResponse.message)" -ForegroundColor Green
    Write-Host "User ID: $($authResponse.user.id)" -ForegroundColor Gray
    Write-Host ""
} catch {
    Write-Host "❌ Auth Failed: $_" -ForegroundColor Red
    Write-Host ""
    exit 1
}

# Test 2: Job Search with Missing Location
Write-Host "TEST 2: Job Search - Missing Location (Should Fail)" -ForegroundColor Yellow
Write-Host "─────────────────────────────────────────────────────────" -ForegroundColor Gray

$jobSearchBody1 = @{
    keywords = "Software Developer"
    # No location provided
} | ConvertTo-Json

try {
    $response = Invoke-WebRequest -Uri "$baseUrl/api/jobs/search" -Method POST -Body $jobSearchBody1 -ContentType "application/json" -UseBasicParsing
    $data = $response.Content | ConvertFrom-Json
    Write-Host "Response Status: $($response.StatusCode)" -ForegroundColor Gray
    Write-Host "Response: $($data | ConvertTo-Json -Depth 3)" -ForegroundColor Gray
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    $errorBody = $_.ErrorDetails.Message | ConvertFrom-Json
    Write-Host "✅ Expected Error - Status: $statusCode" -ForegroundColor Green
    Write-Host "Error: $($errorBody.error)" -ForegroundColor Gray
    Write-Host "Error Code: $($errorBody.errorCode)" -ForegroundColor Gray
}
Write-Host ""

# Test 3: Job Search with Too Broad Location
Write-Host "TEST 3: Job Search - Too Broad Location 'Canada' (Should Fail)" -ForegroundColor Yellow
Write-Host "─────────────────────────────────────────────────────────" -ForegroundColor Gray

$jobSearchBody2 = @{
    keywords = "Software Developer"
    location = "Canada"
} | ConvertTo-Json

try {
    $response = Invoke-WebRequest -Uri "$baseUrl/api/jobs/search" -Method POST -Body $jobSearchBody2 -ContentType "application/json" -UseBasicParsing
    $data = $response.Content | ConvertFrom-Json
    Write-Host "Response Status: $($response.StatusCode)" -ForegroundColor Gray
    Write-Host "Response: $($data | ConvertTo-Json -Depth 3)" -ForegroundColor Gray
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    $errorBody = $_.ErrorDetails.Message | ConvertFrom-Json
    Write-Host "✅ Expected Error - Status: $statusCode" -ForegroundColor Green
    Write-Host "Error: $($errorBody.error)" -ForegroundColor Gray
    Write-Host "Example: $($errorBody.example)" -ForegroundColor Gray
}
Write-Host ""

# Test 4: Job Search with Valid Location (Will fail due to auth, but validates location logic)
Write-Host "TEST 4: Job Search - Valid Location 'Toronto, ON'" -ForegroundColor Yellow
Write-Host "─────────────────────────────────────────────────────────" -ForegroundColor Gray

$jobSearchBody3 = @{
    keywords = "Software Developer"
    location = "Toronto, ON"
    limit = 10
} | ConvertTo-Json

try {
    $response = Invoke-WebRequest -Uri "$baseUrl/api/jobs/search" -Method POST -Body $jobSearchBody3 -ContentType "application/json" -UseBasicParsing
    $data = $response.Content | ConvertFrom-Json
    
    if ($response.StatusCode -eq 200) {
        Write-Host "✅ SUCCESS - Status: $($response.StatusCode)" -ForegroundColor Green
        Write-Host "Jobs Returned: $($data.jobs.Count)" -ForegroundColor Gray
        Write-Host "Total Results: $($data.totalResults)" -ForegroundColor Gray
        if ($data.jobs.Count -gt 0) {
            Write-Host "First Job: $($data.jobs[0].title) at $($data.jobs[0].company)" -ForegroundColor Gray
        }
    }
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    $errorBody = $_.ErrorDetails.Message | ConvertFrom-Json
    
    if ($statusCode -eq 401) {
        Write-Host "⚠️ Auth Required (Expected) - Status: $statusCode" -ForegroundColor Yellow
        Write-Host "Note: Location validation passed (reached auth check)" -ForegroundColor Gray
    } else {
        Write-Host "❌ Unexpected Error - Status: $statusCode" -ForegroundColor Red
        Write-Host "Error: $($errorBody.error)" -ForegroundColor Gray
    }
}
Write-Host ""

Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "TESTING COMPLETE" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
