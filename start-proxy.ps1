# start-proxy.ps1
# Skripta za samodejni zagon MCP SuperAssistant Proxyja

$ErrorActionPreference = "Stop"
$ConfigPath = "F:\d\MCP-SuperAssistant\config.json"
$Port = 3006
$Transport = "sse"

Write-Host "🚀 MCP SuperAssistant Proxy Starter" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan

# Preveri ali config obstaja
if (-not (Test-Path $ConfigPath)) {
    Write-Host "❌ Config.json ne obstaja!" -ForegroundColor Red
    Write-Host "Ustvarjam primer config.json..." -ForegroundColor Yellow
    
    $config = @{
        mcpServers = @{
            "desktop-commander" = @{
                command = "npx"
                args = @("-y", "@wonderwhy-er/desktop-commander")
            }
        }
    }
    
    $config | ConvertTo-Json -Depth 10 | Out-File -FilePath $ConfigPath -Encoding utf8
    Write-Host "✅ Config.json ustvarjen!" -ForegroundColor Green
}

# Preveri ali je port že zaseden
$connection = $null
try {
    $connection = Test-NetConnection -ComputerName localhost -Port $Port -InformationLevel Silent
} catch {
    $connection = $false
}

if ($connection) {
    Write-Host "⚠️ Port $Port je že zaseden!" -ForegroundColor Yellow
    Write-Host "Ali želiš ustaviti obstoječi proces? (y/n)" -NoNewline
    $response = Read-Host
    
    if ($response -eq 'y') {
        $process = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue | 
                   Select-Object -ExpandProperty OwningProcess |
                   ForEach-Object { Get-Process -Id $_ -ErrorAction SilentlyContinue }
        
        if ($process) {
            Stop-Process -Id $process.Id -Force
            Write-Host "✅ Proces ustavljen!" -ForegroundColor Green
            Start-Sleep -Seconds 2
        }
    } else {
        Write-Host "❌ Zagon preklican!" -ForegroundColor Red
        exit 1
    }
}

# Zaženi proxy
Write-Host "📡 Zaganjam MCP proxy na portu $Port..." -ForegroundColor Green
Write-Host "Transport: $Transport" -ForegroundColor Green
Write-Host "Config: $ConfigPath" -ForegroundColor Green
Write-Host ""
Write-Host "Pritisni Ctrl+C za zaustavitev" -ForegroundColor Yellow
Write-Host ""

# Zaženi v isti konzoli (da vidiš loge)
npx -y @srbhptl39/mcp-superassistant-proxy@latest `
    --config $ConfigPath `
    --outputTransport $Transport `
    --port $Port
