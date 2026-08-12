# Nura V4.3 — Voz feminina mais amigável e natural

- Modelo TTS padrão atualizado para `gemini-3.1-flash-tts-preview`.
- Voz padrão alterada para `Achird` (perfil Friendly).
- Direção de fala refeita para uma atendente brasileira feminina, acolhedora e conversacional.
- Removido o fallback automático para `speechSynthesis`/voz do Windows, evitando troca para voz robótica quando o Gemini TTS falhar.
- Mantido o controle de voz única e a leitura automática das respostas da V4.2.
- `GEMINI_TTS_MODEL` e `GEMINI_TTS_VOICE` continuam podendo sobrescrever os padrões no Cloudflare.
