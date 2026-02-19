document.getElementById("generate").addEventListener("click", async () => {
  const output = document.getElementById("output");
  const btn = document.getElementById("generate");
  const topic = document.getElementById("topic").value.trim();
  output.textContent = "";
  output.classList.remove("error");

  const { apiBase, apiKey } = await chrome.storage.local.get(["apiBase", "apiKey"]);
  if (!apiBase || !apiKey) {
    output.textContent = "Set API base URL and API key in extension options first.";
    output.classList.add("error");
    return;
  }

  btn.disabled = true;
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => window.getSelection?.()?.toString()?.trim() ?? "",
    });
    const selectedText = results?.[0]?.result ?? "";
    const prompt = topic || "Expand and improve this content for a blog post.";
    const textToUse = selectedText || prompt;

    const res = await fetch(`${apiBase.replace(/\/$/, "")}/api/v1/generate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        topic: textToUse,
        format: "blog",
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error ?? "Generation failed");
    }
    output.textContent = data.content ?? data.blog ?? data.text ?? JSON.stringify(data);
  } catch (e) {
    output.textContent = e instanceof Error ? e.message : "Failed";
    output.classList.add("error");
  } finally {
    btn.disabled = false;
  }
});

document.getElementById("openApp").addEventListener("click", async () => {
  const { apiBase } = await chrome.storage.local.get(["apiBase"]);
  const base = apiBase || "https://agentflow-pro-seven.vercel.app";
  chrome.tabs.create({ url: base.replace(/\/api.*$/, "").replace(/\/$/, "") });
});
