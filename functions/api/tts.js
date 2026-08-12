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

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: corsHeaders });
}

export async function onRequestPost(context) {
  try {
    const apiKey = context.env.GEMINI_API_KEY;
    const model = context.env.GEMINI_TTS_MODEL || "gemini-3.1-flash-tts-preview";
    const voiceName = context.env.GEMINI_TTS_VOICE || "Achird";
    if (!apiKey) return json({ error: "GEMINI_API_KEY não configurada" }, 503);

    const body = await context.request.json();
    const text = String(body?.text || "").replace(/\s+/g, " ").trim().slice(0, 1200);
    if (!text) return json({ error: "Texto vazio" }, 400);

    const performancePrompt = `
Sintetize fala em português do Brasil. Não leia as instruções abaixo; fale somente o texto marcado como TEXTO PARA FALAR.

PERFIL DA VOZ:
Fale como uma atendente brasileira de perfumaria, adulta, feminina, muito simpática, acolhedora e natural. A sensação deve ser de uma conversa individual no balcão de uma loja premium, nunca de uma narração.

DIREÇÃO DE INTERPRETAÇÃO:
- voz feminina suave, próxima e amigável;
- português brasileiro natural, sem sotaque artificial;
- ritmo conversacional, ligeiramente calmo, variando naturalmente conforme a frase;
- pequenas pausas espontâneas entre ideias, sem pausas mecânicas;
- entonação viva e humana, com leve sorriso na voz quando fizer sentido;
- não fale como locutora, URA, assistente virtual, comercial ou audiolivro;
- não exagere a dicção e não dê a mesma ênfase a todas as palavras;
- perguntas devem soar curiosas e acolhedoras, como uma vendedora realmente ouvindo o cliente;
- recomendações devem soar seguras, mas nunca empurradas;
- pronuncie nomes de perfumes e marcas estrangeiras com naturalidade;
- não leia emojis, markdown, asteriscos, hashtags ou símbolos de formatação;
- não acrescente introduções e não explique estas instruções.

TEXTO PARA FALAR:
${text}
`;

    const upstream = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
      {
        method: "POST",
        headers: { "content-type": "application/json", "x-goog-api-key": apiKey },
        body: JSON.stringify({
          contents: [{ parts: [{ text: performancePrompt }] }],
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

    const raw = await upstream.json();
    if (!upstream.ok) return json({ error: raw?.error?.message || "Falha ao gerar voz" }, upstream.status);

    const part = raw?.candidates?.[0]?.content?.parts?.find(p => p.inlineData?.data);
    const base64 = part?.inlineData?.data;
    if (!base64) throw new Error("Áudio vazio da Gemini");

    const pcm = base64ToBytes(base64);
    const wav = pcm16ToWav(pcm, 24000);
    return new Response(wav, {
      status: 200,
      headers: {
        ...corsHeaders,
        "content-type": "audio/wav",
        "cache-control": "no-store"
      }
    });
  } catch (error) {
    return json({ error: error?.message || "Erro ao gerar voz" }, 500);
  }
}
