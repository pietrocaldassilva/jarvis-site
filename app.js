(() => {
  // SHA-256("jarvis-acesso") — só destrava o guia no site; não libera o código-fonte.
  const EXPECTED =
    "20c84f11a56f0edcc9c44c7755b54ecbe633a7c8f5a55e4741265483847656bc";
  const STORAGE = "jarvis_site_ok_v1";

  const gate = document.getElementById("gate");
  const unlocked = document.getElementById("unlocked");
  const input = document.getElementById("siteKey");
  const msg = document.getElementById("gateMsg");

  async function sha256(text) {
    const data = new TextEncoder().encode(text);
    const buf = await crypto.subtle.digest("SHA-256", data);
    return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
  }

  function showUnlocked() {
    if (gate) gate.hidden = true;
    if (unlocked) unlocked.hidden = false;
    document.querySelectorAll("[data-needs-key]").forEach((el) => el.classList.add("is-open"));
  }

  function showLocked() {
    document.querySelectorAll("[data-needs-key]").forEach((el) => el.classList.remove("is-open"));
  }

  async function tryUnlock(raw) {
    const got = await sha256(String(raw || "").trim());
    if (got === EXPECTED) {
      sessionStorage.setItem(STORAGE, "1");
      showUnlocked();
      if (msg) msg.textContent = "Ok.";
      return;
    }
    if (msg) msg.textContent = "Chave incorreta.";
  }

  document.getElementById("btnUnlock")?.addEventListener("click", () => tryUnlock(input?.value));
  input?.addEventListener("keydown", (ev) => {
    if (ev.key === "Enter") tryUnlock(input.value);
  });

  if (sessionStorage.getItem(STORAGE) === "1") showUnlocked();
  else showLocked();
})();
