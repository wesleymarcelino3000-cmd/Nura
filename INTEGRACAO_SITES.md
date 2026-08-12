# Integração da Nura em outros sites

## Widget flutuante

Cole antes de `</body>`:

```html
<script
  src="https://SEU-DOMINIO.pages.dev/embed.js"
  data-label="Escolha seu perfume"
  data-position="right">
</script>
```

O widget inclui `allow="microphone"` para permitir mensagens de áudio no iframe.

## Iframe direto

```html
<iframe
  src="https://SEU-DOMINIO.pages.dev/?embed=1"
  allow="microphone"
  style="width:100%;height:700px;border:0;border-radius:20px">
</iframe>
```

## API

### Catálogo
`GET /api/catalog`

### Conversa em texto
`POST /api/chat`

Exemplo:

```json
{
  "messages": [
    {"role":"user","text":"Quero um perfume fresco para o calor"}
  ],
  "recentRecommendationIds": []
}
```

### Conversa por áudio
O frontend envia WAV base64:

```json
{
  "messages": [],
  "audio": {
    "mimeType":"audio/wav",
    "data":"BASE64..."
  }
}
```

A resposta pode conter:

```json
{
  "reply":"...",
  "recommendationIds":[],
  "suggestedReplies":[],
  "transcript":"..."
}
```
