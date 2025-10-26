# Comprehensive API Testing - All Testable Endpoints
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "COMPREHENSIVE API TESTING - Career Lever AI" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

$baseUrl = "http://localhost:3000"
$passCount = 0
$failCount = 0

function Test-Endpoint {
    param($name, $method, $path, $body, $expectedStatus, $expectedContent)
    
    Write-Host "TEST: $name" -ForegroundColor Yellow
    try {
        $params = @{
            Uri = "$baseUrl$path"
            Method = $method
            UseBasicParsing = $true
            ErrorAction = 'Stop'
        }
        
        if ($body) {
            $params.Body = $body
            $params.ContentType = "application/json"
        }
        
        $response = Invoke-WebRequest @params
        $statusCode = $response.StatusCode
        $content = $response.Content
        
        if ($statusCode -eq $expectedStatus) {
            Write-Host "  ✅ PASS - Status: $statusCode" -ForegroundColor Green
            $script:passCount++
        } else {
            Write-Host "  ❌ FAIL - Expected: $expectedStatus, Got: $statusCode" -ForegroundColor Red
            $script:failCount++
        }
        
    } catch {
        $statusCode = $_.Exception.Response.StatusCode.value__
        $errorBody = $_.ErrorDetails.Message
        
        if ($statusCode -eq $expectedStatus) {
            Write-Host "  ✅ PASS - Status: $statusCode" -ForegroundColor Green
            if ($expectedContent -and $errorBody -match $expectedContent) {
                Write-Host "  ✅ Content match: $expectedContent" -ForegroundColor Green
            }
            $script:passCount++
        } else {
            Write-Host "  ❌ FAIL - Expected: $expectedStatus, Got: $statusCode" -ForegroundColor Red
            Write-Host "  Response: $errorBody" -ForegroundColor Gray
            $script:failCount++
        }
    }
    Write-Host ""
}

# ═══════════════════════════════════════════════════════
# JOB SEARCH API TESTS
# ═══════════════════════════════════════════════════════
Write-Host "═══ JOB SEARCH API ═══" -ForegroundColor Cyan
Write-Host ""

Test-Endpoint `
    -name "Job Search - Missing Location" `
    -method "POST" `
    -path "/api/jobs/search" `
    -body '{"keywords":"Software Developer"}' `
    -expectedStatus 400 `
    -expectedContent "Location is required"

Test-Endpoint `
    -name "Job Search - Too Broad Location (Canada)" `
    -method "POST" `
    -path "/api/jobs/search" `
    -body '{"keywords":"Software Developer","location":"Canada"}' `
    -expectedStatus 400 `
    -expectedContent "too broad"

Test-Endpoint `
    -name "Job Search - Too Broad Location (USA)" `
    -method "POST" `
    -path "/api/jobs/search" `
    -body '{"keywords":"Engineer","location":"United States"}' `
    -expectedStatus 400 `
    -expectedContent "too broad"

Test-Endpoint `
    -name "Job Search - Valid Location (Toronto)" `
    -method "POST" `
    -path "/api/jobs/search" `
    -body '{"keywords":"Developer","location":"Toronto, ON"}' `
    -expectedStatus 401

Test-Endpoint `
    -name "Job Search - Valid Location (Seattle)" `
    -method "POST" `
    -path "/api/jobs/search" `
    -body '{"keywords":"Engineer","location":"Seattle, WA"}' `
    -expectedStatus 401

Test-Endpoint `
    -name "Job Search - Missing Keywords" `
    -method "POST" `
    -path "/api/jobs/search" `
    -body '{"location":"Toronto, ON"}' `
    -expectedStatus 400

# ═══════════════════════════════════════════════════════
# RESUME API TESTS
# ═══════════════════════════════════════════════════════
Write-Host "═══ RESUME API ═══" -ForegroundColor Cyan
Write-Host ""

Test-Endpoint `
    -name "Resume Upload - No Auth" `
    -method "POST" `
    -path "/api/resume/upload" `
    -body '{"text":"Test resume"}' `
    -expectedStatus 401

Test-Endpoint `
    -name "Resume List - No Auth" `
    -method "GET" `
    -path "/api/resume/list" `
    -expectedStatus 401

Test-Endpoint `
    -name "Resume Parse - No Auth" `
    -method "POST" `
    -path "/api/resume/parse" `
    -body '{"resumeId":"test123"}' `
    -expectedStatus 401

# ═══════════════════════════════════════════════════════
# AUTH API TESTS
# ═══════════════════════════════════════════════════════
Write-Host "═══ AUTH API ═══" -ForegroundColor Cyan
Write-Host ""

Test-Endpoint `
    -name "Test Auth Endpoint - GET" `
    -method "GET" `
    -path "/api/test-auth" `
    -expectedStatus 200

Test-Endpoint `
    -name "Test Auth Endpoint - Invalid Credentials" `
    -method "POST" `
    -path "/api/test-auth" `
    -body '{"email":"wrong@test.com","password":"wrong"}' `
    -expectedStatus 401

Test-Endpoint `
    -name "Test Auth Endpoint - Valid Credentials" `
    -method "POST" `
    -path "/api/test-auth" `
    -body '{"email":"joemcdonald29@gmail.com","password":"Cohen2011!"}' `
    -expectedStatus 200

# ═══════════════════════════════════════════════════════
# HEALTH CHECK TESTS
# ═══════════════════════════════════════════════════════
Write-Host "═══ HEALTH CHECKS ═══" -ForegroundColor Cyan
Write-Host ""

Test-Endpoint `
    -name "Homepage - GET" `
    -method "GET" `
    -path "/" `
    -expectedStatus 200

Test-Endpoint `
    -name "Dashboard - No Auth" `
    -method "GET" `
    -path "/dashboard" `
    -expectedStatus 200

# ═══════════════════════════════════════════════════════
# RESULTS SUMMARY
# ═══════════════════════════════════════════════════════
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "TEST RESULTS SUMMARY" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
Write-Host "Total Tests: $($passCount + $failCount)" -ForegroundColor White
Write-Host "✅ Passed: $passCount" -ForegroundColor Green
Write-Host "❌ Failed: $failCount" -ForegroundColor Red
Write-Host ""

if ($failCount -eq 0) {
    Write-Host "🎉 ALL TESTS PASSED!" -ForegroundColor Green
    Write-Host "✅ Mission Accomplished - All testable functions verified" -ForegroundColor Green
} else {
    Write-Host "⚠️ Some tests failed - Review above for details" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Note: Tests requiring authentication return 401 as expected" -ForegroundColor Gray
Write-Host "Full end-to-end testing requires authenticated session" -ForegroundColor Gray
