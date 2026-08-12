const chat = document.querySelector("#chat");
const form = document.querySelector("#composer");
const input = document.querySelector("#input");
const sendBtn = document.querySelector("#sendBtn");
const micBtn = document.querySelector("#micBtn");
const typing = document.querySelector("#typing");
const resetBtn = document.querySelector("#resetBtn");
const modeBanner = document.querySelector("#modeBanner");
const voiceToggle = document.querySelector("#voiceToggle");
const audioStatus = document.querySelector("#audioStatus");
const audioStatusText = document.querySelector("#audioStatusText");
const recordTimer = document.querySelector("#recordTimer");

const params = new URLSearchParams(location.search);
if (params.get("embed") === "1") document.body.classList.add("embed");

let catalog = [];
let messages = [];
let busy = false;
let voiceEnabled = localStorage.getItem("nuraVoiceEnabled") !== "0";
let mediaRecorder = null;
let mediaStream = null;
let recordChunks = [];
let recordingStartedAt = 0;
let recordInterval = null;
let recordTimeout = null;
let customerProfile = {
  referenceStatus: "unknown",
  referencePerfume: "",
  aromaPreference: "",
  occasion: "",
  intensity: "",
  dislikes: ""
};
let currentVoiceAudio = null;
let currentVoiceUrl = null;

const initialAssistant = "Oi, eu sou a Nura. Antes de te indicar qualquer perfume, quero entender seu gosto de verdade. Tem algum perfume que você já usou e gostou muito? Pode ser de qualquer marca — e, se não lembrar o nome, me fala que eu te ajudo pelo aroma.";

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
  updateVoiceButton();

  try {
    const savedProfile = JSON.parse(sessionStorage.getItem("nuraCustomerProfile") || "null");
    if (savedProfile && typeof savedProfile === "object") customerProfile = { ...customerProfile, ...savedProfile };
  } catch {}

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
            renderRecommendationCards(item.recommendationIds, false);
          }
        }
        const lastAssistant = [...messages].reverse().find(item => item.role === "assistant");
        if (lastAssistant?.suggestedReplies?.length) renderSuggestedReplies(lastAssistant.suggestedReplies);
      }
    } catch {}
  }

  if (!messages.length) {
    messages = [{ role: "assistant", text: initialAssistant, recommendationIds: [], suggestedReplies: [] }];
  }

  if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
    micBtn.classList.add("unsupported");
    micBtn.title = "Seu navegador não oferece gravação de áudio aqui";
  }

  input.focus({ preventScroll: true });
  scrollBottom(false);
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
    messages.push({ role, text, recommendationIds: [], suggestedReplies: [] });
    persist();
  }

  scrollBottom(false);
  return { row, bubble };
}

function renderRecommendationCards(ids = [], autoScroll = true) {
  const products = ids
    .map(id => catalog.find(product => product.id === id))
    .filter(product => product && product.realImage === true)
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
    img.decoding = "async";
    img.referrerPolicy = "no-referrer";
    img.addEventListener("load", () => autoScroll && scrollBottom(true), { once: true });
    img.addEventListener("error", () => {
      img.remove();
      imageWrap.classList.add("image-unavailable");
      imageWrap.setAttribute("aria-label", `Foto real de ${product.name} indisponível no momento`);
      if (autoScroll) scrollBottom(true);
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
    compare.textContent = "Comparar";

    actions.append(choose, compare);
    body.append(brand, title, profile, actions);
    card.append(imageWrap, body);
    wrap.appendChild(card);
  }

  chat.appendChild(wrap);
  if (autoScroll) {
    scrollBottom(true);
    setTimeout(() => scrollBottom(true), 100);
    setTimeout(() => scrollBottom(true), 350);
  }
}

function renderSuggestedReplies(items = []) {
  document.querySelectorAll(".context-chips").forEach(el => el.remove());
  const replies = [...new Set(items.map(String).map(s => s.trim()).filter(Boolean))].slice(0, 3);
  if (!replies.length) return;

  const wrap = document.createElement("div");
  wrap.className = "quick-replies context-chips";
  for (const reply of replies) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.dataset.quick = reply;
    btn.textContent = reply;
    wrap.appendChild(btn);
  }
  chat.appendChild(wrap);
  scrollBottom(true);
}

function persist() {
  sessionStorage.setItem("nuraConversation", JSON.stringify(messages.slice(-36)));
  sessionStorage.setItem("nuraCustomerProfile", JSON.stringify(customerProfile));
}

function scrollBottom(smooth = false) {
  requestAnimationFrame(() => {
    chat.scrollTo({
      top: chat.scrollHeight,
      behavior: smooth ? "smooth" : "auto"
    });
  });
}

function getRecentRecommendationIds() {
  return [...new Set(
    messages.flatMap(item => Array.isArray(item.recommendationIds) ? item.recommendationIds : [])
  )].slice(-12);
}

function setBusy(value) {
  busy = value;
  sendBtn.disabled = value;
  micBtn.disabled = value && !mediaRecorder;
  input.disabled = value;
  typing.classList.toggle("hidden", !value);
  if (value) scrollBottom(false);
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
  if (quick && !busy && !mediaRecorder) {
    input.value = quick.dataset.quick;
    form.requestSubmit();
    document.querySelector("#initialChips")?.remove();
    document.querySelector("#introCard")?.remove();
    document.querySelectorAll(".context-chips").forEach(el => el.remove());
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
    input.value = `Quero comparar o ${compare.dataset.productName} com outra opção diferente que combine comigo.`;
    form.requestSubmit();
  }
});

form.addEventListener("submit", async event => {
  event.preventDefault();
  const text = input.value.trim();
  if (!text || busy || mediaRecorder) return;

  document.querySelector("#initialChips")?.remove();
  document.querySelector("#introCard")?.remove();
  document.querySelectorAll(".context-chips").forEach(el => el.remove());

  appendMessage("user", text);
  input.value = "";
  autoGrow();
  setBusy(true);

  const payloadMessages = messages
    .filter(item => item.role === "user" || item.role === "assistant")
    .slice(-24)
    .map(item => ({ role: item.role, text: item.text }));

  try {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        messages: payloadMessages,
        recentRecommendationIds: getRecentRecommendationIds(),
        customerProfile
      })
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || "API indisponível");

    const reply = data.reply || "Me conta um pouco mais do que você procura.";
    const ids = Array.isArray(data.recommendationIds) ? data.recommendationIds : [];
    const suggestions = Array.isArray(data.suggestedReplies) ? data.suggestedReplies : [];
    if (data.customerProfile && typeof data.customerProfile === "object") {
      customerProfile = { ...customerProfile, ...data.customerProfile };
    }

    setBusy(false);
    appendMessage("assistant", reply);
    messages[messages.length - 1].recommendationIds = ids;
    messages[messages.length - 1].suggestedReplies = suggestions;
    persist();
    renderRecommendationCards(ids);
    renderSuggestedReplies(suggestions);
    modeBanner.classList.add("hidden");
    speakText(reply);
  } catch (error) {
    const demo = demoReply(text);
    setBusy(false);
    appendMessage("assistant", demo.reply);
    messages[messages.length - 1].recommendationIds = demo.recommendationIds;
    messages[messages.length - 1].suggestedReplies = demo.suggestedReplies || [];
    persist();
    renderRecommendationCards(demo.recommendationIds);
    renderSuggestedReplies(demo.suggestedReplies || []);

    modeBanner.textContent = "Estou em modo demonstração. Configure a chave da Gemini no Cloudflare para usar a inteligência completa.";
    modeBanner.classList.remove("hidden");
  }
});

resetBtn.addEventListener("click", () => {
  stopSpeaking();
  sessionStorage.removeItem("nuraConversation");
  sessionStorage.removeItem("nuraCustomerProfile");
  location.reload();
});

/* ---------------- VOZ DA NURA ---------------- */

function updateVoiceButton() {
  voiceToggle.classList.toggle("active", voiceEnabled);
  voiceToggle.setAttribute("aria-pressed", String(voiceEnabled));
  voiceToggle.title = voiceEnabled ? "Desativar voz da Nura" : "Ativar voz da Nura";
}

voiceToggle.addEventListener("click", () => {
  voiceEnabled = !voiceEnabled;
  localStorage.setItem("nuraVoiceEnabled", voiceEnabled ? "1" : "0");
  updateVoiceButton();
  if (!voiceEnabled) stopSpeaking();
});

function stopSpeaking() {
  cleanupVoiceAudio();
  if ("speechSynthesis" in window) window.speechSynthesis.cancel();
}

function getBestBrowserVoice() {
  if (!("speechSynthesis" in window)) return null;
  const voices = speechSynthesis.getVoices();
  const preferred = voices.filter(v => /pt-BR/i.test(v.lang));
  return preferred.find(v => /female|maria|francisca|luciana|google português/i.test(v.name))
    || preferred[0]
    || voices.find(v => /^pt/i.test(v.lang))
    || voices[0]
    || null;
}

function cleanupVoiceAudio() {
  if (currentVoiceAudio) {
    currentVoiceAudio.pause();
    currentVoiceAudio.src = "";
  }
  currentVoiceAudio = null;
  if (currentVoiceUrl) URL.revokeObjectURL(currentVoiceUrl);
  currentVoiceUrl = null;
  voiceToggle.classList.remove("speaking");
}

async function speakText(text) {
  if (!voiceEnabled || !text) return;
  stopSpeaking();
  voiceToggle.classList.add("speaking");

  try {
    const response = await fetch("/api/tts", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ text })
    });
    if (!response.ok) throw new Error("TTS indisponível");
    const blob = await response.blob();
    currentVoiceUrl = URL.createObjectURL(blob);
    currentVoiceAudio = new Audio(currentVoiceUrl);
    currentVoiceAudio.preload = "auto";
    currentVoiceAudio.addEventListener("ended", cleanupVoiceAudio, { once: true });
    currentVoiceAudio.addEventListener("error", cleanupVoiceAudio, { once: true });
    await currentVoiceAudio.play();
    return;
  } catch {
    cleanupVoiceAudio();
  }

  if (!("speechSynthesis" in window)) return;
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "pt-BR";
  utterance.rate = 0.96;
  utterance.pitch = 1.04;
  const voice = getBestBrowserVoice();
  if (voice) utterance.voice = voice;
  utterance.onend = () => voiceToggle.classList.remove("speaking");
  utterance.onerror = () => voiceToggle.classList.remove("speaking");
  speechSynthesis.speak(utterance);
}

/* ---------------- ÁUDIO DO CLIENTE ---------------- */

micBtn.addEventListener("click", async () => {
  if (busy) return;
  if (mediaRecorder) {
    stopRecording();
  } else {
    await startRecording();
  }
});

async function startRecording() {
  stopSpeaking();
  if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
    showBanner("Seu navegador não liberou gravação de áudio. Você ainda pode digitar normalmente.");
    return;
  }

  try {
    mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const preferredTypes = [
      "audio/webm;codecs=opus",
      "audio/ogg;codecs=opus",
      "audio/webm",
      "audio/ogg"
    ];
    const mimeType = preferredTypes.find(type => MediaRecorder.isTypeSupported(type));
    mediaRecorder = mimeType ? new MediaRecorder(mediaStream, { mimeType }) : new MediaRecorder(mediaStream);
    recordChunks = [];

    mediaRecorder.addEventListener("dataavailable", event => {
      if (event.data?.size) recordChunks.push(event.data);
    });

    mediaRecorder.addEventListener("stop", async () => {
      clearRecordingTimers();
      const duration = Math.max(1, Math.round((Date.now() - recordingStartedAt) / 1000));
      const blob = new Blob(recordChunks, { type: mediaRecorder?.mimeType || "audio/webm" });
      cleanupRecorder();
      await processRecordedAudio(blob, duration);
    }, { once: true });

    mediaRecorder.start(250);
    recordingStartedAt = Date.now();
    micBtn.classList.add("recording");
    micBtn.setAttribute("aria-label", "Parar e enviar áudio");
    input.disabled = true;
    sendBtn.disabled = true;
    audioStatus.classList.remove("hidden");
    audioStatusText.textContent = "Gravando… toque no microfone novamente para enviar.";
    updateRecordTimer();
    recordInterval = setInterval(updateRecordTimer, 500);
    recordTimeout = setTimeout(() => {
      if (mediaRecorder?.state === "recording") stopRecording();
    }, 45000);
  } catch (error) {
    cleanupRecorder();
    showBanner("Não consegui acessar o microfone. Verifique a permissão do navegador e tente novamente.");
  }
}

function stopRecording() {
  if (!mediaRecorder || mediaRecorder.state === "inactive") return;
  audioStatusText.textContent = "Preparando seu áudio…";
  micBtn.classList.remove("recording");
  mediaRecorder.stop();
}

function updateRecordTimer() {
  const elapsed = Math.max(0, Math.floor((Date.now() - recordingStartedAt) / 1000));
  const min = Math.floor(elapsed / 60);
  const sec = String(elapsed % 60).padStart(2, "0");
  recordTimer.textContent = `${min}:${sec}`;
}

function clearRecordingTimers() {
  if (recordInterval) clearInterval(recordInterval);
  if (recordTimeout) clearTimeout(recordTimeout);
  recordInterval = null;
  recordTimeout = null;
}

function cleanupRecorder() {
  clearRecordingTimers();
  mediaStream?.getTracks()?.forEach(track => track.stop());
  mediaStream = null;
  mediaRecorder = null;
  recordChunks = [];
  micBtn.classList.remove("recording");
  micBtn.setAttribute("aria-label", "Gravar áudio");
  input.disabled = false;
  sendBtn.disabled = false;
}

async function processRecordedAudio(blob, duration) {
  try {
    audioStatus.classList.remove("hidden");
    audioStatusText.textContent = "Entendendo o que você falou…";
    const wavBuffer = await blobToWav(blob);
    const base64 = arrayBufferToBase64(wavBuffer);
    await sendAudio(base64, duration);
  } catch (error) {
    audioStatus.classList.add("hidden");
    showBanner("Não consegui processar esse áudio. Tente gravar novamente ou escreva sua mensagem.");
    input.focus({ preventScroll: true });
  }
}

async function blobToWav(blob) {
  const bytes = await blob.arrayBuffer();
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx) throw new Error("AudioContext indisponível");
  const ctx = new AudioCtx();
  try {
    const buffer = await ctx.decodeAudioData(bytes.slice(0));
    return encodeWav(buffer);
  } finally {
    await ctx.close().catch(() => {});
  }
}

function encodeWav(audioBuffer) {
  const channels = audioBuffer.numberOfChannels;
  const length = audioBuffer.length;
  const sampleRate = audioBuffer.sampleRate;
  const mono = new Float32Array(length);

  for (let c = 0; c < channels; c++) {
    const data = audioBuffer.getChannelData(c);
    for (let i = 0; i < length; i++) mono[i] += data[i] / channels;
  }

  const out = new ArrayBuffer(44 + length * 2);
  const view = new DataView(out);
  const write = (offset, value) => [...value].forEach((ch, i) => view.setUint8(offset + i, ch.charCodeAt(0)));

  write(0, "RIFF");
  view.setUint32(4, 36 + length * 2, true);
  write(8, "WAVE");
  write(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  write(36, "data");
  view.setUint32(40, length * 2, true);

  let offset = 44;
  for (let i = 0; i < length; i++, offset += 2) {
    const sample = Math.max(-1, Math.min(1, mono[i]));
    view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);
  }
  return out;
}

function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

async function sendAudio(base64, duration) {
  document.querySelector("#initialChips")?.remove();
  document.querySelector("#introCard")?.remove();
  document.querySelectorAll(".context-chips").forEach(el => el.remove());

  const temp = appendMessage("user", `🎤 Áudio de ${duration}s`, false);
  setBusy(true);

  const payloadMessages = messages
    .filter(item => item.role === "user" || item.role === "assistant")
    .slice(-24)
    .map(item => ({ role: item.role, text: item.text }));

  try {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        messages: payloadMessages,
        audio: { data: base64, mimeType: "audio/wav" },
        recentRecommendationIds: getRecentRecommendationIds(),
        customerProfile
      })
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || "Falha ao entender áudio");

    const transcript = String(data.transcript || "").trim();
    const userText = transcript || "Mensagem de áudio";
    temp.bubble.textContent = transcript ? `🎤 “${transcript}”` : "🎤 Áudio recebido";

    messages.push({ role: "user", text: userText, recommendationIds: [], suggestedReplies: [] });
    persist();

    const reply = data.reply || "Entendi. Me conta só mais um pouco do que você procura.";
    const ids = Array.isArray(data.recommendationIds) ? data.recommendationIds : [];
    const suggestions = Array.isArray(data.suggestedReplies) ? data.suggestedReplies : [];
    if (data.customerProfile && typeof data.customerProfile === "object") {
      customerProfile = { ...customerProfile, ...data.customerProfile };
    }

    setBusy(false);
    audioStatus.classList.add("hidden");
    appendMessage("assistant", reply);
    messages[messages.length - 1].recommendationIds = ids;
    messages[messages.length - 1].suggestedReplies = suggestions;
    persist();
    renderRecommendationCards(ids);
    renderSuggestedReplies(suggestions);
    modeBanner.classList.add("hidden");
    speakText(reply);
  } catch (error) {
    setBusy(false);
    audioStatus.classList.add("hidden");
    temp.bubble.textContent = "🎤 Não consegui entender esse áudio";
    appendMessage("assistant", "Não consegui ouvir esse áudio direitinho. Pode tentar novamente ou me escrever do seu jeito.");
    showBanner("O áudio não foi processado. Tente novamente.");
  }
}

function showBanner(text) {
  modeBanner.textContent = text;
  modeBanner.classList.remove("hidden");
  setTimeout(() => modeBanner.classList.add("hidden"), 7000);
}

/* ---------------- DEMONSTRAÇÃO SEM API ---------------- */

function demoReply(text) {
  const t = text.toLowerCase();
  const userTurns = messages.filter(m => m.role === "user").length;
  const context = messages.filter(m => m.role === "user").map(m => m.text.toLowerCase()).join(" ");
  const aromaKnown = /doce|gourmand|fresco|limpo|amadeir|especiad|frutad|cítric|citrico|cremos|floral|oud|baunilha/.test(context);

  if (userTurns <= 1) {
    if (/não lembro|nao lembro|nunca tive|nenhum/.test(t)) {
      return {
        reply: "Sem problema. Então eu começo pelo cheiro que te agrada: você costuma gostar mais de algo fresco e limpo, doce e envolvente, amadeirado e elegante ou mais marcante e especiado?",
        recommendationIds: [],
        suggestedReplies: ["Fresco e limpo", "Doce e envolvente", "Amadeirado e elegante"]
      };
    }
    return {
      reply: "Quero usar essa referência para entender seu gosto, não para te jogar opções aleatórias. Qual é o nome do perfume que você gostou? Se não lembrar, pode me dizer como era o cheiro.",
      recommendationIds: [],
      suggestedReplies: ["Não lembro o nome", "Era mais fresco", "Era mais doce"]
    };
  }

  if (!aromaKnown) {
    return {
      reply: "Essa referência já me ajuda. Agora quero entender a parte que mais te atraía nele: você gostava mais do frescor, do lado doce, da madeira/elegância ou daquela presença mais marcante?",
      recommendationIds: [],
      suggestedReplies: ["Mais fresco", "Mais doce", "Mais amadeirado"]
    };
  }

  if (/fresco|limpo|cítric|citrico|calor|trabalho/.test(context)) {
    return {
      reply: "Agora já dá para fazer uma ponte melhor. Eu começaria pelo Afnan Turathi Blue se você quer frescor cítrico com um ar mais arrumado; se prefere algo ainda mais luminoso e mineral, o Club de Nuit Sillage entra bem. Entre os dois, eu começaria pelo Turathi Blue para uma escolha mais fácil de usar.",
      recommendationIds: ["afnan-turathi-blue", "armaf-cdn-sillage"],
      suggestedReplies: ["Quero o mais elegante", "Quero o mais fresco", "Vou usar no trabalho"]
    };
  }

  if (/doce|gourmand|baunilha|cremos/.test(context)) {
    return {
      reply: "Pelo caminho doce que você descreveu, eu não iria direto no mais pesado. O 9 PM traz um doce mais jovem e sedutor; o Khamrah é mais quente e gourmand. Se você quer algo fácil para noite, eu começaria no 9 PM.",
      recommendationIds: ["afnan-9pm", "lattafa-khamrah"],
      suggestedReplies: ["Quero algo mais elegante", "Prefiro menos doce", "É para sair à noite"]
    };
  }

  if (/amadeir|marcante|especiad|forte|presença|presenca/.test(context)) {
    return {
      reply: "Nesse perfil eu buscaria presença com acabamento mais elegante. O Asad vai para um lado quente e especiado; o Supremacy Not Only Intense traz uma construção frutada e amadeirada com bastante personalidade. Eu escolheria entre eles pela sensação que você quer passar.",
      recommendationIds: ["lattafa-asad", "afnan-supremacy-noi"],
      suggestedReplies: ["Mais elegante", "Mais marcante", "Quero para noite"]
    };
  }

  return {
    reply: "Já estou entendendo melhor seu gosto. Só me diz onde você pretende usar mais esse perfume: dia a dia, trabalho, encontros ou festas? Isso vai me ajudar a te mostrar uma opção árabe que faça sentido de verdade.",
    recommendationIds: [],
    suggestedReplies: ["Dia a dia", "Trabalho", "Encontros e festas"]
  };
}

init();
