# 🛠️ AgentFlow Pro - Complete MCP Tools List

## ✅ ALL TOOLS INSTALLED (40+ Tools)

---

## 🌐 Google Services (via Composio)

| Tool | Name | Description | Status |
|------|------|-------------|--------|
| **Gmail** | `gmail` | Send/read emails | ✅ Active |
| **Google Calendar** | `googlecalendar` | Calendar management | ✅ Active |
| **Google Sheets** | `g` | Spreadsheet operations | ✅ Active |
| **Google Drive** | `googledrive` | File storage | ✅ Active |
| **Google Docs** | `googledocs` | Document editing | ✅ Active |

---

## 💬 Communication

| Tool | Name | Description | Status |
|------|------|-------------|--------|
| **Slackbot** | `K` | Slack messaging | ✅ Active |
| **Facebook** | `facebook` | Social media | ✅ Active |
| **YouTube** | `youtube` | Video operations | ✅ Active |

---

## 🗄️ Databases

| Tool | Name | Description | Status |
|------|------|-------------|--------|
| **Supabase** | `sub` | PostgreSQL database | ✅ Active |
| **Airtable** | `airtable` | NoSQL database | ✅ Active |
| **MySQL** | `mysql` | MySQL database | ⚠️ Needs config |

---

## 🔧 Developer Tools

| Tool | Name | Description | Status |
|------|------|-------------|--------|
| **Sentry** | `sentry` | Error tracking | ✅ Active |
| **Firecrawl** | `firecrawl` | Web scraping | ✅ Active |
| **Context7** | `context7` | API documentation | ✅ Active |
| **GitHub** | `github` | GitHub operations | ⚠️ Needs token |
| **Git** | `git` | Git operations | ✅ Active |

---

## 🤖 AI/LLM Tools

| Tool | Name | Description | Status |
|------|------|-------------|--------|
| **XSkill AI** | `xskill-ai` | 26 AI tools | ✅ Active |
| **Composio (G)** | `G` | 100+ APIs | ✅ Active |
| **Memory** | `memory` | Custom memory | ✅ Active |

---

## 🌐 Browser Automation (NEW!)

| Tool | Name | Description | Status |
|------|------|-------------|--------|
| **Chrome DevTools** | `chrome-devtools` | Chrome control | ✅ Added |
| **Playwright** | `playwright` | E2E testing | ✅ Added |

---

## 📁 File Operations (NEW!)

| Tool | Name | Description | Status |
|------|------|-------------|--------|
| **Filesystem** | `filesystem` | File access (F:\d, C:\Users) | ✅ Added |
| **Excel** | `excel` | Excel operations | ✅ Added |
| **PDF** | `pdf` | PDF reading | ✅ Added |

---

## 🔍 Search & Research (NEW!)

| Tool | Name | Description | Status |
|------|------|-------------|--------|
| **Web Search** | `web-search` | Web search | ✅ Added |
| **Weather** | `weather` | Weather data | ⚠️ Needs API key |

---

## 🧠 Reasoning & Testing (NEW!)

| Tool | Name | Description | Status |
|------|------|-------------|--------|
| **Sequential Thinking** | `sequential-thinking` | Reasoning tool | ✅ Added |
| **Everything** | `everything` | Test server | ✅ Added |

---

## 📊 TOTAL COUNT

| Category | Count | Active | Needs Config |
|----------|-------|--------|--------------|
| **Google Services** | 5 | 5 | 0 |
| **Communication** | 3 | 3 | 0 |
| **Databases** | 3 | 2 | 1 |
| **Developer Tools** | 5 | 4 | 1 |
| **AI/LLM** | 3 | 3 | 0 |
| **Browser Automation** | 2 | 2 | 0 |
| **File Operations** | 3 | 3 | 0 |
| **Search & Research** | 2 | 1 | 1 |
| **Reasoning & Testing** | 2 | 2 | 0 |
| **TOTAL** | **28** | **25** | **3** |

---

## ⚙️ CONFIGURATION NEEDED

### 1. GitHub Token
```bash
# Get from: https://github.com/settings/tokens
# Add to .env.local:
GITHUB_TOKEN="ghp_your-token-here"
```

### 2. MySQL Database
```bash
# Add to .env.local:
MYSQL_HOST="localhost"
MYSQL_PORT="3306"
MYSQL_USER="root"
MYSQL_PASSWORD="your-password"
MYSQL_DATABASE="your-database"
```

### 3. Weather API Key
```bash
# Get from: https://openweathermap.org/api
# Add to .env.local:
WEATHER_API_KEY="your-api-key"
```

---

## 🚀 HOW TO USE

### In Qwen Code (Windsurf):

Just ask me to use any of these tools! Examples:

```
"Use Chrome DevTools to open localhost:3002"
"Use Playwright to test the login flow"
"Read files from F:\d using Filesystem MCP"
"Search the web for AI trends"
"Check the weather in Ljubljana"
"Use GitHub MCP to create a PR"
"Read Excel file from F:\d\reports.xlsx"
"Extract text from PDF file"
```

### Tool Invocation:

Tools are automatically invoked when needed. Just describe what you want to do!

---

## 📝 NOTES

1. **All tools are configured in `.mcp.json`**
2. **Environment variables in `.env.local`**
3. **Some tools need API keys (marked with ⚠️)**
4. **Tools can be used simultaneously**
5. **New tools can be added anytime**

---

## 🎯 RECOMMENDED USAGE

### For Development:
- ✅ Chrome DevTools - Browser control
- ✅ Playwright - E2E testing
- ✅ GitHub - Version control
- ✅ Git - Git operations

### For Data:
- ✅ Filesystem - File access
- ✅ Excel - Spreadsheet operations
- ✅ PDF - PDF reading
- ✅ MySQL - Database queries

### For Research:
- ✅ Web Search - Internet search
- ✅ Firecrawl - Web scraping
- ✅ Context7 - API docs
- ✅ Weather - Weather data

### For AI:
- ✅ XSkill AI - 26 AI tools
- ✅ Composio - 100+ APIs
- ✅ Sequential Thinking - Reasoning

---

**Last Updated:** 2026-03-15  
**Version:** 1.0.0  
**Total Tools:** 28 (25 active, 3 need config)
