/* Método Wanwan — app.js v2 (UI das 3 superfícies).
   Toda a lógica pedagógica vive em engine.js (window.Wanwan).
   Criança: onboarding -> exploração (colocação em escada) -> ilhas/trilhas/missões + estrelas.
   Regras de superfície: criança nunca vê N0-N6; sem ranking; sem cronômetro. */
'use strict';
(function(){
const E=window.Wanwan; E.init(window.APP_DATA);
const LEVELS=E.LEVELS, FORMATS=E.FORMATS, li=E.li, DAY=86400000;
const FMT_LABEL={DIRECT:'Direta',REPR:'Representação',PROBLEM:'Problema',EXPLAIN:'Explicação',VARIATION:'Variação'};
const RARITY_META={comum:{nm:'Comum',em:'🤍',cls:'r-comum'},raro:{nm:'Raro',em:'💙',cls:'r-raro'},epico:{nm:'Épico',em:'💜',cls:'r-epico'},lendario:{nm:'Lendário',em:'💛',cls:'r-lendario'}};
/* fatia vertical: tema Pé de Feijão (SNC/axis 1) */
const BEANSTALK_AXIS=1;
const TREASURE_ART={'SNC-GEM-1':'gema.png','SNC-TROPHY':'trofeu.png'};
function bsImg(f){return 'assets/img/'+f;}
const AXMETA={1:{ic:'🔢',nm:'Contagem'},2:{ic:'🧩',nm:'Partes e Todo'},3:{ic:'🧱',nm:'Dezenas'},
 4:{ic:'➕',nm:'Somar e Subtrair'},5:{ic:'✖️',nm:'Multiplicar'},6:{ic:'➗',nm:'Dividir'},
 7:{ic:'🍕',nm:'Frações'},8:{ic:'🔷',nm:'Formas'},9:{ic:'⏰',nm:'Medidas e Dinheiro'},
 10:{ic:'🔮',nm:'Padrões'},11:{ic:'📊',nm:'Dados e Chance'},12:{ic:'🕵️',nm:'Detetive'}};
const HINT_TEXT={ten_frame:'Complete primeiro uma dezena inteira, depois conte o que sobra.',
 base10:'Lembre: cada barra grande vale 10. Conte as barras primeiro.',
 number_line:'Olhe os números das pontas. Onde ficaria a metade do caminho?',
 choice:'Pense com calma. Uma das opções foi retirada para ajudar.',
 problem:'Ouça de novo a história. O que ela pergunta no final?',
 explain_choice:'Qual explicação combina com o que você faria com os dedos ou blocos?'};

/* ---------- estado ---------- */
const KEY='wanwan_state_v3', OLD_KEY='wanwan_state_v2'; // 06/07/2026: modelo multi-criança (guardian+children[]); migração v2->v3 em E.migrateState
const FLU_TARGET_SEC=6; // limiar de fluencia (s); override por item via item.fluency_target_sec
let S=load();
function load(){
  try{const r=JSON.parse(localStorage.getItem(KEY));if(r&&r.v===3)return ensurePin(E.migrateState(r));}catch(e){}
  try{const old=JSON.parse(localStorage.getItem(OLD_KEY));if(old&&old.v===2)return ensurePin(E.migrateState(old));}catch(e){}
  return ensurePin(E.newState());
}
function ensurePin(s){if(s.parentPin===undefined)s.parentPin=null;return s;}
let saveWarned=false;
function save(){try{localStorage.setItem(KEY,JSON.stringify(S));}catch(e){if(!saveWarned){saveWarned=true;alert('Não consegui salvar o progresso neste navegador (armazenamento cheio ou bloqueado). O jogo continua, mas o progresso pode se perder ao fechar.');}}}
function now(){return Date.now()+S.devDayOffset*DAY;}
/* ---------- preferências de exibição (handoff tela 11): fonte p/ dislexia + alto contraste.
   Preferência de UI deste aparelho (não é dado pedagógico): localStorage próprio, fora do estado do engine. */
const UIP_KEY='wanwan_ui_prefs_v1';
let UIP=(function(){try{return JSON.parse(localStorage.getItem(UIP_KEY))||{};}catch(e){return {};}})();
function applyUiPrefs(){try{const r=document.documentElement;r.setAttribute('data-dys',UIP.dys?'1':'');r.setAttribute('data-contrast',UIP.contrast?'1':'');}catch(e){}}
function saveUiPrefs(){try{localStorage.setItem(UIP_KEY,JSON.stringify(UIP));}catch(e){}}
function mkToggle(label,desc,key){
  const b=el('button','tgl'+(UIP[key]?' on':''));
  b.innerHTML='<span><span class="t-l">'+label+'</span><span class="t-d">'+desc+'</span></span><span class="track"><i></i></span>';
  b.onclick=()=>{UIP[key]=!UIP[key];saveUiPrefs();applyUiPrefs();b.classList.toggle('on',!!UIP[key]);};
  return b;
}

/* ---------- áudio (só TTS de enunciado; nunca grava a criança) ---------- */
let voice=null;
function loadVoice(){const vs=speechSynthesis.getVoices();voice=vs.find(v=>/pt-BR/i.test(v.lang))||vs.find(v=>/pt/i.test(v.lang))||null;}
if('speechSynthesis'in window){loadVoice();speechSynthesis.onvoiceschanged=loadVoice;}
/* speakable: prepara o texto para a voz — troca símbolos matemáticos por palavras (menos/mais/vezes/dividido por/igual a) e colapsa repetições do MESMO emoji que o TTS leria uma a uma (ex.: '6 uvas 🍇🍇🍇🍇🍇🍇' → '6 uvas 🍇'), preservando sequências informativas de ícones distintos (identificação/pictograma/padrão). Só afeta a FALA; o visual do enunciado permanece intacto. */
function speakable(t){if(!t)return t;var s=String(t);s=s.replace(/(\p{Extended_Pictographic}\uFE0F?)(?:\s*\1)+/gu,'$1');s=s.replace(/\u00D7/g,' vezes ').replace(/\u00F7/g,' dividido por ');s=s.replace(/(\d)\s*[xX]\s*(\d)/g,'$1 vezes $2');s=s.replace(/(\d)\s*[-\u2212\u2013\u2014]\s*(\d)/g,'$1 menos $2');s=s.replace(/(\d)\s*\+\s*/g,'$1 mais ');s=s.replace(/\s*=\s*/g,' igual a ');s=s.replace(/(\d)\s*>\s*(\d)/g,'$1 maior que $2').replace(/(\d)\s*<\s*(\d)/g,'$1 menor que $2');return s.replace(/\s{2,}/g,' ').trim();}
function speak(t){if(!('speechSynthesis'in window)||!t)return;try{speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(speakable(t));u.lang='pt-BR';if(voice)u.voice=voice;u.rate=.98;speechSynthesis.speak(u);}catch(e){}}
function rewardLadderStr(rt){var p=[];if(rt.coroas)p.push('👑 '+rt.coroas);if(rt.diamantes)p.push('💎 '+rt.diamantes);if(rt.safiras)p.push('🔷 '+rt.safiras);p.push('⭐ '+rt.estrelas);return p.join(' · ');}
/* ---------- pipeline de enunciado por perfil de leitura (05/07, item 3 da auditoria) ----------
   Prioridade da fonte: MP3 pré-gerado (item.audio) > TTS do navegador.
   Texto falado: item.audio_text (versão para voz) tem prioridade sobre prompt.text (versão lida).
   Autoplay por reading_profile: pré-leitor e leitor inicial ouvem tudo automaticamente;
   leitor pleno só sob demanda no 🔊 (decisão da 12ª sessão: "por criança, sem recorte por nível").
   Convenção p/ geração em massa: dropar o MP3 em assets/audio/<item_id>.mp3 e setar item.audio="<item_id>.mp3". */
/* ==== voz Chirp3-HD (fatia Pé de Feijão): manifesto texto->arquivo. MP3 se houver, senão TTS. ==== */
const AUDIO_MANIFEST={"Quantos pontos você vê? (sem contar um por um)":"v0187d884d5eb819d.mp3","Isso! Você reconheceu 4 num olhar só.":"v7a19214f453c4486.mp3","Olhe o formato: dois em cima e dois embaixo. Isso é 4.":"v5a839b76bf56fae4.mp3","Vamos ver juntos: Isso! Você reconheceu 4 num olhar só.":"vd1185bf5c92cd278.mp3","Mostre 3 no quadro de dez.":"v67952313530c6ad8.mp3","Isso! Você montou 3.":"vb02a995b8be837c8.mp3","Conte de novo: coloque uma ficha para cada, até 3.":"vb067fe474e0fe77f.mp3","Vamos ver juntos: Isso! Você montou 3.":"v33651cd939a2b59f.mp3","Na folha havia joaninhas. Quantas você vê de uma vez?":"v08da12f9be584bcc.mp3","Isso! São 5, como no dado.":"vfab894181ca816b4.mp3","É o formato do 5 no dado: 4 nos cantos e 1 no meio.":"vcc8f2fc97c0e66e9.mp3","Vamos ver juntos: Isso! São 5, como no dado.":"vcacba60b15c2f8ff.mp3","Por que são 4? Escolha os jeitos que mostram o 4 em partes.":"vde0d8e533391c9f2.mp3","Muito bem! Você mostrou 4 como partes juntas.":"v940072a93309c2a8.mp3","Tente ver 4 como partes: 2 e 2, ou 3 e 1.":"v59d5de89284bde34.mp3","Vamos ver juntos: Muito bem! Você mostrou 4 como partes juntas.":"v07d88b16f3bf3b98.mp3","E agora, quantos pontos?":"v160dd0ec178f72f3.mp3","Isso! 3, mesmo em fila.":"v27611f3e27dd1838.mp3","São 3, não importa o arranjo.":"v0aae7ec6ac95270a.mp3","Vamos ver juntos: Isso! 3, mesmo em fila.":"v9a5a179490efc434.mp3","Qual número vem depois do 6?":"va8fe477462a0b817.mp3","Isso! Depois do 6 vem o 7.":"v0cbc8dbde164c989.mp3","Conte devagar: 5, 6, 7. Depois do 6 vem o 7.":"vd946197a6a62d731.mp3","Vamos ver juntos: Isso! Depois do 6 vem o 7.":"vb070b1310ec3dddf.mp3","Conte colocando uma ficha de cada vez até 7.":"vebec88522b53b4d7.mp3","Muito bem! Você contou até 7 sem pular.":"v3eb86ce245e1773d.mp3","Toque contando: 1, 2, 3... pare no 7.":"v4aef848640389389.mp3","Vamos ver juntos: Muito bem! Você contou até 7 sem pular.":"v1361eb1718799538.mp3","Você sobe a escada contando. Parou no degrau depois do 8. Em que degrau está?":"v4a3f762645a356d8.mp3","Isso! Depois do 8 vem o 9.":"vcfeb23b32aceb802.mp3","Depois do 8 vem o 9: 7, 8, 9.":"ve2441de70659b310.mp3","Vamos ver juntos: Isso! Depois do 8 vem o 9.":"v693766551c1b7261.mp3","Contando até 5, qual jeito está certo?":"va4e12389b61799cc.mp3","Certo! A ordem é 1, 2, 3, 4, 5.":"ve313b31ee5e5dd5b.mp3","Sem pular e sem trocar: 1, 2, 3, 4, 5.":"vb9799833c55ad052.mp3","Vamos ver juntos: Certo! A ordem é 1, 2, 3, 4, 5.":"v149917fe36e8a507.mp3","Qual número vem ANTES do 4?":"vbda49f015b78bc9e.mp3","Isso! Antes do 4 vem o 3.":"vae2dff4e94c87bb3.mp3","Conte: 2, 3, 4. Antes do 4 é o 3.":"v70b6d85bd3a5e616.mp3","Vamos ver juntos: Isso! Antes do 4 vem o 3.":"v92fb3c790ea01eb5.mp3","Quantos pontos há?":"v622b23a0d9fb775e.mp3","Isso! São 6.":"vc1a8feb9c9c94415.mp3","Toque em cada ponto uma vez: são 6.":"v2dc7abb77813b15c.mp3","Vamos ver juntos: Isso! São 6.":"v58610134087126cf.mp3","Coloque uma ficha para cada estrela. São 8 estrelas.":"vec768860ed845633.mp3","Muito bem! Uma ficha para cada estrela.":"v4a274739047fe832.mp3","Uma ficha por estrela, sem repetir: 8.":"v8f731ab0c557fc8b.mp3","Vamos ver juntos: Muito bem! Uma ficha para cada estrela.":"v00b2ae3dd9eaf9ee.mp3","Cada criança ganha 1 balão. Estes são os balões. Quantas crianças?":"v348b28d1d6d152ad.mp3","Isso! 7 balões, 7 crianças.":"ve1b6e41f9f6de85e.mp3","Um balão por criança: conte cada um uma vez, são 7.":"v47f1b9d433cf155c.mp3","Vamos ver juntos: Isso! 7 balões, 7 crianças.":"v2f7cbbf03be2dc84.mp3","Como contar sem errar?":"vefcc6de1bb0a21ad.mp3","Certo! Um toque para cada objeto.":"v9c1515b18b25a4ed.mp3","O jeito certo é tocar em cada um, uma vez só.":"v6f13cb7ed8f05f87.mp3","Vamos ver juntos: Certo! Um toque para cada objeto.":"v0ad03ef22ba623cf.mp3","Quantos pontos?":"ve0de46c2194e8d3f.mp3","Isso! São 9.":"v74b3966c12ecf721.mp3","Conte cada ponto uma vez: 9.":"v66b29a04d71af2a3.mp3","Vamos ver juntos: Isso! São 9.":"va4a5159f976608fb.mp3","Você contou 1, 2, 3, 4, 5, 6, 7. Quantos há ao todo?":"v6e17fd12c0c58f44.mp3","Isso! O último número, 7, diz quantos são.":"va6a334e22d821df3.mp3","O último número que você falou, 7, é o total.":"v2123891f90ed7ace.mp3","Vamos ver juntos: Isso! O último número, 7, diz quantos são.":"v6582b3ee9a4bf2b5.mp3","Coloque 6 fichas no quadro, contando uma por uma.":"v57f86066e6de6b3c.mp3","Muito bem! São 6 no total.":"vbcbd51a5b387f358.mp3","O último contado é o total: 6.":"vfa079a8169be5776.mp3","Vamos ver juntos: Muito bem! São 6 no total.":"vc018c88bf0aed89b.mp3","Contamos os patos: 1, 2, 3, 4, 5. Quantos patos há?":"vfd646fa3c39472f4.mp3","Isso! São 5 patos.":"v05f14ff5a5528f65.mp3","Não precisa contar de novo: o último foi 5, então são 5.":"vaab96e42b1986777.mp3","Vamos ver juntos: Isso! São 5 patos.":"v1e37c44e69bbbc15.mp3","Alguém contou 8 blocos. Quantos são?":"ve53ef1b9f371bfbf.mp3","Certo! O último número é o total.":"v41ab26f62cf98df4.mp3","O último número contado já diz quantos são: 8.":"v74ea211d99aefe09.mp3","Vamos ver juntos: Certo! O último número é o total.":"vd8f93827bdf8bfc4.mp3","Você contou até 9 os carrinhos. Quantos carrinhos há?":"v002a60be28126064.mp3","O último número, 9, é a quantidade.":"va8f76728eb1744ce.mp3","Comece no 5 e conte mais um. Qual vem?":"ve57b46964d895913.mp3","Isso! Depois do 5 vem o 6.":"vbfea7b18d09686e2.mp3","Não volte ao 1: depois do 5 é o 6.":"v35f3d143488b65c0.mp3","Vamos ver juntos: Isso! Depois do 5 vem o 6.":"v49853d72258cf661.mp3","Já há 4 fichas. Continue contando até 9.":"v1136771e948b62e9.mp3","Muito bem! Você seguiu de 4 até 9.":"ve75a262cff861029.mp3","Comece do 4 e siga: 5, 6, 7, 8, 9.":"v026afb91f57f36e6.mp3","Vamos ver juntos: Muito bem! Você seguiu de 4 até 9.":"vefe5626e38f566b7.mp3","Comece no 7 e conte mais 3. Em que número você chega?":"vf3966a9a5298419c.mp3","Isso! Chega no 10.":"v7969671c12cfee6b.mp3","A partir do 7: 8, 9, 10.":"v3ad8ee9d1fde5758.mp3","Vamos ver juntos: Isso! Chega no 10.":"v97bfa22d1913d595.mp3","Para contar a partir do 6, o que fazer?":"v875c4b4ad2c21b42.mp3","Certo! Siga do 6: 7, 8, 9.":"v37651bfab3c54d0a.mp3","Não recomece do 1; continue de onde parou.":"v112a876fbf440d26.mp3","Vamos ver juntos: Certo! Siga do 6: 7, 8, 9.":"v0c4a8df9b7446942.mp3","Continue: 12, 13, __":"vafe84fbde046ebfc.mp3","Isso! Vem o 14.":"va1232dd9384cdc41.mp3","Depois de 13 vem 14.":"vc79a3321793dd7e7.mp3","Vamos ver juntos: Isso! Vem o 14.":"v8416f0d1b4c5dd25.mp3","Um grupo tem 7 fichas e outro tem 4. Qual é maior?":"vf4a485bf2c1dd7e1.mp3","Isso! 7 é mais que 4.":"vf4bc208c95bdadd4.mp3","Conte cada grupo: 7 é mais que 4.":"v1cfcbc48a4a0c598.mp3","Vamos ver juntos: Isso! 7 é mais que 4.":"v06692126cb5742f7.mp3","Faça um grupo MAIOR que 5: coloque 8 fichas.":"vc89d7ad49448abeb.mp3","Muito bem! 8 é o grupo maior.":"v959b7d83e8bd0f6e.mp3","O maior aqui é 8.":"v2f9361ccb984f315.mp3","Vamos ver juntos: Muito bem! 8 é o grupo maior.":"v74e7a03ab65dabf3.mp3","Há 6 maçãs e 6 peras. Qual tem mais?":"v2be780ba5221622d.mp3","Isso! 6 e 6 são iguais.":"vd405791e3114074e.mp3","Mesma quantidade: 6 = 6.":"v2d7b6c057171303d.mp3","Vamos ver juntos: Isso! 6 e 6 são iguais.":"v3b5de5efc1a2e725.mp3","8 fichas grandes e 9 pequenas. Qual grupo tem MAIS?":"v0e2d4f6d316aee2f.mp3","Certo! Conta a quantidade, não o tamanho.":"vda58e4bfe2684fc6.mp3","Tamanho não é quantidade: 9 > 8.":"vf29df5a473e00207.mp3","Vamos ver juntos: Certo! Conta a quantidade, não o tamanho.":"v453aa87078a987b3.mp3","Onde há MENOS: 3 ou 9?":"v5e954921aaea307c.mp3","Isso! 3 é menos que 9.":"vc7b20bbd04024254.mp3","Menos é o grupo menor: 3.":"vc070fc2d6ae2689a.mp3","Vamos ver juntos: Isso! 3 é menos que 9.":"v6f0c2c2ba1059e74.mp3","Contando para trás: 10, 9, 8, __?":"vb7518ffa45b46bab.mp3","Isso! Depois de 8 vem 7.":"v7653041952fe2ff9.mp3","Para trás: 8, 7.":"vd7f9ed13cfdf0b34.mp3","Vamos ver juntos: Isso! Depois de 8 vem 7.":"v21f9edcf77effd4c.mp3","Havia 10 fichas. Tire até ficar 6 (conte para trás).":"v85ae8d4014e68daa.mp3","Muito bem! 10, 9, 8, 7, 6.":"va6a4905def2c7205.mp3","Conte para trás até 6.":"vf95130a499d4819f.mp3","Vamos ver juntos: Muito bem! 10, 9, 8, 7, 6.":"ve67fb6b1fbb85cac.mp3","Foguete decolando: 5, 4, 3, __?":"vde0717f89a8b714a.mp3","Isso! Depois de 3 vem 2.":"v66870d44dfd83362.mp3","Regressiva: 3, 2.":"v5f3548d6dc3c0775.mp3","Vamos ver juntos: Isso! Depois de 3 vem 2.":"vc2efae5f02791083.mp3","Qual é a contagem para trás certa a partir de 10?":"vdead36dd10e58b88.mp3","Certo! Para trás é 10, 9, 8, 7.":"v8508ee29ba5db214.mp3","Para trás desce de 1 em 1.":"v65d26267a3236310.mp3","Vamos ver juntos: Certo! Para trás é 10, 9, 8, 7.":"veca70387a6f19b7c.mp3","Regressiva: 7, 6, 5, __?":"v6f8505e940fcc619.mp3","Isso! Depois de 5 vem 4.":"v08c7045c36aac70b.mp3","Para trás: 5, 4.":"v07439091e465ebb9.mp3","Vamos ver juntos: Isso! Depois de 5 vem 4.":"vc6ba696c919d3a0f.mp3","João plantou feijões mágicos e um pé enorme cresceu até o céu. Conte com ele para subir degrau a degrau! Conte os feijões um por um e diga quantos João guardou no bolso.":"vbc19f582ffb3f117.mp3","Conte os feijões um por um e diga quantos João guardou no bolso.":"v8be3b33ebb5a6fea.mp3","Quase! Quer tentar mais uma vez?":"v32cfd0dac041af89.mp3","Muito bem!":"v0a66934e39a451f1.mp3","Uau! Três estrelas!":"v09c8c9814fc71f70.mp3","Muito bem! Missão concluída!":"vab5a5874766115b6.mp3","Missão concluída!":"vc2d3f0217172e1a2.mp3","Você ganhou uma safira!":"v7dfa3bc01afe55bf.mp3","Você ganhou um diamante!":"vc57f61530141e20a.mp3","Você ganhou uma coroa!":"v9c70838aba583d61.mp3","Você achou um tesouro!":"v9e3f4d90e69fc7cd.mp3","Uau! Um tesouro raro!":"v960af44f8a1f5c24.mp3","Complete primeiro uma dezena inteira, depois conte o que sobra.":"v2164f72eecc03a60.mp3","Lembre: cada barra grande vale 10. Conte as barras primeiro.":"v4beb02dbb6e16a43.mp3","Olhe os números das pontas. Onde ficaria a metade do caminho?":"vc3129e0c9e25fa78.mp3","Pense com calma. Uma das opções foi retirada para ajudar.":"v8dd6708e676b1302.mp3","Ouça de novo a história. O que ela pergunta no final?":"vfe7c54e5471b4fb7.mp3","Qual explicação combina com o que você faria com os dedos ou blocos?":"v54a82987d2c16dcb.mp3","Respire fundo e pense no que o problema pergunta.":"vf6a9bf7a364f3836.mp3","Oi! Eu sou a Sofie. Quantos anos você tem?":"v06d651d441df4bcb.mp3","Você já lê sozinho?":"vac6245c0ec2d0f6a.mp3"};
function voicedFile(t){return t&&AUDIO_MANIFEST[t]?('assets/audio/'+AUDIO_MANIFEST[t]):null;}
function voicedSay(t){
  if(!t){return;}
  try{speechSynthesis&&speechSynthesis.cancel();}catch(e){}
  if(_promptAudio){try{_promptAudio.pause();}catch(e){}_promptAudio=null;}
  var f=voicedFile(t);
  if(f){try{_promptAudio=new Audio(f);_promptAudio.play().catch(function(){speak(t);});return;}catch(e){}}
  speak(t);
}
function audioText(item){return (item&&(item.audio_text||(item.prompt&&item.prompt.text)))||'';}
function audioSrc(item){return (item&&item.audio)?('assets/audio/'+item.audio):null;}
let _promptAudio=null;
function playPrompt(item){
  try{speechSynthesis&&speechSynthesis.cancel();}catch(e){}
  if(_promptAudio){try{_promptAudio.pause();}catch(e){}_promptAudio=null;}
  const src=audioSrc(item)||voicedFile(audioText(item));
  if(src){try{_promptAudio=new Audio(src);_promptAudio.play().catch(()=>speak(audioText(item)));return;}catch(e){}}
  speak(audioText(item));
}
function autoPlaysPrompt(){return S.child.reading_profile!=='leitor';}
function maybeAutoPlay(item){if(autoPlaysPrompt())playPrompt(item);}

/* ---------- mascote (handoff): cachorrinho em CSS puro; placeholder até a arte oficial ---------- */
function mascotEl(){
  const m=el('div','mascot');m.setAttribute('aria-hidden','true');
  m.innerHTML='<i class="m-ear l"></i><i class="m-ear r"></i><i class="m-head"></i><i class="m-eye l"></i><i class="m-eye r"></i><i class="m-muz"></i><i class="m-nose"></i><i class="m-tongue"></i>';
  return m;
}
/* ---------- DOM ---------- */
const view=document.getElementById('view');
function el(t,c,h){const e=document.createElement(t);if(c)e.className=c;if(h!=null)e.innerHTML=h;return e;}
function clear(n){while(n.firstChild)n.removeChild(n.firstChild);}
function starHtml(n){let s='';for(let i=0;i<3;i++)s+='<span class="'+(i<n?'':'star-dim')+'">⭐</span>';return s;}

/* ---------- router ---------- */
let runner=null;
// cadeado do modo Criança (06/07/2026): Responsável/Admin ficam escondidos atrás de um
// ícone único enquanto a criança está no app; PIN revela os dois. Nunca persiste — reseta
// a cada carregamento e ao voltar pra Criança (a tela some das mãos de quem destravou).
let parentUnlocked=false;
function render(){
  const childLocked=S.surface==='child'&&!parentUnlocked;
  const parentBtn=document.querySelector('#surfaceSeg [data-s="parent"]');
  const adminBtn=document.querySelector('#surfaceSeg [data-s="admin"]');
  const lockBtn=document.getElementById('lockBtn');
  parentBtn.style.display=childLocked?'none':'';
  adminBtn.style.display=childLocked?'none':'';
  lockBtn.style.display=childLocked?'':'none';
  /* 10/07 handoff: a criança não vê chrome de adulto — modo e superfícies só após o PIN */
  const mt=document.getElementById('modeToggle');if(mt)mt.style.display=childLocked?'none':'';
  const segEl=document.getElementById('surfaceSeg');if(segEl)segEl.style.display=childLocked?'none':'';
  document.querySelectorAll('#surfaceSeg button').forEach(b=>b.classList.toggle('on',b.dataset.s===S.surface));
  document.querySelectorAll('#modeToggle button').forEach(b=>b.classList.toggle('on',b.dataset.mode===S.mode));
  clear(view);
  if(S.surface==='child')renderChild();
  else if(S.surface==='parent')renderParent();
  else renderAdmin();
}
document.getElementById('lockBtn').addEventListener('click',()=>{
  // cadeado agora fica FORA da pílula .seg (para não parecer "Criança trancada"):
  // handler próprio, mesmo efeito de antes (revela Responsável/Admin via PIN, sem trocar de superfície).
  if(gateParentAccess())parentUnlocked=true;
  render();
});
document.getElementById('surfaceSeg').addEventListener('click',e=>{
  const b=e.target.closest('button');if(!b)return;
  const target=b.dataset.s;
  if(S.surface==='child'&&(target==='parent'||target==='admin')&&!parentUnlocked){
    if(!gateParentAccess())return;
    parentUnlocked=true;
  }
  if(target==='child')parentUnlocked=false; // devolve o app pra criança, esconde de novo
  S.surface=target;runner=null;save();render();
});
function gateParentAccess(){
  if(!S.parentPin){
    renderFirstRunPinSetup();
    return false;
  }
  for(let i=0;i<3;i++){
    const p=prompt('Digite o PIN de 4 dígitos:');
    if(p===null)return false;
    if(p===S.parentPin)return true;
    alert(i<2?'PIN incorreto. Tente de novo.':'PIN incorreto. Muitas tentativas — voltando para a Criança.');
  }
  return false;
}
document.getElementById('modeToggle').addEventListener('click',e=>{
  const b=e.target.closest('button');if(!b)return;
  const target=b.dataset.mode;
  // PIN (06/07/2026, correção 3ª auditoria): "com adulto" alimenta explanation_quality→EE;
  // sem gate, a criança sozinha podia se autodeclarar "com adulto" e contaminar a evidência.
  // Reusa o mesmo gateParentAccess() de Responsável/Admin; NÃO seta parentUnlocked (não revela abas).
  if(target==='with_adult'&&S.mode!=='with_adult'&&!gateParentAccess())return;
  S.mode=target;save();render();
});

/* ============================================ CRIANÇA */
function renderChild(){
  if(runner){renderRunnerStep();return;}
  if(!E.hasConsent(S)){renderConsent();return;}
  if(!S.onboarded){renderOnboarding();return;}
  const wrap=el('div','child-wrap');
  const head=el('div','row');head.style.alignItems='center';head.style.justifyContent='space-between';
  const left=el('div','row');left.style.alignItems='center';
  left.appendChild(el('div','avatar',(S.child.nickname||'S').charAt(0).toUpperCase()));
  const hi=el('div');hi.appendChild(el('h2',null,'Oi, '+S.child.nickname+'!'));
  hi.appendChild(el('div','muted small',S.placement.finished?'Para onde vamos hoje?':'Vamos explorar as ilhas da matemática!'));
  left.appendChild(hi);head.appendChild(left);
  head.appendChild(el('div','starbar',rewardLadderStr(E.rewardTiers(S))+' &nbsp;·&nbsp; 🏅 '+S.selos.length));
  wrap.appendChild(head);

  if(!S.placement.finished){
    const prog=placementDoneAxes();
    const mc=el('div','mission-card hero');mc.style.marginTop='16px';
    mc.appendChild(mascotEl());
    mc.appendChild(el('div','kicker','Missão de Exploração'));
    mc.appendChild(el('h2',null,'Explorar as ilhas'));
    mc.appendChild(el('div','sub','Mostre o que você já sabe. Sem pressa, sem nota — é só para eu montar o seu mapa!'));
    const dots=el('div','progress-dots');
    for(let i=0;i<prog.total;i++){const d=el('i');if(i<prog.done)d.classList.add('done');if(i===prog.done)d.classList.add('now');dots.appendChild(d);}
    mc.appendChild(dots);
    mc.appendChild(el('div','small muted',prog.done+' de '+prog.total+' ilhas exploradas'));
    const b=el('button','big-btn',prog.done?'Continuar explorando':'Começar a explorar');b.style.marginTop='12px';
    b.onclick=startPlacement;mc.appendChild(b);wrap.appendChild(mc);
    view.appendChild(wrap);return;
  }

  /* hero "Missão do dia" (design handoff v2, tela 1: fundo marca-escura + CTA âmbar pill) */
  const mc=el('div','mission-card hero');mc.style.marginTop='16px';
  mc.appendChild(mascotEl());
  mc.appendChild(el('div','kicker','Missão do dia'));
  mc.appendChild(el('h2',null,'Sua aventura de hoje'));
  mc.appendChild(el('div','sub','Atividades escolhidas só para você — com revisão do que você já conquistou.'));
  const cta=el('div','hero-cta');
  const b=el('button','big-btn','Começar missão');b.style.width='auto';
  b.onclick=startDailyMission;cta.appendChild(b);
  cta.appendChild(el('div','eta','≈ 10 min'));
  mc.appendChild(cta);
  const b2=el('button','big-btn alt','🎮 Jogos');b2.style.marginTop='12px';b2.onclick=renderGames;mc.appendChild(b2);
  wrap.appendChild(mc);
  const cst0=E.collectionStatus(S);
  const cofreCard=el('div','mission-card');cofreCard.style.marginTop='12px';
  cofreCard.appendChild(el('div',null,'<div style="font-size:34px">🧰</div>'));
  cofreCard.appendChild(el('h3',null,'Meu Cofre de Tesouros'));
  cofreCard.appendChild(el('div','muted small','Você já tem '+cst0.have+' de '+cst0.total+' tesouros. Cumpra missões para achar os que faltam!'));
  const cofreBtn=el('button','big-btn cofre-btn','Abrir o Cofre');cofreBtn.style.marginTop='10px';cofreBtn.onclick=renderCofre;cofreCard.appendChild(cofreBtn);
  wrap.appendChild(cofreCard);

  wrap.appendChild(el('h3',null,'<span style="font-family:var(--font-display)">Minhas ilhas</span>')).style.marginTop='18px';
  const grid=el('div','islands');
  window.APP_DATA.taxonomy.axes.forEach(ax=>{
    const meta=AXMETA[ax.axis_id]||{ic:'📚',nm:ax.name};
    const prog=E.axisProgress(S,ax.axis_id);
    const card=el('div','island'+(prog==null?' locked':''));
    card.appendChild(el('div','ic',meta.ic));
    card.appendChild(el('div','nm',meta.nm));
    if(ax.axis_id===BEANSTALK_AXIS)card.classList.add('isl-snc');
    if(prog==null){card.appendChild(el('div','soon','em breve'));}
    else{
      const ring=el('div','ring');ring.style.setProperty('--p',Math.round(prog*100));
      ring.appendChild(el('b',null,Math.round(prog*100)+'%'));card.appendChild(ring);
      const selos=S.selos.filter(x=>E.skillById(x.skill_id).axis_id===ax.axis_id).length;
      if(selos)card.appendChild(el('div','soon','🏅 '+selos));
      card.onclick=()=>renderTrail(ax.axis_id);
    }
    grid.appendChild(card);
  });
  wrap.appendChild(grid);
  view.appendChild(wrap);
}
function renderOnboarding(){
  const wrap=el('div','child-wrap');
  const mc=el('div','mission-card');
  mc.appendChild(el('div',null,'<div style="font-size:46px">👋</div>'));
  mc.appendChild(el('h2',null,'Oi! Eu sou a Sofie.'));
  if(!S.child.age_band){
    mc.appendChild(el('div','muted','Quantos anos você tem?'));
    const g=el('div','bigchoice');
    /* 07/07/2026 (3ª auditoria): faixas antigas se sobrepunham (6,7,8,10,11 cabiam em 2 botões
       ao mesmo tempo). Cada idade agora aparece em exatamente um botão — ver engine.js ENTRY_LADDER. */
    [['5-6','5 ou 6 anos'],['7','7 anos'],['8','8 anos'],['9-10','9 ou 10 anos'],['11','11 anos'],['12','12 anos']].forEach(([v,t])=>{
      const b=el('button',null,t);b.onclick=()=>{S.child.age_band=v;save();render();};g.appendChild(b);});
    mc.appendChild(g);
  }else{
    mc.appendChild(el('div','muted','Você já lê sozinho(a)?'));
    const g=el('div','bigchoice');
    [['pre_leitor','🐣 Ainda não leio'],['leitor_inicial','🌱 Leio um pouquinho'],['leitor','🚀 Leio sozinho(a)!']].forEach(([v,t])=>{
      const b=el('button',null,t);b.onclick=()=>{S.child.reading_profile=v;S.onboarded=true;save();render();};g.appendChild(b);});
    mc.appendChild(g);
    mc.appendChild(el('div','note','Tudo aqui pode ser ouvido no 🔊 — ler não é obrigatório.'));
  }
  wrap.appendChild(mc);view.appendChild(wrap);
  voicedSay(S.child.age_band?'Você já lê sozinho?':'Oi! Eu sou a Sofie. Quantos anos você tem?');
}
function placementDoneAxes(){
  const pl=S.placement,groups=E.sessionAxisGroups(S.child.age_band);
  let n=0;
  for(let p=0;p<pl.part;p++)n+=groups[p].length;
  n+=pl.axisIdx;
  const total=groups.reduce((a,g)=>a+g.length,0);
  return {done:Math.min(total,n),total};
}
/* ---------- trilha de um eixo ---------- */
function renderTrail(axisId){
  clear(view);const wrap=el('div','child-wrap');
  const meta=AXMETA[axisId];
  const back=el('button','btn ghost','← Ilhas');back.onclick=render;wrap.appendChild(back);
  wrap.appendChild(el('h2',null,meta.ic+' '+meta.nm));
  wrap.appendChild(el('div','muted small','Cada degrau é uma nova conquista. Complete o caminho!'));
  const tale=E.taleOf(axisId);
  if(tale){
    const doneCh=(tale.chapters||[]).filter(ch=>E.chapterComplete(S,ch.skills)).length;
    const progTxt='Capítulos concluídos: '+doneCh+' de '+(tale.chapters||[]).length+' · o baú abre ao dominar cada capítulo.';
    if(axisId===BEANSTALK_AXIS){
      const hero=el('div','snc-hero');
      const jb=el('img','joao');jb.src=bsImg('joao.png');jb.alt='João';jb.setAttribute('aria-hidden','true');hero.appendChild(jb);
      hero.appendChild(el('h3',null,'📖 '+tale.title));
      hero.appendChild(el('div','goal','🎯 '+tale.goal));
      hero.appendChild(el('div','prog',progTxt));
      wrap.appendChild(hero);
    }else{
      const tb=el('div','tale-band');
      tb.appendChild(el('h3',null,'📖 '+tale.title));
      tb.appendChild(el('div','goal',tale.goal));
      tb.appendChild(el('div','small muted',progTxt));
      wrap.appendChild(tb);
    }
  }
  const trail=el('div','trail');
  E.axisSkills(axisId).forEach(s=>{
    const playable=E.itemsBySkill(s.skill_id).length>0;
    const m=E.mastery(S,s.skill_id);
    const unlocked=E.unlocked(S,s.skill_id);
    const cell=el('button','tcell'+(playable?(unlocked?'':' locked'):' ghost'));
    const ic=el('div',null,playable?(unlocked?(li(m.level)>=li(s.level_target||'N5')?'🏅':'🟢'):'🔒'):'🌫️');
    ic.style.fontSize='22px';cell.appendChild(ic);
    const mid=el('div');mid.style.flex='1';
    mid.appendChild(el('div',null,'<b style="font-size:14px">'+childDesc(s)+'</b>'));
    const seg=el('div','seg6');
    for(let i=1;i<=6;i++){const b=el('i');if(li(m.level)>=i)b.classList.add(m.level==='N6'?'gold':'on');seg.appendChild(b);}
    mid.appendChild(seg);cell.appendChild(mid);
    if(playable&&unlocked){
      cell.onclick=()=>startMission(s);
    }else if(!playable){cell.appendChild(el('span','soon','em breve'));}
    trail.appendChild(cell);
  });
  wrap.appendChild(trail);view.appendChild(wrap);
}
/* ---------- abertura narrativa da missão (o "onde se quer chegar") ---------- */
function chapterFor(skill){
  const tale=E.taleOf(skill.axis_id);if(!tale)return null;
  const ch=(tale.chapters||[]).find(c=>(c.skills||[]).includes(skill.skill_id));
  return ch?{tale,ch}:null;
}
function startMission(skill){
  const ci=chapterFor(skill);
  if(!ci){startSession(E.buildMission(S,now(),skill.skill_id));return;} // sem conto: começa direto
  renderMissionIntro(skill,ci);
}
// Missão do dia (botão da home): também abre com a cena do conto. Antes chamava
// startSession direto e a criança nunca via a introdução (bug 08/07/2026). Usa o FOCO
// da missão já construída p/ achar o capítulo, e inicia ESSA missão (sem rebuild).
function startDailyMission(){
  const mis=E.buildMission(S,now());
  const foc=mis&&mis.focus?E.skillById(mis.focus):null;
  const ci=foc?chapterFor(foc):null;
  if(!ci){startSession(mis);return;} // sem conto/sem foco: começa direto
  renderMissionIntro(foc,ci,{session:mis,onBack:()=>render()});
}
function renderMissionIntro(skill,ci,opts){
  opts=opts||{};
  clear(view);const wrap=el('div','child-wrap');
  const meta=AXMETA[skill.axis_id];
  const isFirst=!!(ci.tale.chapters&&ci.tale.chapters[0]&&ci.tale.chapters[0].id===ci.ch.id);
  const say=(isFirst&&ci.tale.intro?ci.tale.intro+' ':'')+ci.ch.beat; // 1ª missão da ilha: abre com a cena do conto
  const back=el('button','btn ghost','\u2190 Voltar');back.onclick=opts.onBack||(()=>renderTrail(skill.axis_id));wrap.appendChild(back);
  const card=el('div','mission-card');card.style.textAlign='center';
  const _bs=(skill.axis_id===BEANSTALK_AXIS);
  if(_bs){
    card.appendChild(el('div','scene-stage'));
  }else{
    card.appendChild(el('div',null,'<div style="font-size:52px">'+(meta&&meta.ic||'\ud83d\udcd6')+'</div>'));
  }
  card.appendChild(el('div','pill learn','\ud83d\udcd6 '+ci.tale.title));
  if(isFirst&&ci.tale.intro){const sc=el('div','reveal-line d1',ci.tale.intro);sc.style.cssText='font-size:15px;font-style:italic;margin:8px 6px;color:#555;line-height:1.4';card.appendChild(sc);}
  card.appendChild(el('h2','reveal-line d1',ci.ch.title));
  const beat=el('div','reveal-line d2',ci.ch.beat);beat.style.cssText='font-size:17px;margin:10px 6px;line-height:1.45';card.appendChild(beat);
  card.appendChild(el('div','small muted reveal-line d3','\ud83c\udfaf '+ci.tale.goal));
  const row=el('div','row');row.style.cssText='justify-content:center;gap:10px;margin-top:14px';
  const sb=el('button','speak','\ud83d\udd0a');sb.title='Ouvir de novo';sb.onclick=()=>voicedSay(say);row.appendChild(sb);
  const go=el('button','big-btn','Come\u00e7ar!');go.onclick=()=>startSession(opts.session||E.buildMission(S,now(),skill.skill_id));row.appendChild(go);
  card.appendChild(row);
  wrap.appendChild(card);view.appendChild(wrap);
  if(autoPlaysPrompt())voicedSay(say); // narra só p/ pré-leitor/leitor inicial; o mais velho lê e usa 🔊 se quiser
}
function childDesc(s){
  const d=s.description;return d.length>64?d.slice(0,62)+'…':d;
}
/* ---------- jogos ---------- */
function renderGames(){
  clear(view);const wrap=el('div','child-wrap');
  const back=el('button','btn ghost','← Voltar');back.onclick=render;wrap.appendChild(back);
  wrap.appendChild(el('h2',null,'Jogos com matemática de verdade'));
  const games=[
    {t:'Complete a Dezena',d:'Complete o quadro de dez para descobrir as partes do número.',sk:'AS-B2-002',ic:'🔟'},
    {t:'Monta-Número',d:'Construa o número com barras e cubinhos.',sk:'VP-B2-001',ic:'🧱'},
    {t:'Salto na Reta',d:'Coloque o número no lugar certo da reta.',sk:'SNC-B2-003',ic:'➡️'}];
  games.forEach(g=>{
    const c=el('div','mission-card');c.style.textAlign='left';c.style.marginTop='12px';
    c.appendChild(el('div',null,'<span style="font-size:32px">'+g.ic+'</span> <b>'+g.t+'</b>'));
    c.appendChild(el('div','muted small',g.d));
    const b=el('button','big-btn alt','Jogar');b.style.marginTop='10px';
    b.onclick=()=>startSession({kind:'game',mode:S.mode,items:E.itemsBySkill(g.sk).filter(i=>['REPR','DIRECT'].includes(i.evidence_format)).map(it=>({item:it,rec_type:'practice',reason:'jogo'}))});
    c.appendChild(b);wrap.appendChild(c);
  });
  view.appendChild(wrap);
}

/* ---------- colocação (exploração) ---------- */
function startPlacement(){
  const rec={session_id:'s'+(S.sessions.length+1),child_id:S.child.child_id,kind:'placement',mode:S.mode,started_at:now(),items_planned:null,items_completed:0};
  S.sessions.push(rec);
  runner={kind:'placement',answered:false,count:0,events:[],sessionId:rec.session_id};
  save();
  nextPlacementStep();
}
function nextPlacementStep(){
  // fim de sessão do diagnóstico (§8.4): para aqui, sem emendar direto na próxima sessão de eixos.
  if(S.placement.lastSessionBoundary){
    S.placement.lastSessionBoundary=false;save();
    renderPlacementDone('session');return;
  }
  const axBefore=E.placementAxis(S);
  const it=E.nextPlacementItem(S);
  save();
  if(!it){
    if(S.placement.finished){renderPlacementDone();return;}
    // eixo terminou dentro da mesma sessão — segue para o próximo
    const it2=E.nextPlacementItem(S);save();
    if(!it2){renderPlacementDone('axis');return;}
    runner.item=it2;runner.answered=false;renderRunnerStep();return;
  }
  runner.item=it;runner.answered=false;renderRunnerStep();
}
function renderPlacementDone(reason){
  clear(view);const wrap=el('div','child-wrap');
  const c=el('div','mission-card celebrate');
  const finished=S.placement.finished;
  reason=finished?'finished':(reason||'axis');
  const cfg={
    finished:{ic:'🗺️✨',title:'Mapa completo!',msg:'Agora eu sei por onde começar. Suas missões estão prontas!',btn:'Ver minhas ilhas'},
    session:{ic:'🎉',title:'Você explorou bastante por agora!',msg:'Vamos fazer outra coisa — você pode continuar explorando quando quiser.',btn:'Voltar ao início'},
    axis:{ic:'⛵',title:'Ilha explorada!',msg:'Descanse um pouco ou siga para a próxima ilha.',btn:'Voltar ao início'}
  }[reason];
  c.appendChild(el('div',null,'<div style="font-size:56px">'+cfg.ic+'</div>'));
  c.appendChild(el('h2',null,cfg.title));
  c.appendChild(el('div','muted',cfg.msg));
  const b=el('button','big-btn',cfg.btn);b.style.marginTop='14px';
  b.onclick=()=>{runner=null;save();render();};c.appendChild(b);
  wrap.appendChild(c);view.appendChild(wrap);
  runner=null;save();
}

/* ---------- sessões (missão/jogo) ---------- */
function startSession(sess){
  if(!sess.items.length){alert('Sem itens disponíveis aqui ainda.');return;}
  const rec={session_id:'s'+(S.sessions.length+1),child_id:S.child.child_id,kind:sess.kind,mode:S.mode,started_at:now(),items_planned:sess.items.length,items_completed:0};
  S.sessions.push(rec);
  runner={kind:sess.kind,sess,idx:0,answered:false,events:[],selosGanhos:[],answeredCount:0,mistakes:0,step:null,sessionId:rec.session_id};
  save();renderRunnerStep();
}
function endSession(showStars){
  const rec=S.sessions[S.sessions.length-1];if(rec){rec.ended_at=now();rec.items_completed=runner.answeredCount;}
  if(showStars&&runner.kind!=='placement'){
    const st=E.sessionStars(runner.events,runner.answeredCount,runner.sess.items.length,runner.mistakes);
    const _starsBefore=S.stars;
    S.stars+=st.stars;S.starLog.push({ts:now(),stars:st.stars,why:st.why});
    const crossed=E.tierCrossed(_starsBefore,S.stars);
    const selos=runner.selosGanhos.slice();
    const treasureChanges=E.evaluateTreasures(S,now());
    runner=null;save();renderStars(st,selos,treasureChanges,crossed);return;
  }
  runner=null;save();render();
}
function renderStars(st,selos,treasureChanges,crossed){
  clear(view);const wrap=el('div','child-wrap');
  const c=el('div','mission-card celebrate');
  c.appendChild(el('div',null,'<div style="font-size:52px">🎉</div>'));
  c.appendChild(el('h2',null,'Missão concluída!'));
  c.appendChild(el('div','stars-big',starHtml(st.stars)));
  st.why.forEach(w=>c.appendChild(el('div','small muted','✓ '+w)));
  const _rt=E.rewardTiers(S);
  if(crossed){const _nm={safira:'uma safira 🔷',diamante:'um diamante 💎',coroa:'uma coroa 👑'}[crossed];
    const _tp=el('div',null,'✨ Você ganhou '+_nm+'!');_tp.style.cssText='font-size:20px;font-weight:800;margin:8px 0;color:#2a6ad1';c.appendChild(_tp);}
  const _rl=el('div',null,rewardLadderStr(_rt));_rl.style.cssText='font-size:22px;margin-top:6px';c.appendChild(_rl);
  c.appendChild(el('div','small muted','Faltam '+_rt.toNextSafira+' ⭐ para a próxima safira 🔷'));
  c.appendChild(el('div','small muted','Sem notas, sem comparação. Este é o seu caminho.'));
  if(selos.length){
    c.appendChild(el('h3',null,'Novos selos!'));
    selos.forEach(sk=>{const s=E.skillById(sk);c.appendChild(el('span','selo'+(S.selos.find(x=>x.skill_id===sk&&x.gold)?' gold':''),'🏅 '+AXMETA[s.axis_id].nm));});
  }
  const hasT=treasureChanges&&treasureChanges.length;
  const b=el('button','big-btn'+(hasT?' cofre-btn':''),hasT?'🎁 Abrir o baú!':'Voltar ao início');b.style.marginTop='14px';
  b.onclick=hasT?(()=>renderTreasureReveal(treasureChanges)):render;c.appendChild(b);
  wrap.appendChild(c);view.appendChild(wrap);
  const _msg=crossed?('Você ganhou '+({safira:'uma safira!',diamante:'um diamante!',coroa:'uma coroa!'}[crossed])):(st.stars>=3?'Uau! Três estrelas!':(st.stars>=1?'Muito bem! Missão concluída!':'Missão concluída!'));
  voicedSay(_msg);
}
function treasureCatalogItem(tid){return ((window.APP_DATA&&window.APP_DATA.treasures)||[]).find(t=>t.id===tid)||null;}
function renderTreasureReveal(changes){
  clear(view);const wrap=el('div','child-wrap');
  const c=el('div','mission-card celebrate');
  c.appendChild(el('div',null,'<img class="art-chest" src="assets/img/bau.png" alt="baú do tesouro">'));
  c.appendChild(el('h2',null,changes.length>1?'Baús abertos!':'Baú aberto!'));
  changes.forEach(ch=>{
    const t=treasureCatalogItem(ch.treasure);if(!t)return;
    const rm=RARITY_META[ch.rarity]||RARITY_META.comum;
    const card=el('div','tcard '+rm.cls);card.style.margin='10px auto';card.style.maxWidth='210px';
    if(TREASURE_ART[ch.treasure]){card.appendChild(el('div',null,'<img class="art-treasure" src="'+bsImg(TREASURE_ART[ch.treasure])+'" alt="'+(t.name||'tesouro')+'">'));}else{card.appendChild(el('div','em reveal-treasure',t.emoji||'💎'));}
    card.appendChild(el('div','tn',t.name));
    card.appendChild(el('div','rar',rm.nm));
    if(!ch.isNew&&ch.upgradedFrom)card.appendChild(el('div','where','Evoluiu de '+((RARITY_META[ch.upgradedFrom]||{nm:ch.upgradedFrom}).nm)+'!'));
    c.appendChild(card);
  });
  c.appendChild(el('div','muted small','Guardado no seu Cofre.'));
  const b=el('button','big-btn cofre-btn','Ver meu Cofre');b.style.marginTop='12px';b.onclick=renderCofre;c.appendChild(b);
  const b2=el('button','big-btn alt','Voltar ao início');b2.style.marginTop='10px';b2.onclick=render;c.appendChild(b2);
  wrap.appendChild(c);view.appendChild(wrap);
  voicedSay(changes.some(ch=>ch.rarity==='lendario'||ch.rarity==='epico')?'Uau! Um tesouro raro!':'Você achou um tesouro!');
}
function renderCofre(){
  clear(view);const wrap=el('div','child-wrap');
  const back=el('button','btn ghost','← Voltar');back.onclick=render;wrap.appendChild(back);
  const cst=E.collectionStatus(S);
  const h=el('div');h.style.marginTop='8px';
  h.appendChild(el('h2',null,'🧰 Meu Cofre de Tesouros'));
  h.appendChild(el('div','muted small','Você tem '+cst.have+' de '+cst.total+' tesouros.'));
  wrap.appendChild(h);
  const leg=el('div','rar-legend');
  [['lendario','Lendário'],['epico','Épico'],['raro','Raro'],['comum','Comum']].forEach(function(p){
    const rm=RARITY_META[p[0]];leg.appendChild(el('span','pill',rm.em+' '+p[1]+': '+cst.byRarity[p[0]]));
  });
  wrap.appendChild(leg);
  const tales=(window.APP_DATA&&window.APP_DATA.tales)||{};
  window.APP_DATA.taxonomy.axes.forEach(function(ax){
    const tale=tales[String(ax.axis_id)];if(!tale)return;
    const items=cst.items.filter(t=>t.axis_id===ax.axis_id);
    if(!items.length)return;
    const band=el('div','tale-band');band.style.marginTop='16px';
    band.appendChild(el('h3',null,'📖 '+tale.title));
    const grid=el('div','treasure-grid');
    items.forEach(function(t){
      const owned=t.owned;const rm=owned?(RARITY_META[t.rarity]||RARITY_META.comum):null;
      const card=el('div','tcard '+(owned?rm.cls:'locked'));
      if(owned&&TREASURE_ART[t.id]){card.appendChild(el('div',null,'<img class="art-treasure" style="width:88px" src="'+bsImg(TREASURE_ART[t.id])+'" alt="'+(t.name||'tesouro')+'">'));}else{card.appendChild(el('div','em',owned?(t.emoji||'💎'):'❔'));}
      card.appendChild(el('div','tn',owned?t.name:'???'));
      if(owned){card.appendChild(el('div','rar',rm.nm));}
      else{const ch=E.treasureChapter(ax.axis_id,t.chapter);card.appendChild(el('div','where','🔒 '+(ch?ch.beat:'Continue a aventura para conquistar.')));}
      grid.appendChild(card);
    });
    band.appendChild(grid);wrap.appendChild(band);
  });
  wrap.appendChild(el('div','note','Mais ilhas e tesouros chegam em breve. Cada baú abre quando você domina um capítulo da história — sem sorteio, é conquista sua!'));
  view.appendChild(wrap);
}
function currentItem(){return runner.kind==='placement'?runner.item:runner.sess.items[runner.idx].item;}
function renderRunnerStep(){
  clear(view);
  if(runner.kind!=='placement'&&runner.idx>=runner.sess.items.length){endSession(true);return;}
  const item=currentItem();
  runner.step={tries:0,support:'none',firstError:null,hintUsed:false};
  const wrap=el('div','child-wrap');
  const top=el('div','row');top.style.justifyContent='space-between';top.style.alignItems='center';
  const bx=el('button','btn ghost','⏸ Pausar');bx.onclick=()=>{if(confirm('Pausar? O progresso fica salvo.'))endSession(false);};
  top.appendChild(bx);
  const isPl=runner.kind==='placement';
  const ax=isPl?E.skillById(item.skill_id).axis_id:null;
  top.appendChild(el('div','pill '+(isPl?'learn':'ok'),isPl?('🗺️ explorando: '+AXMETA[ax].nm):(runner.kind==='game'?'jogo':'missão')));
  wrap.appendChild(top);
  if(!isPl){
    const dots=el('div','progress-dots');
    runner.sess.items.forEach((_,i)=>{const d=el('i');if(i<runner.idx)d.classList.add('done');if(i===runner.idx)d.classList.add('now');dots.appendChild(d);});
    wrap.appendChild(dots);
    wrap.appendChild(el('div','small muted center',(runner.idx+1)+' de '+runner.sess.items.length));
  }
  const card=el('div','mission-card');card.style.textAlign='center';
  /* enunciado como botão de áudio (handoff): pill marca-soft com play + equalizador; todo enunciado é ouvível */
  const ap=el('button','audio-pill');ap.title='Ouvir o enunciado';
  ap.appendChild(el('span','ap-ic'));
  ap.appendChild(el('span','ap-txt',item.prompt.text));
  ap.appendChild(el('span','eq','<i></i><i></i><i></i>'));
  ap.onclick=()=>{playPrompt(item);ap.classList.add('playing');setTimeout(()=>ap.classList.remove('playing'),2200);};
  card.appendChild(ap);
  if(item.requires_adult)card.appendChild(el('div','pill adult','✋ Fazer com um adulto'));
  const stage=el('div','stage');card.appendChild(stage);
  const fbHost=el('div');card.appendChild(fbHost);
  const navHost=el('div');navHost.style.marginTop='12px';card.appendChild(navHost);
  // dica (não na exploração — lá medimos sem apoio)
  if(!isPl){
    const hb=el('button','hintbtn','💡 Quero uma dica');hb.style.marginTop='10px';
    hb.onclick=()=>{hb.disabled=true;runner.step.support='hint';runner.step.hintUsed=true;applyHint(item,stage,card);};
    card.appendChild(hb);
  }
  wrap.appendChild(card);view.appendChild(wrap);
  maybeAutoPlay(item);
  runner.step.t0=Date.now();
  renderItem(item,stage,res=>onAnswer(item,res,fbHost,navHost,stage),{reveal:isPl}); // C-02: 1º render de missão/jogo não revela; no diagnóstico a resposta é final
}
function applyHint(item,stage,card){
  const txt=HINT_TEXT[item.kind]||'Respire fundo e pense no que o problema pergunta.';
  if(item.kind==='choice'||item.kind==='problem'||item.kind==='explain_choice'){
    // elimina uma opção errada
    const opts=Array.from(stage.querySelectorAll('.opt')).filter(b=>!b.disabled&&!b.classList.contains('faded'));
    const wrong=opts.filter(b=>{
      if(item.kind==='explain_choice')return true; // tratado abaixo
      return String(b.textContent)!==String(item.correct_answer);
    });
    let target=null;
    if(item.kind==='explain_choice'){
      const p=item.payload;const corr=Array.isArray(item.correct_answer)?item.correct_answer:[item.correct_answer];
      const wrongLabels=p.options.filter(o=>!corr.includes(o.id)).map(o=>String(o.label));
      target=opts.find(b=>wrongLabels.includes(b.textContent))||null; // C-01: achar pelo rótulo, não pelo índice
    }else if(wrong.length)target=wrong[0];
    if(target)target.classList.add('faded');
  }
  card.appendChild(el('div','note','💡 '+txt));
  voicedSay(txt);
}
function onAnswer(item,res,fbHost,navHost,stage){
  if(runner.answered)return;
  const st=runner.step;st.tries++;
  const isPl=runner.kind==='placement';
  if(!res.correct&&st.tries===1&&!isPl){
    st.firstError=res.errorPattern||null;
    clear(fbHost);
    const fb=el('div','feedback no','<div class="fb-h"><span class="fb-ic">?</span>Quase! Quer tentar mais uma vez?</div>');fbHost.appendChild(fb);
    voicedSay('Quase! Quer tentar mais uma vez?');
    clear(navHost);
    const retry=el('button','big-btn alt','Tentar de novo');
    retry.onclick=()=>{clear(fbHost);clear(navHost);runner.step.t0=Date.now();renderItem(item,stage,r=>onAnswer(item,r,fbHost,navHost,stage),{reveal:true});}; // C-02: 2ª tentativa é final
    navHost.appendChild(retry);
    return;
  }
  runner.answered=true;runner.answeredCount++;
  const final={correct:res.correct,partial:false,support:st.support,attempt:st.tries,
    errorPattern:res.correct?null:(res.errorPattern||st.firstError),
    explanation_quality:res.explanation_quality||null,
    fluent:(function(){var s=E.skillById(item.skill_id);return !!(s&&s.fluency&&res.correct&&st.support==='none'&&st.tries===1&&(Date.now()-(st.t0||Date.now()))<=((item.fluency_target_sec||FLU_TARGET_SEC)*1000));})()};
  let out;
  if(isPl){
    E.recordPlacement(S,item,final,now(),runner.sessionId);
  }else{
    out=E.recordAttempt(S,item,final,now(),runner.sess.items[runner.idx].rec_type||'mission',runner.sessionId);
    if(final.attempt>1)runner.mistakes++; // 3ª estrela (missão limpa): tropeço = não acertou de primeira
    runner.events.push(...out.evts);
    out.evts.filter(e=>e==='selo').forEach(()=>runner.selosGanhos.push(item.skill_id));
  }
  save();
  clear(fbHost);
  const fb=el('div','feedback '+(res.correct?'ok':'no'));
  let msg=res.correct?(item.feedback_correct||'Muito bem!'):
    ((item.feedback_error&&(item.feedback_error[String(res.rawValue)]||item.feedback_error[res.errorPattern]||item.feedback_error.default))||'Vamos ver juntos: '+(item.feedback_correct||''));
  fb.innerHTML='<div class="fb-h"><span class="fb-ic">'+(res.correct?'✓':'?')+'</span>'+(res.correct?'Isso mesmo!':'Vamos pensar juntos')+'</div><div class="fb-b">'+msg+'</div>';fbHost.appendChild(fb);voicedSay(msg);
  clear(navHost);
  const last=isPl?false:runner.idx>=runner.sess.items.length-1;
  const next=el('button','big-btn',isPl?'Próxima':(last?'Terminar':'Próxima'));
  next.onclick=()=>{
    if(isPl){runner.answered=false;nextPlacementStep();}
    else{runner.idx++;runner.answered=false;renderRunnerStep();}
  };
  navHost.appendChild(next);
}

/* ---------- renderizadores por tipo ---------- */
function renderItem(item,stage,cb,ropts){
  clear(stage);
  switch(item.kind){
    case 'choice':case 'problem':return renderChoice(item,stage,cb,ropts);
    case 'ten_frame':return renderTenFrame(item,stage,cb);
    case 'base10':return renderBase10(item,stage,cb);
    case 'number_line':return renderNumberLine(item,stage,cb);
    case 'explain_choice':return renderExplain(item,stage,cb);
    default:stage.appendChild(el('div','muted','[tipo não suportado]'));
  }
}
function dotCard(n,arr){
  const c=el('div','dotcard');
  const layout=arr==='line'?[n]:diceRows(n);
  layout.forEach(r=>{const row=el('div','dc-row');for(let i=0;i<r;i++)row.appendChild(el('span','dc-dot'));c.appendChild(row);});
  return c;
}
function diceRows(n){const map={1:[1],2:[1,1],3:[1,1,1],4:[2,2],5:[2,1,2],6:[3,3]};return map[n]||[n];}
function base10Static(t,u){
  const z=el('div','b10-zone');
  const tc=el('div','b10-col');const bars=el('div','bars');for(let i=0;i<t;i++)bars.appendChild(el('span','bar10'));tc.appendChild(bars);tc.appendChild(el('div','muted small',t+' dezena(s)'));
  const uc=el('div','b10-col');const cubes=el('div','cubes');for(let i=0;i<u;i++)cubes.appendChild(el('span','cube'));uc.appendChild(cubes);uc.appendChild(el('div','muted small',u+' unidade(s)'));
  z.append(tc,uc);return z;
}
function renderChoice(item,stage,cb,ropts){
  ropts=ropts||{};
  const p=item.payload;
  if(p.dots!=null)stage.appendChild(dotCard(p.dots,p.arrangement));
  else if(p.tens!=null)stage.appendChild(base10Static(p.tens,p.units));
  else if(p.expression)stage.appendChild(el('div',null,'<div style="font-size:40px;font-weight:800">'+p.expression+' = ?</div>'));
  const grid=el('div','opt-grid');
  const opts=p.options.slice(); // C-01 (4ª auditoria): embaralhar NO RENDER — nunca confiar na ordem dos dados
  for(let i=opts.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));const t=opts[i];opts[i]=opts[j];opts[j]=t;}
  opts.forEach(v=>{
    const b=el('button','opt',String(v));
    b.onclick=()=>{
      const correct=v==item.correct_answer;
      Array.from(grid.children).forEach(x=>x.disabled=true);
      b.classList.add(correct?'correct':'wrong');
      if(!correct&&ropts.reveal!==false){const t=Array.from(grid.children).find(x=>x.textContent===String(item.correct_answer));if(t)t.classList.add('correct');} // C-02: só revela em resposta final
      cb({correct,errorPattern:item.diagnostic_errors&&item.diagnostic_errors[String(v)],rawValue:v});
    };
    grid.appendChild(b);
  });
  stage.appendChild(grid);
}
function renderTenFrame(item,stage,cb){
  const p=item.payload;const frames=p.frames||1;const target=p.target;let filled=0;
  const cont=el('div');cont.style.display='grid';cont.style.gap='12px';
  const cells=[];
  for(let f=0;f<frames;f++){const tf=el('div','tenframe');for(let i=0;i<10;i++){const c=el('div','tf-cell');c.appendChild(el('span','dot'));
    c.onclick=()=>{const idx=cells.indexOf(c);
      if(c.classList.contains('on')){for(let k=idx;k<cells.length;k++)cells[k].classList.remove('on','ten');}
      else{for(let k=0;k<=idx;k++)cells[k].classList.add('on');}
      filled=cells.filter(x=>x.classList.contains('on')).length;
      cells.forEach((x,ix)=>x.classList.toggle('ten',(ix+1)%10===0&&x.classList.contains('on')));};
    cells.push(c);tf.appendChild(c);}cont.appendChild(tf);}
  stage.appendChild(cont);
  if(p.prefill){for(let k=0;k<p.prefill&&k<cells.length;k++)cells[k].classList.add('on');filled=p.prefill;}
  const done=el('button','big-btn alt','Pronto');done.style.marginTop='10px';
  done.onclick=()=>{done.disabled=true;const correct=filled===target;const key=correct?null:(filled<target?'menos':'mais');cb({correct,errorPattern:correct?null:(item.diagnostic_errors&&item.diagnostic_errors[key]),rawValue:filled});};
  stage.appendChild(done);
}
function renderBase10(item,stage,cb){
  const target=item.payload.target;let t=0,u=0;
  const z=el('div','b10-zone');
  const tc=el('div','b10-col');const bars=el('div','bars');tc.appendChild(bars);
  const ts=el('div','stepper');const tm=el('button',null,'−'),tp=el('button',null,'+');ts.append(tm,el('b',null,'dez'),tp);
  tc.appendChild(el('div','muted small','dezenas'));tc.appendChild(ts);
  const uc=el('div','b10-col');const cubes=el('div','cubes');uc.appendChild(cubes);
  const us=el('div','stepper');const um=el('button',null,'−'),up=el('button',null,'+');us.append(um,el('b',null,'uni'),up);
  uc.appendChild(el('div','muted small','unidades'));uc.appendChild(us);
  z.append(tc,uc);stage.appendChild(z);
  function redraw(){clear(bars);for(let i=0;i<t;i++)bars.appendChild(el('span','bar10'));clear(cubes);for(let i=0;i<u;i++)cubes.appendChild(el('span','cube'));}
  tp.onclick=()=>{if(t<9){t++;redraw();}};tm.onclick=()=>{if(t>0){t--;redraw();}};
  up.onclick=()=>{if(u<19){u++;redraw();}};um.onclick=()=>{if(u>0){u--;redraw();}};
  redraw();
  const done=el('button','big-btn alt','Pronto');done.style.marginTop='10px';
  done.onclick=()=>{done.disabled=true;const v=t*10+u;const correct=v===target;const key=correct?null:((u*10+t===target)?'troca':'valor_errado');cb({correct,errorPattern:correct?null:(item.diagnostic_errors&&item.diagnostic_errors[key]),rawValue:v});};
  stage.appendChild(done);
}
function renderNumberLine(item,stage,cb){
  const p=item.payload;const min=p.min,max=p.max,step=p.step||1;let val=null;
  const nl=el('div','numline');
  nl.appendChild(el('div','nl-track'));
  (p.ticks||[min,max]).forEach(tv=>{const t=el('div','nl-tick');t.style.left=((tv-min)/(max-min)*100)+'%';t.appendChild(el('span',null,String(tv)));nl.appendChild(t);});
  if(p.marker!=null){const fm=el('div','nl-fixed');fm.style.left=((p.marker-min)/(max-min)*100)+'%';nl.appendChild(fm);}
  const marker=el('div','nl-marker');marker.style.display='none';marker.appendChild(el('b'));nl.appendChild(marker);
  const hit=el('div','nl-hit');
  hit.onclick=e=>{const r=nl.getBoundingClientRect();const x=Math.min(1,Math.max(0,(e.clientX-r.left)/r.width));val=Math.round((min+x*(max-min))/step)*step;marker.style.left=(x*100)+'%';marker.style.display='block';lbl.textContent='Marcado! Pode ajustar ou tocar em Pronto.';done.disabled=false;};
  nl.appendChild(hit);stage.appendChild(nl);
  const lbl=el('div','muted small','Toque na reta para marcar.');stage.appendChild(lbl);
  const done=el('button','big-btn alt','Pronto');done.style.marginTop='10px';done.disabled=true;
  done.onclick=()=>{done.disabled=true;const correct=Math.abs(val-p.target)<=(p.tolerance||5);const key=correct?null:(val<p.target?'aquem':'alem');cb({correct,errorPattern:correct?null:(item.diagnostic_errors&&item.diagnostic_errors[key]),rawValue:val});};
  stage.appendChild(done);
}
function renderExplain(item,stage,cb){
  const p=item.payload;const grid=el('div');grid.style.cssText='display:grid;gap:10px';
  const eopts=p.options.slice(); // C-01: embaralhar também as justificativas
  for(let i=eopts.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));const t=eopts[i];eopts[i]=eopts[j];eopts[j]=t;}
  eopts.forEach(o=>{
    const b=el('button','opt txt',o.label);
    b.onclick=()=>{
      Array.from(grid.children).forEach(x=>x.disabled=true);
      const ok=Array.isArray(item.correct_answer)?item.correct_answer.includes(o.id):item.correct_answer===o.id;
      b.classList.add(ok?'correct':'wrong');
      if(S.mode==='with_adult'){
        showRubric(stage,q=>cb({correct:ok,errorPattern:ok?null:(item.diagnostic_errors&&item.diagnostic_errors[o.id]),explanation_quality:q,rawValue:o.id})); // C-10: EE=30 via EXPL.none, não 0
      }else{
        cb({correct:ok,errorPattern:ok?null:(item.diagnostic_errors&&item.diagnostic_errors[o.id]),explanation_quality:ok?'partial':'none',rawValue:o.id}); // C-09: solo nunca certifica 'clear' (EE=60, sem estrela, sem N6) — 'clear' só via rubrica do adulto
      }
    };
    grid.appendChild(b);
  });
  stage.appendChild(grid);
}
function showRubric(stage,cb){
  const r=el('div','rubric');r.style.marginTop='10px';
  r.appendChild(el('div','muted small','Adulto: como a criança explicou? (nada é gravado)'));
  [['clear','Explicou com clareza'],['partial','Explicou em parte'],['none','Não explicou']].forEach(([q,t])=>{
    const b=el('button',null,t);b.onclick=()=>{Array.from(r.querySelectorAll('button')).forEach(x=>x.disabled=true);cb(q);};r.appendChild(b);});
  stage.appendChild(r);
}

/* ============================================ RESPONSÁVEL */
function renderParent(){
  E.markReviews(S,now());
  const withData=E.skills().filter(s=>{const m=E.mastery(S,s.skill_id);return m.window.length||m.seeded;});
  const c1=el('div','card');
  c1.appendChild(el('h2',null,'Painel do Responsável — '+S.child.nickname));
  c1.appendChild(el('div','muted small','Faixa '+(S.child.age_band||'—')+' · leitura: '+(S.child.reading_profile||'—')+' · ⭐ '+S.stars+' · 🏅 '+S.selos.length+(S.placement.finished?'':' · exploração inicial em andamento')));
  const atTarget=withData.filter(s=>li(E.mastery(S,s.skill_id).level)>=li(s.level_target||'N5')).length;
  const seeded=withData.filter(s=>E.mastery(S,s.skill_id).seeded).length;
  const g=el('div','grid3');g.style.marginTop='10px';
  g.appendChild(metric('Atividades feitas',(typeof S.attemptsTotal==='number'?S.attemptsTotal:S.attempts.length)));
  g.appendChild(metric('Habilidades no alvo',atTarget));
  g.appendChild(metric('A confirmar (sondagem)',seeded));
  c1.appendChild(g);
  const alerts=withData.filter(s=>E.mastery(S,s.skill_id).dominant_error).slice(0,4);
  alerts.forEach(s=>c1.appendChild(el('div','pill warn','⚠ '+s.skill_id+': '+E.mastery(S,s.skill_id).dominant_error.replace(/_/g,' '))));
  view.appendChild(c1);

  const c2=el('div','card');c2.appendChild(el('h3',null,'Mapa por eixo'));
  window.APP_DATA.taxonomy.axes.forEach(ax=>{
    const p=E.axisProgress(S,ax.axis_id);
    const row=el('div');row.style.margin='10px 0';
    row.appendChild(el('div','small','<b>'+ax.name+'</b>'+(p==null?' <span class="muted">(sem conteúdo ainda)</span>':'')));
    const bar=el('div','bar');const i=el('i');i.style.width=(p==null?0:Math.round(p*100))+'%';bar.appendChild(i);row.appendChild(bar);
    c2.appendChild(row);
  });
  view.appendChild(c2);

  const c3=el('div','card');c3.appendChild(el('h3',null,'Perfil por habilidade (nível + confiança + evidência)'));
  if(!withData.length)c3.appendChild(el('div','muted','Sem dados ainda. Faça a exploração na aba Criança.'));
  else{
    const t=el('table');t.innerHTML='<thead><tr><th>Habilidade</th><th>Nível</th><th>Acerto recente</th><th>Evidências</th><th>Erro recorrente</th><th>Próximo passo</th></tr></thead>';
    const tb=el('tbody');
    withData.forEach(s=>{const m=E.mastery(S,s.skill_id);
      const conf=E.confidence(m,now()); // C-05: decaimento passivo rebaixa a confiança exibida
      const cov=E.coveredFormats(m);
      const ev=FORMATS.map(f=>'<span class="evf '+(cov.includes(f)?'got':'')+'" title="'+FMT_LABEL[f]+'">'+f[0]+'</span>').join('');
      const status=E.decayed(m,now())?'<span class="pill rev">'+m.level+' (a confirmar)</span>': /* C-05: plano §6 */
        m.status==='review_needed'?'<span class="pill rev">revisar</span>':m.status==='reconfirm'?'<span class="pill warn">reconfirmar</span>':
        '<span class="pill '+(li(m.level)>=li(s.level_target||'N5')?'ok':'learn')+'">'+m.level+(m.seeded?' (sondagem)':'')+'</span>';
      tb.appendChild(el('tr',null,'<td><code>'+s.skill_id+'</code><br><span class="muted small">'+s.description+'</span></td>'+
        '<td>'+status+'<span class="conf '+conf+'">'+conf+'</span></td>'+
        '<td>'+(m.window.length?Math.round(E.AR(m))+'%':'—')+'</td><td>'+ev+'</td>'+
        '<td class="small">'+(m.dominant_error?m.dominant_error.replace(/_/g,' '):'—')+'</td>'+
        '<td class="small">'+nextStep(s,m)+'</td>'));
    });
    t.appendChild(tb);c3.appendChild(t);
  }
  c3.appendChild(el('div','note','“(sondagem)” = nível provisório da exploração inicial, com confiança baixa — as próximas missões confirmam. “(a confirmar)” = domínio sem prática há mais de 60 dias — a próxima revisão reconfirma. A criança nunca vê estes códigos.'));
  view.appendChild(c3);

  const cA=el('div','card');
  cA.appendChild(el('h3',null,'Preferências de exibição'));
  cA.appendChild(el('div','muted small','Valem para este aparelho. A informação no app nunca depende só de cor.'));
  cA.appendChild(el('div','small','<b>Modo preferido</b>'));
  const sm=el('div','segmode');
  [['solo','Sozinha'],['with_adult','✋ Com um adulto por perto']].forEach(([v,t])=>{
    const b=el('button',v===S.mode?'on':'',t);
    b.onclick=()=>{S.mode=v;save();render();};
    sm.appendChild(b);
  });
  cA.appendChild(sm);
  cA.appendChild(mkToggle('Fonte para dislexia','Troca o texto do app pela fonte Lexend, mais fácil de ler.','dys'));
  cA.appendChild(mkToggle('Alto contraste','Escurece textos e reforça bordas em todo o app.','contrast'));
  view.appendChild(cA);

  const cSec=el('div','card');
  cSec.appendChild(el('h3',null,'Segurança'));
  cSec.appendChild(el('div','muted small','PIN protege a entrada neste painel e no Admin vindo da aba Criança.'));
  const pinBtn=el('button','btn ghost','🔑 Trocar PIN do Responsável/Admin');
  pinBtn.onclick=()=>{
    if(S.parentPin){
      const cur=prompt('Digite o PIN atual:');
      if(cur===null)return;
      if(cur!==S.parentPin){alert('PIN atual incorreto. Nada foi alterado.');return;}
    }
    const p1=prompt('Novo PIN (4 dígitos):');
    if(p1===null)return;
    if(!/^\d{4}$/.test(p1)){alert('O novo PIN precisa ter exatamente 4 dígitos numéricos. Nada foi alterado.');return;}
    const p2=prompt('Confirme o novo PIN:');
    if(p2!==p1){alert('Os PINs digitados não coincidem. Nada foi alterado.');return;}
    S.parentPin=p1;save();
    alert('PIN atualizado com sucesso.');
  };
  cSec.appendChild(pinBtn);
  view.appendChild(cSec);

  const cP=el('div','card');
  cP.appendChild(el('h3',null,'Privacidade e dados (LGPD)'));
  const cc=E.currentConsent(S), st=S.child.consent_status;
  const stLabel=st==='granted'?'concedido':st==='withdrawn'?'revogado':'pendente';
  cP.appendChild(el('div','muted small','Consentimento: <b>'+stLabel+'</b>'+(cc?(' · versão '+cc.terms_version+' · '+new Date(cc.created_at).toLocaleDateString('pt-BR')+' · escopo: '+((cc.scope||[]).join(', ')||'—')):'')));
  cP.appendChild(el('div','muted small','Base legal: consentimento do responsável (LGPD Art. 14, §1º). Dados guardados só neste navegador, sem servidor.'));
  const rowL=el('div','row');rowL.style.marginTop='8px';
  const bExp=el('button','btn ghost','⬇ Exportar dados (JSON)');bExp.onclick=downloadExport;
  const bRev=el('button','btn ghost','⏸ Revogar consentimento');bRev.onclick=revokeConsent;
  const bDel=el('button','btn ghost','🗑 Excluir todos os dados');bDel.onclick=wipeAllData;
  rowL.append(bExp,bRev,bDel);cP.appendChild(rowL);
  cP.appendChild(el('div','note','“Exportar” baixa um arquivo com o progresso e as respostas (portabilidade, Art. 18). “Revogar” interrompe o uso até um novo consentimento, mantendo o registro da revogação como prova. “Excluir” apaga tudo deste navegador, sem volta.'));
  view.appendChild(cP);
}
function nextStep(s,m){
  if(m.status==='review_needed')return 'Revisão espaçada nesta semana.';
  if(m.status==='reconfirm')return 'Reconfirmando após falha na revisão.';
  if(m.seeded)return 'Confirmar nível da sondagem com prática real.';
  if(li(m.level)>=li(s.level_target||'N5'))return 'No alvo — enriquecer e revisar.';
  const cov=E.coveredFormats(m);
  const missing=FORMATS.filter(f=>!cov.includes(f)&&E.itemsBySkill(s.skill_id).some(i=>i.evidence_format===f));
  if(cov.length>=2&&missing.includes('PROBLEM'))return 'Falta resolver um problema (obrigatório para dominar).';
  if(missing.length)return 'Coletar: '+missing.slice(0,2).map(f=>FMT_LABEL[f]).join(', ')+'.';
  return 'Consolidar com acurácia mais alta.';
}
function metric(l,v){const d=el('div','stat');d.appendChild(el('div','v',String(v)));d.appendChild(el('div','l',l));return d;}

/* ============================================ ADMIN */
function renderAdmin(){
  const dev=el('div','card');dev.appendChild(el('h3',null,'Controles (dev / demonstração)'));
  const r=el('div','row');
  const b1=el('button','btn ghost','⏩ Simular +1 dia');b1.onclick=()=>{S.devDayOffset++;E.markReviews(S,now());save();render();};
  const b2=el('button','btn ghost','↺ Resetar dados');b2.onclick=()=>{if(confirm('Apagar todo o progresso?')){S=E.newState();save();render();}};
  /* 10/07: atalho de demonstração — abre as ilhas sem terminar o diagnóstico. NÃO semeia nível
     nenhum (regra 4 do manual intacta: sondagem só via exploração real); tudo começa do piso. */
  const b3=el('button','btn ghost','⏭ Pular exploração (demo)');b3.onclick=()=>{
    if(confirm('Marcar a exploração inicial como concluída? Atalho de demonstração: nada é semeado — as habilidades começam do zero e as missões calibram jogando.')){
      S.placement.finished=true;S.placement.lastSessionBoundary=false;save();
      alert('Pronto. Volte para a aba Criança: as ilhas e a Missão do dia estão abertas.');render();
    }
  };
  r.append(b1,b2,b3);dev.appendChild(r);
  dev.appendChild(el('div','muted small','Dia simulado: hoje +'+S.devDayOffset));
  view.appendChild(dev);

  const q=el('div','card');q.appendChild(el('h3',null,'Qualidade e parâmetros (plano de avaliação §12)'));
  const withData=E.skills().filter(s=>E.mastery(S,s.skill_id).window.length);
  const gg=el('div','grid3');
  gg.appendChild(metric('Habilidades (v2)',E.skills().length));
  gg.appendChild(metric('Jogáveis (com itens)',E.playable().length));
  gg.appendChild(metric('Com evidência real',withData.length));
  q.appendChild(gg);
  const P=E.P;
  q.appendChild(el('div','note','Janela '+P.WINDOW_N+' tentativas/'+P.WINDOW_DAYS+'d · recência '+P.RECENCY+' · formato coberto EE≥'+P.COVER_EE+' · AR N5≥'+P.AR.N5+' · dica ×'+P.SUP.hint+' · 2ª tentativa ×'+P.RETRY2+' · diagnóstico ≤'+P.DIAG_MAX_PER_AXIS+' itens/eixo · cota de revisão '+Math.round(P.REVIEW_QUOTA*100)+'%'));
  const errFreq={};S.attempts.filter(a=>a.error_pattern).forEach(a=>errFreq[a.error_pattern]=(errFreq[a.error_pattern]||0)+1);
  const top=Object.entries(errFreq).sort((a,b)=>b[1]-a[1]).slice(0,5);
  q.appendChild(el('div','small',top.length?'<b>Erros mais frequentes:</b> '+top.map(([e,n])=>e.replace(/_/g,' ')+' ('+n+')').join(' · '):'<span class="muted">Sem erros registrados.</span>'));
  view.appendChild(q);

  const mx=el('div','card');mx.appendChild(el('h3',null,'Matriz v2 — '+E.skills().length+' habilidades (manual_mestre_v2 §7)'));
  mx.appendChild(el('div','muted small','🆕 = nova no v2 · B5a/B5b = subbloco · nível técnico visível só aqui e no painel.'));
  window.APP_DATA.taxonomy.axes.forEach(ax=>{
    mx.appendChild(el('div','axis-h','<span class="pill learn">'+ax.name+'</span>'));
    E.axisSkills(ax.axis_id).forEach(s=>{
      const m=E.mastery(S,s.skill_id);const has=E.itemsBySkill(s.skill_id).length>0;
      const det=el('details');
      det.appendChild(el('summary',null,'<code>'+s.skill_id+'</code> '+(s.extension?'🆕 ':'')+s.description+
        ' '+(s.subblock?'<span class="tag">'+s.subblock+'</span>':'')+
        (has?'<span class="tag">'+E.itemsBySkill(s.skill_id).length+' itens</span>':'<span class="tag">sem itens</span>')+
        ' <span class="pill '+(li(m.level)>=li(s.level_target||'N5')?'ok':'learn')+'">'+m.level+(m.seeded?'*':'')+'</span>'));
      const body=el('div','small');
      body.innerHTML='<div class="kv"><span>Piso → alvo</span><b>'+s.level_floor+' → '+s.level_target+'</b></div>'+
        '<div class="kv"><span>Bloco / idade</span><b>'+s.block+(s.subblock?' ('+s.subblock+')':'')+' · '+s.age_ref+'</b></div>'+
        '<div class="kv"><span>Pré-requisitos</span><b>'+(E.prereqsOf(s.skill_id).join(', ')||'—')+'</b></div>'+
        '<div class="kv"><span>Diagnostic links</span><b>'+((s.diagnostic_links||[]).join(', ')||'—')+'</b></div>'+
        '<div class="kv"><span>Crédito cruzado</span><b>'+(s.overlap_with||'—')+'</b></div>'+
        '<div class="kv"><span>Erros comuns</span><b>'+((s.common_errors||[]).join(', ')||'—')+'</b></div>';
      det.appendChild(body);mx.appendChild(det);
    });
  });
  view.appendChild(mx);
}

/* ---------- init ---------- */
(function maybeResetPin(){
  try{
    const qs=new URLSearchParams(location.search);
    if(qs.get('resetpin')==='1'){
      if(confirm('Isso vai apagar o PIN atual do Responsável/Admin (guardado só neste navegador). Continuar?')){
        S.parentPin=null;save();
        alert('PIN removido. Ao continuar, o app vai pedir para definir um novo PIN antes de liberar o uso.');
      }
    }
  }catch(e){}
})();
/* ============================================ CONSENTIMENTO (LGPD Art. 14) — tela do responsavel */
function renderConsent(){
  clear(view);
  const wrap=el('div','child-wrap');
  const c=el('div','card');c.style.textAlign='left';
  c.appendChild(el('div',null,'<div style="font-size:42px;text-align:center">🛡️</div>'));
  c.appendChild(el('h2',null,'Consentimento do responsável'));
  c.appendChild(el('div','muted small','Esta etapa é para o pai, a mãe ou o responsável legal — não para a criança. O Método Wanwan trata dados de uma criança e, pela LGPD (Lei 13.709/2018, Art. 14, §1º), isso exige o consentimento específico e em destaque de um responsável legal.'));
  const t=el('div','note');t.style.marginTop='12px';
  t.innerHTML='<b>O que este app guarda</b><br>'+
    '• Apelido (sugerimos um apelido, não o nome real), faixa de idade e perfil de leitura.<br>'+
    '• O progresso na matemática: nível por habilidade, respostas e erros das atividades.<br>'+
    '<b>O que este app NUNCA coleta</b><br>'+
    '• Nome completo, data de nascimento exata, foto, endereço, escola ou localização.<br>'+
    '• A voz da criança — o microfone nunca é usado.<br>'+
    '<b>Onde os dados ficam</b><br>'+
    '• Somente neste navegador, neste aparelho. Não há servidor: nada é enviado pela internet.<br>'+
    '<b>Seus direitos (LGPD Art. 18)</b><br>'+
    '• No Painel do Responsável você pode, quando quiser, revogar este consentimento, exportar todos os dados (arquivo JSON) ou excluí-los por completo.';
  c.appendChild(t);
  const sc=el('div');sc.style.margin='14px 0';
  sc.appendChild(el('div','small','<b>Autorizo o tratamento de:</b>'));
  const mk=(id,label,desc,checked,disabled)=>{
    const row=el('label','row');row.style.cssText='align-items:flex-start;gap:8px;margin:8px 0;cursor:pointer';
    const cb=el('input');cb.type='checkbox';cb.id=id;cb.checked=checked;if(disabled)cb.disabled=true;
    row.append(cb,el('div','small','<b>'+label+'</b><br><span class="muted">'+desc+'</span>'));return row;
  };
  sc.appendChild(mk('sc_ped','Progresso pedagógico','Nível por habilidade e histórico de atividades — é o que permite o app ensinar de forma adaptada. Necessário para o app funcionar.',true,true));
  sc.appendChild(mk('sc_tel','Telemetria de uso','Estatísticas de uso (tempo e sessões) para acompanhar a evolução. Opcional.',true,false));
  c.appendChild(sc);
  const conf=el('label','row');conf.style.cssText='align-items:flex-start;gap:8px;margin:10px 0;cursor:pointer';
  const cbR=el('input');cbR.type='checkbox';cbR.id='sc_resp';
  conf.append(cbR,el('div','small','<b>Declaro que sou o pai, a mãe ou o responsável legal desta criança</b> e que li e concordo com as informações acima (versão dos termos: '+E.TERMS_VERSION+').'));
  c.appendChild(conf);
  const btn=el('button','big-btn','Concordar e liberar o app');btn.style.marginTop='6px';
  btn.onclick=()=>{
    if(!cbR.checked){alert('Para continuar, confirme que você é o responsável legal desta criança.');return;}
    const scope=[];
    if(document.getElementById('sc_ped').checked)scope.push('progresso_pedagogico');
    if(document.getElementById('sc_tel').checked)scope.push('telemetria_uso');
    E.recordConsent(S,'grant',scope,(typeof navigator!=='undefined'&&navigator.userAgent)||null);
    save();render();
  };
  c.appendChild(btn);
  c.appendChild(el('div','muted small','Sem este consentimento, a criança não pode usar o app. Este aviso não substitui revisão jurídica para uso comercial.'));
  wrap.appendChild(c);view.appendChild(wrap);
}
function downloadExport(){
  try{
    const data=E.exportData(S);
    const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'});
    const url=URL.createObjectURL(blob);
    const a=document.createElement('a');
    a.href=url;a.download='wanwan_dados_'+((S.child.nickname||'crianca').replace(/[^\w-]+/g,'_'))+'_'+new Date().toISOString().slice(0,10)+'.json';
    document.body.appendChild(a);a.click();a.remove();
    setTimeout(()=>{try{URL.revokeObjectURL(url);}catch(e){}},1500);
  }catch(e){alert('Não consegui gerar o arquivo de exportação neste navegador.');}
}
function revokeConsent(){
  if(!confirm('Revogar o consentimento? A criança não poderá continuar usando o app até que um novo consentimento seja concedido. O registro da revogação é mantido como prova de conformidade (LGPD).'))return;
  E.recordConsent(S,'withdraw',[],(typeof navigator!=='undefined'&&navigator.userAgent)||null);
  save();parentUnlocked=false;S.surface='child';render();
  alert('Consentimento revogado. O app ficará bloqueado até um novo consentimento.');
}
function wipeAllData(){
  if(!confirm('Excluir TODOS os dados desta criança e do responsável guardados neste navegador (progresso, respostas, PIN e registro de consentimento)? Esta ação não pode ser desfeita.'))return;
  try{localStorage.removeItem(KEY);localStorage.removeItem(OLD_KEY);}catch(e){}
  S=ensurePin(E.newState());S.parentPin=null;save();
  parentUnlocked=false;
  alert('Dados excluídos. O app vai recomeçar do zero.');
  boot();
}
function renderFirstRunPinSetup(){
  clear(view);
  const wrap=el('div','child-wrap');
  const mc=el('div','mission-card');
  mc.appendChild(el('div',null,'<div style="font-size:46px">🔐</div>'));
  mc.appendChild(el('h2',null,'Antes de começar'));
  mc.appendChild(el('div','muted','Esta etapa é para o responsável, não para a criança. Defina um PIN de 4 dígitos para proteger o Painel do Responsável e o Admin — a criança não precisa dele para jogar.'));
  const b=el('button','big-btn','Definir PIN agora');b.style.marginTop='14px';
  b.onclick=()=>{if(setupPin())render();};
  mc.appendChild(b);
  wrap.appendChild(mc);view.appendChild(wrap);
}
function setupPin(){
  const p1=prompt('Defina um PIN de 4 dígitos para o Responsável/Admin:');
  if(p1===null)return false;
  const pin=(p1||'').trim();
  if(!/^\d{4}$/.test(pin)){alert('O PIN precisa ter exatamente 4 dígitos numéricos. Toque no botão para tentar de novo.');return false;}
  const p2=prompt('Confirme o PIN:');
  if(p2!==pin){alert('Os PINs não coincidem. Toque no botão para tentar de novo.');return false;}
  S.parentPin=pin;save();
  return true;
}
function boot(){
  applyUiPrefs();
  if(!S.parentPin){renderFirstRunPinSetup();return;}
  render();
}
boot();
})();
