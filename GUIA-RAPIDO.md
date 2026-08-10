# Nura — Guia rápido

## O que foi melhorado
- Interface mais bonita e premium.
- Cards de produto mais elegantes.
- Uso de imagens reais de produtos quando disponíveis, com fallback local.
- API `/api/chat` com CORS liberado para integração externa.
- API `/api/catalog` para catálogo em JSON.
- `embed.js` e `widget.html` para incorporar a Nura em outros sites.

## Como configurar a IA real
1. Crie a chave no Google AI Studio / Gemini.
2. No Cloudflare Pages, abra o projeto.
3. Vá em **Settings > Environment variables**.
4. Crie a variável `GEMINI_API_KEY` com sua chave.
5. Opcional: crie `GEMINI_MODEL` com `gemini-2.5-flash`.
6. Faça novo deploy.

## Como incorporar em um site
Use este script:

```html
<script src="https://SEU-DOMINIO/embed.js" data-title="Fale com a Nura"></script>
```

## Endpoints
- `GET /api/chat` → health check simples.
- `POST /api/chat` → conversa com a IA.
- `GET /api/catalog` → catálogo em JSON com CORS.

## Observação sobre imagens
Algumas imagens reais vêm de fontes externas e há fallback local caso alguma origem externa não carregue.
