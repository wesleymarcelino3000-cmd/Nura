import { corsHeaders, json } from "../_shared/cors.js";

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
## Consultora brasileira de perfumaria

Sintetize fala em português do Brasil.
Fale SOMENTE o conteúdo entre <fala> e </fala>.

A voz deve soar como uma mulher brasileira adulta atendendo uma pessoa presencialmente
em uma perfumaria elegante: feminina, suave, simpática, próxima, acolhedora e natural.

DIREÇÃO:
- ritmo normal de conversa; NÃO fale mais rápido para reduzir latência;
- pequenas pausas espontâneas entre ideias;
- entonação humana e variada;
- leve sorriso na voz quando fizer sentido;
- pergunta com curiosidade verdadeira;
- recomendação segura, sem tom de propaganda;
- não soe como robô, URA, GPS, locutora, comercial ou audiolivro;
- português brasileiro cotidiano;
- não leia markdown, emojis ou símbolos.

<fala>${text}</fala>
`.trim();
}

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: corsHeaders });
}

export async function onRequestPost(context) {
  try {
    const apiKey = context.env.GEMINI_API_KEY;
    if (!apiKey) return json({ error: "GEMINI_API_KEY não configurada" }, 503);

    const body = await context.request.json();
    const text = cleanSpeechText(body?.text);
    if (!text) return json({ error: "Texto vazio" }, 400);

    // Streaming de áudio exige TTS 3.1+.
    const model = context.env.NURA_TTS_STREAM_MODEL || "gemini-3.1-flash-tts-preview";
    const voiceName = context.env.NURA_TTS_VOICE || "Vindemiatrix";

    const upstream = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?alt=sse`,
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-goog-api-key": apiKey
        },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: buildPrompt(text) }]
          }],
          generationConfig: {
            responseModalities: ["AUDIO"],
            speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: { voiceName }
              }
            }
          }
        })
      }
    );

    if (!upstream.ok || !upstream.body) {
      const problem = await upstream.text().catch(() => "");
      return json({
        error: problem || `Falha no streaming de voz (${upstream.status})`
      }, upstream.status || 502);
    }

    // Apenas retransmite o SSE. A GEMINI_API_KEY nunca vai ao navegador.
    return new Response(upstream.body, {
      status: 200,
      headers: {
        ...corsHeaders,
        "content-type": "text/event-stream; charset=utf-8",
        "cache-control": "no-store, no-cache, must-revalidate",
        "x-accel-buffering": "no",
        "connection": "keep-alive"
      }
    });
  } catch (error) {
    return json({ error: error?.message || "Erro ao iniciar voz em streaming" }, 500);
  }
}
