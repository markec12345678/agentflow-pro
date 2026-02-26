#!/usr/bin/env pwsh

# Page Builder Deployment Script

echo "🚀 Starting Page Builder deployment..."

# Build the application
echo "📦 Building Next.js application..."
npm run build

if ($LASTEXITCODE -eq 0); then
  echo "✅ Build successful!"
  
  # Start the application in development mode
  echo "🚀 Starting Page Builder in development mode..."
  npm run dev
  
  # Open browser
  echo "🌐 Opening Page Builder in browser..."
  start http://localhost:3000
  
  # Open browser with PowerShell (Windows fallback)
  if (Get-Command pwsh -Command "Get-Command" -ErrorAction SilentlyContinue)) {
    echo "🌐 Opening Page Builder in browser (PowerShell)..."
    Start-Process "http://localhost:3000"
  }
  
  echo "🎉 Deployment complete!"
else
  echo "❌ Build failed!"
  exit 1
fi
