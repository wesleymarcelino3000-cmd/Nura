const chat = document.querySelector("#chat");
const form = document.querySelector("#composer");
const input = document.querySelector("#input");
const sendBtn = document.querySelector("#sendBtn");
const typing = document.querySelector("#typing");
const resetBtn = document.querySelector("#resetBtn");
const modeBanner = document.querySelector("#modeBanner");

let catalog = [];
let messages = [];
let busy = false;

const initialAssistant = "Oi 😊 Que bom ter você por aqui. Eu posso te ajudar a encontrar um perfume que combine com seu estilo, mesmo que você não entenda nada de perfumaria. É para você ou para presente?";

async function init() {
  try {
    catalog = await fetch("/catalog.json").then(r => r.json());
  } catch {
    catalog = [];
  }

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
  scrollBottom();
}

function escapeForText(value) {
  return String(value ?? "");
}

function appendMessage(role, text, save = true) {
  const row = document.createElement("div");
  row.className = `message ${role}`;
  const bubble = document.createElement("div");
  bubble.className = "bubble";
  bubble.textContent = escapeForText(text);
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
    .map(id => catalog.find(p => p.id === id))
    .filter(Boolean)
    .slice(0, 3);

  if (!products.length) return;

  const wrap = document.createElement("div");
  wrap.className = "recommendations";

  for (const product of products) {
    const card = document.createElement("article");
    card.className = "product-card";

    const img = document.createElement("img");
    img.src = product.image;
    img.alt = `${product.name}, ${product.brand}`;
    img.loading = "lazy";

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
    profile.textContent = product.profile;

    body.append(brand, title, profile);
    card.append(img, body);
    wrap.appendChild(card);
  }

  chat.appendChild(wrap);
  scrollBottom();
}

function persist() {
  sessionStorage.setItem("nuraConversation", JSON.stringify(messages.slice(-30)));
}

function scrollBottom() {
  requestAnimationFrame(() => {
    chat.scrollTop = chat.scrollHeight;
  });
}

function setBusy(value) {
  busy = value;
  sendBtn.disabled = value;
  input.disabled = value;
  typing.classList.toggle("hidden", !value);
  if (value) scrollBottom();
}

function autoGrow() {
  input.style.height = "auto";
  input.style.height = `${Math.min(input.scrollHeight, 130)}px`;
}
input.addEventListener("input", autoGrow);

document.addEventListener("click", (event) => {
  const btn = event.target.closest("[data-quick]");
  if (!btn || busy) return;
  input.value = btn.dataset.quick;
  form.requestSubmit();
  document.querySelector("#initialChips")?.remove();
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const text = input.value.trim();
  if (!text || busy) return;

  appendMessage("user", text);
  input.value = "";
  autoGrow();
  setBusy(true);

  const payloadMessages = messages
    .filter(m => m.role === "user" || m.role === "assistant")
    .slice(-16)
    .map(m => ({ role: m.role, text: m.text }));

  try {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ messages: payloadMessages })
    });

    if (!response.ok) throw new Error("API indisponível");

    const data = await response.json();
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

    modeBanner.textContent = "Modo demonstração ativo. Para respostas realmente inteligentes, configure a chave gratuita da Gemini no Cloudflare.";
    modeBanner.classList.remove("hidden");
  }
});

resetBtn.addEventListener("click", () => {
  sessionStorage.removeItem("nuraConversation");
  location.reload();
});

function demoReply(text) {
  const t = text.toLowerCase();
  const userTexts = messages.filter(m => m.role === "user").map(m => m.text.toLowerCase()).join(" ");

  if (t.includes("presente")) {
    return {
      reply: "Boa escolha em pedir ajuda antes de comprar. Para eu não te indicar algo no escuro: a pessoa é mais discreta e elegante ou gosta de perfume que chama atenção?",
      recommendationIds: []
    };
  }

  if (t.includes("doce") || userTexts.includes("doce")) {
    if (t.includes("noite") || t.includes("balada") || t.includes("festa") || userTexts.includes("noite")) {
      return {
        reply: "Já dá para afunilar bem. Para uma proposta doce e noturna, eu olharia primeiro para o 9 PM e o Khamrah. O 9 PM tende a passar uma sensação mais jovem e de saída; o Khamrah vai para um lado mais gourmand e especiado. Você quer algo mais sedutor e descontraído ou mais quente e sofisticado?",
        recommendationIds: ["afnan-9pm", "lattafa-khamrah"]
      };
    }
    return {
      reply: "Entendi a direção. Doce pode ir de algo jovem e divertido até um gourmand bem quente. Você imagina usar mais durante o dia ou quando sair à noite?",
      recommendationIds: []
    };
  }

  if (t.includes("marcante") || t.includes("forte") || userTexts.includes("marcante")) {
    return {
      reply: "Então eu não te levaria para os mais discretos. Dá para buscar presença sem ficar pesado demais. Você quer essa presença para encontros e festas ou precisa que funcione também no dia a dia?",
      recommendationIds: []
    };
  }

  if (t.includes("fresco") || t.includes("dia") || t.includes("trabalho")) {
    return {
      reply: "Nesse caminho eu priorizaria algo mais versátil e menos carregado. O Club de Nuit Intense Man entra como uma opção interessante do catálogo inicial. Antes de bater o martelo: você gosta de um toque mais frutado/cítrico ou prefere algo mais amadeirado?",
      recommendationIds: ["armaf-cdnim"]
    };
  }

  if (t.includes("para mim") || t.includes("é pra mim") || t.includes("e pra mim")) {
    return {
      reply: "Ótimo. Me dá uma referência sua: tem algum perfume que você usa ou já sentiu e pensou “é esse tipo de cheiro que eu gosto”? Pode ser de qualquer marca.",
      recommendationIds: []
    };
  }

  return {
    reply: "Fica à vontade para me explicar do seu jeito. O que você quer sentir quando usar esse perfume: algo mais limpo e elegante, mais doce e envolvente, ou uma fragrância que chega com bastante presença?",
    recommendationIds: []
  };
}

init();
