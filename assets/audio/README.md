# assets/audio — enunciados pré-gerados (MP3)

Pipeline ligado em `app.js` na 18ª sessão (item 3 da auditoria). O app já sabe tocar MP3;
falta só a produção em massa (roadmap de assets, passo final).

## Convenção de nome (NÃO renomear depois)
Um MP3 por item, nomeado pelo `item_id`:

    assets/audio/<item_id>.mp3        ex.: assets/audio/FDP-B5-010-R1.mp3

## Como o app resolve a fonte (ordem de prioridade)
1. Se o item tem o campo `audio` (ex.: `"audio":"FDP-B5-010-R1.mp3"`) → toca `assets/audio/<audio>`.
2. Senão → TTS do navegador (fallback), usando `audio_text` se existir, senão `prompt.text`.

## Texto que deve ser gravado
Gravar o **`audio_text`** quando o item tiver esse campo (versão falada, ex.: `1:2`→"um para dois");
caso contrário gravar o `prompt.text`. Ver `app.js:audioText()`.

## Autoplay por perfil de leitura (`reading_profile`)
- `pre_leitor`, `leitor_inicial` → toca automaticamente ao abrir o item.
- `leitor` → só sob demanda no botão 🔊.

## Para publicar áudio em massa
1. Gerar os MP3 (skill `gerar-audios-tts`, voz Chirp3-HD pt-BR aprovada na 12ª sessão).
2. Salvar cada arquivo como `<item_id>.mp3` aqui.
3. Setar `item.audio="<item_id>.mp3"` em `data/items.json` e **regenerar o bundle**.
   (Até lá, todos os itens caem no fallback TTS — nada quebra.)
