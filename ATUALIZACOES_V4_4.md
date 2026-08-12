# Nura V4.4 — Voz robusta

- Mantém Gemini 3.1 Flash TTS como voz principal.
- Usa Gemini 2.5 Flash TTS automaticamente como fallback.
- Mantém a voz Achird.
- A leitura automática continua ativada.
- Nunca inicia várias vozes ao mesmo tempo.
- Erros de TTS deixam de ser silenciosos e passam a aparecer no site.
- Adicionado GET /api/tts para diagnóstico seguro (não expõe a chave).
- Corrigida a persistência do botão de voz.
