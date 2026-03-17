# 🔧 QWEN-AGENT FIX - Pydantic Validation Error

**Napaka:** `Field required [type=missing, input_value={'model_server': 'http://...Y', 'llm': 'qwen2.5:7b'}]`

**Vzrok:** Manjka required field v ServerConfig

---

## ✅ REŠITEV

### **Opcija 1: Dodaj missing field v run_server.py**

**Uredi `run_server.py` okoli line 115:**

```python
# Pred (napačno):
server=ServerConfig(
    server_host='127.0.0.1',
    fast_api_port=7866,
    app_in_browser_port=7863,
    workstation_port=7864,
    model_server='dashscope',
    api_key='',
    llm='qwen-plus',
    max_ref_token=4000,
    max_days=7
)

# Po (pravilno):
server=ServerConfig(
    server_host='127.0.0.1',
    fast_api_port=7866,
    app_in_browser_port=7863,
    workstation_port=7864,
    model_server='dashscope',
    api_key='',
    llm='qwen-plus',
    max_ref_token=4000,
    max_days=7,
    work_space_root='workspace/',  # DODANO
    download_root='workspace/download/',  # DODANO
    code_interpreter_ws='workspace/tools/code_interpreter/'  # DODANO
)
```

---

### **Opcija 2: Uporabi PathConfig**

**Uredi `run_server.py`:**

```python
from qwen_agent.utils import PathConfig, ServerConfig

path = PathConfig(
    work_space_root='workspace/',
    download_root='workspace/download/',
    code_interpreter_ws='workspace/tools/code_interpreter/'
)

server = ServerConfig(
    server_host='127.0.0.1',
    fast_api_port=7866,
    app_in_browser_port=7863,
    workstation_port=7864,
    model_server='dashscope',
    api_key='',
    llm='qwen-plus',
    max_ref_token=4000,
    max_days=7
)

# Dodaj path v logger config
logger_config = {'path': path, 'server': server}
```

---

### **Opcija 3: Najenostavneje - Zaženi brez GUI**

```bash
cd F:\d\MCP-SuperAssistant\Qwen-Agent\Qwen-Agent
python -c "
from qwen_agent import Agent
agent = Agent(model='qwen2.5:7b')
response = agent.run('Pozdrav! Kako ti lahko pomagam?')
print(response)
"
```

---

## 🚀 HITRI ZAČETEK

**Najboljše:** Uporabi direct Python brez serverja:

```bash
cd F:\d\MCP-SuperAssistant\Qwen-Agent\Qwen-Agent

# Test 1: Basic chat
python -c "from qwen_agent import Agent; a = Agent(); print(a.run('Test'))"

# Test 2: Z localnim modelom
python -c "from qwen_agent import Agent; a = Agent(model='qwen2.5:7b'); print(a.run('Pozdrav'))"

# Test 3: Z dashscope (če imaš API key)
python -c "import os; os.environ['DASHSCOPE_API_KEY']='sk-xxx'; from qwen_agent import Agent; a = Agent(); print(a.run('Test'))"
```

---

**Izberi opcijo in bom ustvaril fix! 🤖**
