# Trigger Supabase Bulk Download
Write-Host "Starting Supabase bulk download..." -ForegroundColor Cyan
Write-Host "Target: 1000 jobs (Edmonton only)" -ForegroundColor Yellow
Write-Host "Expected duration: 5-10 minutes" -ForegroundColor Yellow
Write-Host ""

$headers = @{
    "Authorization" = "Bearer career-lever-ai-bulk-download-secret-2025"
}

try {
    $response = Invoke-RestMethod -Uri "http://localhost:3000/api/cron/bulk-download-jobs-supabase" -Method Get -Headers $headers
    
    Write-Host "SUCCESS!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Results:" -ForegroundColor Cyan
    $response | ConvertTo-Json -Depth 10 | Write-Host
    
} catch {
    Write-Host "ERROR!" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
}
