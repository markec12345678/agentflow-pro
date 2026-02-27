#!/usr/bin/env pwsh

# Page Builder Deployment Script

Write-Host "🚀 Starting Page Builder deployment..."

# Build the application
Write-Host "📦 Building Next.js application..."
$buildResult = npm run build 2>&1

if ($LASTEXITCODE -eq 0) {
  Write-Host "✅ Build successful!"
} else {
  Write-Host "❌ Build failed with exit code $LASTEXITCODE"
  exit 1
}

# Start the application in development mode
Write-Host "🚀 Starting Page Builder in development mode..."
npm run dev

# Function to check if port is in use
function Test-Port {
  param(
    [Parameter(Mandatory=$true)]
    [string]$Port
  )
  
  process {
    $ErrorActionPreference = "Stop"
    $ErrorView = "Normal"
  }
  
  try {
    $socket = New-Object System.Net.Sockets.TcpClient
    $socket.Connect("localhost", 3000)
    $socket.Close()
    Write-Host "Port 3000 is in use"
    return $true
  } catch {
    Write-Host "Port 3000 is not in use"
    return $false
  }
}

# Wait for port to be available
$timeout = 0
while ($timeout -lt 10) {
  if (Test-Port -Port 3000) {
    Write-Host "Port 3000 is available, starting browser..."
    break
  }
  Start-Sleep -Seconds 1
  $timeout++
}

# Open browser
Write-Host "🌐 Opening Page Builder in browser..."
if (Get-Command pwsh -Command "Get-Command" -ErrorAction SilentlyContinue) {
  Start-Process "http://localhost:3002"
} else {
  Start-Process "http://localhost:3002"
}

Write-Host "🎉 Deployment complete!"
