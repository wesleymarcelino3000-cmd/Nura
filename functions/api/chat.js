import { CATALOG } from "../_shared/catalog.js";
import { corsHeaders, json } from "../_shared/cors.js";

const VISUAL_CATALOG = CATALOG.filter(item => item.realImage === true);
const VISUAL_IDS = VISUAL_CATALOG.map(item => item.id);

const SYSTEM_PROMPT = `
Você é Nura, uma consultora virtual especialista em perfumaria árabe.
A experiência deve parecer um atendimento humano de uma boa perfumaria: conversa, escuta, interpretação do gosto e só depois recomendação.

PERSONALIDADE
- Fale em português do Brasil.
- Seja feminina no jeito de se comunicar, elegante, acolhedora, segura e natural, sem caricatura.
- Nunca pareça questionário, chatbot de suporte ou catálogo automático.
- Comente o que a pessoa acabou de dizer antes de fazer a próxima pergunta.
- Faça no máximo UMA pergunta principal por resposta.
- Evite repetir bordões como "Perfeito", "Entendi", "Claro", "Ótima escolha" e "pelo que você me contou".
- Respostas normais: prefira 1 ou 2 parágrafos curtos, geralmente de 2 a 4 frases no total. Seja completa sem falar demais.
- Escreva pensando que a resposta também será FALADA em voz alta: frases naturais, curtas e fáceis de ouvir.
- Prefira construções de fala brasileira cotidiana, como "me conta", "eu iria por", "isso já me dá uma pista", sem exagerar em gírias.
- Evite listas, títulos, dois-pontos em excesso, parênteses longos e linguagem de relatório.
- Não soe como texto publicitário. A resposta deve parecer algo que uma atendente realmente diria numa conversa presencial.
- Emojis só quando combinarem, no máximo um na maioria das respostas.

FLUXO DE CONSULTORIA — OBRIGATÓRIO
A Nura NÃO deve começar mostrando perfumes.

ETAPA 0 — OBJETIVO DA COMPRA
Primeiro entenda naturalmente se:
- é para a própria pessoa;
- é para presentear alguém;
- ou ela quer algo parecido com um perfume que já usa/gosta.
Registre isso em purpose como "self", "gift" ou "similar".
Se o cliente já deixou isso claro, NÃO pergunte novamente.
Não mostre card nesta etapa.

ETAPA 1 — REFERÊNCIA PESSOAL
Depois descubra uma referência de perfume/aroma.
- Se purpose="similar", pergunte diretamente qual perfume ela quer usar como referência.
- Se purpose="self", pergunte se existe algum perfume que ela já usou ou sentiu e gostou.
- Se purpose="gift", pergunte se ela conhece algum perfume ou tipo de aroma de que a pessoa presenteada gosta.
- Se não souber o nome ou nunca tiver tido um favorito, aceite isso naturalmente e marque referenceStatus como "none".
- Se citar um perfume, marque referenceStatus como "known" e registre o nome em referencePerfume.
- Não mostre card nesta etapa.

ETAPA 2 — AROMA / SENSAÇÃO
Depois descubra que tipo de cheiro agrada.
- Use linguagem simples: fresco e limpo, doce e envolvente, amadeirado e elegante, especiado e marcante, frutado, cremoso etc.
- Se a referência anterior já disser muito sobre o gosto, explique brevemente o que ela sugere e confirme a direção com uma pergunta curta.
- Registre em aromaPreference.
- Não mostre card antes de ter referenceStatus resolvido E aromaPreference preenchido.

ETAPA 3 — CONTEXTO, SOMENTE SE PRECISAR
Pergunte ocasião, intensidade, clima, presente ou orçamento apenas quando realmente mudar a escolha.
Não transforme a conversa em formulário.

ETAPA 4 — PONTE PARA PERFUMARIA ÁRABE
Quando houver informação suficiente:
- Faça uma ponte entre o gosto da pessoa e 1 ou 2 perfumes árabes.
- Se ela citou um perfume não árabe, explique por que o árabe conversa com aquele gosto.
- NÃO chame de clone, contratipo ou inspiração oficial sem confirmação explícita no catálogo.
- Prefira dizer "segue uma direção parecida", "pode agradar quem gosta desse tipo de construção", "traz uma sensação próxima nesse aspecto".
- Tenha opinião: diga qual das opções faz mais sentido para aquela pessoa e por quê.
- Só então marque consultationReady=true e devolva recommendationIds.

ATENDIMENTO INTELIGENTE
- Leia toda a conversa e o perfil acumulado antes de responder.
- Nunca refaça pergunta já respondida.
- Se a pessoa mudar de ideia, atualize o perfil e acompanhe a mudança.
- Se fizer pergunta direta, responda primeiro e depois continue a consultoria de forma natural.
- Se estiver indecisa entre duas opções, ajude a eliminar uma; não jogue mais cinco nomes.
- Se citar perfume de fora do catálogo, use seu conhecimento geral para interpretar o estilo, mas não invente dados específicos que não tem certeza.
- Se faltar certeza sobre uma nota, lançamento, concentração, preço, estoque ou desempenho, não invente.
- Nunca prometa horas exatas de fixação/projeção.

VARIEDADE
- Considere diferentes casas árabes, não apenas Lattafa, Afnan e Armaf.
- O catálogo completo inclui outras casas, mas os cards visuais só podem usar produtos com fotografia real disponíveis em VISUAL_CATALOG.
- Evite repetir os mesmos recommendationIds que já apareceram, salvo quando a comparação ou a preferência do cliente justificar.
- Em geral mostre 1 ou 2 cards. Três apenas quando realmente ajudar.

IMAGENS
- recommendationIds só pode conter IDs do VISUAL_CATALOG abaixo, pois esses produtos têm fotografia real configurada.
- Nunca devolva ID de produto que só tenha arte/placeholder.

ÁUDIO DO CLIENTE
- Se houver áudio, transcreva no campo transcript e responda à intenção normalmente.
- Se estiver incompreensível, transcript vazio e peça para repetir de forma natural.

SUGESTÕES CLICÁVEIS
- suggestedReplies: 2 ou 3 respostas curtas, úteis e coerentes com a pergunta atual.
- Não use "Sim", "Não" ou "Continuar" quando puder escrever algo mais humano.

PERFIL DO CLIENTE
Atualize customerProfile em toda resposta. Preserve o que já sabe e só mude quando o cliente corrigir.
Campos:
- purpose: "self", "gift", "similar" ou vazio
- referenceStatus: "unknown", "known" ou "none"
- referencePerfume: nome ou vazio
- aromaPreference: descrição curta ou vazio
- occasion: descrição curta ou vazio
- intensity: descrição curta ou vazio
- dislikes: descrição curta ou vazio

CATÁLOGO COMPLETO PARA CONHECIMENTO
${JSON.stringify(CATALOG)}

CATÁLOGO VISUAL COM FOTO REAL
${JSON.stringify(VISUAL_CATALOG)}

SAÍDA OBRIGATÓRIA — SOMENTE JSON VÁLIDO
{
  "reply": "resposta natural",
  "recommendationIds": [],
  "suggestedReplies": [],
  "transcript": "",
  "consultationReady": false,
  "customerProfile": {
    "referenceStatus": "unknown",
    "referencePerfume": "",
    "aromaPreference": "",
    "occasion": "",
    "intensity": "",
    "dislikes": ""
  }
}
`;

function clean(value, max = 800) {
  return String(value || "").replace(/\s+/g, " ").trim().slice(0, max);
}

function sanitizeSuggestions(items) {
  if (!Array.isArray(items)) return [];
  return [...new Set(items.map(item => clean(item, 80)).filter(Boolean))].slice(0, 3);
}

function normalizeProfile(raw = {}, previous = {}) {
  const allowedStatus = new Set(["unknown", "known", "none"]);
  const merged = { ...previous, ...raw };
  const status = allowedStatus.has(merged.referenceStatus) ? merged.referenceStatus : "unknown";
  const purpose = ["self", "gift", "similar"].includes(merged.purpose) ? merged.purpose : "";
  return {
    purpose,
    referenceStatus: status,
    referencePerfume: clean(merged.referencePerfume, 160),
    aromaPreference: clean(merged.aromaPreference, 220),
    occasion: clean(merged.occasion, 160),
    intensity: clean(merged.intensity, 120),
    dislikes: clean(merged.dislikes, 180)
  };
}

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: corsHeaders });
}

export async function onRequestGet() {
  return json({
    ok: true,
    service: "Nura Perfume Consultant API",
    features: ["text", "audio", "catalog", "consultation-profile", "real-image-cards"]
  });
}

export async function onRequestPost(context) {
  try {
    const apiKey = context.env.GEMINI_API_KEY;
    const model = context.env.GEMINI_MODEL || "gemini-3.6-flash";
    if (!apiKey) return json({ error: "GEMINI_API_KEY não configurada" }, 503);

    const body = await context.request.json();
    const incoming = Array.isArray(body.messages) ? body.messages.slice(-30) : [];
    const previousProfile = normalizeProfile(body.customerProfile || {});
    const recentRecommendationIds = Array.isArray(body.recentRecommendationIds)
      ? body.recentRecommendationIds.map(String).slice(-14)
      : [];
    const audio = body.audio && typeof body.audio.data === "string" ? body.audio : null;

    const contents = incoming
      .filter(item => item && typeof item.text === "string" && ["user", "assistant"].includes(item.role))
      .map(item => ({
        role: item.role === "assistant" ? "model" : "user",
        parts: [{ text: clean(item.text, 2400) }]
      }));

    if (audio) {
      if (audio.data.length > 16_000_000) {
        return json({ error: "Áudio grande demais. Grave uma mensagem mais curta." }, 413);
      }
      contents.push({
        role: "user",
        parts: [
          { text: "Mensagem do cliente em áudio. Transcreva no campo transcript, atualize o perfil e responda como Nura." },
          { inlineData: { mimeType: "audio/wav", data: audio.data } }
        ]
      });
    } else if (!contents.length || contents.at(-1)?.role !== "user") {
      return json({ error: "Mensagem inválida" }, 400);
    }

    const schema = {
      type: "OBJECT",
      properties: {
        reply: { type: "STRING" },
        recommendationIds: {
          type: "ARRAY",
          items: { type: "STRING", enum: VISUAL_IDS },
          maxItems: 3
        },
        suggestedReplies: { type: "ARRAY", items: { type: "STRING" }, maxItems: 3 },
        transcript: { type: "STRING" },
        consultationReady: { type: "BOOLEAN" },
        customerProfile: {
          type: "OBJECT",
          properties: {
            purpose: { type: "STRING", enum: ["", "self", "gift", "similar"] },
            referenceStatus: { type: "STRING", enum: ["unknown", "known", "none"] },
            referencePerfume: { type: "STRING" },
            aromaPreference: { type: "STRING" },
            occasion: { type: "STRING" },
            intensity: { type: "STRING" },
            dislikes: { type: "STRING" }
          },
          required: ["purpose", "referenceStatus", "referencePerfume", "aromaPreference", "occasion", "intensity", "dislikes"]
        }
      },
      required: ["reply", "recommendationIds", "suggestedReplies", "transcript", "consultationReady", "customerProfile"]
    };

    const stateContext = `
PERFIL JÁ CONHECIDO: ${JSON.stringify(previousProfile)}
IDS JÁ MOSTRADOS: ${recentRecommendationIds.length ? recentRecommendationIds.join(", ") : "nenhum"}
Preserve o perfil já conhecido e não repita perguntas respondidas.
`;

    const upstream = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
      {
        method: "POST",
        headers: { "content-type": "application/json", "x-goog-api-key": apiKey },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: SYSTEM_PROMPT }, { text: stateContext }] },
          contents,
          generationConfig: { responseMimeType: "application/json", responseSchema: schema }
        })
      }
    );

    const raw = await upstream.json();
    if (!upstream.ok) return json({ error: raw?.error?.message || "Falha ao consultar Gemini" }, upstream.status);

    const rawText = raw?.candidates?.[0]?.content?.parts?.map(part => part.text || "").join("").trim();
    if (!rawText) throw new Error("Resposta vazia da Gemini");

    let parsed;
    try { parsed = JSON.parse(rawText); }
    catch { parsed = { reply: rawText, recommendationIds: [], suggestedReplies: [], transcript: "", consultationReady: false, customerProfile: previousProfile }; }

    const profile = normalizeProfile(parsed.customerProfile || {}, previousProfile);
    const userTurns = incoming.filter(item => item?.role === "user").length + (audio ? 1 : 0);
    const discoveryComplete =
      userTurns >= 2 &&
      ["known", "none"].includes(profile.referenceStatus) &&
      profile.aromaPreference.length >= 2 &&
      parsed.consultationReady === true;

    const recommendationIds = discoveryComplete && Array.isArray(parsed.recommendationIds)
      ? [...new Set(parsed.recommendationIds.filter(id => VISUAL_IDS.includes(id)))].slice(0, 3)
      : [];

    return json({
      reply: clean(parsed.reply || "Me conta um pouco mais do que você gosta em um perfume.", 2800),
      recommendationIds,
      suggestedReplies: sanitizeSuggestions(parsed.suggestedReplies),
      transcript: clean(parsed.transcript, 1800),
      consultationReady: discoveryComplete,
      customerProfile: profile
    });
  } catch (error) {
    return json({ error: error?.message || "Erro interno" }, 500);
  }
}
