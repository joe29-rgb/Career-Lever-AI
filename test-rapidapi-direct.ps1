Write-Host "Testing RapidAPI Google Jobs directly..." -ForegroundColor Cyan

# Test if we can reach the API
$url = "http://localhost:3000/api/cron/bulk-download-jobs"

Write-Host "Calling: $url" -ForegroundColor Yellow
Write-Host "This will show us what the APIs are returning..." -ForegroundColor Gray
Write-Host ""

try {
    $response = Invoke-RestMethod -Uri $url -Method Get -Headers @{ "Authorization" = "Bearer dev-secret" } -TimeoutSec 600 -Verbose
    
    Write-Host "Response:" -ForegroundColor Cyan
    $response | ConvertTo-Json -Depth 10 | Write-Host
    
} catch {
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "Response Body:" -ForegroundColor Yellow
        Write-Host $responseBody
    }
}
