# 🚀 MCP SuperAssistant - Popolna Konfiguracija

## 📋 Kazalo

1. [Auto-Execute Nastavitev](#auto-execute-nastavitev)
2. [Config.json za Dodatna Orodja](#configjson-za-dodatna-orodja)
3. [Kako Uporabljati Orodja](#kako-uporabljati-orodja)
4. [Skripte za Avtomatizacijo](#skripte-za-avtomatizacijo)
5. [Debugiranje Težav](#debugiranje-težav)

---

## ⚡ Auto-Execute Nastavitev

### Kje je Auto-Execute?

**Trenutna verzija (v0.6.0)** nima UI toggle-a za Auto-Execute v sidebarju.

### Rešitev - Dve Možnosti:

#### **Možnost A: Ročni Klik (Trenutno Deluje)**

1. Odpri ChatGPT/Perplexity/Gemini
2. MCP sidebar je odprt desno
3. Ko AI generira tool call, klikni **"RUN"** gumb
4. Rezultat se prikaže v sidebaru
5. Klikni **"Insert"** da dodaš rezultat v chat

#### **Možnost B: Ročna Aktivacija z MCP Instructions**

V sidebaru odpri **"Instructions"** tab in kopiraj to v ChatGPT:

```
## MCP Desktop Commander - Navodila

Imaš dostop do Desktop Commander MCP orodij. Ko želiš uporabiti orodje:

1. Generiraj tool call v tem formatu:
{"type": "function_call_start", "name": "read_file", "call_id": 1}
{"type": "description", "Preberi datoteko"}
{"type": "parameter", "key": "path", "value": "F:\\d\\test.txt"}
{"type": "function_call_end", "call_id": 1}

2. Uporabnik bo videl tool call v MCP sidebaru
3. Uporabnik klikne RUN za izvedbo
4. Rezultat se vrne v ta chat

Dostopne mape:
- F:\d\ - Glavna mapa
- F:\ffff\agentflow-pro\ - AgentFlow projekt

Primeri ukazov:
- "Preberi F:\d\MCP-SuperAssistant\package.json"
- "Izpiši mapo F:\d\MCP-SuperAssistant"
- "Ustvari mapo F:\d\nov-projekt"
```

---

## 🛠️ Config.json za Dodatna Orodja

### Primer Config.json:

```json
{
  "mcpServers": {
    "desktop-commander": {
      "command": "npx",
      "args": ["-y", "@wonderwhy-er/desktop-commander"]
    },
    "filesystem": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-filesystem",
        "F:\\d",
        "F:\\ffff"
      ]
    },
    "firecrawl": {
      "command": "npx",
      "args": ["-y", "firecrawl-mcp"],
      "env": { "FIRECRAWL_API_KEY": "tvoj-ključ" }
    }
  }
}
```

### Kako Dodati Novo Orodje:

1. Ustvari config.json v `F:\d\MCP-SuperAssistant\config.json`
2. Dodaj MCP server po zgornjem primeru
3. Zaženi proxy server: `npx -y @srbhptl39/mcp-superassistant-proxy@latest --config ./config.json --outputTransport sse`
4. V MCP sidebaru nastavi URL na `http://localhost:3006/sse`
5. Klikni Connect

---

## 🎯 Kako Uporabljati Orodja

### Primeri:

**Preberi datoteko:**

```
Preberi datoteko: F:\d\MCP-SuperAssistant\README.md
```

**Izpiši mapo:**

```
Kaj je v mapi: F:\d\MCP-SuperAssistant
```

**Ustvari mapo:**

```
Ustvari mapo: F:\d\nov-projekt\src
```

**Zaženi ukaz:**

```
Zaženi: npm install v F:\d\MCP-SuperAssistant
```

---

## 🤖 Skripte za Avtomatizacijo

### 1. PowerShell - Zagon Proxyja

**Datoteka:** `F:\d\MCP-SuperAssistant\start-proxy.ps1`

```powershell
$ErrorActionPreference = "Stop"
Write-Host "🚀 MCP SuperAssistant Proxy" -ForegroundColor Cyan
npx -y @srbhptl39/mcp-superassistant-proxy@latest --config ./config.json --outputTransport sse --port 3006
```

**Uporaba:**

```powershell
cd F:\d\MCP-SuperAssistant
.\start-proxy.ps1
```

### 2. Batch - Hitri Zagon

**Datoteka:** `F:\d\MCP-SuperAssistant\start.bat`

```batch
@echo off
echo MCP SuperAssistant - Quick Start
echo.
echo 1. Development Mode (pnpm dev)
echo 2. Build Production (pnpm build)
echo 3. Start MCP Proxy
echo.
set /p choice="Izbira: "
if "%choice%"=="1" pnpm dev
if "%choice%"=="2" pnpm build
if "%choice%"=="3" powershell -ExecutionPolicy Bypass -File start-proxy.ps1
pause
```

---

## 🐛 Debugiranje Težav

### Extension Ne Detektira Tool Call-ov:

1. Restartaj extension: chrome://extensions/ → Refresh
2. Preveri console loge: F12 → Console → Filter "MCP"
3. Ponovno poveži server v sidebaru

### Tool Execution Fails:

```powershell
# Preveri ali proxy teče
Get-NetTCPConnection -LocalPort 3006 -ErrorAction SilentlyContinue

# Če ne teče:
.\start-proxy.ps1

# Počisti cache:
pnpm clean:install
```

### Connection Issues:

```powershell
# Preveri port
Test-NetConnection -ComputerName localhost -Port 3006

# Ustavi obstoječi proces in restartaj
.\start-proxy.ps1
```

---

## 📞 Hitra Pomoč

```powershell
# Zaženi proxy
.\start-proxy.ps1

# Preveri status
Get-NetTCPConnection -LocalPort 3006

# Restartaj extension
# chrome://extensions/ → Refresh ikona

# Počisti cache
pnpm clean:install
```

---

**Več informacij:** https://mcpsuperassistant.ai/
