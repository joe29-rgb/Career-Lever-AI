# Fix all hardcoded text colors for dark mode compatibility

Write-Host "Fixing text colors across all files..." -ForegroundColor Green

$files = Get-ChildItem -Path "src/app" -Filter "*.tsx" -Recurse
$count = 0

foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw
    $original = $content
    
    # Replace gray text colors with CSS variables
    $content = $content -replace 'text-gray-900', 'text-foreground'
    $content = $content -replace 'text-gray-800', 'text-foreground'
    $content = $content -replace 'text-gray-700', 'text-foreground'
    $content = $content -replace 'text-gray-600', 'text-muted-foreground'
    $content = $content -replace 'text-gray-500', 'text-muted-foreground'
    $content = $content -replace 'text-gray-400', 'text-muted-foreground'
    
    # Replace absolute colors (but not in compound classes)
    $content = $content -replace 'text-white(?!-)', 'text-foreground'
    $content = $content -replace 'text-black(?!-)', 'text-foreground'
    
    # Replace gray backgrounds with CSS variables
    $content = $content -replace 'bg-gray-50(?!0)', 'bg-background'
    $content = $content -replace 'bg-gray-100(?!0)', 'bg-muted'
    
    if ($content -ne $original) {
        Set-Content -Path $file.FullName -Value $content
        $count++
        Write-Host "  Fixed: $($file.Name)" -ForegroundColor Cyan
    }
}

Write-Host "Complete! Fixed $count files" -ForegroundColor Green
