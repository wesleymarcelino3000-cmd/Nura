# Nura V4 — Atendente Virtual de Perfumes Árabes

Versão focada em atendimento humano: primeiro entende o cliente, depois compara com a perfumaria árabe e só então mostra opções com fotografia real.

## O que mudou

- fluxo consultivo em etapas: perfume de referência -> aroma -> contexto quando necessário -> recomendação;
- cards não aparecem logo de cara;
- perfil do cliente fica salvo na sessão para evitar perguntas repetidas;
- comparação com perfumes não árabes sem afirmar clone/inspiração oficial;
- catálogo geral com 26 perfumes;
- 13 produtos habilitados para cards com fotografia real;
- voz principal via Gemini Flash TTS com perfil de atendente brasileira feminina, calorosa e natural;
- fallback para `speechSynthesis` do navegador se o TTS não responder;
- gravação de áudio do cliente mantida;
- mobile e rolagem mantidos/refinados.

## Variáveis do Cloudflare

Obrigatória:

`GEMINI_API_KEY`

Opcionais:

- `GEMINI_MODEL` — padrão `gemini-3.6-flash`
- `GEMINI_TTS_MODEL` — padrão `gemini-2.5-flash-preview-tts`
- `GEMINI_TTS_VOICE` — padrão `Sulafat`

Não é necessário criar outra chave: `/api/chat` e `/api/tts` usam a mesma `GEMINI_API_KEY`.

## Cloudflare Pages

- branch: `main`
- build output: `public`
- `functions/` na raiz
- secret `GEMINI_API_KEY` no Cloudflare

## Rotas

- `POST /api/chat` — conversa, perfil, áudio do cliente e recomendações
- `GET /api/catalog` — catálogo
- `POST /api/tts` — voz natural da Nura

## Observação sobre imagens

Os cards visuais só são liberados para itens marcados com `realImage: true`. Se uma foto externa não carregar, o sistema informa que a foto está indisponível em vez de fingir uma imagem do produto.
