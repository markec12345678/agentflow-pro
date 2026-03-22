/**
 * AgentFlow Pro - Chrome extension content script
 * Captures selected text for use in popup generation.
 * Selection is read via chrome.scripting.executeScript in popup.
 */
(function () {
  document.addEventListener("mouseup", () => {
    const sel = window.getSelection?.();
    if (!sel || sel.isCollapsed) return;
    const text = sel.toString().trim();
    if (text.length > 0) {
      chrome.runtime.sendMessage?.({ type: "selection", text }).catch(() => { });
    }
  });
})();
