import { corsHeaders, json } from "../_shared/cors.js";

function pcm16ToWav(pcmBytes, sampleRate = 24000) {
  const dataSize = pcmBytes.length;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);
  const out = new Uint8Array(buffer);
  const write = (offset, text) => [...text].forEach((ch, i) => view.setUint8(offset + i, ch.charCodeAt(0)));

  write(0, "RIFF");
  view.setUint32(4, 36 + dataSize, true);
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
  view.setUint32(40, dataSize, true);
  out.set(pcmBytes, 44);

  return out;
}

function base64ToBytes(base64) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function cleanSpeechText(value) {
  return String(value || "")
    .replace(/https?:\/\/\S+/gi, "")
    .replace(/[*#_`~>|[\]{}]/g, "")
    .replace(/[😀-🙏🌀-🫿]/gu, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 1000);
}

function buildPrompt(text) {
  return `
# AUDIO PROFILE: Marina
## "A consultora de perfumaria que conversa olhando nos olhos"

Marina é uma mulher brasileira adulta, aproximadamente na faixa dos 30 anos.
Ela trabalha como consultora em uma perfumaria elegante. É simpática, acolhedora,
segura e muito fácil de conversar. Sua voz é claramente feminina, suave e natural.
Ela não é locutora, narradora, influenciadora nem assistente virtual.

## A CENA: atendimento individual em uma perfumaria tranquila

Imagine que Marina está a poucos passos do cliente, em uma loja de perfumes calma.
Não há microfone, palco ou gravação. É apenas uma conversa real, individual.
Ela ouviu o cliente com atenção e está respondendo olhando para ele, com interesse genuíno.

### DIREÇÃO DA VOZ

Identidade:
- voz feminina adulta brasileira;
- timbre suave, gentil, acolhedor e próximo;
- personalidade simpática e elegante, sem exagero;
- passe a sensação de uma atendente que gosta de ajudar, não de uma IA.

Naturalidade:
- fale como numa conversa normal de loja;
- use um leve sorriso vocal, principalmente nas saudações e perguntas;
- varie a entonação naturalmente;
- algumas palavras podem sair um pouco mais leves que outras;
- faça micro-pausas naturais entre ideias, como uma pessoa pensando enquanto conversa;
- não mantenha o mesmo ritmo e a mesma melodia em todas as frases.

Ritmo:
- ritmo médio para levemente calmo;
- não fale rápido;
- não alongue palavras artificialmente;
- deixe perguntas terminarem com curiosidade acolhedora, não com entonação de telemarketing.

Sotaque e pronúncia:
- português brasileiro neutro e cotidiano;
- pronúncia clara, mas nunca excessivamente articulada;
- nomes estrangeiros de perfumes devem soar naturais dentro de uma conversa em português.

EVITE COMPLETAMENTE:
- voz de robô;
- voz de URA;
- voz de GPS;
- voz de comercial;
- voz de locutora de rádio;
- narração de audiolivro;
- tom infantil;
- entusiasmo exagerado;
- dicção teatral;
- pausas iguais e mecânicas;
- terminar todas as frases com a mesma melodia.

### CONTEXTO DE ATUAÇÃO

Marina acabou de ouvir o cliente falar sobre os perfumes e aromas de que gosta.
Ela responde de forma espontânea, como faria uma excelente vendedora presencial.
Quando fizer uma pergunta, deve parecer realmente interessada na resposta.
Quando sugerir um perfume, deve soar confiante e próxima, nunca como propaganda.

### TRANSCRIÇÃO

Fale somente o conteúdo abaixo. Não leia os títulos ou as instruções.

<fala>
${text}
</fala>
`.trim();
}
async function generateWithModel({ apiKey, model, voiceName, prompt }) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 22000);

  try {
    const upstream = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-goog-api-key": apiKey
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            responseModalities: ["AUDIO"],
            speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: { voiceName }
              }
            }
          }
        }),
        signal: controller.signal
      }
    );

    const raw = await upstream.json().catch(() => ({}));

    if (!upstream.ok) {
      return {
        ok: false,
        status: upstream.status,
        error: raw?.error?.message || `Falha no modelo ${model}`
      };
    }

    const part = raw?.candidates?.[0]?.content?.parts?.find(p => p.inlineData?.data);
    const base64 = part?.inlineData?.data;
    if (!base64) {
      return { ok: false, status: 502, error: `Áudio vazio no modelo ${model}` };
    }

    return { ok: true, base64 };
  } catch (error) {
    return {
      ok: false,
      status: error?.name === "AbortError" ? 504 : 500,
      error: error?.name === "AbortError"
        ? `Tempo excedido ao gerar voz com ${model}`
        : (error?.message || `Erro no modelo ${model}`)
    };
  } finally {
    clearTimeout(timeout);
  }
}

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: corsHeaders });
}

export async function onRequestGet(context) {
  const configured = context.env.GEMINI_TTS_MODEL || null;
  return json({
    ok: true,
    service: "Nura TTS",
    configuredModel: configured,
    primaryModel: configured || "gemini-3.1-flash-tts-preview",
    fallbackModel: "gemini-2.5-flash-preview-tts",
    voice: context.env.NURA_TTS_VOICE || "Vindemiatrix",
    hasApiKey: Boolean(context.env.GEMINI_API_KEY)
  });
}

export async function onRequestPost(context) {
  try {
    const apiKey = context.env.GEMINI_API_KEY;
    if (!apiKey) return json({ error: "GEMINI_API_KEY não configurada" }, 503);

    const body = await context.request.json();
    const text = cleanSpeechText(body?.text);
    if (!text) return json({ error: "Texto vazio" }, 400);

    const voiceName = context.env.NURA_TTS_VOICE || "Vindemiatrix";
    const configuredModel = context.env.GEMINI_TTS_MODEL || "";

    const models = [
      configuredModel,
      "gemini-3.1-flash-tts-preview",
      "gemini-2.5-flash-preview-tts"
    ].filter(Boolean);

    const uniqueModels = [...new Set(models)];
    const prompt = buildPrompt(text);
    const failures = [];

    for (const model of uniqueModels) {
      const result = await generateWithModel({
        apiKey,
        model,
        voiceName,
        prompt
      });

      if (result.ok) {
        const pcm = base64ToBytes(result.base64);
        const wav = pcm16ToWav(pcm, 24000);

        return new Response(wav, {
          status: 200,
          headers: {
            ...corsHeaders,
            "content-type": "audio/wav",
            "cache-control": "no-store",
            "x-nura-tts-model": model,
            "x-nura-tts-voice": voiceName
          }
        });
      }

      failures.push({
        model,
        status: result.status,
        error: result.error
      });
    }

    const quotaFailure = failures.some(item => item.status === 429);
    const authFailure = failures.some(item => item.status === 401 || item.status === 403);

    return json({
      error: authFailure
        ? "A chave Gemini não está autorizada para gerar voz."
        : quotaFailure
          ? "O limite temporário da voz Gemini foi atingido. Aguarde um pouco e tente novamente."
          : "Não consegui gerar a voz natural agora.",
      failures
    }, quotaFailure ? 429 : authFailure ? 403 : 502);

  } catch (error) {
    return json({ error: error?.message || "Erro ao gerar voz" }, 500);
  }
}
