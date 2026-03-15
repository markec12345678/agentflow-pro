$windsurfConfigPath = "$env:USERPROFILE\.windsurf\config.json"

$json = @'
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "F:\\d\\MCP-SuperAssistant", "F:\\ffff\\agentflow-pro"],
      "disabled": false
    },
    "memory": {
      "command": "node",
      "args": ["F:\\ffff\\agentflow-pro\\src\\memory\\mcp-server.js"],
      "disabled": false
    },
    "context7": {
      "command": "npx",
      "args": ["-y", "context7-mcp"],
      "disabled": false
    },
    "browsermcp": {
      "command": "npx",
      "args": ["-y", "@browsermcp/mcp"],
      "disabled": false
    }
  }
}
'@

if (Test-Path $windsurfConfigPath) {
    Write-Host "Config exists, backing up..."
    Copy-Item $windsurfConfigPath "$windsurfConfigPath.backup" -Force
}

$json | Out-File -FilePath $windsurfConfigPath -Encoding UTF8
Write-Host "MCP config created at: $windsurfConfigPath"
Write-Host "Restart Windsurf to load MCP servers!"
