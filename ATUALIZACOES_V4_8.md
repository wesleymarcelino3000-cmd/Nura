# Nura V4.8 — Início da leitura mais rápido

Esta versão NÃO acelera a velocidade da fala.

## O que mudou
- O Gemini 3.1 Flash TTS agora é chamado via `streamGenerateContent`.
- A Nura começa a reproduzir o áudio assim que o primeiro chunk PCM chega.
- Não é mais necessário esperar o arquivo WAV inteiro ser gerado.
- O ritmo e a persona feminina natural da atendente foram mantidos.
- Se o streaming falhar, a Nura usa automaticamente o endpoint TTS tradicional como fallback.
- Continua existindo apenas uma fala ativa por vez.
- Mantém os novos quebra-gelos da V4.7:
  - É para mim
  - Quero dar de presente
  - Quero algo parecido

## Novo endpoint
`POST /api/tts-stream`

A chave Gemini continua somente no Cloudflare e nunca é enviada ao navegador.
