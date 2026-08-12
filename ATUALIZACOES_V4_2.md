# Nura V4.2 — Voz automática e reprodução única

- Corrige múltiplas vozes tocando ao mesmo tempo.
- Cancela geração TTS anterior quando chega uma resposta nova.
- Cancela Web Audio, HTML Audio e SpeechSynthesis antes de iniciar nova fala.
- Usa um identificador de sequência para impedir respostas de áudio antigas de começarem depois.
- Desbloqueia Web Audio na primeira interação do usuário.
- Usa Web Audio como reprodução principal do áudio WAV retornado pela Gemini.
- A leitura das novas respostas começa automaticamente quando a voz está ativada.
- A voz automática vem ativada por padrão após esta atualização.
- Também fala respostas do modo demonstração.
