$body = @{
    email = "e2e@test.com"
    password = "e2e-secret"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3000/api/auth/test-login" -Method POST -Body $body -ContentType "application/json"
