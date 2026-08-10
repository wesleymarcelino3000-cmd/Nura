const chat = document.querySelector("#chat");
const form = document.querySelector("#composer");
const input = document.querySelector("#input");
const sendBtn = document.querySelector("#sendBtn");
const typing = document.querySelector("#typing");
const resetBtn = document.querySelector("#resetBtn");
const modeBanner = document.querySelector("#modeBanner");

const params = new URLSearchParams(location.search);
if (params.get("embed") === "1") document.body.classList.add("embed");

let catalog = [];
let messages = [];
let busy = false;

const initialAssistant = "Oi 😊 É um prazer te receber. Para começar bem: o perfume é para você ou para presentear alguém?";

async function loadCatalog() {
  try {
    const response = await fetch("/api/catalog", { headers: { accept: "application/json" } });
    if (!response.ok) throw new Error("API catalog indisponível");
    const data = await response.json();
    return Array.isArray(data.items) ? data.items : [];
  } catch {
    try {
      return await fetch("/catalog.json").then(r => r.json());
    } catch {
      return [];
    }
  }
}

async function init() {
  catalog = await loadCatalog();
  const saved = sessionStorage.getItem("nuraConversation");

  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length) {
        messages = parsed;
        chat.innerHTML = "";
        for (const item of messages) {
          appendMessage(item.role, item.text, false);
          if (item.role === "assistant" && Array.isArray(item.recommendationIds)) {
            renderRecommendationCards(item.recommendationIds);
          }
        }
      }
    } catch {}
  }

  if (!messages.length) {
    messages = [{ role: "assistant", text: initialAssistant, recommendationIds: [] }];
  }

  input.focus({ preventScroll: true });
  scrollBottom();
}

function appendMessage(role, text, save = true) {
  const row = document.createElement("div");
  row.className = `message ${role}`;

  if (role === "assistant") {
    const avatar = document.createElement("div");
    avatar.className = "assistant-mini-avatar";
    avatar.textContent = "N";
    row.appendChild(avatar);
  }

  const bubble = document.createElement("div");
  bubble.className = "bubble";
  bubble.textContent = String(text ?? "");
  row.appendChild(bubble);
  chat.appendChild(row);

  if (save) {
    messages.push({ role, text, recommendationIds: [] });
    persist();
  }

  scrollBottom();
}

function renderRecommendationCards(ids = []) {
  const products = ids
    .map(id => catalog.find(product => product.id === id))
    .filter(Boolean)
    .slice(0, 3);

  if (!products.length) return;

  const wrap = document.createElement("div");
  wrap.className = "recommendations";

  for (const product of products) {
    const card = document.createElement("article");
    card.className = "product-card";

    const imageWrap = document.createElement("div");
    imageWrap.className = "product-image-wrap";

    const badge = document.createElement("span");
    badge.className = "product-badge";
    badge.textContent = product.audience || "Perfume árabe";

    const img = document.createElement("img");
    img.src = product.image;
    img.alt = `${product.name}, ${product.brand}`;
    img.loading = "lazy";
    img.referrerPolicy = "no-referrer";
    img.addEventListener("error", () => {
      if (product.fallbackImage && img.src !== new URL(product.fallbackImage, location.href).href) {
        img.src = product.fallbackImage;
      }
    }, { once: true });

    imageWrap.append(img, badge);

    const body = document.createElement("div");
    body.className = "product-body";

    const brand = document.createElement("p");
    brand.className = "product-brand";
    brand.textContent = product.brand;

    const title = document.createElement("h3");
    title.className = "product-title";
    title.textContent = product.name;

    const profile = document.createElement("p");
    profile.className = "product-profile";
    profile.textContent = product.vibe || product.profile;

    const actions = document.createElement("div");
    actions.className = "product-actions";

    const choose = document.createElement("button");
    choose.type = "button";
    choose.className = "choose-product";
    choose.dataset.productChoice = product.id;
    choose.dataset.productName = product.name;
    choose.textContent = "Gostei desse";

    const compare = document.createElement("button");
    compare.type = "button";
    compare.className = "compare-product";
    compare.dataset.productCompare = product.id;
    compare.dataset.productName = product.name;
    compare.textContent = "Quero comparar";

    actions.append(choose, compare);
    body.append(brand, title, profile, actions);
    card.append(imageWrap, body);
    wrap.appendChild(card);
  }

  chat.appendChild(wrap);
  scrollBottom();
}

function persist() {
  sessionStorage.setItem("nuraConversation", JSON.stringify(messages.slice(-30)));
}

function scrollBottom() {
  requestAnimationFrame(() => { chat.scrollTop = chat.scrollHeight; });
}

function setBusy(value) {
  busy = value;
  sendBtn.disabled = value;
  input.disabled = value;
  typing.classList.toggle("hidden", !value);
  if (value) scrollBottom();
  else input.focus({ preventScroll: true });
}

function autoGrow() {
  input.style.height = "auto";
  input.style.height = `${Math.min(input.scrollHeight, 130)}px`;
}
input.addEventListener("input", autoGrow);
input.addEventListener("keydown", event => {
  if (event.key === "Enter" && !event.shiftKey) {
    event.preventDefault();
    form.requestSubmit();
  }
});

document.addEventListener("click", event => {
  const quick = event.target.closest("[data-quick]");
  if (quick && !busy) {
    input.value = quick.dataset.quick;
    form.requestSubmit();
    document.querySelector("#initialChips")?.remove();
    document.querySelector("#introCard")?.remove();
    return;
  }

  const choose = event.target.closest("[data-product-choice]");
  if (choose && !busy) {
    input.value = `Gostei do ${choose.dataset.productName}. Me ajuda a decidir se ele combina mesmo comigo.`;
    form.requestSubmit();
    return;
  }

  const compare = event.target.closest("[data-product-compare]");
  if (compare && !busy) {
    input.value = `Quero comparar o ${compare.dataset.productName} com outra opção que faça sentido para mim.`;
    form.requestSubmit();
  }
});

form.addEventListener("submit", async event => {
  event.preventDefault();
  const text = input.value.trim();
  if (!text || busy) return;

  document.querySelector("#initialChips")?.remove();
  document.querySelector("#introCard")?.remove();

  appendMessage("user", text);
  input.value = "";
  autoGrow();
  setBusy(true);

  const payloadMessages = messages
    .filter(item => item.role === "user" || item.role === "assistant")
    .slice(-18)
    .map(item => ({ role: item.role, text: item.text }));

  try {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ messages: payloadMessages })
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || "API indisponível");

    const reply = data.reply || "Me conta um pouco mais do que você procura.";
    const ids = Array.isArray(data.recommendationIds) ? data.recommendationIds : [];

    setBusy(false);
    appendMessage("assistant", reply);
    messages[messages.length - 1].recommendationIds = ids;
    persist();
    renderRecommendationCards(ids);
    modeBanner.classList.add("hidden");
  } catch (error) {
    const demo = demoReply(text);
    setBusy(false);
    appendMessage("assistant", demo.reply);
    messages[messages.length - 1].recommendationIds = demo.recommendationIds;
    persist();
    renderRecommendationCards(demo.recommendationIds);

    modeBanner.textContent = "Estou em modo demonstração. Assim que a chave da Gemini estiver configurada no Cloudflare, o atendimento usa a IA completa.";
    modeBanner.classList.remove("hidden");
  }
});

resetBtn.addEventListener("click", () => {
  sessionStorage.removeItem("nuraConversation");
  location.reload();
});

function demoReply(text) {
  const t = text.toLowerCase();
  const context = messages.filter(m => m.role === "user").map(m => m.text.toLowerCase()).join(" ");

  if (t.includes("presente")) {
    return { reply: "Consigo te ajudar mesmo sem você saber quais perfumes a pessoa usa. Ela é mais discreta e elegante ou gosta de chegar e ser notada?", recommendationIds: [] };
  }

  if (t.includes("doce") || context.includes("doce")) {
    if (/noite|balada|festa|encontro/.test(t + " " + context)) {
      return { reply: "Para esse clima mais doce e noturno, eu colocaria dois na sua frente: 9 PM e Khamrah. O primeiro é mais jovem e sedutor; o segundo é mais quente e gourmand. Pelo seu jeito, qual dessas duas sensações parece mais você?", recommendationIds: ["afnan-9pm", "lattafa-khamrah"] };
    }
    return { reply: "Doce pode seguir caminhos bem diferentes. Você imagina algo mais jovem e sedutor ou mais quente, cremoso e sofisticado?", recommendationIds: [] };
  }

  if (/marcante|forte|chama atenção/.test(t + " " + context)) {
    return { reply: "Então faz sentido procurar presença, mas sem escolher algo pesado só por ser forte. Você quer usar mais em encontros e festas ou também precisa que funcione no dia a dia?", recommendationIds: [] };
  }

  if (/fresco|dia|trabalho/.test(t + " " + context)) {
    return { reply: "Nesse caso eu iria por algo mais versátil e fácil de conviver. O Club de Nuit Intense Man entra bem nessa conversa. Você prefere uma saída mais cítrica e frutada ou quer algo mais amadeirado?", recommendationIds: ["armaf-cdnim"] };
  }

  if (/para mim|pra mim/.test(t)) {
    return { reply: "Ótimo. Me dá uma referência: tem algum perfume que você já usou, sentiu em alguém ou simplesmente gostou muito? Pode ser de qualquer marca.", recommendationIds: [] };
  }

  return { reply: "Pode me explicar do seu jeito. Você quer passar uma sensação mais limpa e elegante, mais doce e envolvente ou prefere um perfume que chega com bastante presença?", recommendationIds: [] };
}

init();
