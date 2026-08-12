(() => {
  const script = document.currentScript;
  if (!script) return;

  const origin = new URL(script.src).origin;
  const position = script.dataset.position === "left" ? "left" : "right";
  const label = script.dataset.label || "Falar com a Nura";
  const accent = script.dataset.accent || "#171411";

  const root = document.createElement("div");
  root.id = "nura-widget-root";
  root.style.cssText = "position:fixed;z-index:2147483000;bottom:20px;" + position + ":20px;font-family:Inter,Arial,sans-serif;";

  const frame = document.createElement("iframe");
  frame.src = `${origin}/?embed=1`;
  frame.title = "Nura - Consultora de Perfumes";
  frame.setAttribute("loading", "lazy");
  frame.setAttribute("allow", "microphone");
  frame.style.cssText = `display:none;width:min(420px,calc(100vw - 18px));height:min(720px,calc(100dvh - 86px));border:0;border-radius:22px;box-shadow:0 24px 70px rgba(0,0,0,.24);background:#fff;margin-bottom:12px;`;

  const button = document.createElement("button");
  button.type = "button";
  button.setAttribute("aria-label", label);
  button.style.cssText = `margin-left:auto;display:flex;align-items:center;gap:10px;border:0;border-radius:999px;padding:11px 16px 11px 11px;background:${accent};color:#fff;box-shadow:0 12px 30px rgba(0,0,0,.18);font-weight:650;cursor:pointer;`;
  button.innerHTML = `<span style="width:32px;height:32px;border-radius:50%;display:grid;place-items:center;background:#a47b43;font-family:Georgia,serif;font-size:17px">N</span><span>${label}</span>`;

  let open = false;
  button.addEventListener("click", () => {
    open = !open;
    frame.style.display = open ? "block" : "none";
    button.querySelector("span:last-child").textContent = open ? "Fechar atendimento" : label;
  });

  root.append(frame, button);
  document.body.appendChild(root);
})();
