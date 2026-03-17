# 🔗 QWEN-AGENT LOKALNA POVEZAVA

**Cilj:** Povezati AgentFlow Pro z obstoječo Qwen-Agent instanco na `F:\d\MCP-SuperAssistant\Qwen-Agent\Qwen-Agent`

---

## 📋 PREDHODNA PREVERBA

### **1. Preveri če Qwen-Agent deluje:**

```bash
cd F:\d\MCP-SuperAssistant\Qwen-Agent\Qwen-Agent
python -c "import qwen_agent; print('Qwen-Agent OK')"
```

### **2. Preveri port:**

```bash
# Default port za Qwen-Agent
netstat -ano | findstr :8000
# Ali drug port ki ga uporabljaš
```

---

## 🔧 INTEGRACIJSKE OPCIJE

### **OPCIJA 1: MCP Protocol (Najboljše)**

**Korak 1: Dodaj MCP server v AgentFlow Pro**

Ustvari `F:\d\MCP-SuperAssistant\Qwen-Agent\Qwen-Agent\mcp-server.py`:

```python
"""
Qwen-Agent MCP Server for AgentFlow Pro
"""
from mcp.server import Server
from mcp.server.stdio import stdio_server
from qwen_agent import Agent

server = Server("qwen-agent")

agent = Agent(
    model="qwen-max",
    system_message="You are a helpful AI assistant for AgentFlow Pro"
)

@server.call_tool()
async def qwen_chat(name: str, arguments: dict) -> list:
    """Chat with Qwen-Agent"""
    message = arguments.get("message", "")
    response = agent.run(message)
    return [{"type": "text", "text": response}]

@server.list_tools()
async def list_tools() -> list:
    return [
        {
            "name": "qwen_chat",
            "description": "Chat with Qwen-Agent",
            "inputSchema": {
                "type": "object",
                "properties": {
                    "message": {"type": "string"}
                }
            }
        }
    ]

async def main():
    async with stdio_server() as (read_stream, write_stream):
        await server.run(read_stream, write_stream)

if __name__ == "__main__":
    import asyncio
    asyncio.run(main())
```

**Korak 2: Dodaj MCP config v AgentFlow Pro**

Posodobi `.mcp.json` v `f:\ffff\agentflow-pro\.mcp.json`:

```json
{
  "mcpServers": {
    "qwen-agent": {
      "command": "python",
      "args": [
        "F:\\d\\MCP-SuperAssistant\\Qwen-Agent\\Qwen-Agent\\mcp-server.py"
      ],
      "cwd": "F:\\d\\MCP-SuperAssistant\\Qwen-Agent\\Qwen-Agent",
      "env": {
        "PYTHONPATH": "F:\\d\\MCP-SuperAssistant\\Qwen-Agent\\Qwen-Agent"
      }
    }
  }
}
```

**Korak 3: Restartaj AgentFlow Pro**

```bash
cd f:\ffff\agentflow-pro
# Restart Windsurf ali VSCode
```

---

### **OPCIJA 2: HTTP API (Enostavnejše)**

**Korak 1: Zaženi Qwen-Agent API server:**

```bash
cd F:\d\MCP-SuperAssistant\Qwen-Agent\Qwen-Agent
python -m qwen_agent.server --port 8000
```

**Korak 2: Ustvari API client v AgentFlow Pro:**

Ustvari `f:\ffff\agentflow-pro\src\lib\ai\qwen-client.ts`:

```typescript
/**
 * Qwen-Agent Local API Client
 */

const QWEN_API_URL = process.env.QWEN_API_URL || 'http://localhost:8000';

export interface QwenChatOptions {
  message: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

export async function qwenChat(options: QwenChatOptions): Promise<string> {
  const response = await fetch(`${QWEN_API_URL}/v1/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: options.model || 'qwen-max',
      messages: [
        {
          role: 'user',
          content: options.message,
        },
      ],
      temperature: options.temperature || 0.7,
      max_tokens: options.maxTokens || 2048,
    }),
  });

  if (!response.ok) {
    throw new Error(`Qwen API error: ${response.statusText}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

export async function qwenStream(
  options: QwenChatOptions,
  onChunk: (chunk: string) => void
): Promise<void> {
  const response = await fetch(`${QWEN_API_URL}/v1/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: options.model || 'qwen-max',
      messages: [
        {
          role: 'user',
          content: options.message,
        },
      ],
      stream: true,
    }),
  });

  const reader = response.body?.getReader();
  if (!reader) throw new Error('No reader');

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    
    const chunk = new TextDecoder().decode(value);
    const lines = chunk.split('\n');
    
    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = JSON.parse(line.slice(6));
        if (data.choices?.[0]?.delta?.content) {
          onChunk(data.choices[0].delta.content);
        }
      }
    }
  }
}
```

**Korak 3: Dodaj environment variable:**

V `.env.local`:
```bash
QWEN_API_URL=http://localhost:8000
```

**Korak 4: Uporabi v AI Agentih:**

```typescript
// f:\ffff\agentflow-pro\src\lib\ai\agents\research-agent.ts
import { qwenChat } from '@/lib/ai/qwen-client';

export async function researchAgent(query: string) {
  const response = await qwenChat({
    message: `Research: ${query}`,
    temperature: 0.3,
  });
  return response;
}
```

---

### **OPCIJA 3: Direct Import (Najhitrejše)**

**Korak 1: Dodaj Qwen-Agent kot dependency:**

```bash
cd f:\ffff\agentflow-pro
npm install -D qwen-agent
# Or use existing Python env
```

**Korak 2: Ustvari Python bridge:**

Ustvari `f:\ffff\agentflow-pro\src\lib\ai\qwen-bridge.py`:

```python
import sys
import json
from qwen_agent import Agent

def chat(message: str, model: str = "qwen-max"):
    agent = Agent(model=model)
    response = agent.run(message)
    print(json.dumps({"response": response}))

if __name__ == "__main__":
    message = sys.argv[1]
    model = sys.argv[2] if len(sys.argv) > 2 else "qwen-max"
    chat(message, model)
```

**Korak 3: Uporabi v TypeScript:**

```typescript
// f:\ffff\agentflow-pro\src\lib\ai\qwen-bridge.ts
import { spawn } from 'child_process';
import path from 'path';

export async function qwenBridge(message: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const pythonProcess = spawn('python', [
      path.join(__dirname, 'qwen-bridge.py'),
      message,
      'qwen-max'
    ]);

    let output = '';
    pythonProcess.stdout.on('data', (data) => {
      output += data.toString();
    });

    pythonProcess.on('close', (code) => {
      if (code === 0) {
        const result = JSON.parse(output);
        resolve(result.response);
      } else {
        reject(new Error(`Python error: ${output}`));
      }
    });
  });
}
```

---

## 🚀 PRIPOROČENA METODA

**Uporabi OPCIJO 2 (HTTP API)** ker:

✅ **Najenostavnejša** - samo API calli
✅ **Brez dodatnih dependencies** - Qwen-Agent že deluje
✅ **Language agnostic** - dela s TypeScript/Python
✅ **Easy debugging** - vidiš vse requeste
✅ **Scalable** - lahko premakneš na drug server

---

## 📋 HITRI ZAČETEK (5 minut)

### **1. Zaženi Qwen-Agent API:**
```bash
cd F:\d\MCP-SuperAssistant\Qwen-Agent\Qwen-Agent
python -m qwen_agent.server --port 8000
```

### **2. Testiraj API:**
```bash
curl http://localhost:8000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "qwen-max",
    "messages": [{"role": "user", "content": "Hello!"}]
  }'
```

### **3. Dodaj v AgentFlow Pro:**
```bash
# V .env.local dodaj:
QWEN_API_URL=http://localhost:8000
```

### **4. Uporabi:**
```typescript
import { qwenChat } from '@/lib/ai/qwen-client';

const response = await qwenChat({
  message: "Generate hotel description",
  temperature: 0.7,
});
```

---

## 🔍 TROUBLESHOOTING

### **Qwen-Agent se ne zažene:**
```bash
# Preveri Python env
cd F:\d\MCP-SuperAssistant\Qwen-Agent\Qwen-Agent
python -c "import qwen_agent; print(qwen_agent.__version__)"
```

### **Port zaseden:**
```bash
# Najdi in ubij proces
netstat -ano | findstr :8000
taskkill /F /PID <PID>
```

### **API ne deluje:**
```bash
# Testiraj z curl
curl http://localhost:8000/health
```

---

## ✅ VERIFICATION CHECKLIST

```
□ Qwen-Agent API running on port 8000
□ API responds to /v1/chat/completions
□ .env.local has QWEN_API_URL
□ qwen-client.ts created in AgentFlow Pro
□ Test call successful
□ Integrated in AI agents
```

---

**Izberi metodo in bom ustvaril vse potrebne datoteke! 🚀**

*Created: 2026-03-16*
*Target: Connect to existing Qwen-Agent without reinstalling*
