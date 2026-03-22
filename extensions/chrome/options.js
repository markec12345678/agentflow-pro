chrome.storage.local.get(["apiBase", "apiKey"], (r) => {
  document.getElementById("apiBase").value = r.apiBase || "https://agentflow-pro-seven.vercel.app";
  document.getElementById("apiKey").value = r.apiKey || "";
});

document.getElementById("save").addEventListener("click", () => {
  const apiBase = document.getElementById("apiBase").value.trim();
  const apiKey = document.getElementById("apiKey").value.trim();
  chrome.storage.local.set({ apiBase, apiKey }, () => {
    alert("Saved.");
  });
});
