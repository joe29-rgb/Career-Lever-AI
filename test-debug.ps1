try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000/api/cron/test-prefetch" -Method Get -UseBasicParsing
    Write-Host "Success!" -ForegroundColor Green
    Write-Host $response.Content
} catch {
    Write-Host "Error Status: $($_.Exception.Response.StatusCode.value__)" -ForegroundColor Red
    $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
    $responseBody = $reader.ReadToEnd()
    Write-Host "Error Response:" -ForegroundColor Yellow
    Write-Host $responseBody
}
