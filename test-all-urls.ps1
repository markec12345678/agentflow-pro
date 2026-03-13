# Test all public URLs
$urls = @(
    "/",
    "/login",
    "/register",
    "/pricing",
    "/onboarding",
    "/forgot-password",
    "/solutions",
    "/stories",
    "/docs",
    "/contact",
    "/generate",
    "/content",
    "/settings",
    "/dashboard",
    "/manifest.json",
    "/icons/icon-192x192.png",
    "/icons/icon-512x512.png"
)

Write-Host "`nTesting all public URLs...`n"

foreach ($url in $urls) {
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:3002$url" -Method Head -TimeoutSec 5 -ErrorAction Stop
        $status = $response.StatusCode
        if ($status -eq 200) {
            Write-Host "[OK] $url - $status"
        } else {
            Write-Host "[WARN] $url - $status"
        }
    } catch {
        $status = $_.Exception.Response.StatusCode
        Write-Host "[FAIL] $url - $status"
    }
}

Write-Host "`nTest complete!"
