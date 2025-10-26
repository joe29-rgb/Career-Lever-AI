# Simple API Testing Script
Write-Host "Testing Career Lever AI APIs..." -ForegroundColor Cyan
Write-Host ""

$baseUrl = "http://localhost:3000"

# Test 1: Missing Location
Write-Host "TEST 1: Job Search - Missing Location" -ForegroundColor Yellow
try {
    Invoke-RestMethod -Uri "$baseUrl/api/jobs/search" -Method POST -Body '{"keywords":"Software Developer"}' -ContentType "application/json"
} catch {
    Write-Host "Status: $($_.Exception.Response.StatusCode.value__)" -ForegroundColor Green
    Write-Host "Response: $($_.ErrorDetails.Message)" -ForegroundColor Gray
}
Write-Host ""

# Test 2: Too Broad Location
Write-Host "TEST 2: Job Search - Too Broad Location (Canada)" -ForegroundColor Yellow
try {
    Invoke-RestMethod -Uri "$baseUrl/api/jobs/search" -Method POST -Body '{"keywords":"Software Developer","location":"Canada"}' -ContentType "application/json"
} catch {
    Write-Host "Status: $($_.Exception.Response.StatusCode.value__)" -ForegroundColor Green
    Write-Host "Response: $($_.ErrorDetails.Message)" -ForegroundColor Gray
}
Write-Host ""

# Test 3: Valid Location
Write-Host "TEST 3: Job Search - Valid Location (Toronto, ON)" -ForegroundColor Yellow
try {
    $result = Invoke-RestMethod -Uri "$baseUrl/api/jobs/search" -Method POST -Body '{"keywords":"Software Developer","location":"Toronto, ON"}' -ContentType "application/json"
    Write-Host "Success: $($result.success)" -ForegroundColor Green
    Write-Host "Jobs: $($result.jobs.Count)" -ForegroundColor Gray
} catch {
    Write-Host "Status: $($_.Exception.Response.StatusCode.value__)" -ForegroundColor Yellow
    Write-Host "Response: $($_.ErrorDetails.Message)" -ForegroundColor Gray
}
Write-Host ""

Write-Host "Testing Complete" -ForegroundColor Cyan
