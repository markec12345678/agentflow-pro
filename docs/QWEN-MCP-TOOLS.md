# 🤖 MCPHUBZ + QWEN-AGENT INTEGRACIJA

**Datum:** 2026-03-17
**Status:** ✅ Ustvarjeno

---

## 📂 KREIRANE DATOTEKE

### **1. Qwen Chat Tool**
**Lokacija:** `F:\d\MCP-SuperAssistant\Qwen-Agent\Qwen-Agent\workspace\tools\qwen_chat.py`

**Funkcija:** Chat z Qwen-Agent preko MCP

```python
from qwen_agent import Agent

def qwen_chat(message: str, model: str = 'qwen2.5:7b'):
    """
    Chat with Qwen-Agent
    
    Args:
        message: Your message
        model: Model to use (default: qwen2.5:7b)
    
    Returns:
        Qwen response
    """
    agent = Agent(model=model)
    response = agent.run(message)
    return {"response": response}

# Test
if __name__ == "__main__":
    result = qwen_chat("Pozdrav! Kako si?")
    print(result)
```

---

### **2. Qwen Health Check**
**Lokacija:** `F:\d\MCP-SuperAssistant\Qwen-Agent\Qwen-Agent\workspace\tools\qwen_health.py`

**Funkcija:** Preveri če Qwen-Agent dela

```python
def check_qwen_health():
    """Check if Qwen-Agent is working"""
    try:
        from qwen_agent import Agent
        agent = Agent(model='qwen2.5:7b')
        return {
            "status": "OK",
            "model": "qwen2.5:7b",
            "message": "Qwen-Agent is working!"
        }
    except Exception as e:
        return {
            "status": "ERROR",
            "error": str(e)
        }
```

---

### **3. Test Script**
**Lokacija:** `F:\d\MCP-SuperAssistant\Qwen-Agent\Qwen-Agent\test_qwen_mcp.py`

**Funkcija:** Testira vse Qwen-MCP integracije

```python
#!/usr/bin/env python
"""Test Qwen-Agent MCP Tools"""

print("🔍 Testing Qwen-Agent MCP Tools...\n")

# Test 1: Health Check
print("1️⃣ Health Check:")
from workspace.tools.qwen_health import check_qwen_health
health = check_qwen_health()
print(f"   Status: {health['status']}")
if health['status'] == 'OK':
    print(f"   ✅ Model: {health['model']}")
else:
    print(f"   ❌ Error: {health['error']}")

# Test 2: Chat
print("\n2️⃣ Chat Test:")
from workspace.tools.qwen_chat import qwen_chat
response = qwen_chat("Pozdrav! Reci samo 'Deluje!'")
print(f"   Response: {response['response']}")

print("\n✅ Vsi testi končani!")
```

---

## AGON TESTNIH ORODIJ

### **1. Health Check:**
```bash
cd F:\d\MCP-SuperAssistant\Qwen-Agent\Qwen-Agent
python workspace\tools\qwen_health.py
```

### **2. Chat Test:**
```bash
python workspace\tools\qwen_chat.py
```

### **3. Full Test:**
```bash
python test_qwen_mcp.py
```

---

## 🔗 POVEZAVA Z MCPHUBZ

### **Korak 1: Odpri MCPHubz**
```
http://localhost:3000
```

### **Korak 2: Dodaj Qwen-Agent MCP Server**

V MCPHubz UI:
1. Click "Add MCP Server"
2. Name: `Qwen-Agent`
3. Command: `python`
4. Args: `F:\d\MCP-SuperAssistant\Qwen-Agent\Qwen-Agent\workspace\tools\qwen_chat.py`
5. Save

### **Korak 3: Testiraj Orodja**

V MCPHubz:
- Click "Tools" tab
- Izberi "qwen_chat"
- Vnesi message: "Pozdrav!"
- Click "Run"
- Vidi odgovor!

---

## 📊 KAJ LAHKO POČNEMO

### **1. Chat z Qwen:**
```python
qwen_chat("Napiši kratek opis hotela")
```

### **2. Content Generation:**
```python
qwen_chat("Generate hotel description for Bled, Slovenia")
```

### **3. Code Generation:**
```python
qwen_chat("Write Python function to calculate tourist tax")
```

### **4. Document Analysis:**
```python
# Upload document in MCPHubz
qwen_chat("Summarize this document")
```

---

## ✅ VERIFICATION CHECKLIST

```
□ Qwen-Agent health check works
□ Chat tool responds
□ MCPHubz can see Qwen tools
□ Can run qwen_chat from MCPHubz UI
□ Responses are correct
□ No errors in console
```

---

**Vse pripravljeno za testiranje! 🚀**

*Created: 2026-03-17*
*Next: Run test_qwen_mcp.py*
