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
const ISLAND_ART={2:'ilha-cdt.jpg',3:'ilha-vp.jpg',4:'ilha-as.jpg',5:'ilha-mul.jpg',6:'ilha-div.jpg',7:'ilha-fdp.jpg',8:'ilha-geo.jpg',9:'ilha-mtd.jpg',10:'ilha-pal.jpg',11:'ilha-dgp.jpg',12:'ilha-lrp.jpg'};
const TREASURE_ART={'SNC-GEM-1':'gema.png','SNC-TROPHY':'trofeu.png'};
function bsImg(f){return 'assets/img/'+f;}
/* 11/07/2026 — REDESIGN "trilha = cenário do conto".
   Cada CAPÍTULO é uma parada do caminho; dentro dele, cada HABILIDADE é um objeto da cena.
   CHAPTER_PROPS dá o objeto (glifo + nome) de cada capítulo. Sem entrada => nó neutro (⭐)
   e manipulativo sem tema: o app segue correto nas 11 ilhas ainda não vestidas. */
const CHAPTER_PROPS={
  'SNC-CAP-1':{g:'\u{1FAD8}',n:'Feijão'},   /* 🫘 os feijões mágicos */
  'SNC-CAP-2':{g:'\u{1F343}',n:'Folha'},    /* 🍃 o pé sobe até o céu */
  'SNC-CAP-3':{g:'\u2601\uFE0F',n:'Nuvem'},/* ☁️ entre as nuvens */
  'SNC-CAP-4':{g:'\u{1F9ED}',n:'Trilha'},   /* 🧭 o caminho certo */
  'SNC-CAP-5':{g:'\u{1F6AA}',n:'Porta'}     /* 🚪 a porta do castelo */
};
const DEFAULT_PROP={g:'\u2B50',n:'Desafio'};
/* Falas do herói na TRANSIÇÃO entre as questões (pedido do Wanderson: "a cada questão").
   Curtas, faladas, sem pressa e sem repreender o erro. Sorteadas sem repetir na sessão. */
const CHAPTER_LINES={
 'SNC-CAP-1':{ok:['Mais um feijão no bolso!','O saquinho está ficando cheio!','Você contou direitinho.','Boa! Mais um passo até plantar.','O João sorriu. Vamos seguir.'],
              no:['Tudo bem. Vamos com calma.','Sem pressa: o João espera.','Errar faz parte da subida.','Calma. A gente tenta de novo.']},
 'SNC-CAP-2':{ok:['O pé de feijão cresceu mais um pouco!','Mais uma folha para subir.','Boa! Estamos subindo.','O caule ficou mais alto.','Mais um galho conquistado!'],
              no:['Calma: o pé de feijão não vai fugir.','Tudo bem. Vamos devagar.','A gente sobe no seu tempo.','Sem pressa. Respire e siga.']},
 'SNC-CAP-3':{ok:['As nuvens estão pertinho!','Mais um pedaço do céu.','Boa! Quase nas nuvens.','O vento ajudou a subir.','Você está bem alto agora!'],
              no:['Tudo bem. Aqui em cima a gente vai devagar.','Sem pressa. As nuvens esperam.','Calma. A gente tenta outra vez.']},
 'SNC-CAP-4':{ok:['Caminho certo!','Boa escolha de trilha.','O João não se perdeu!','Mais um passo no rumo certo.'],
              no:['Quase! Vamos olhar de novo.','Tudo bem. A trilha continua ali.','Sem pressa para escolher.']},
 'SNC-CAP-5':{ok:['A porta rangeu!','Mais perto do castelo!','Boa! A tranca cedeu um pouco.','O castelo está bem ali!'],
              no:['Tudo bem. A porta espera.','Calma. Vamos tentar de novo.','Sem pressa: o gigante está dormindo.']}
};
const DEFAULT_LINES={ok:['Boa! Vamos seguir.','Mais um passo!','Você conseguiu!','Muito bem. Seguimos juntos.'],
                     no:['Tudo bem. Vamos com calma.','Sem pressa. A gente tenta de novo.','Errar faz parte.']};
function linesFor(chId){return CHAPTER_LINES[chId]||DEFAULT_LINES;}
function shuffled(a){const x=a.slice();for(let i=x.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));const t=x[i];x[i]=x[j];x[j]=t;}return x;}
const TALE_VINE={1:['#4E9E4A','#8FD37A']}; /* caule do pé de feijão; demais ilhas usam o caminho padrão */
function islandArt(axisId){return axisId===BEANSTALK_AXIS?'fundo-mapa.jpg':(ISLAND_ART[axisId]||null);}
/* arte da CENA de um capítulo (o cap.1 do Pé de Feijão tem cena própria; os demais herdam a arte da ilha) */
function chapterArt(axisId,chId){return (axisId===BEANSTALK_AXIS&&chId==='SNC-CAP-1')?'cena-cap1.jpg':islandArt(axisId);}
function propOf(chId){return CHAPTER_PROPS[chId]||DEFAULT_PROP;}
function skillAtTarget(s){const m=E.mastery(S,s.skill_id);return li(m.level)>=li(s.level_target||'N5');}
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
const AUDIO_MANIFEST={"Quantos pontos você vê? (sem contar um por um)":"v0187d884d5eb819d.mp3","Isso! Você reconheceu 4 num olhar só.":"v7a19214f453c4486.mp3","Olhe o formato: dois em cima e dois embaixo. Isso é 4.":"v5a839b76bf56fae4.mp3","Vamos ver juntos: Isso! Você reconheceu 4 num olhar só.":"vd1185bf5c92cd278.mp3","Mostre 3 no quadro de dez.":"v67952313530c6ad8.mp3","Isso! Você montou 3.":"vb02a995b8be837c8.mp3","Conte de novo: coloque uma ficha para cada, até 3.":"vb067fe474e0fe77f.mp3","Vamos ver juntos: Isso! Você montou 3.":"v33651cd939a2b59f.mp3","Na folha havia joaninhas. Quantas você vê de uma vez?":"v08da12f9be584bcc.mp3","Isso! São 5, como no dado.":"vfab894181ca816b4.mp3","É o formato do 5 no dado: 4 nos cantos e 1 no meio.":"vcc8f2fc97c0e66e9.mp3","Vamos ver juntos: Isso! São 5, como no dado.":"vcacba60b15c2f8ff.mp3","Por que são 4? Escolha os jeitos que mostram o 4 em partes.":"vde0d8e533391c9f2.mp3","Muito bem! Você mostrou 4 como partes juntas.":"v940072a93309c2a8.mp3","Tente ver 4 como partes: 2 e 2, ou 3 e 1.":"v59d5de89284bde34.mp3","Vamos ver juntos: Muito bem! Você mostrou 4 como partes juntas.":"v07d88b16f3bf3b98.mp3","E agora, quantos pontos?":"v160dd0ec178f72f3.mp3","Isso! 3, mesmo em fila.":"v27611f3e27dd1838.mp3","São 3, não importa o arranjo.":"v0aae7ec6ac95270a.mp3","Vamos ver juntos: Isso! 3, mesmo em fila.":"v9a5a179490efc434.mp3","Qual número vem depois do 6?":"va8fe477462a0b817.mp3","Isso! Depois do 6 vem o 7.":"v0cbc8dbde164c989.mp3","Conte devagar: 5, 6, 7. Depois do 6 vem o 7.":"vd946197a6a62d731.mp3","Vamos ver juntos: Isso! Depois do 6 vem o 7.":"vb070b1310ec3dddf.mp3","Conte colocando uma ficha de cada vez até 7.":"vebec88522b53b4d7.mp3","Muito bem! Você contou até 7 sem pular.":"v3eb86ce245e1773d.mp3","Toque contando: 1, 2, 3... pare no 7.":"v4aef848640389389.mp3","Vamos ver juntos: Muito bem! Você contou até 7 sem pular.":"v1361eb1718799538.mp3","Você sobe a escada contando. Parou no degrau depois do 8. Em que degrau está?":"v4a3f762645a356d8.mp3","Isso! Depois do 8 vem o 9.":"vcfeb23b32aceb802.mp3","Depois do 8 vem o 9: 7, 8, 9.":"ve2441de70659b310.mp3","Vamos ver juntos: Isso! Depois do 8 vem o 9.":"v693766551c1b7261.mp3","Contando até 5, qual jeito está certo?":"va4e12389b61799cc.mp3","Certo! A ordem é 1, 2, 3, 4, 5.":"ve313b31ee5e5dd5b.mp3","Sem pular e sem trocar: 1, 2, 3, 4, 5.":"vb9799833c55ad052.mp3","Vamos ver juntos: Certo! A ordem é 1, 2, 3, 4, 5.":"v149917fe36e8a507.mp3","Qual número vem ANTES do 4?":"vbda49f015b78bc9e.mp3","Isso! Antes do 4 vem o 3.":"vae2dff4e94c87bb3.mp3","Conte: 2, 3, 4. Antes do 4 é o 3.":"v70b6d85bd3a5e616.mp3","Vamos ver juntos: Isso! Antes do 4 vem o 3.":"v92fb3c790ea01eb5.mp3","Quantos pontos há?":"v622b23a0d9fb775e.mp3","Isso! São 6.":"vc1a8feb9c9c94415.mp3","Toque em cada ponto uma vez: são 6.":"v2dc7abb77813b15c.mp3","Vamos ver juntos: Isso! São 6.":"v58610134087126cf.mp3","Coloque uma ficha para cada estrela. São 8 estrelas.":"vec768860ed845633.mp3","Muito bem! Uma ficha para cada estrela.":"v4a274739047fe832.mp3","Uma ficha por estrela, sem repetir: 8.":"v8f731ab0c557fc8b.mp3","Vamos ver juntos: Muito bem! Uma ficha para cada estrela.":"v00b2ae3dd9eaf9ee.mp3","Cada criança ganha 1 balão. Estes são os balões. Quantas crianças?":"v348b28d1d6d152ad.mp3","Isso! 7 balões, 7 crianças.":"ve1b6e41f9f6de85e.mp3","Um balão por criança: conte cada um uma vez, são 7.":"v47f1b9d433cf155c.mp3","Vamos ver juntos: Isso! 7 balões, 7 crianças.":"v2f7cbbf03be2dc84.mp3","Como contar sem errar?":"vefcc6de1bb0a21ad.mp3","Certo! Um toque para cada objeto.":"v9c1515b18b25a4ed.mp3","O jeito certo é tocar em cada um, uma vez só.":"v6f13cb7ed8f05f87.mp3","Vamos ver juntos: Certo! Um toque para cada objeto.":"v0ad03ef22ba623cf.mp3","Quantos pontos?":"ve0de46c2194e8d3f.mp3","Isso! São 9.":"v74b3966c12ecf721.mp3","Conte cada ponto uma vez: 9.":"v66b29a04d71af2a3.mp3","Vamos ver juntos: Isso! São 9.":"va4a5159f976608fb.mp3","Você contou 1, 2, 3, 4, 5, 6, 7. Quantos há ao todo?":"v6e17fd12c0c58f44.mp3","Isso! O último número, 7, diz quantos são.":"va6a334e22d821df3.mp3","O último número que você falou, 7, é o total.":"v2123891f90ed7ace.mp3","Vamos ver juntos: Isso! O último número, 7, diz quantos são.":"v6582b3ee9a4bf2b5.mp3","Coloque 6 fichas no quadro, contando uma por uma.":"v57f86066e6de6b3c.mp3","Muito bem! São 6 no total.":"vbcbd51a5b387f358.mp3","O último contado é o total: 6.":"vfa079a8169be5776.mp3","Vamos ver juntos: Muito bem! São 6 no total.":"vc018c88bf0aed89b.mp3","Contamos os patos: 1, 2, 3, 4, 5. Quantos patos há?":"vfd646fa3c39472f4.mp3","Isso! São 5 patos.":"v05f14ff5a5528f65.mp3","Não precisa contar de novo: o último foi 5, então são 5.":"vaab96e42b1986777.mp3","Vamos ver juntos: Isso! São 5 patos.":"v1e37c44e69bbbc15.mp3","Alguém contou 8 blocos. Quantos são?":"ve53ef1b9f371bfbf.mp3","Certo! O último número é o total.":"v41ab26f62cf98df4.mp3","O último número contado já diz quantos são: 8.":"v74ea211d99aefe09.mp3","Vamos ver juntos: Certo! O último número é o total.":"vd8f93827bdf8bfc4.mp3","Você contou até 9 os carrinhos. Quantos carrinhos há?":"v002a60be28126064.mp3","O último número, 9, é a quantidade.":"va8f76728eb1744ce.mp3","Comece no 5 e conte mais um. Qual vem?":"ve57b46964d895913.mp3","Isso! Depois do 5 vem o 6.":"vbfea7b18d09686e2.mp3","Não volte ao 1: depois do 5 é o 6.":"v35f3d143488b65c0.mp3","Vamos ver juntos: Isso! Depois do 5 vem o 6.":"v49853d72258cf661.mp3","Já há 4 fichas. Continue contando até 9.":"v1136771e948b62e9.mp3","Muito bem! Você seguiu de 4 até 9.":"ve75a262cff861029.mp3","Comece do 4 e siga: 5, 6, 7, 8, 9.":"v026afb91f57f36e6.mp3","Vamos ver juntos: Muito bem! Você seguiu de 4 até 9.":"vefe5626e38f566b7.mp3","Comece no 7 e conte mais 3. Em que número você chega?":"vf3966a9a5298419c.mp3","Isso! Chega no 10.":"v7969671c12cfee6b.mp3","A partir do 7: 8, 9, 10.":"v3ad8ee9d1fde5758.mp3","Vamos ver juntos: Isso! Chega no 10.":"v97bfa22d1913d595.mp3","Para contar a partir do 6, o que fazer?":"v875c4b4ad2c21b42.mp3","Certo! Siga do 6: 7, 8, 9.":"v37651bfab3c54d0a.mp3","Não recomece do 1; continue de onde parou.":"v112a876fbf440d26.mp3","Vamos ver juntos: Certo! Siga do 6: 7, 8, 9.":"v0c4a8df9b7446942.mp3","Continue: 12, 13, __":"vafe84fbde046ebfc.mp3","Isso! Vem o 14.":"va1232dd9384cdc41.mp3","Depois de 13 vem 14.":"vc79a3321793dd7e7.mp3","Vamos ver juntos: Isso! Vem o 14.":"v8416f0d1b4c5dd25.mp3","Um grupo tem 7 fichas e outro tem 4. Qual é maior?":"vf4a485bf2c1dd7e1.mp3","Isso! 7 é mais que 4.":"vf4bc208c95bdadd4.mp3","Conte cada grupo: 7 é mais que 4.":"v1cfcbc48a4a0c598.mp3","Vamos ver juntos: Isso! 7 é mais que 4.":"v06692126cb5742f7.mp3","Faça um grupo MAIOR que 5: coloque 8 fichas.":"vc89d7ad49448abeb.mp3","Muito bem! 8 é o grupo maior.":"v959b7d83e8bd0f6e.mp3","O maior aqui é 8.":"v2f9361ccb984f315.mp3","Vamos ver juntos: Muito bem! 8 é o grupo maior.":"v74e7a03ab65dabf3.mp3","Há 6 maçãs e 6 peras. Qual tem mais?":"v2be780ba5221622d.mp3","Isso! 6 e 6 são iguais.":"vd405791e3114074e.mp3","Mesma quantidade: 6 = 6.":"v2d7b6c057171303d.mp3","Vamos ver juntos: Isso! 6 e 6 são iguais.":"v3b5de5efc1a2e725.mp3","8 fichas grandes e 9 pequenas. Qual grupo tem MAIS?":"v0e2d4f6d316aee2f.mp3","Certo! Conta a quantidade, não o tamanho.":"vda58e4bfe2684fc6.mp3","Tamanho não é quantidade: 9 > 8.":"vf29df5a473e00207.mp3","Vamos ver juntos: Certo! Conta a quantidade, não o tamanho.":"v453aa87078a987b3.mp3","Onde há MENOS: 3 ou 9?":"v5e954921aaea307c.mp3","Isso! 3 é menos que 9.":"vc7b20bbd04024254.mp3","Menos é o grupo menor: 3.":"vc070fc2d6ae2689a.mp3","Vamos ver juntos: Isso! 3 é menos que 9.":"v6f0c2c2ba1059e74.mp3","Contando para trás: 10, 9, 8, __?":"vb7518ffa45b46bab.mp3","Isso! Depois de 8 vem 7.":"v7653041952fe2ff9.mp3","Para trás: 8, 7.":"vd7f9ed13cfdf0b34.mp3","Vamos ver juntos: Isso! Depois de 8 vem 7.":"v21f9edcf77effd4c.mp3","Havia 10 fichas. Tire até ficar 6 (conte para trás).":"v85ae8d4014e68daa.mp3","Muito bem! 10, 9, 8, 7, 6.":"va6a4905def2c7205.mp3","Conte para trás até 6.":"vf95130a499d4819f.mp3","Vamos ver juntos: Muito bem! 10, 9, 8, 7, 6.":"ve67fb6b1fbb85cac.mp3","Foguete decolando: 5, 4, 3, __?":"vde0717f89a8b714a.mp3","Isso! Depois de 3 vem 2.":"v66870d44dfd83362.mp3","Regressiva: 3, 2.":"v5f3548d6dc3c0775.mp3","Vamos ver juntos: Isso! Depois de 3 vem 2.":"vc2efae5f02791083.mp3","Qual é a contagem para trás certa a partir de 10?":"vdead36dd10e58b88.mp3","Certo! Para trás é 10, 9, 8, 7.":"v8508ee29ba5db214.mp3","Para trás desce de 1 em 1.":"v65d26267a3236310.mp3","Vamos ver juntos: Certo! Para trás é 10, 9, 8, 7.":"veca70387a6f19b7c.mp3","Regressiva: 7, 6, 5, __?":"v6f8505e940fcc619.mp3","Isso! Depois de 5 vem 4.":"v08c7045c36aac70b.mp3","Para trás: 5, 4.":"v07439091e465ebb9.mp3","Vamos ver juntos: Isso! Depois de 5 vem 4.":"vc6ba696c919d3a0f.mp3","João plantou feijões mágicos e um pé enorme cresceu até o céu. Conte com ele para subir degrau a degrau! Conte os feijões um por um e diga quantos João guardou no bolso.":"vbc19f582ffb3f117.mp3","Conte os feijões um por um e diga quantos João guardou no bolso.":"v8be3b33ebb5a6fea.mp3","Quase! Quer tentar mais uma vez?":"v32cfd0dac041af89.mp3","Muito bem!":"v0a66934e39a451f1.mp3","Uau! Três estrelas!":"v09c8c9814fc71f70.mp3","Muito bem! Missão concluída!":"vab5a5874766115b6.mp3","Missão concluída!":"vc2d3f0217172e1a2.mp3","Você ganhou uma safira!":"v7dfa3bc01afe55bf.mp3","Você ganhou um diamante!":"vc57f61530141e20a.mp3","Você ganhou uma coroa!":"v9c70838aba583d61.mp3","Você achou um tesouro!":"v9e3f4d90e69fc7cd.mp3","Uau! Um tesouro raro!":"v960af44f8a1f5c24.mp3","Complete primeiro uma dezena inteira, depois conte o que sobra.":"v2164f72eecc03a60.mp3","Lembre: cada barra grande vale 10. Conte as barras primeiro.":"v4beb02dbb6e16a43.mp3","Olhe os números das pontas. Onde ficaria a metade do caminho?":"vc3129e0c9e25fa78.mp3","Pense com calma. Uma das opções foi retirada para ajudar.":"v8dd6708e676b1302.mp3","Ouça de novo a história. O que ela pergunta no final?":"vfe7c54e5471b4fb7.mp3","Qual explicação combina com o que você faria com os dedos ou blocos?":"v54a82987d2c16dcb.mp3","Respire fundo e pense no que o problema pergunta.":"vf6a9bf7a364f3836.mp3","Oi! Eu sou a Sofie. Quantos anos você tem?":"v06d651d441df4bcb.mp3","Você já lê sozinho?":"vac6245c0ec2d0f6a.mp3","'4 vezes mais' é 4×3 = 12, não 3+4.":"v38d63a06dc9bd1a4.mp3","'Havia 6 fichas, tirei 2.' Qual desenho combina?":"v2c6a75e8d29750cd.mp3","'O filme começou às 4 horas.' Isso fala de um MOMENTO (que horas) ou de uma DURAÇÃO (quanto tempo)?":"vd240eb41c0218475.mp3","'Tinha 10, sobraram 6.' Qual conta descobre quantos saíram?":"ve0829cb3b3ce5cfd.mp3","'Tinha 5 maçãs, comi 2. Quantas restam?' O que o problema pergunta?":"v017918956460b0ae.mp3","'às 4 horas' marca UM momento no relógio, não quanto tempo durou.":"veffadec1bbd8a47c.mp3","1 metro tem 100 centímetros. Quantos centímetros há em 2 metros?":"v76cc529101922423.mp3","1/2 é o mesmo que 2/4; 3/4 tem um quarto a mais.":"v15051a5b97e44ed8.mp3","1/2, 0,5 e 50% representam...":"v825843f314ff092f.mp3","1/4 + 1/4 + 1/4 é igual a que fração?":"vaa44c1014099130e.mp3","100÷4=25 e 56÷4=14; junte: 39.":"v5ad69d5ad5722934.mp3","10×10=100 e 10×3=30 dão 130 (ainda faltam as outras partes).":"v19714cb53234512c.mp3","12 = 8 + ?, então deu 4 (mesmo dizendo 'deu').":"v9328b5a32c86eaf7.mp3","12 lápis para 4 potes, igual em cada. Quantos lápis por pote?":"v5712e90d7debf5da.mp3","12 pode ser um array de 3 × 4. Qual OUTRO array também dá 12?":"v84aa7efcd13bdc8f.mp3","12 × 13 tem 4 partes: 10×10, 10×3, 2×10, 2×3. Só as duas primeiras: 100 + 30 = ?":"ve42af89762f1bc1d.mp3","12×14=168; estime por 12×10=120 e ajuste para cima.":"v5562204790a722d1.mp3","14 ÷ 4 dá 3 e ainda sobra. Quanto sobra?":"vaa344151c49592fc.mp3","15 figurinhas em grupos de 5. Quantos grupos?":"v8e4d545f128a5c2a.mp3","156÷4=?":"v8dcf887f2c99bde1.mp3","168÷12=?":"v5cd8dc87f83e9999.mp3","19 + 21 é mais perto de quanto?":"vbb76e9e845cb59b1.mp3","2 linhas com 4 estrelas: ⭐⭐⭐⭐ e ⭐⭐⭐⭐. Quantas ao todo?":"vcaca0b82337ff96c.mp3","20 + 20 é cerca de 40.":"vbe7b314765ed3054.mp3","20−2 e 9+9 dão 18; só 10+7 dá 17.":"v39097fd3ed5e5acb.mp3","23 × 3: faça 20×3 + 3×3. Quanto dá?":"vc36b3626c5cf436f.mp3","25/100 é igual a qual decimal?":"vc367294329fdbba9.mp3","2×6=12. 3×3=9 e 5×2=10 não dão 12.":"ve89849ab614a2569.mp3","3 cabe dentro do 6, mas não é múltiplo. Saltando de 6: 6, 12, 18.":"v09357aa9d7e0840b.mp3","3 grupos de 2 maçãs 🍎🍎. Quantas maçãs ao todo?":"vaa1256e34af19fb5.mp3","3 vezes 2: 2+2+2 = 6. Somar 3+2 daria só 5.":"veac8d5ce192f030a.mp3","3 × 4 dá o mesmo que qual conta?":"v00929ec452629012.mp3","3 − 8 não dá: troque 1 dezena por 10. Fica 13 − 8 = 5, e 5 − 2 = 3: 35.":"v93445c90de18721b.mp3","3, 6, 9, __. Qual é o próximo número?":"v6594cbbc6a87d63b.mp3","3/4 são três partes de 1/4 cada: 1/4 + 1/4 + 1/4.":"v565571ac0345f2c3.mp3","3/4 é o mesmo que:":"vbbc89a7b9b0f80a7.mp3","30÷3=10 e 18÷3=6; junte os dois: 16.":"ve8cfc81f0b21ce9d.mp3","30÷5=?":"vc33b3f0fb60a094b.mp3","4 e quanto formam 5?":"v8b0778b8f98c37bc.mp3","4 grupos de 3: 3+3+3+3 = 12.":"v3a01435cd8358e9c.mp3","4 é o número de potes. Em cada um cabem 3.":"vfd44ccae8ede92e3.mp3","40 + 16 = 56: é uma troca válida.":"vf67549403ccb64da.mp3","45 tem 4 dezenas: fica entre 40 e 50.":"ve11751152486c3ba.mp3","45 × 10 = ?":"v665bc8c989568066.mp3","48÷3, quebrando: 30÷3 + 18÷3 = ?":"vb5090a3dea043181.mp3","49 vira 50 pegando 1 do 6; então 50 + 5 = 55.":"v2493ef23b3155cdd.mp3","4×3=12; de 14 sobram 2. O resto é 2.":"v3236806bb41c6c54.mp3","4×6=24. Então 24÷6=?":"v97e86c9a975ed025.mp3","5 e 3 dão 8.":"vc9376fd599fcbf22.mp3","5 mais QUANTO dá 8?":"v498e6010b7d15857.mp3","5 não cabe certinho em 12 e 24 é múltiplo, não divisor. 12 ÷ 4 = 3: o 4 serve.":"v1df6d9ddd07ca957.mp3","50 e 12 juntos dão 62. 60+20 passa de 62; 6+2 é só 8.":"v995efb7ababc4da7.mp3","50 pessoas, a van leva 8. 50÷8 dá 6 e sobram 2. Quantas vans?":"v3d2f3a2063851246.mp3","56 é 5 dezenas e 6 unidades. Qual é outra forma válida?":"v6c86f48f71427ee8.mp3","56÷8=?":"vaa476ae6162b0dac.mp3","6 + 6 = 12.":"vdd0f6a7fca24877d.mp3","6 dezenas > 5 dezenas: 67 > 58.":"v1c6f25024f6d844d.mp3","6 meias em duplas: 🧦🧦 🧦🧦 🧦🧦. Sobrou alguma sozinha?":"v5e80ca7d49005841.mp3","6 uvas 🍇🍇🍇🍇🍇🍇 para 2 pratos, partes IGUAIS. Quantas em cada prato?":"va7e621a128f85c34.mp3","6 vans levam 48; sobram 2 pessoas. Precisa de mais 1: 7 vans.":"v30a032222921f8c1.mp3","6 × 100 = ? (acrescente os zeros do 100)":"vb4d4d2e9f46f5c9c.mp3","6 é o total. Em CADA grupo tem 3.":"vda9f1b6a4a7491e4.mp3","6+8=14 (vai 1); 4+7+1=12 (vai 1); 2+1+1=4. Total 424. Não esqueça os 'vai 1'.":"vae4d141cc6982bc5.mp3","600÷100=?":"v4a187360f2127aad.mp3","62 = 60 + 2. Qual outra soma também dá 62?":"v8955d106221358a1.mp3","63 arredondado para a dezena mais próxima é?":"v3309ec7ed8693c79.mp3","6×5=30 e 6×2=12. Junte as partes: 30+12 = 42.":"vc0a396b2a51f246c.mp3","6×6 é 5×6 mais um grupo de 6: 30+6 = 36.":"vf4a032a868d3dae8.mp3","6×7 = 42. Se travar, pense 6×7 = 6×5 + 6×2 = 30+12.":"v9b9eed26f2d03333.mp3","7 + 3 = 10, então 10 - 7 = 3.":"vbe8cce8dbc09b9ac.mp3","7 = 3 + 4. Essa frase está…":"v16da22324f250983.mp3","7 e quanto formam 10?":"v150cf2bb26c2920f.mp3","7 × 6 = 7 × 5 + ?":"vfc11603b68341291.mp3","7×5 são cinco setes; para ter seis setes, some mais 7.":"v3bd5a3517de0e0ce.mp3","8 + 6 = 14. Apoio: 8 + 2 = 10, e mais 4 = 14.":"vbced26605ed6a62e.mp3","A 1ª casa depois da vírgula é a dos décimos: 0,3 = 3 décimos, menos que 1.":"v03388eba0630cd8a.mp3","A afirmação 'todo número multiplicado por 0 dá 0' é sempre, às vezes ou nunca verdadeira?":"v3ffa6a2603222019.mp3","A barra é 1 grupo de 10: vale 10.":"v6fcc3174b222baa1.mp3","A escala não é sempre 1; leia os números do eixo.":"v984ded7037447f4d.mp3","A festa começou às 3 horas 🕒 e durou 2 horas. A que horas acabou?":"vc9a9d36795dc77e8.mp3","A história precisa corresponder à operação.":"v44272bf32955c96c.mp3","A história tem dois números: 3 e 2.":"v28a329194e35f08f.mp3","A hora tem 60 min. 75 min viram 1h15: 2h40 + 35 = 3h15.":"vf74daa7a336af68a.mp3","A letra n representa o valor que foi dado — aqui n vale 5, não sempre o mesmo número.":"v71f76cba541c0aea.mp3","A razão é uma divisão (quantos km em cada hora), não a diferença entre 60 e 2.":"veeaf4c5b3b101a6e.mp3","A regra da caixa é BICHO: o carro está no lugar errado.":"vadcb6f914d5ae610.mp3","A regra do grupo é FRUTA: só a laranja combina.":"v34fe4a43187ed0c7.mp3","A representação precisa mostrar a ação do problema, não só decorar.":"v5729fdf0e25c1f8b.mp3","A vírgula separa o inteiro da parte decimal — cada casa depois dela tem um nome (décimos, centésimos).":"vdc1e9cfa478e1a0d.mp3","Alinhe pela VÍRGULA (mesma casa decimal), não pelo dígito da direita.":"v4eca12ea8358ef43.mp3","Amanhã é um dia depois: 10 + 1 = 11.":"v239b184badf711f8.mp3","Ana diz: 'todo número par mais número par dá par'. Ela testou só 2 + 4 = 6. Isso prova que a regra vale sempre?":"v27ecbf65830fc461.mp3","Ana tem 12 figurinhas. Ela tem 5 a mais que Leo. Quantas Leo tem?":"v3c85d4720de546cf.mp3","Ana tem 3 figurinhas. João tem 4 vezes mais. Quantas João tem?":"v1fe14300f64673d7.mp3","Ana tem 6 anos e 4 balas. Ela comeu 1 bala. Para descobrir quantas balas restam, quais números devemos usar?":"v9c85171ae4c5b91b.mp3","Ana tem moedas de R$ 2, R$ 2 e R$ 1. Quantos reais ela tem?":"v340673f00bb8f1df.mp3","Antes de comparar, transforme todas para a mesma forma (todas frações, ou todas decimais).":"vfdad4024e36ab2fd.mp3","Antes de somar frações com denominadores diferentes, transforme uma (ou as duas) em frações equivalentes com o mesmo denominador.":"vc910608ce437a8b6.mp3","Ao DESLIZAR (translação) um triângulo para a direita, o que muda e o que fica igual?":"v21969f090372501e.mp3","Ao virar a década: 39, 40.":"va37d7b2d0f15555c.mp3","Aplique a mesma regra usada entre os termos anteriores, não um número qualquer perto dos vizinhos.":"v2ad6496e388198d6.mp3","Aplique a regra da tabela à entrada nova, em vez de repetir uma saída que já apareceu.":"v7dd44885933da029.mp3","Arredonde 398 para 400, some 205 e devolva os 2: 603.":"v310c2a1c7a9488d0.mp3","Arredonde: 40 + 40 = 80. O total tem duas casas, não é 8 nem 800.":"vf339af950ee39792.mp3","Aumentar pessoas e ovos na mesma proporção não é somar a mesma diferença — é multiplicar pelo mesmo fator de escala.":"v362f84f43047d6b4.mp3","Boa estimativa! Fica lá pelos 50.":"vaf40559448152c36.mp3","Cada algarismo vale pelo lugar: 3 centenas (300) + 0 dezenas + 5 = 300 + 5.":"vf573cafe3ef52ccb.mp3","Cada barra vale 10, não 1. 30 + 4 = 34.":"ve2deea2f44ada963.mp3","Cada categoria mantém a própria quantidade da tabela.":"v918de35f9a959c6a.mp3","Cada metro são 100 cm: 2 × 100 = 200.":"v1f19cf0c62d57d94.mp3","Cada ✔ vale 1 gato: conte as marcas, são 3.":"v3aab5e68d6b13fda.mp3","Cada 🍦 é um sorvete vendido. Segunda: 🍦🍦🍦. Terça: 🍦. Que dia vendeu MAIS?":"vf17f5d9e8d7baf60.mp3","Comece no 3 e ande 2 horas: 4, 5. Acabou às 5 horas.":"vbfaca216f31c9a4f.mp3","Comece no 7 e conte 2: 8, 9.":"v724824d648931f1d.mp3","Como justificar que um quadrado é um paralelogramo?":"v791fae0bcc5a49ff.mp3","Como se lê 0,3?":"v3aa8086263c15016.mp3","Compare a ABERTURA do ângulo com o ângulo reto (90°) como referência, não o tamanho dos lados desenhados.":"v83d8781592964eb4.mp3","Compare casa a casa: 5 décimos > 4 décimos. Ter mais algarismos não faz maior.":"v2bb2607a05eb9b4d.mp3","Compare estratégias; nem sempre o caminho mais mecânico é o melhor.":"vfec6abfc2d0fd724.mp3","Compare os tamanhos de ponta a ponta: o trem ganha.":"vb11523e7541fc150.mp3","Compare pela casa mais alta primeiro: 900 é mais que 090, então 1900 é o maior.":"vb221ff6004373cc9.mp3","Compare quantas azuis existem dentro do mesmo total.":"v2cd78abd53a5f496.mp3","Complete 10 primeiro: 8 precisa de 2, sobra 3 do 5 -> 13.":"vc010188e6c5768f3.mp3","Conclusão de investigação precisa se apoiar em dados.":"vc3bb0f355ed7ecdf.mp3","Confira a ORDEM: primeiro o valor horizontal (x), depois o vertical (y) — não troque nem conte errado.":"vd3bf2c5eda312b42.mp3","Confira cada direção separadamente: quantas casas na horizontal e quantas na vertical, sem trocar os números ou o sentido.":"v75da48bdfb85d693.mp3","Contando de 2 em 2, os números são 2, 4, 6. Qual vem depois?":"vb6b62070abee70de.mp3","Conte as casas decimais pelo denominador: centésimos usa 2 casas depois da vírgula.":"v2ab419e734f756f2.mp3","Conte cada superfície plana do sólido, uma por uma, sem pular nem repetir.":"va715ef5f4748d1bc.mp3","Conte de 10 em 10 a partir de 290. Qual vem depois?":"v6ef372bd9145d7a7.mp3","Conte de 5 em 5, ou seja 5, 10, 15. Quanto é 4 vezes 5?":"ve91dd31bc9680ced.mp3","Conte de 7 até 10: 8, 9, 10 - são 3.":"vac3b7ee2c7ec0b06.mp3","Conte os SALTOS: 3→4 e 4→5. São 2 horas, não os números.":"v7961857e5d748603.mp3","Conte os clipes encostados: 4.":"vc92540f1ef6b4359.mp3","Conte os cubinhos: 2 fileiras de 3 = 6.":"vd5eae1ae5a3d2120.mp3","Conte os desenhos de cada dia: 3 na segunda, 1 na terça.":"v07f7dd3e22690362.mp3","Conte os lados de cada forma: o quadrado tem 4.":"vc8d15ecf7251ba0f.mp3","Conte os pontos: 8.":"vcd19caf5e8ed3b80.mp3","Conte os quadradinhos de cada barra: 5 contra 3.":"v61c992a58658451a.mp3","Conte quantas faces o sólido tem — a planificação precisa ter exatamente essa quantidade de peças.":"v9893224cc88bb753.mp3","Conte todos os pontos, não só os extremos.":"v48f6b32020244419.mp3","Conte todos os pontos: 5.":"ve1b096b29555480b.mp3","Conte todos: 3 e 2.":"v0dd68101a7f90aac.mp3","Continue o padrão: 🔴🔵🔴🔵🔴…":"v46c854a97e7f8cc4.mp3","Cuidado: barras são dezenas. 3 dezenas = 30, mais 4 = 34.":"v57a67a10e5095fd2.mp3","Dados: dois, três, três e dez. Qual é a moda?":"ve30bf341c8a5ae96.mp3","De 10 em 10 sobe uma dezena; 290 mais 10 fecha uma centena nova: 300.":"v25e1e64f5ade43f9.mp3","De 3 horas 🕒 até 5 horas 🕔, quantas horas passaram?":"v5cb3fd24fd313651.mp3","De 4 bolinhas, 1 é vermelha. Que fração das bolinhas é vermelha?":"v4b39b5c33360f053.mp3","De 4 para 5 falta 1.":"vfe3f742107c10185.mp3","De 8 tire 3: sobra 5.":"v0724981e3bf45c99.mp3","De cabeça: 1000 − 998 = ?":"v9c2158a6cbf65dd3.mp3","Depois de multiplicar, confira se a vírgula ficou num lugar que faz a resposta ter um tamanho razoável.":"v7e6b48393a972731.mp3","Divida: uma para cada prato, de novo e de novo. Dá 3 e 3.":"vb1d2209ee11945d2.mp3","Dividir em 4 dá pedaços menores que dividir em 2: 1/2 é maior, mesmo com o 4 sendo maior.":"v93e88d4cc61e893a.mp3","Divisores de 12 são os números que cabem certinho em 12, sem sobrar. Qual é divisor de 12?":"v642385bd28f5ef21.mp3","Em um CONJUNTO, a fração compara quantos objetos têm a característica com o TOTAL de objetos — não é sobre dividir uma figura ao meio.":"vf71d95bc5266117a.mp3","Encoste os lados retos dos triângulos: vira um quadrado.":"v06bc35a87f6e9c28.mp3","Escolha a representação pela pergunta: aqui queremos comparar categorias.":"v8b0dbe983f5c841a.mp3","Explicar é contar o caminho, não só repetir a conta.":"v92c716a9c7e27329.mp3","Faça grupos de 5: 5, 10, 15 — deu 3 grupos.":"v7694accc040b0b3e.mp3","Grupo das FRUTAS: 🍎🍌🍇. Quem entra junto?":"v57134d01351cdf01.mp3","Grupos de 5 dentro de 30: 5,10,15,20,25,30 — 6 grupos. Metade seria só para ÷2.":"v072a5e22a30b7951.mp3","Hoje é dia 10 📅. Que dia é amanhã?":"v567476c8d9bddcf1.mp3","Há mais vermelhas, mas ainda existe bola azul.":"v73b8c509848e1d29.mp3","Ilha explorada! Descanse um pouco ou siga para a próxima ilha.":"v47aa22e546328230.mp3","Imagine dobrar no meio: os lados da borboleta batem certinho.":"va48fe4dcc4296186.mp3","Isso! 'às 4 horas' diz QUE horas: é um momento.":"v111e4fef8d4c49c7.mp3","Isso! -8 é mais frio que -3.":"v36744dde46f3a88b.mp3","Isso! 0,3 = 3/10 = 'três décimos'.":"v5af7b7841de466d2.mp3","Isso! 0,5 = 5 décimos é maior que 0,45.":"v646f8be217bc2057.mp3","Isso! 1 bolinha vermelha em 4 bolinhas é 1/4 do grupo.":"vccca856ce5f2a7b5.mp3","Isso! 1 de 4 partes iguais = um quarto.":"v902e39fadd98e89c.mp3","Isso! 1/2 = 2/4, então 2/4+1/4 = 3/4.":"v9eb3a72decb0bcf4.mp3","Isso! 1/2 = 4/8, que é maior que 3/8.":"v8a8478e8c33d8fff.mp3","Isso! 1/2 é maior que 1/4.":"vf77bb9343b501113.mp3","Isso! 10 + 6 = 16.":"v588f4c34ed727f49.mp3","Isso! 10 + 7 = 17, não 18.":"va78abf226e9a1fd3.mp3","Isso! 10 - 6 acha o que saiu.":"v287cb57dd2701c22.mp3","Isso! 10 é mais que 1.":"v0551be04eff00803.mp3","Isso! 10 − 7 = 3 de troco.":"v5ecbdd4dbfc14a30.mp3","Isso! 100 + 30 = 130.":"v5c2d38e20f2413e4.mp3","Isso! 12 dezenas = 1 centena e 2 dezenas: 324.":"vc5dc9c221abf09ea.mp3","Isso! 12 em 4 fileiras dá 3 em cada.":"vc6663a5bc774809c.mp3","Isso! 12 ÷ 4 = 3 sem sobrar: 4 é divisor de 12.":"v003b53702f6451aa.mp3","Isso! 15 + 8 = 23, e 23 − 6 = 17.":"v600c8b872b6356b4.mp3","Isso! 156÷4=39.":"v5590517ac9d71147.mp3","Isso! 168÷12=14.":"vce8e0e066485bdd1.mp3","Isso! 1900 é o maior.":"v2dcb687c31ceed7a.mp3","Isso! 2 + 2 + 1 = 5.":"v2fff73779415e9bc.mp3","Isso! 2 metros = 200 cm.":"vd5497bbcdc56f366.mp3","Isso! 2 × 3 = 6 cubinhos.":"v2677b4fe657b26be.mp3","Isso! 2 × 6 = 12.":"vce141ab4d16ae828.mp3","Isso! 246 + 178 = 424.":"v76d857cfa978616b.mp3","Isso! 25 centésimos = 0,25.":"v90a6f848c633b4cb.mp3","Isso! 25 x 4 é 100 de um jeito rápido.":"vd1a5f49d940910bf.mp3","Isso! 25 → 35 → 38.":"v2115f025bc4b155a.mp3","Isso! 3 dezenas e 4 unidades = 34.":"v6cd6559515023a41.mp3","Isso! 3 décimos + 4 décimos = 7 décimos = 0,7.":"vda1539fd670dafbf.mp3","Isso! 3 e 3.":"v3ec264f50deb3c24.mp3","Isso! 3 em cada pote.":"ve0fec27396d78449.mp3","Isso! 3 grupos de 2 = 6.":"ve8a630f66f4eeea4.mp3","Isso! 3 grupos de 2 dão 6.":"vfd892386aa425f8a.mp3","Isso! 3 grupos de 5.":"ve5eb206558909145.mp3","Isso! 3 horas mais 2 de duração = 5 horas.":"v26f249fd622dbca3.mp3","Isso! 3 marcas, 3 gatos.":"v17907d17f8ce3f68.mp3","Isso! 3 × 1/4 = 1/4+1/4+1/4 = 3/4.":"v49f0743703c9a540.mp3","Isso! 3 × 2,45 = 7,35 — perto da estimativa de 6, faz sentido.":"v8ce8a18c9329fccc.mp3","Isso! 3 × 4 = 12 quadradinhos de área.":"v664621a3e3c55de8.mp3","Isso! 3 × 4 = 4 × 3.":"v605b1d4b68a3afd1.mp3","Isso! 3 é mais que 1.":"vfcbc1c62a4191294.mp3","Isso! 3/4 fica na 3ª marca, contando do 0 até o 1.":"v5041c548814221a5.mp3","Isso! 3/4 é maior que 1/2.":"vb7f712a72baaf88d.mp3","Isso! 30 + 12 = 42.":"vb7ccb3c6c15aed75.mp3","Isso! 30 + 6 = 36.":"v28820b81c9f8fd81.mp3","Isso! 305 = 300 + 5 (não há dezenas).":"v256ea3fcbd47d342.mp3","Isso! 30÷5=6.":"vcfa500e5389eda82.mp3","Isso! 34 + 5 = 39 (só mudam as unidades).":"vc1f6f30823d9526e.mp3","Isso! 39 ≈ 40 e 42 ≈ 40, então ≈ 80.":"v3aff7c22199c9f0a.mp3","Isso! 398 vira 400 e depois tiro os 2: 603.":"v346ac3d0a60387b4.mp3","Isso! 4 + 3 + 2 = 9 votos.":"v693d9a83a598591a.mp3","Isso! 4 + 3 = 7.":"vb3a299dba27d2aaf.mp3","Isso! 4 + 4 = 8.":"vd1c1945b3ef04a06.mp3","Isso! 4 + 6 + 8 = 18, e 18 ÷ 3 = 6.":"va0c81df8ffb3c170.mp3","Isso! 4 clipes certinhos.":"vb9b5b4ae372e00a6.mp3","Isso! 4 dezenas e 16 unidades também dão 56.":"v26ff4ff17dee19c3.mp3","Isso! 4 e 1 formam 5.":"ve3228bf94c5a793b.mp3","Isso! 4 vezes 3 = 12.":"vde9f76d1ce3692f7.mp3","Isso! 4 × 3 = 12 quadradinhos.":"va35480d6a4dd315a.mp3","Isso! 4 × 3 = 12.":"v0e7eca24733961c4.mp3","Isso! 4 × 5 = 20.":"v480a10a421f3d6f8.mp3","Isso! 40 + 35 = 75 min = 1h15, então 2h40 + 35 = 3h15.":"v4a6e01943118b8da.mp3","Isso! 45 está entre 40 e 50.":"vdecabe24461bbbf8.mp3","Isso! 5 + 2 = 7.":"v8a30c335f3af00fc.mp3","Isso! 5 + 3 = 8.":"vf24fa5e113e0e6a3.mp3","Isso! 5 + 3 = 8: a letra n recebeu o valor dado e você somou 3.":"v43c557fa71a46935.mp3","Isso! 5 e 3 formam 8.":"v41971c9075e0aa91.mp3","Isso! 5 é mais que 3.":"v71fc665875d3785f.mp3","Isso! 50 + 12 também é 62.":"vcd8069a835bc6429.mp3","Isso! 50% é a metade: metade de 20 é 10.":"v9641518d56c0cb4e.mp3","Isso! 6 + 3 = 9.":"v490ab30798c22f43.mp3","Isso! 6 pessoas são 1,5 vez as 4 pessoas, então 6 ovos × 1,5 = 9 ovos.":"vf29fae117965d374.mp3","Isso! 6 × 100 = 600.":"v40e6af2d590cca00.mp3","Isso! 6 × 7 = 42.":"v98953e45be63c08c.mp3","Isso! 6, 12, 18: o 18 aparece nos saltos de 6.":"v3c68d764fa8006a4.mp3","Isso! 60 + 9 = 69.":"vcde6f0cb666739ef.mp3","Isso! 60 km ÷ 2 horas = 30 km por hora.":"v90f4db909f18962e.mp3","Isso! 600÷100=6.":"vedd3bfcb33df4e6f.mp3","Isso! 63 está mais perto de 60.":"va80285bd2fcda3eb.mp3","Isso! 63 − 28 = 35.":"vd36046d39afa9e63.mp3","Isso! 67 é maior.":"vff90ae304ac292dc.mp3","Isso! 7 + 3 = 10.":"v8e13bd90c5119be3.mp3","Isso! 7 vans — as 2 que sobram precisam de mais uma.":"v72843ac4745cebba.mp3","Isso! 7, porque 8×7=56.":"vbd7b4140de6bc95a.mp3","Isso! 8 + 5 = 13.":"v16d81a2b9302a303.mp3","Isso! 8 + 6 = 14.":"v1db33ed4be6c5acb.mp3","Isso! 8 + 7 = 15.":"v026d78bf5cc532d9.mp3","Isso! 8 - 3 = 5.":"v5e4fb019df3461b7.mp3","Isso! 80 é o mais perto de 100.":"ve4f800f1b9b1cf50.mp3","Isso! 998 e 1000 são vizinhos: a diferença é 2.":"v4b035d0e0bbfd832.mp3","Isso! A banana está entre as duas.":"vbaaa32a4be362bcb.mp3","Isso! A barra da maçã recebe 4 quadradinhos.":"vaa67b9abf362b2cf.mp3","Isso! A conclusão cita os dados comparados.":"v0c013ccae92c52ad.mp3","Isso! A cor não ajuda a calcular o gasto.":"v89ceac283ac76dd4.mp3","Isso! A divisão desfaz a multiplicação: 24÷6=4.":"vef47091e7489462f.mp3","Isso! A evidência é 8 maior que 5.":"v5a2a4b867890e48f.mp3","Isso! A fala mostra os passos do raciocínio.":"v94d55f10d5e03922.mp3","Isso! A história tem um todo e uma retirada.":"v7bbf010af61d5f00.mp3","Isso! A idade (6) não entra na conta.":"vb7f3afeecaeeb9c5.mp3","Isso! A justificativa usa a PROPRIEDADE (lados opostos paralelos), não a aparência.":"v2cccaa8a075662d7.mp3","Isso! A pergunta é quantas restam.":"vb885167100aafec8.mp3","Isso! A regra explica como cada número nasce do anterior.":"v8b2c1ee06dcf0cca.mp3","Isso! A regra é somar 3 a cada vez.":"vf284b5d88a883bbf.mp3","Isso! A representação mostra o todo e a parte que saiu.":"v422423cb6ccfc6f0.mp3","Isso! Amanhã é dia 11.":"v9035fb67c409dfb7.mp3","Isso! Antes de aceitar, estime a grandeza.":"vdd7e576049864577.mp3","Isso! Ao todo são 5.":"vbad79426a8f7114f.mp3","Isso! As asas da borboleta são espelhadas.":"v256eed47fce6687d.mp3","Isso! As partes 4 e 3 formam o todo 7.":"v528d453d7aa709de.mp3","Isso! Barras ajudam a comparar categorias.":"v77370a99921762d0.mp3","Isso! Cada algarismo sobe uma casa: 45 vira 450.":"vd8d4964093571276.mp3","Isso! Cada grupo tem 3.":"v7a159bacc49dc052.mp3","Isso! Cada pedaço de um todo dividido em 3 partes iguais é um terço.":"v08db81c57f21bdb3.mp3","Isso! Carrinho não é bicho.":"v6f648199d3a75cf0.mp3","Isso! Com o mesmo denominador, quem tem numerador maior é maior: 5/8 > 3/8.":"v1fb0e6e45246bcc9.mp3","Isso! Da mesma família: 10 - 7 = 3.":"v30bce70dc501c241.mp3","Isso! De 2 em 2 vem o 8.":"vbe96304beefb21ac.mp3","Isso! De 3 a 5 são 2 saltos: 2 horas.":"vd40be2bcccc2bbb2.mp3","Isso! Depois de 39 vem 40.":"vd2b1596a38e2fe9f.mp3","Isso! Depois do vermelho vem o azul.":"v8e1e889d2b9ee89f.mp3","Isso! Desenhar 6 e riscar 2.":"v7439ca173718d1c0.mp3","Isso! Deu 4.":"vfab9d60c9308121f.mp3","Isso! Do 7: 8, 9.":"v7954880e7bff73a6.mp3","Isso! Dois triângulos formam um quadrado.":"v1ced54511d05e25a.mp3","Isso! Falta mais um grupo de 7.":"v4e654d4a349e8169.mp3","Isso! Fechou a centena: 290 mais 10 é 300.":"ve459dba37a002ecf.mp3","Isso! Fração, decimal e porcentagem são três formas de escrever a mesma quantidade.":"v8eff52d48d6ee4b5.mp3","Isso! Há 5 medidas no gráfico.":"v5fc54b0cb1993e87.mp3","Isso! Juntando 3 partes de 1/4, formamos 3/4 (não o número 3).":"va3d62e321a4b1476.mp3","Isso! Laranja também é fruta.":"v535afcb05a61d09f.mp3","Isso! Líquido se mede em litros.":"v872b549bd64d6728.mp3","Isso! Metade de 6 é 3.":"va39ffe5eea58df00.mp3","Isso! Moda é o valor que aparece mais: 3.":"vd72039841b2caf4a.mp3","Isso! Multiplicando numerador E denominador por 2: 1/2 = 2/4.":"v1f380aca92399804.mp3","Isso! No saco A, azul é 4 de 5; no B, é 2 de 5.":"v1c9ba3df61abc8c7.mp3","Isso! O 12 está nas duas listas: é o denominador comum.":"v6ca6abc2ef61cac6.mp3","Isso! O 3 depois da vírgula são 3 décimos.":"v92ff2e11b0017acf.mp3","Isso! O 4 está nos milhares: vale 4000.":"v2adfef5ad12fc176.mp3","Isso! O 7 está nas dezenas: vale 70.":"v80c5784caaa1296b.mp3","Isso! O = diz que os lados valem o mesmo.":"vff670be6071804ad.mp3","Isso! O canto da folha é o exemplo mais comum de ângulo reto (90°).":"v0947545ba0495cc5.mp3","Isso! O contorno todo mede 12.":"vedc1887819b672c6.mp3","Isso! O cubo tem 6 faces quadradas.":"vfceabd4599b2f3f8.mp3","Isso! O cubo tem 6 faces, então a planificação tem 6 quadrados.":"vf34882aa1efa485c.mp3","Isso! O círculo é redondinho.":"v2e6f56ecaf8b2a8d.mp3","Isso! O dia começa acordando.":"v9ffb949edfb36a64.mp3","Isso! O dobro de 6 é 12.":"ve80d101c6f50e12d.mp3","Isso! O lápis é pequeno: medimos em centímetros.":"va3c3200cf1563426.mp3","Isso! O primeiro número (x) é o quanto anda na horizontal; o segundo (y) é o quanto sobe.":"ve28f287a2a465ab6.mp3","Isso! O quadrado tem 4 lados.":"va97067d60efa43c8.mp3","Isso! O sinal negativo em x manda para a esquerda; y positivo manda para cima.":"v2e09c644cc83304a.mp3","Isso! O trem é o mais comprido.":"vf145c052201289b0.mp3","Isso! O valor lido no eixo é 8.":"ve81fd38a5224c5c4.mp3","Isso! O ângulo reto mede 90 graus.":"vee2c3ddb21bc592c.mp3","Isso! Os dados são 3 e 2.":"vfecabf4a3dac30a9.mp3","Isso! Perto de 40.":"vf1ac60476578db35.mp3","Isso! Ponteiro pequeno no 3: 3 horas.":"v238d522fb4ded263.mp3","Isso! Por cento (%) significa 'a cada 100'.":"v1687892d21ef84f1.mp3","Isso! Primeiro resolva os pacotes, depois junte as soltas.":"v86f30e4ad0287307.mp3","Isso! Qualquer número multiplicado por 0 dá 0, sem exceção.":"vcc00654015eeb7c9.mp3","Isso! Se Ana tem 5 a mais, Leo tem 5 a menos: 12 - 5.":"vc9ef9474efbd8956.mp3","Isso! Siga exatamente a quantidade de casas de cada direção, na ordem certa.":"v125862257c031078.mp3","Isso! Sobram 2.":"vd45067803168b3dc.mp3","Isso! Some só os numeradores e mantenha o denominador: 1/5+2/5=3/5.":"v75da2869f71ac0bc.mp3","Isso! São 8, o numeral 8.":"v036e81e336008029.mp3","Isso! Tirei 1 do 6 para o 49 virar 50; sobra 5. Dá 55.":"v0b3c564cdd8f7b64.mp3","Isso! Todas têm par: 6 é par.":"v6d693ce9ecfceae4.mp3","Isso! Todo quadrado é um retângulo (tem 4 ângulos retos), mas nem todo retângulo é quadrado.":"v88b7da6b9c2f6c1d.mp3","Isso! Translação só move a figura — forma e tamanho não mudam.":"v4ecc20620e6ebc82.mp3","Isso! Trocar a ordem das parcelas na adição não muda o resultado.":"v65ca707945950959.mp3","Isso! Três pedaços de um quarto.":"vcc6a0ecef6be83cd.mp3","Isso! Um exemplo certo não garante que a regra vale sempre — mas testar vários casos ajuda a confiar nela.":"v53b97157bcf4e0ea.mp3","Isso! Uma dezena vale 10.":"v58d38cb8f7c26bbc.mp3","Isso! Vermelha é mais provável, mas não é certeza.":"v1a232e1d7b56e268.mp3","Isso! Você aplicou a regra 'mais 4' à nova entrada.":"v0468ca633d03f66e.mp3","Isso! Ângulo agudo é menor que 90°.":"v6075484e1a800517.mp3","Juntando dois triângulos 🔺🔻 certinho, dá para formar…":"v98c4e774609199e8.mp3","Junte 4 e 3: dá 7.":"v3eef7beab4e229b1.mp3","Junte as partes iguais mantendo o mesmo denominador — 3/4 é uma fração, não é '3 e 4' separados.":"vf0e28ec462d7484e.mp3","Junte as partes: 4 e 3 dão 7.":"v0d77bf89686dca38.mp3","Junte tudo: 200 + 120 + 4 = 324. Trocar 10 dezenas por 1 centena não muda o total.":"v3de99ca9e6f656ec.mp3","Justificar geometria exige citar a propriedade que a figura cumpre, não como ela 'parece' no desenho.":"vb5a263dace5e8ef1.mp3","Lara comprou 3 cadernos de 8 reais. Ela tem 30 reais e a capa é azul. Qual dado sobra?":"va4d1443f4149c48e.mp3","Lia tinha 12 figurinhas e deu algumas. Ficou com 8. Quantas deu?":"v4174d72393d6d144.mp3","Line plot de alturas: cento e vinte, cento e vinte, cento e trinta, cento e quarenta, cento e quarenta centímetros. Quantos pontos há no total?":"vdccbf31c993c87b1.mp3","Listar os números não é a mesma coisa que explicar a regra de formação.":"v601ac2b9f816d4d4.mp3","Mapa completo! Agora eu sei por onde começar. Suas missões estão prontas!":"v21a32b2e0a67de79.mp3","Metade: divida em 2 partes IGUAIS. 3 e 3.":"v2aeb860c34d2d915.mp3","Metros medem comprimento e gramas medem peso. Líquido é em litros.":"v369ac22ed9485611.mp3","Moda não é o maior nem o primeiro valor; é o que mais se repete.":"v8894a6d24c567f8d.mp3","Multiplicar fração por número natural é somar essa fração várias vezes, mantendo o denominador.":"v34deca7e1e7b8164.mp3","Multiplicar por 10 empurra tudo uma casa acima: 4 vira centena, 5 vira dezena → 450.":"vb98050b661862324.mp3","Multiplicar por 100 acrescenta dois zeros: 600.":"v4535c0c3c89e48fd.mp3","Média não é o maior valor; é repartir o total igualmente.":"v979ce8b730ff6490.mp3","Múltiplos de 4 são 4, 8, 12. Múltiplos de 6 são 6, 12. Qual número aparece nas duas listas?":"v5a607e77354fe119.mp3","Múltiplos de 6 são onde você para saltando de 6 em 6, ou seja 6, 12, 18. Qual destes é múltiplo de 6?":"v7a7debc8c89f7246.mp3","Na caixa dos BICHOS tem: 🐶🐱🚗🐰. Quem NÃO devia estar lá?":"v2b790b8900d55e02.mp3","Na expressão n + 3, quando n = 5, qual é o valor?":"v4b3c29f42db85a28.mp3","Na reta, a partir de 25 saltei +10 e depois +3. Onde cheguei?":"va126cbd783aebd0c.mp3","Na tabela, a linha dos GATOS tem as marcas: ✔✔✔. Quantos gatos?":"vafc5359a1e94c131.mp3","Nas transformações desse tipo (deslizar, girar, espelhar), a figura mantém sua forma e tamanho — só muda de posição.":"v29779edf3d448209.mp3","Nem todo 'a mais' vira somar; compare quem tem mais.":"v85e424dfffbb2422.mp3","No gráfico: maçã tem 5 quadradinhos, banana tem 3. Qual tem MAIS votos?":"v8391229c12321696.mp3","No meio = entre uma e outra: a banana.":"v0f7a22b514ac7176.mp3","No número 372, quanto vale o 7?":"v702e1da0fe1f6a87.mp3","No número 4 250, quanto vale o 4?":"v4e9dfe4a553110c5.mp3","No problema 'Ana tinha 3 balas e ganhou 2', quais números aparecem?":"vb96eb56be8e34bb5.mp3","No saco há 5 bolas vermelhas e 1 azul. Tirar vermelha é...":"vdf4b481b42077d6e.mp3","Numa grade, para ir do quadrado A ao quadrado B você anda 3 casas para a direita e 2 para cima. Qual é o caminho certo?":"v78c232fe563da3a7.mp3","Numa mini-investigação, qual conclusão usa dados?":"vd90b735afdcde296.mp3","Numa máquina, a saída é sempre a entrada mais 4: quando a entrada é 2, a saída é 6; quando é 5, a saída é 9. Se a entrada for 7, qual é a saída?":"vf72a1844ac78f2ed.mp3","Numa reta de 0 a 1 dividida em 4 partes iguais, onde fica 3/4?":"ve7a04099edef48d0.mp3","Não some 4+6. Procure o número que aparece nas DUAS listas: o 12.":"ve03b22b9ae9ef43b.mp3","Não some o 5 com o 8: procure o que FALTA de 5 até 8.":"va3054cf21eabddfb.mp3","Números quase iguais: conte a diferença de cabeça (2). Não precisa de algoritmo com trocas.":"v6f46bfd48c58a070.mp3","O 4 ocupa a casa dos milhares: 4 × 1000 = 4000.":"v75de2949f1d33090.mp3","O 5 e o 2 são dados; a pergunta é o que sobrou.":"v7e4c950afb12a8c3.mp3","O 5 é unidade: soma com o 4, não com a dezena. 34 + 5 = 39.":"v292f21063a5e4598.mp3","O 7 ocupa o lugar das dezenas: vale 7 dezenas = 70, não só 'sete'.":"vddb0100817fcb715.mp3","O = não é 'a resposta vem aqui': é 'os dois lados valem igual'.":"vddbb812f2b5449f6.mp3","O cantinho quadrado é o ângulo reto: 90 graus.":"v2ce1f66994fb7e7e.mp3","O chocolate foi partido em 4 pedaços IGUAIS. Um pedaço é…":"v86c77f98437965a2.mp3","O círculo é redondo, sem cantos: ⚪.":"v74d03ee4699ef03e.mp3","O denominador (tamanho das partes) não muda ao somar — some só os numeradores.":"veefe99d12f917df7.mp3","O desenho ⬛⬛⬛ / ⬛⬛⬛ / ⬛⬛⬛ / ⬛⬛⬛ (4 fileiras de 3) mostra qual conta?":"ve9e8d494f01e8a25.mp3","O eixo do gráfico conta de 2 em 2. A barra chega ao 8. Qual é o valor?":"v8caafca07e3e649e.mp3","O grupo fechado vale 5; com mais 2 riscos dá 7.":"va66e4e95334732d1.mp3","O lápis mede 4 clipes, um encostado no outro: 📎📎📎📎. Quantos clipes mede o lápis?":"vb790cef57d4804f4.mp3","O lápis é curto. Metros são para coisas grandes; a balança mede peso, não comprimento.":"vd8912b25d3e64e0d.mp3","O nome da fração vem de QUANTAS partes iguais formam o todo, não do número de pedaços cortados.":"vd4c0e4e9d5df1565.mp3","O número que falta não é igual a um dos números já dados — resolva a sentença para descobrir seu valor.":"v346ad7cb2a2ae07e.mp3","O padrão é vermelho-azul, sempre: agora vem 🔵.":"v6bae4346c223970c.mp3","O perímetro é o contorno da figura. Some os lados: 3 + 3 + 3 + 3.":"v012b54d22bd2ee07.mp3","O ponteiro PEQUENO mostra a hora: está no 3.":"vd8302226f69e8355.mp3","O ponto (-3, 2) fica em qual direção a partir da origem?":"v899f67a0077b1bac.mp3","O que significa 25%?":"v984be3ff0293a012.mp3","O que vem PRIMEIRO no seu dia?":"v07bcd080c7f159e5.mp3","O sinal (+ ou −) de cada coordenada decide a direção — não ignore o sinal negativo.":"v44a3139b74675b4c.mp3","O todo menos o que ficou: 10 - 6.":"v4b49a8cf4fe111b2.mp3","Observe a sequência: 2, 5, 8, 11. Qual é a regra?":"v8d3c58ea3749d859.mp3","Olhe as duplas: ninguém sobrou, então 6 é par.":"v09f6b475362a0430.mp3","Olhe o NÚMERO: 10 é maior que 1.":"v4e1b40999423e76b.mp3","Paguei 10 reais 💵 por um lanche de 7. Quanto de troco?":"v0076e13967a9327b.mp3","Para 19 + 22, uma resposta 401 faz sentido?":"vd63d8cdb1ee0b156.mp3","Para 25 x 4, qual estratégia parece mais eficiente?":"v9e4648b3cc1d434a.mp3","Para 6 × 7, quebro em 6×5 + 6×2. Quanto dá?":"v0d7ca120cd47937f.mp3","Para achar uma fração equivalente, multiplique OU divida numerador E denominador pelo MESMO número.":"v64a23119c564d11d.mp3","Para comparar votos por lanche, qual representação ajuda mais?":"v3a0d74167e0cdd7d.mp3","Para facilitar 49 + 6, penso 50 + ?":"v0c53d4d485bcae2d.mp3","Para medir o comprimento do lápis ✏️, qual régua serve melhor?":"v5e8058f215784f20.mp3","Para medir quanto de suco cabe na garrafa 🥤, o que usamos?":"v633fa0629368073c.mp3","Para o problema '12 figurinhas, dei 5', qual representação combina?":"v0d72a8a8905e4d31.mp3","Para o total, use todos os dados pedidos, não só uma linha.":"vd8e711854a663bcf.mp3","Para resolver '3 pacotes com 4 figurinhas e mais 5 soltas', qual plano vem primeiro?":"v6b110e179a5ab200.mp3","Para somar 1/2 + 1/4, o que fazer primeiro?":"vf5b727e25e1897a1.mp3","Partiu em 4 iguais? Cada pedaço é UM QUARTO.":"v7e6d560c80578f74.mp3","Pelo algoritmo, quanto é 246 + 178?":"vd1e304fb173a87f1.mp3","Pense na ordem do dia: primeiro a gente acorda.":"vd8266e6c3b6bd2c6.mp3","Pense na reta: 80 está mais à direita, perto do 100.":"v2113191452f1a3b0.mp3","Pense na tabuada: 8×7=56, então 56÷8=7.":"v490c12cf84e746df.mp3","Pense no tamanho: 5 é pouquíssimo e 500 é demais; algo perto de 50 faz sentido.":"v218e8757acb1572f.mp3","Perímetro é somar TODOS os lados do contorno: 3+3+3+3 = 12.":"v264617433be7f181.mp3","Planeje as etapas pela história, não pela ordem das palavras.":"vc527c8b9e161c834.mp3","Por 100 a quantidade fica 100 vezes menor: 600 vira 6.":"v09f2d632bf5b10b7.mp3","Porcentagem sempre compara com um total de 100 — não é um número solto.":"vaa455d3ff7086ccf.mp3","Porcentagem sempre é PORCENTAGEM DE ALGUMA COISA — calcule a parte daquele total específico.":"v33e464f08c2ee886.mp3","Pule de 2: 6 mais 2 é 8.":"vc8fd7ec7e871aab6.mp3","Qual conta NÃO é igual a 18?":"v38dbbf55c6087f83.mp3","Qual conta é igual a 25 + 19 + 75, apenas reorganizando a ordem das parcelas?":"v58a02b8e52619b3c.mp3","Qual desses é um ângulo reto?":"v15ce161b4bef4b92.mp3","Qual destas também é 324?":"va98bbbf53e749a37.mp3","Qual fala explica melhor 8 + 5?":"v60681d570b79654d.mp3","Qual figura tem os dois lados IGUAIS, como num espelho?":"vd361675eefa1c14b.mp3","Qual forma tem 4 lados?":"v72943ea892329b9d.mp3","Qual fração é MAIOR: 1/2 ou 1/4?":"v6093f87754e9449e.mp3","Qual fração é equivalente a 1/2?":"vf0f20faa5b695f7d.mp3","Qual fração é maior: 3/8 ou 5/8?":"ve84f0fcebf7d63a0.mp3","Qual história combina com 12 - 5?":"vbdb0d7ad7f1235d9.mp3","Qual número deixa a sentença certa? __ + 7 = 15":"v23fe44829c0a8cd2.mp3","Qual número está mais perto de 100?":"vef7db0666323b5df.mp3","Qual número fica entre 40 e 50?":"v0277c726b14c52d4.mp3","Qual número vem depois de 39?":"v435364535a438e73.mp3","Qual temperatura é mais FRIA (menor): -3°C ou -8°C?":"v00420a604ba8508c.mp3","Qual vale MAIS: a nota de R$ 10 ou a moeda de R$ 1?":"ve65e2d4f828e87f6.mp3","Qual é a forma expandida de 305?":"v7978676a4517a89f.mp3","Qual é a metade de 6 maçãs? 🍎🍎🍎🍎🍎🍎":"v6dd9068290da9d2d.mp3","Qual é a média de quatro, seis e oito?":"va11c37fb371dadc4.mp3","Qual é maior: 0,5 ou 0,45?":"v58d12d0f2a1241c6.mp3","Qual é maior: 1/2 ou 3/4?":"vaba25e2e63c98455.mp3","Qual é maior: 3/8 ou 1/2?":"v8606cc422c66bd07.mp3","Qual é maior: 67 ou 58?":"v3a3f85dfc2bdfaa7.mp3","Qual é o círculo?":"v182ccb263e91ea05.mp3","Qual é o jeito mais esperto de fazer 398 + 205?":"vf94ec31caecfc683.mp3","Qual é o maior número?":"v55525e216e5fca6d.mp3","Qual é uma forma de formar 8?":"v7058e29c88f9b9b2.mp3","Quando o denominador é igual, compare só os numeradores — mais partes iguais tomadas é mais quantidade.":"vbd6893b80b5570f5.mp3","Quanto formam 3 barras de dez e 4 cubinhos?":"v804bb6997c46cfa8.mp3","Quanto mais abaixo de zero, mais frio: -8 é menor que -3.":"va7163629130fe373.mp3","Quanto vale o 3 em 0,3?":"v7958f2504ea0db3d.mp3","Quanto é 0,3 + 0,4?":"v99e51dc82093bae2.mp3","Quanto é 1/5 + 2/5?":"vd7e0a9b641355935.mp3","Quanto é 2 + 2 + 2?":"v8fdfa5aca2c28dd7.mp3","Quanto é 2 + 7? Comece pelo maior.":"v900709f9f88e683d.mp3","Quanto é 2h40 + 35 minutos?":"va1092eaff90c8c4c.mp3","Quanto é 3 × 1/4?":"v06a41a79ff7b1a60.mp3","Quanto é 3 × R$2,45 (estime antes: um pouco mais que 3×2=6)?":"vb7786d0c0ccaf239.mp3","Quanto é 34 + 5?":"vab77db23c0ba0c08.mp3","Quanto é 4 + 3?":"vb554fe0a3852a4b5.mp3","Quanto é 4 × 3?":"v69d48de728b877aa.mp3","Quanto é 50% de 20?":"v52eac4b5d5e6b50d.mp3","Quanto é 6 + 3?":"v299d2a0a2524cf9d.mp3","Quanto é 6 + 6?":"va9fd14517b3efe77.mp3","Quanto é 63 − 28?":"v2b7cabddb1eea17b.mp3","Quanto é 8 + 5?":"v4f1b4039a20ecae9.mp3","Quanto é 8 - 3?":"v658e4c995443c7c4.mp3","Quantos pontos há? Escolha o numeral.":"va2fa8ed4160bb44f.mp3","Quase. Tente completar 10 primeiro: 8 + 2 = 10, sobra 3 -> 13.":"vd954a3ce0c709a4b.mp3","Que horas mostra o relógio 🕒?":"v3838b00be2e117a6.mp3","Quem é mais COMPRIDO?":"v8af18600e68f9fd2.mp3","Rápido: 6 × 7 = ?":"vf1e252bb54e429ba.mp3","Rápido: 8 + 6 = ?":"v6f1cb1e3185f6590.mp3","Saco A: 4 azuis e 1 vermelha. Saco B: 2 azuis e 3 vermelhas. Onde azul é mais provável?":"vdea60f8b7632fe4b.mp3","Saltos de 5: 5, 10, 15, 20. Quatro saltos = 20.":"v4efa279cb5111882.mp3","Se 4×6=24, então 24÷6 volta para o 4.":"v72a303c703e9a476.mp3","Se 7 + 3 = 10, então 10 - 7 = ?":"v98a8be256a727ec4.mp3","Sei que 5 × 6 = 30. Quanto é 6 × 6? (mais um grupo de 6)":"v8e84e8cbfb5bc679.mp3","Sem contar certinho: 39 + 42 fica perto de quanto?":"v5fb1e63338d75229.mp3","Sem contar um por um, mais ou menos quantos feijões cabem neste pote cheio?":"vcdcb06bfaa7999b0.mp3","Separe dados úteis de detalhes que não respondem à pergunta.":"v47299ac8d42f0b44.mp3","Separe: 20×3=60 e 3×3=9. Junte: 69.":"v7a516f466a90d164.mp3","Some os VALORES: 2 + 2 + 1 = 5. Não conte as moedas.":"vd9c7f436520f5ea7.mp3","Some os dois saltos: +10 leva a 35, +3 leva a 38.":"vd8b64c1b024ac6dc.mp3","São 12 no total em 4 fileiras iguais: 12÷4=3.":"v8f14e28818e34d95.mp3","São 2 linhas de 4: 4, 8.":"v94695de64a8781ac.mp3","São 3 grupos de 2: 2, 4, 6.":"v4fc620322f3bdbb8.mp3","São duas etapas: primeiro some o que ganhou (23), depois tire o que gastou (17).":"v009a773c3af24887.mp3","Só as balas: 4 e 1.":"vd9b432013c0d66e4.mp3","Tabela: A teve 8 votos, B teve 5. Afirmação: A venceu. Qual dado sustenta isso?":"v2677171f8909c1f6.mp3","Tabela: maçã 4 votos, banana 2 votos. Qual barra deve ter 4 quadradinhos?":"v4f41c897b365730c.mp3","Tabela: maçã quatro votos, banana três votos, uva dois votos. Quantos votos ao todo?":"v19c62427e6f46464.mp3","Teste com números diferentes: nenhum deles escapa da regra de multiplicar por 0.":"v994132c7297717cf.mp3","Tinha 15 reais. Ganhei 8 e gastei 6. Com quanto fiquei?":"vd924181acf13b5d2.mp3","Tirar é riscar: 6 fichas, risca 2.":"ve88b6aa335b327d2.mp3","Trocar a ordem dos fatores dá o mesmo total: 3×4 = 4×3 = 12.":"v168027c1cd02f9d6.mp3","Trocar a ordem só vale para a soma — na subtração, mudar a ordem muda o resultado.":"vb69c35f2ffcd3d22.mp3","Troco é o que sobra: 10 − 7 = 3.":"v20f9dd00c872b7c0.mp3","Um carro percorre 60 km em 2 horas, num ritmo constante. Qual é a razão (taxa) de km por hora?":"vc3c6160e6f5a8375.mp3","Um cubo tem quantas faces?":"vec021bf28a5307fe.mp3","Um exemplo certo é só um começo; a regra precisa valer em vários casos para ser confiável.":"v1147047a1fa9aaac.mp3","Um grupo fechado de marcas de contagem vale 5. Quanto valem um grupo fechado e mais 2 marcas soltas?":"vdd899454f9b5f381.mp3","Um ponto está 3 casas para a direita e 2 casas para cima da origem. Quais são suas coordenadas (x,y)?":"v29940a0d3e22e54f.mp3","Um quadrado tem 4 lados iguais e 4 ângulos retos. Ele também pode ser chamado de retângulo?":"v77b388489391fab1.mp3","Um retângulo tem 3 colunas e 4 linhas de quadradinhos ⬜. Quantos quadradinhos?":"vebeca6e468658889.mp3","Um ângulo menor que o ângulo reto (90°) é chamado de...":"v5a22e3e7344e977e.mp3","Um ângulo reto 📐 (quininho quadrado) mede quantos graus?":"v1a6b21114fbb0784.mp3","Uma barra de chocolate foi dividida em 3 pedaços iguais. Como se chama cada pedaço?":"vdb0be84d09117f47.mp3","Uma barra de dez vale quanto?":"vf490779953ef460c.mp3","Uma caixa tem 1 camada de 2 por 3 cubinhos 🧊. Quantos cubinhos?":"vb49233feba7edeb8.mp3","Uma conclusão sobre dados precisa citar os dados.":"v4b9732c613e1ed74.mp3","Uma figura pode pertencer a mais de uma classe ao mesmo tempo, se tiver todas as propriedades exigidas.":"v3c030f2dbfa145a4.mp3","Uma malha tem 4 colunas e 3 linhas ⬜. Área em quadradinhos?":"v49dc361654b02844.mp3","Uma parte tem 4 e a outra tem 3. Qual é o todo?":"v4dbaf0a3da5da3b6.mp3","Uma planificação (molde) de cubo tem quantos quadrados?":"v4ff1c47943c39aaf.mp3","Uma receita para 4 pessoas usa 6 ovos. Mantendo a mesma proporção, quantos ovos para 6 pessoas?":"vb1138c1d08f0473a.mp3","Use o 0 e o 1 como referência e conte as marcas — a posição depende do numerador sobre o total de partes.":"v9baae46bcc88541a.mp3","Use o fato: 6 e 3 dão 9.":"v58bce232d275edf8.mp3","Use pontos de referência como 1/2 para comparar rápido, sem precisar de conta complicada.":"v99a6b13046d0eb23.mp3","Vamos conferir com calma: Isso! 3 dezenas e 4 unidades = 34.":"vab453871bfca44a6.mp3","Veja a proximidade: 63 está a 3 de 60 e a 7 de 70. Fica 60.":"vda1c1ddd4b0ae189.mp3","Veja os grupos: 🚗🚗🚗 | 🚗🚗🚗. Quantos carrinhos em CADA grupo?":"vf611d7feea9b98e5.mp3","Veja: 🍎🍌🍇. Qual fruta está NO MEIO?":"v4438f81db2aaa377.mp3","Verifique se a resposta combina com a ordem de grandeza.":"ve46252b4a9b24798.mp3","Você explorou bastante por agora! Vamos fazer outra coisa — você pode continuar explorando quando quiser.":"v84d021c7e334ffe3.mp3","Área conta os quadradinhos de dentro: 3 fileiras de 4 = 12.":"v1592cf7a55f343e4.mp3","Área é linhas × colunas: 4×3 = 12.":"vd4bf3a86544325c0.mp3","Ângulo é sobre a ABERTURA entre os dois lados, não sobre o tamanho dos lados.":"v80c609284d23dd9e.mp3","1/2 é a metade do caminho entre 0 e 1: fica no meio.":"v7013ed62b9b924df.mp3","25 é a metade de 50: fica entre o 0 e o meio.":"v654e84af133a3392.mp3","4/5 é quase o inteiro (falta só 1/5): fica pertinho do 1.":"v8628da5c3e1f07c2.mp3","50 é a metade do caminho entre 0 e 100.":"v2aa14b0ec722a8b2.mp3","530 tem só centenas; 5030 e 5300 têm milhares, então são maiores.":"v16159a255cd5432e.mp3","60 são 6 dezenas: um pouco depois do 50.":"v617b7c116f92510a.mp3","60 é um pouco mais que a metade (50): marque à direita do meio.":"v185a7ac51aadc7ec.mp3","70 é mais que a metade (50): fique um pouco à direita do meio.":"vf058420b12e5ca74.mp3","A Cinderela foi convidada para o baile. Reconheça as formas e siga os caminhos certos para chegar ao castelo! Reconheça e nomeie as formas do vestido e do salão.":"v7e96bc6fbc275e7d.mp3","A casa de doces apareceu! Some e subtraia ate 100 para contar as guloseimas.":"v407602e5eea499cd.mp3","A galinha bota ovos de ouro! Organize os ovos em grupos iguais para guardar todos com capricho. Junte os ovos em grupos iguais dentro da cesta.":"v6fe0bf04e0cc6d91.mp3","A lebre e a tartaruga vão apostar corrida! Registre, leia os gráficos e preveja quem chega na frente. Classifique e registre quantos torcedores vieram para cada lado.":"vddcd68cdd7fb4d6f.mp3","A lua se escondeu! Use suas estrategias de soma ate 20 para achar o caminho.":"vab8c3bc03202b7b1.mp3","A reta é o pé de feijão, do 0 ao 100. Coloque a folha 50.":"vae4919b07a6ec62d.mp3","A tranca da porta vai de 0 a 1. Marque 1/2 (a metade).":"v39d19e5031b8bdb1.mp3","Ache o número escondido que faz a conta ficar certa.":"v6b9987eeab23346e.mp3","Ache o ponto certo na reta numérica e abra a porta do castelo nas nuvens.":"v9e67e9d0fd7549a8.mp3","Agora coloque a folha 25 no pé de feijão.":"vd86a7079e0c8fd71.mp3","Ao completar a dezena, vem o 50.":"vddc69482fd14240a.mp3","Ao virar a dezena: 39, 40.":"v339fb75a948db1ef.mp3","Arrume os ovos em fileiras iguais e some de grupo em grupo.":"v393b9fbbdc16112c.mp3","Boa estimativa! Fica lá pelas 50.":"v8fcf54986a27e9ac.mp3","Cada feijão vira um pé de feijão. Estes são os feijões de João. Quantos pés vão nascer?":"vf0bafdf9b0c59933.mp3","Cada galho tem 5 folhas. Contando de 5 em 5 três galhos: 5, 10, __?":"v3a05f36122f6305b.mp3","Cada subida é 10, não 1: 280, 290, 300, 310.":"v65b2df62ba50f556.mp3","Calcule a média dos resultados e diga se a frase sobre a corrida é verdadeira.":"vcc1b34a25bc835df.mp3","Calcule a área da mesa, meça os potes e confira o troco do banquete.":"v8f416e32afad9401.mp3","Caíram feijões na terra. Quantos você vê de uma vez?":"v6dd731d10ad878fc.mp3","Certo! 49, 50.":"v0fc12366a0c98632.mp3","Certo! Grupos iguais deixam a contagem mais fácil e segura.":"vd0b64d89b4343789.mp3","Certo! O que conta é a quantidade, não o tamanho.":"va51effbf289f60b6.mp3","Certo! O último número contado é o total.":"v86ecee616623f907.mp3","Certo! Um toque para cada feijão.":"v41efc6529b2dd987.mp3","Chapeuzinho leva uma cesta de doces para a vovó. Reparta tudo em partes justas para dividir com quem encontrar no caminho! Reparta os doces igualmente entre duas pessoas, sem sobrar diferença.":"vb1521eaad11d254c.mp3","Classifique e registre quantos torcedores vieram para cada lado.":"vb625017c7222ac22.mp3","Coloque um feijão de cada vez, até chegar a 3.":"vf21c7ab233a9fced.mp3","Como contar os feijões sem errar?":"v741e6b8eddbdc697.mp3","Compare frações e decimais para servir a mesa com pedaços justos.":"vef5b0cc4edf0132f.mp3","Compare os números dos degraus e ache qual é maior para não se perder.":"vef3f5143a1a3e388.mp3","Compare tamanhos e pesos e reconheça as moedas para escolher as botas.":"v7f3f81c00ed92003.mp3","Complete 10 juntando as tábuas que faltam.":"v5a28dc8f8a4137ab.mp3","Complete a outra metade do vestido deixando os dois lados iguais.":"v31041fdaaa9dd5f4.mp3","Complete a sentença deixando os dois lados do sinal de igual valendo o mesmo.":"v222158f7ac85a397.mp3","Contamos os feijões do bolso: 1, 2, 3, 4, 5. Quantos feijões há?":"v3c58576ec5f8a84c.mp3","Contando de 10 em 10, os números são 40, 50. Qual vem depois?":"v445f90fbcbffb538.mp3","Contando de 10 em 10, por que depois de 590 vem 600?":"v2648382738c0a741.mp3","Contando para trás: 3, 2.":"v35a5be8eaabda9fd.mp3","Contando para trás: 7, 6, 5, __?":"vcad1cc7a8794f983.mp3","Contar as folhas de 5 em 5 serve para quê?":"v9e671f5a9d9f3193.mp3","Contar em grupos iguais ajuda a não se perder.":"v811febccc8bb8c57.mp3","Conte cada bolso: 7 é mais que 4.":"v227b59598908995e.mp3","Conte cada feijão uma vez: 9.":"v604f7b9baf41a74a.mp3","Conte de 10 em 10 e de 5 em 5 enquanto o pé cresce até as nuvens.":"vf61db18cd4b5b98d.mp3","Conte de 100 em 100, ou seja 150, 250. Qual vem depois?":"va284916bdec0a6da.mp3","Conte devagar com o João: 5, 6, 7. Depois do 6 vem o 7.":"vf9785ce6e06a775d.mp3","Conte para trás até chegar em 6.":"va0055114a201c063.mp3","Continue a contagem de onde ela parou e estime quantas folhas há no caminho.":"vb2fae3f9d0e6e23f.mp3","Continue o padrão das penas e agrupe as que se parecem.":"v456260088770c10f.mp3","Corte o bolo ao meio e depois em quatro pedaços iguais.":"vcd6c129c98f16979.mp3","De 10 em 10, 590 mais 10 fecha a centena: vira 600, não 591 nem 690.":"vc3f260ceca712c98.mp3","De 100 em 100 a partir de 300. Marque onde fica a próxima nuvem (400).":"vead1a9687bcf1c1a.mp3","De 100 em 100: depois de 300 vem 400, um pouco à direita.":"vf39901448b629f3c.mp3","Deixe um rastro de pedrinhas: junte e tire para não se perder.":"va0da6a7cf28dd42f.mp3","Depois da folha 49, qual folha vem?":"vd86837f7d8931437.mp3","Depois de 13 vem o 14.":"va2f21ead53309b54.mp3","Descer é ir para baixo do zero: 0 menos 3 é -3, não 3.":"v421f5034052584d5.mp3","Descubra a metade da cesta e reparta entre alguns amigos.":"ve0f33be7963bf6f1.mp3","Descubra a regra e diga qual patinho vem depois na fila.":"veb4797f658454872.mp3","Descubra qual pedaço é uma metade, um terço ou um quarto do bolo.":"v4418253fa182659e.mp3","Descubra quantos ovos há juntando fileiras iguais, do jeito multiplicativo.":"vff1e31f017f9afe0.mp3","Desenhe o problema e explique com suas palavras como você pensou.":"v34785bd71bfd8a94.mp3","Dever menos é ter o saldo maior: -2 é maior que -5.":"vac54474c0ae36c10.mp3","Diga quanto vale cada algarismo e descubra a altura da torre.":"vc95f2444136b61ea.mp3","Divida os doces e decida o que fazer com o que sobra.":"vc1e4c6d53790d5f0.mp3","Do menor para o maior, qual plaquinha vem PRIMEIRO (a menor)?":"v953f4bca6b3a798a.mp3","Duas plaquinhas: 4200 e 4090. Por que 4200 é MAIOR?":"v3b0d967de20d8a38.mp3","E agora, quantos feijões?":"vbc66abf47e654ca7.mp3","Embaixo vai o total de pedaços (4) e em cima o que ele comeu (3): 3/4.":"v5ead4f503cede051.mp3","Entre as nuvens faz frio. Qual temperatura é mais FRIA (menor): -3°C ou -8°C?":"vdccd5b1a9380137b.mp3","Escolha a melhor conta e leve todos de volta para casa!":"vdbf18ac4536863e7.mp3","Escolha a melhor estratégia e conte todos os ovos de ouro do celeiro.":"v0bf0fbb5171eac20.mp3","Escolha a melhor forma de dividir e chegue com tudo repartido à casa da vovó.":"v8493bd88693cfe45.mp3","Escolha a operação certa e faça uma boa estimativa da resposta.":"v78c44d52f0aeb6e0.mp3","Escolha o jeito mais esperto de juntar as partes e deixe a casa firme.":"v94585a369598e980.mp3","Estenda para os milhares e veja como cada casa vale dez vezes mais.":"v3696e83d07d5f6b6.mp3","Estimar não é chutar: olhe um grupinho de folhas e repita pelos grupos parecidos.":"v0ebd85276c742856.mp3","Exato! 590 mais 10 completa 600.":"vd5ac96f245bfc82c.mp3","Exato! Com os milhares iguais, quem decide é a centena.":"vddd9b81630bc0822.mp3","Exato! Estimar por grupos é mais fácil e mais certo.":"v5f7798f51f088861.mp3","Exato! Mais partes, pedaços menores.":"vf56cbbb19e0c5e24.mp3","Exato! Mais à esquerda quer dizer menor.":"v3d0cc341ae78b3b9.mp3","Exato! O meio é 50, e 70 é maior que 50.":"vc70ff6ac8eed8f33.mp3","Explique a regra do padrão e veja o patinho virar um belo cisne.":"v3504458284e367a2.mp3","Faça as conversões certas e complete o plano esperto do gato.":"v111d78a2f9781eab.mp3","Faça um grupo MAIOR que 5: guarde 8 feijões no quadro.":"v51e1e6a28a5ca015.mp3","Gire e desloque as formas para montar o caminho até o castelo.":"v3d2546a39bb78876.mp3","Guarde 6 feijões no quadro, contando um por um.":"ve72a2bc064d6a3d6.mp3","Guarde 7 feijões no bolso do João, um de cada vez.":"v4d379deb80037c9e.mp3","Havia 10 feijões. João plantou alguns. Deixe 6 no quadro, contando para trás.":"vee066971de102b58.mp3","Isso! -4 fica à esquerda do zero.":"vb3a28810f24bdc54.mp3","Isso! 1/2 fica bem no meio.":"vbce7381484c16acb.mp3","Isso! 1200 é o maior.":"vc2e84d2d2eb94157.mp3","Isso! 25 fica entre o começo e o meio.":"vc0ae4b5b7e30ddfa.mp3","Isso! 280 mais 10, mais 10, mais 10 dá 310.":"v3102e16cc1775244.mp3","Isso! 3 grupos de 10 dão perto de 30.":"v6bc3cade84fc776b.mp3","Isso! 300 mais 100 é 400.":"v1f96da2df95b9acd.mp3","Isso! 4 grupos de mais ou menos 10 dão perto de 40.":"ve7e29bddb220a3ac.mp3","Isso! 4/5 é quase 1.":"v3252c4b421f27cdc.mp3","Isso! 5, 10, 15.":"v7fb8ed9a6d9b61ac.mp3","Isso! 50 fica bem no meio.":"v6a6f703dbb076abb.mp3","Isso! 50 mais 10 é 60.":"v5e4d9e3635d41c67.mp3","Isso! 530 é a menor.":"v2056a2f38e1e5833.mp3","Isso! 60 fica logo depois da metade.":"vd592335f5bfc7a53.mp3","Isso! 6500 fica um pouco depois do meio.":"v72710aeed0f05323.mp3","Isso! 7 feijões, 7 pés de feijão.":"vcfb9d0390b092d2f.mp3","Isso! 70 fica depois do meio.":"v5719ed51c7c80d22.mp3","Isso! 80 é a mais perto do 100.":"v0a2509a060fff993.mp3","Isso! Comeu 3 de 4 pedaços: 3/4.":"v2fba7783ba955fec.mp3","Isso! De 100 em 100: 150, 250, 350.":"vb6a3fea959325067.mp3","Isso! Depois de 59 vem 60.":"v0800d256dbb32ac1.mp3","Isso! Depois do 3 vem o 2.":"v97a2c5724d82e04c.mp3","Isso! Depois do 5 vem o 4.":"v7636a9e05456c51d.mp3","Isso! Depois do 8 vem o 7.":"v9994c812a867ebfa.mp3","Isso! Descer 3 do zero leva ao -3.":"v42ed504d58d2e70d.mp3","Isso! Ele chega no 10.":"vdf3b0ed4ed9889b8.mp3","Isso! Quem tem -2 deve menos.":"vde814a5d0e3d396c.mp3","Isso! São 5 feijões.":"va8d842b502448f33.mp3","Isso! São 6 feijões.":"v529ddc7f4e78d61b.mp3","Isso! São 9 feijões.":"vde095c494c305b68.mp3","Isso! Vem a folha 83.":"v970389a6889e77f5.mp3","João conta as folhas de 10 em 10 a partir de 290. Qual vem depois?":"v3e18f983b3671216.mp3","João conta os feijões até 5. Qual jeito está certo?":"vf82b3e2d14a0cb08.mp3","João conta os feijões: 12, 13, __":"vb0c138f754dccc54.mp3","João continua subindo: 80, 81, 82, __?":"vaa0f1faff83ee39e.mp3","João contou 8 feijões. Quantos são?":"v33529022bc32f465.mp3","João contou até 9 os feijões do saquinho. Quantos feijões há?":"v471b5882c9a1155a.mp3","João contou os feijões: 1, 2, 3, 4, 5, 6, 7. Quantos feijões ele tem ao todo?":"v9dfe4966c0248237.mp3","João desce um degrau. Qual número vem ANTES do 4?":"v8b9d13ed90d36c67.mp3","João deve 5 moedas ao gigante (saldo -5). O amigo dele deve 2 (saldo -2). Quem deve MENOS?":"ved5c86552d97408d.mp3","João e Maria se perderam na floresta. Some e subtraia para marcar o caminho e voltar para casa! Deixe um rastro de pedrinhas: junte e tire para não se perder.":"v17c16c5b7495f45d.mp3","João está na folha 280 e sobe de 10 em 10. Em que folha ele para depois de 3 subidas?":"v72e8b207ce0192ef.mp3","João está na folha 30 e quer chegar na folha 70. Marque a folha 70.":"v8b90e9e3930aad85.mp3","João está na folha 39 do pé de feijão. Qual folha vem depois?":"v19e2d2e8d695db1b.mp3","João está no salão do castelo (andar 0) e desce 3 andares até o porão. Em que andar ele para?":"v0670262fcfbd020d.mp3","João guarda os feijões contando: 5, 6... Qual número vem depois do 6?":"vc04ec37fce273b4b.mp3","João já contou 5 feijões e acha mais um. Qual número vem?":"v92d0dad173a44b1d.mp3","João planta os feijões contando para trás: 10, 9, 8, __?":"v59c3ae9eb2bd2711.mp3","João sobe de 10 em 10 folhas. Marque onde ele para no 30.":"v8c1d92f9d2327f89.mp3","João sobe em ordem: folha 58, folha 59, __?":"vbcbf64f218fddb66.mp3","João sobe o pé de feijão contando os degraus. Ele parou no degrau depois do 8. Em que degrau ele está?":"v36dc17c8ce513dbc.mp3","João tem 6 feijões brancos e 6 feijões pretos. Qual grupo tem MAIS?":"v71c9cfa216a3dcbe.mp3","João tem 7 feijões num bolso e 4 no outro. Qual bolso tem MAIS?":"v824002a84b3f360d.mp3","João tem 8 feijões grandes e 9 feijões pequenos. Qual grupo tem MAIS feijões?":"vb98f03234ddb405b.mp3","João tem 8 feijões. Guarde um feijão de cada vez no quadro.":"v5415a2d6d896d443.mp3","João tinha 7 feijões e ganhou mais 3. Em que número ele chega?":"ve560d4dd4a414239.mp3","Junte 10 tranças em um grupo só: agora você tem uma dezena.":"v547291303fdad130.mp3","Junte os grupos: 4 vezes uns 10 dá cerca de 40, não 14 nem 400.":"v8c85bd8404a17503.mp3","Junte os montinhos de palha para formar 5 e depois 10.":"v50b71cd58274bc40.mp3","Junte os ovos em grupos iguais dentro da cesta.":"v177dd096e2fed195.mp3","Já há 4 feijões no quadro. Continue contando até 9.":"vc9fd50c0cb0f4c0f.mp3","Leia o gráfico da corrida e diga o que é provável acontecer.":"vaf6ec1744f88738d.mp3","Lá em cima, cada galho tem uma plaquinha. Qual plaquinha mostra o número MAIOR?":"v36e89b9d00771a32.mp3","Mesma quantidade nos dois grupos: 6 = 6.":"v251756cedd733ac3.mp3","Meça com passos, leia as horas cheias e junte moedas para pagar.":"v6bdbab43cea6cc9c.mp3","Monte o telhado organizando os tijolos em fileiras iguais.":"vce1d29a63e4208dc.mp3","Mostre 3 feijões no quadro.":"vba507fa439a4cf33.mp3","Muito bem! 10, 20, 30.":"vd63d005506fa1e0c.mp3","Muito bem! 60 fica logo depois do meio.":"v222529c1d117bc04.mp3","Muito bem! Um lugar para cada feijão.":"v3f3271611446eacf.mp3","Muito bem! Você contou até 7 sem pular nenhum.":"v5da584715e863c0a.mp3","Na corda da porta, de 0 a 1, qual fração fica MAIS PERTO do 1?":"v037629803df07bba.mp3","Na escada do castelo, o zero é o salão. Marque o andar -4.":"v9879675df062178b.mp3","Nos negativos é ao contrário: -8 fica mais à esquerda, então é menor que -3.":"v1522383f2fc109b9.mp3","Num galho cabem 10 folhas e há 3 galhos. Estime quantas folhas há ao todo.":"v2f50c9ec2a968bb3.mp3","Não volte ao 1: depois do 5 vem o 6.":"vdd192f671ac3cce5.mp3","Números negativos ficam à esquerda do zero: -4 fica entre 0 e -10.":"vc2a5baf6df59bb5b.mp3","O Gato de Botas é esperto e cheio de planos. Meça, pese e conte as moedas com ele para acertar cada passo da aventura! Compare tamanhos e pesos e reconheça as moedas para escolher as botas.":"v491279a0d037f503.mp3","O Pinóquio quer virar um menino de verdade. Separe as pistas certas das que enganam para ajudá-lo a resolver cada problema! Reconte a história do problema e descubra o que ele está perguntando.":"v710d953037476fdf.mp3","O galho tem 4 fileiras com mais ou menos 10 folhas cada. Estime o total de folhas.":"v4b5d25fd4cf12ac6.mp3","O grupo maior aqui é o de 8.":"v63fe56f0d4a050fc.mp3","O jeito certo é tocar em cada feijão, uma vez só.":"v6176a896c1028316.mp3","O meio da reta é 50. Como 70 é maior que 50, fica depois do meio.":"v3b7e2a94a06951b4.mp3","O meio é 5000; 6500 é maior, então fica à direita do meio.":"va2f8b979ec80e3a0.mp3","O patinho quer descobrir quem ele é. Ache os padrões e o que vem depois para acompanhá-lo até virar um lindo cisne! Continue o padrão das penas e agrupe as que se parecem.":"vd541f13c268503e2.mp3","O pão do gigante foi cortado em 4 pedaços iguais. João comeu 3. Que fração ele comeu?":"vbb73f77e7db53758.mp3","O pé de feijão tem 10000 degraus. Marque onde fica o degrau 6500.":"v02a1c4c792fb5900.mp3","O pé de feijão vai até a folha 100. Marque onde fica a folha 60.":"v0d848a281a1d52c3.mp3","O pé de feijão vai brotar! A contagem é 5, 4, 3, __?":"v2962fa178ae776aa.mp3","O salto é de 100, não de 10: depois de 250 vem 350.":"v48435c23719dfb56.mp3","Onde há MENOS feijões: 3 ou 9?":"v316b9b7cfb779cd0.mp3","Organize os dados na tabela e compare as chances de cada um.":"vaf313b9c3fae0002.mp3","Os milhares são iguais (4000); decide a próxima casa: 200 é mais que 090.":"v661f0a2477e97038.mp3","Os milhares são iguais; olhe as centenas: 200 é mais que 120, 020 e 002.":"v0ab0b628d2249c2f.mp3","Os três porquinhos querem uma casa forte e segura. Junte as peças na medida certa para construir com eles! Junte os montinhos de palha para formar 5 e depois 10.":"v45892cad6f253331.mp3","Para abrir a porta, escolha a fração MAIOR: 1/2 ou 1/4?":"v3fd6a34050c8bbde.mp3","Para continuar a contagem a partir do 6, o que fazer?":"ve819e8e755158e98.mp3","Partir em 4 dá pedaços menores que partir em 2: 1/2 é maior, mesmo com o 4 sendo maior.":"v4a852d31c19186af.mp3","Pense no pé de feijão: 80 está mais acima, mais perto do 100.":"ve36fae4f05c4d6ef.mp3","Planeje as duas etapas e confira se a resposta faz sentido.":"v746ccaa9f2125b5a.mp3","Por que -8 é MENOR que -3?":"vabd26bfc0be3738f.mp3","Por que 1/4 é MENOR que 1/2?":"v98be8fff55f94fd2.mp3","Por que a folha 70 fica depois do meio do pé de feijão?":"veedb6da601153faf.mp3","Por que são 4 feijões? Escolha os jeitos que mostram o 4 em partes.":"v513ea00657c8f561.mp3","Pule de 10: 50, 60.":"v4def17658eec159a.mp3","Pule de 5: 10 mais 5 é 15.":"v21c71987c682b5f7.mp3","Qual folha está MAIS PERTO do topo (o 100)?":"v9da4327ea802ec01.mp3","Qual é a contagem para trás certa a partir do 10?":"v82cafcaf1dc6bef3.mp3","Qual é o melhor jeito de estimar quantas folhas há num galho grande?":"vf2b9904f84b71c24.mp3","Quanto mais pedaços você faz, menor fica cada um: 1/4 é menor que 1/2.":"v3494c671b655d955.mp3","Quantos feijões João tem na mão?":"va21924822d481aa9.mp3","Quantos feijões você vê? (sem contar um por um)":"ved91c9fd9cffa83b.mp3","Quatro galhos têm plaquinhas: 1200, 1120, 1020 e 1002. Qual galho tem o número MAIOR?":"vef877978c381a40e.mp3","Quebre os números grandes em partes para contar montes de ovos mais fácil.":"v9497dbd349a81a1b.mp3","Rapunzel está no alto da torre. Organize os números em unidades, dezenas e centenas para subir andar por andar até ela! Junte 10 tranças em um grupo só: agora você tem uma dezena.":"v3c99787af66d0f10.mp3","Reconheça e nomeie as formas do vestido e do salão.":"v320804316518c37b.mp3","Reconheça os sólidos da carruagem e siga o trajeto na malha até o portão.":"v2a1c72988d463a87.mp3","Reconte a história do problema e descubra o que ele está perguntando.":"v8a07b55f5608d030.mp3","Reparta os doces em grupos iguais e veja como isso é o contrário de juntar grupos.":"v59d35c1201145ef3.mp3","Reparta os doces igualmente entre duas pessoas, sem sobrar diferença.":"v23c1b0fd53288d3a.mp3","Resolva o plano em duas etapas para escapar em seguranca.":"vdb095122f94499fd.mp3","Segue na mesma dezena: 82, 83.":"v1ea5dba615bd6fdf.mp3","Sem contar tudo, marque mais ou menos onde ficam 60 folhas, de 0 a 100.":"vb1d4863d73469137.mp3","Sem contar uma por uma, mais ou menos quantas folhas tem este galho cheio?":"v6179952421655f2b.mp3","Separe o número em dezenas e unidades para saber em que andar parar.":"v56ac4a24652c31f4.mp3","Separe os dados que enganam dos que ajudam e resolva sem errar.":"vec7dd4f767aa5fa7.mp3","Separe os tijolos em partes e junte de novo para ver que dá o mesmo total.":"v2a699c0aa00c8aa2.mp3","Some as marcas de contagem e compare as barras da torcida.":"v319be605e0d893f0.mp3","São 3 feijões, não importa como estão arrumados.":"v0d4d466f39a93c4c.mp3","São grupos de 10 repetidos 3 vezes: cerca de 30, não 13 nem 300.":"v9cadaf9c93ec51a5.mp3","Tamanho não é quantidade: 9 é mais que 8.":"v5435250d4516cd8f.mp3","Toque contando: 1, 2, 3... e pare no 7.":"vb7122ee16716fb80.mp3","Toque em cada feijão uma vez só: são 6.":"v1ce6c428154d3327.mp3","Três pulos de 10: 10, 20, 30.":"v42bedbf387ae2069.mp3","Um feijão por espaço, sem repetir nenhum: 8.":"vf6c0bdc1dceca693.mp3","Um pé para cada feijão: conte cada um uma vez, são 7.":"v8c209dc6d3b2d0ee.mp3","Use a régua e o calendário para planejar o caminho do gato.":"v75f8cf7cf8408d64.mp3","Use as coordenadas da malha para achar o lugar da Cinderela no salão.":"v46413c5c7d9f7a8e.mp3","Use os décimos e centésimos para medir a trança e alcançar a janela.":"vd4d4a16f3b42c5ed.mp3","Veja que dois quartos valem o mesmo que uma metade e junte pedaços iguais.":"v9e5edb428a6bd6ea.mp3","Vira a dezena: 58, 59, 60.":"v58665460e1dab9de.mp3","É dia de festa no castelo! Divida o bolo e os docinhos em pedaços iguais para que ninguém fique de fora. Corte o bolo ao meio e depois em quatro pedaços iguais.":"v83ebcf85344f4d47.mp3","A gente sobe no seu tempo.":"v3e45641b49a913ed.mp3","A porta rangeu!":"v6532847f697510ca.mp3","As nuvens estão pertinho!":"va944fa65a370fd0e.mp3","Boa escolha de trilha.":"v7589d5c86a49c4c2.mp3","Boa! A tranca cedeu um pouco.":"v2168ddcfc2fdf094.mp3","Boa! Estamos subindo.":"v1573c45b83b744be.mp3","Boa! Mais um passo até plantar.":"vcd28b6a0ebbef929.mp3","Boa! Quase nas nuvens.":"v2456f68d7560ac28.mp3","Boa! Vamos seguir.":"v7b11e0d7895d0705.mp3","Calma. A gente tenta de novo.":"v9843bc5dcfac15e3.mp3","Calma. A gente tenta outra vez.":"v2288efcb3acf89b3.mp3","Calma. Vamos tentar de novo.":"v1bdcd0b42898ac45.mp3","Calma: o pé de feijão não vai fugir.":"v618223b2ba720c43.mp3","Caminho certo!":"v09d241905ac05ef6.mp3","Errar faz parte da subida.":"vd849c862229fd192.mp3","Errar faz parte.":"va00459d0a2a04754.mp3","Mais perto do castelo!":"v1b98588c138e9573.mp3","Mais um feijão no bolso!":"v043def9a9bd824a8.mp3","Mais um galho conquistado!":"v70921e7eb1e64817.mp3","Mais um passo no rumo certo.":"ve8f58e8eb046c9bc.mp3","Mais um passo!":"v22bfc793b543eeca.mp3","Mais um pedaço do céu.":"v575eb9ed11a2dc4c.mp3","Mais uma folha para subir.":"v6895cffc09215734.mp3","Muito bem. Seguimos juntos.":"vf75ea901754f7e1d.mp3","O João não se perdeu!":"v434532ec9ee745f2.mp3","O João sorriu. Vamos seguir.":"vb6043fcb2bbb164d.mp3","O castelo está bem ali!":"v61cdd77a6085ad04.mp3","O caule ficou mais alto.":"v7c8828db8aca9608.mp3","O pé de feijão cresceu mais um pouco!":"v7aac6e3c9cb9809b.mp3","O saquinho está ficando cheio!":"v0ef7d45698f33967.mp3","O vento ajudou a subir.":"v9dc0f1038fec2566.mp3","Quase! Vamos olhar de novo.":"v6ebbd7e49f3d549b.mp3","Sem pressa para escolher.":"v5387ea6e1b64390f.mp3","Sem pressa. A gente tenta de novo.":"v939e73f927928cf7.mp3","Sem pressa. As nuvens esperam.":"v292ee7d93d5ae8fd.mp3","Sem pressa. Respire e siga.":"v6c24e7f300c5fd88.mp3","Sem pressa: o João espera.":"v9a5c605480fdf32a.mp3","Sem pressa: o gigante está dormindo.":"vaf30361014303bd9.mp3","Tudo bem. A porta espera.":"v2b0d39cb7c232fe3.mp3","Tudo bem. A trilha continua ali.":"vfe6bfa747d07a95c.mp3","Tudo bem. Aqui em cima a gente vai devagar.":"v5d704a2e57570c9e.mp3","Tudo bem. Vamos com calma.":"v134854034d22e8fb.mp3","Tudo bem. Vamos devagar.":"v40ccf7f0ee918e04.mp3","Você conseguiu!":"v038b4d3a43c549fe.mp3","Você contou direitinho.":"v6d8881ff2ef3dd26.mp3","Você está bem alto agora!":"ve9213c880183556b.mp3"};
function voicedFile(t){return t&&AUDIO_MANIFEST[t]?('assets/audio/'+AUDIO_MANIFEST[t]):null;}
function voicedSay(t,onEnd){
  if(!t){if(onEnd)onEnd();return;}
  try{speechSynthesis&&speechSynthesis.cancel();}catch(e){}
  if(_promptAudio){try{_promptAudio.pause();}catch(e){}_promptAudio=null;}
  var f=voicedFile(t);
  if(f){try{var a=new Audio(f);_promptAudio=a;
    if(onEnd){a.onended=function(){if(_promptAudio===a)_promptAudio=null;onEnd();};}
    a.play().catch(function(){speak(t);if(onEnd)onEnd();});return;}catch(e){}}
  speak(t);
  if(onEnd)setTimeout(onEnd,Math.min(4000,800+String(t).length*55)); // TTS do browser não avisa o fim de forma confiável
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
    const sc=el('div','exp-scene');sc.setAttribute('aria-hidden','true');mc.appendChild(sc);
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
    else if(ISLAND_ART[ax.axis_id]){card.style.backgroundImage="linear-gradient(180deg,rgba(255,255,255,.32),rgba(255,255,255,.85)),url('assets/img/"+ISLAND_ART[ax.axis_id]+"')";card.style.backgroundSize='cover';card.style.backgroundPosition='center';}
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
/* ---------- MAPA DO CONTO (antes: lista de habilidades) ----------
   A criança vê o cenário da história e o caminho com as paradas (capítulos).
   Estado de cada parada: conquistada (todas as habilidades no alvo) / aberta
   (alguma habilidade desbloqueada) / trancada. No topo, o tesouro final da ilha. */
function chapterStat(ch){
  const sks=(ch.skills||[]).map(id=>E.skillById(id)).filter(Boolean);
  const playable=sks.filter(s=>E.itemsBySkill(s.skill_id).length>0);
  const done=playable.filter(skillAtTarget).length;
  const open=playable.some(s=>E.unlocked(S,s.skill_id));
  const complete=playable.length>0&&E.chapterComplete(S,ch.skills);
  return {tot:playable.length,done,state:complete?'done':(open?'open':'locked')};
}
function renderTrail(axisId,opts){
  opts=opts||{};
  clear(view);const wrap=el('div','child-wrap');
  const meta=AXMETA[axisId]||{ic:'📚',nm:''};
  const back=el('button','btn ghost','← Ilhas');back.onclick=render;wrap.appendChild(back);
  const tale=E.taleOf(axisId);
  if(!tale){renderTrailFlat(axisId,wrap);return;} // ilha sem conto: caminho antigo (nenhuma hoje, mas o app não quebra)
  // Missão do dia entra POR AQUI (decisão 11/07): a parada de hoje pulsa e há um CTA no topo.
  if(opts.today){
    const tb=el('div','today-band');
    tb.appendChild(el('div','tb-t','⭐ Missão de hoje'));
    tb.appendChild(el('div','tb-s',opts.todayTitle||''));
    const go=el('button','big-btn','Começar');go.onclick=opts.onStart;tb.appendChild(go);
    wrap.appendChild(tb);
  }
  const chs=tale.chapters||[];
  const map=el('div','tale-map');
  const art=islandArt(axisId);
  if(art)map.style.backgroundImage="url('assets/img/"+art+"')";
  const vine=TALE_VINE[axisId];
  if(vine){map.style.setProperty('--vine',vine[0]);map.style.setProperty('--vine2',vine[1]);}
  const head=el('div','tm-head');
  head.appendChild(el('h3',null,meta.ic+' '+tale.title));
  head.appendChild(el('div','goal','🎯 '+tale.goal));
  const doneCh=chs.filter(ch=>chapterStat(ch).state==='done').length;
  head.appendChild(el('div','prog','Capítulos: '+doneCh+' de '+chs.length));
  map.appendChild(head);
  const path=el('div','tm-path');
  path.appendChild(el('div','tm-vine'));
  // topo primeiro no DOM = fim do caminho; o capítulo 1 fica embaixo (a criança sobe/avança)
  const allDone=chs.length>0&&doneCh===chs.length;
  const top=el('div','tm-stop summit '+(allDone?'done':'locked'));
  const tnode=el('button','tm-node',allDone?'🏆':'🏰');
  tnode.setAttribute('aria-label',allDone?'Ilha conquistada':'O fim da história');
  tnode.disabled=true;top.appendChild(tnode);
  const tlab=el('div','tm-label');
  tlab.appendChild(el('b',null,allDone?'Ilha conquistada!':'O fim da história'));
  tlab.appendChild(el('span',null,allDone?'Troféu no Cofre':'Complete os capítulos'));
  top.classList.add('r');top.appendChild(tlab);
  path.appendChild(top);
  chs.slice().reverse().forEach((ch,ri)=>{
    const idx=chs.length-1-ri;           // índice real do capítulo
    const st=chapterStat(ch);
    const pr=propOf(ch.id);
    const stop=el('div','tm-stop '+st.state+' '+(idx%2===0?'r':'l')+((opts.today===ch.id)?' pulse':''));
    const node=el('button','tm-node',st.state==='locked'?'🔒':pr.g);
    node.setAttribute('aria-label','Capítulo '+(idx+1)+': '+ch.title);
    node.appendChild(el('span','tm-num',String(idx+1)));
    if(st.state==='done')node.appendChild(el('span','tm-chk','💎'));
    if(opts.today===ch.id&&opts.onStart)node.onclick=opts.onStart;      // a parada de hoje leva direto à missão
    else if(st.state!=='locked')node.onclick=()=>renderChapter(axisId,ch.id);
    else node.disabled=true;
    stop.appendChild(node);
    const lab=el('div','tm-label');
    lab.appendChild(el('b',null,ch.title));
    lab.appendChild(el('span',null,st.state==='locked'?'🔒 ainda não':(st.done+' de '+st.tot+' feitas')));
    stop.appendChild(lab);
    path.appendChild(stop);
  });
  map.appendChild(path);
  wrap.appendChild(map);
  wrap.appendChild(el('div','small muted center','Toque numa parada do caminho para entrar na história.'));
  view.appendChild(wrap);
}
/* fallback: ilha sem conto cadastrado — mantém a lista simples de habilidades */
function renderTrailFlat(axisId,wrap){
  const meta=AXMETA[axisId]||{ic:'📚',nm:''};
  wrap.appendChild(el('h2',null,meta.ic+' '+meta.nm));
  const trail=el('div','trail');
  E.axisSkills(axisId).forEach(s=>{
    const playable=E.itemsBySkill(s.skill_id).length>0;
    const m=E.mastery(S,s.skill_id);
    const unlocked=E.unlocked(S,s.skill_id);
    const cell=el('button','tcell'+(playable?(unlocked?'':' locked'):' ghost'));
    cell.appendChild(el('div',null,'<b style="font-size:14px">'+childDesc(s)+'</b>'));
    if(playable&&unlocked)cell.onclick=()=>startMission(s,{onBack:()=>renderTrail(axisId)});
    trail.appendChild(cell);
  });
  wrap.appendChild(trail);view.appendChild(wrap);
}
/* ---------- CENA DO CAPÍTULO: as habilidades como objetos do cenário ---------- */
function renderChapter(axisId,chId){
  const tale=E.taleOf(axisId);
  const ch=(tale.chapters||[]).find(c=>c.id===chId);
  if(!ch){renderTrail(axisId);return;}
  clear(view);const wrap=el('div','child-wrap');
  const back=el('button','btn ghost','← Mapa da história');back.onclick=()=>renderTrail(axisId);wrap.appendChild(back);
  const card=el('div','mission-card');card.style.textAlign='left';
  const scene=el('div','ch-scene');
  const sceneArt=chapterArt(axisId,ch.id);
  if(sceneArt)scene.style.backgroundImage="url('assets/img/"+sceneArt+"')";
  scene.setAttribute('aria-hidden','true');
  card.appendChild(scene);
  card.appendChild(el('div','pill learn','📖 '+tale.title));
  card.appendChild(el('h2',null,ch.title));
  card.appendChild(el('div','ch-beat',ch.beat));
  const sb=el('button','speak','🔊');sb.title='Ouvir de novo';sb.style.marginTop='8px';
  sb.onclick=()=>voicedSay(ch.beat);card.appendChild(sb);
  const pr=propOf(ch.id);
  const st=chapterStat(ch);
  card.appendChild(el('div','small muted',st.done+' de '+st.tot+' já conquistados neste capítulo.'));
  const props=el('div','props');
  const sks=(ch.skills||[]).map(id=>E.skillById(id)).filter(Boolean);
  let k=0;
  sks.forEach(s=>{
    const playable=E.itemsBySkill(s.skill_id).length>0;
    const unlocked=E.unlocked(S,s.skill_id);
    const done=skillAtTarget(s);
    const m=E.mastery(S,s.skill_id);
    if(playable)k++;
    const cls=!playable?'ghost':(done?'done':(unlocked?'open':'locked'));
    const b=el('button','prop '+cls);
    b.appendChild(el('div','pg',!playable?'🌫️':(unlocked?pr.g:'🔒')));
    b.appendChild(el('div','pn',pr.n+(sks.length>1&&playable?' '+k:'')));
    b.appendChild(el('div','pd',childDesc(s)));
    const seg=el('div','seg6');
    for(let i=1;i<=6;i++){const x=el('i');if(li(m.level)>=i)x.classList.add(m.level==='N6'?'gold':'on');seg.appendChild(x);}
    b.appendChild(seg);
    if(done)b.appendChild(el('div','small',' 🏅'));
    if(playable&&unlocked)b.onclick=()=>startMission(s,{onBack:()=>renderChapter(axisId,ch.id)});
    else b.disabled=true;
    props.appendChild(b);
  });
  card.appendChild(props);
  wrap.appendChild(card);view.appendChild(wrap);
}
/* ---------- abertura narrativa da missão (o "onde se quer chegar") ---------- */
function chapterFor(skill){
  const tale=E.taleOf(skill.axis_id);if(!tale)return null;
  const ch=(tale.chapters||[]).find(c=>(c.skills||[]).includes(skill.skill_id));
  return ch?{tale,ch}:null;
}
function startMission(skill,opts){
  const ci=chapterFor(skill);
  if(!ci){startSession(E.buildMission(S,now(),skill.skill_id));return;} // sem conto: começa direto
  renderMissionIntro(skill,ci,opts||{});
}
// Missão do dia (botão da home): também abre com a cena do conto. Antes chamava
// startSession direto e a criança nunca via a introdução (bug 08/07/2026). Usa o FOCO
// da missão já construída p/ achar o capítulo, e inicia ESSA missão (sem rebuild).
function startDailyMission(){
  const mis=E.buildMission(S,now());
  const foc=mis&&mis.focus?E.skillById(mis.focus):null;
  const ci=foc?chapterFor(foc):null;
  if(!ci){startSession(mis);return;} // sem conto/sem foco: começa direto
  // 11/07: a missão do dia entra PELO MAPA — a criança vê onde está antes de jogar.
  renderTrail(foc.axis_id,{today:ci.ch.id,todayTitle:ci.ch.title,
    onStart:()=>renderMissionIntro(foc,ci,{session:mis,onBack:()=>startDailyMission()})});
}
function renderMissionIntro(skill,ci,opts){
  opts=opts||{};
  clear(view);const wrap=el('div','child-wrap');
  const meta=AXMETA[skill.axis_id];
  const isFirst=!!(ci.tale.chapters&&ci.tale.chapters[0]&&ci.tale.chapters[0].id===ci.ch.id);
  const say=(isFirst&&ci.tale.intro?ci.tale.intro+' ':'')+ci.ch.beat; // 1ª missão da ilha: abre com a cena do conto
  const back=el('button','btn ghost','\u2190 Voltar');back.onclick=opts.onBack||(()=>renderChapter(skill.axis_id,ci.ch.id));wrap.appendChild(back);
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
  if(reason==='finished'){const sc=el('div','exp-scene');sc.setAttribute('aria-hidden','true');c.appendChild(sc);}
  else c.appendChild(el('div',null,'<div style="font-size:56px">'+cfg.ic+'</div>'));
  c.appendChild(el('h2',null,cfg.title));
  c.appendChild(el('div','muted',cfg.msg));
  const b=el('button','big-btn',cfg.btn);b.style.marginTop='14px';
  b.onclick=()=>{runner=null;save();render();};c.appendChild(b);
  wrap.appendChild(c);view.appendChild(wrap);
  voicedSay(cfg.title+' '+cfg.msg);
  runner=null;save();
}

/* ---------- sessões (missão/jogo) ---------- */
function startSession(sess){
  if(!sess.items.length){alert('Sem itens disponíveis aqui ainda.');return;}
  const rec={session_id:'s'+(S.sessions.length+1),child_id:S.child.child_id,kind:sess.kind,mode:S.mode,started_at:now(),items_planned:sess.items.length,items_completed:0};
  S.sessions.push(rec);
  runner={kind:sess.kind,sess,idx:0,answered:false,events:[],selosGanhos:[],answeredCount:0,mistakes:0,step:null,sessionId:rec.session_id};
  // CENA ÚNICA da missão (11/07): o cenário é o do capítulo-FOCO e NÃO muda no meio —
  // itens de revisão vêm de outras habilidades (às vezes de outra ilha) e ganham selo 🔁.
  const _f=sess.focus?E.skillById(sess.focus):E.skillById(sess.items[0].item.skill_id);
  const _ci=_f?chapterFor(_f):null;
  if(_ci){runner.scene={axis:_f.axis_id,tale:_ci.tale,ch:_ci.ch};
    const L=linesFor(_ci.ch.id);runner.lineOk=shuffled(L.ok);runner.lineNo=shuffled(L.no);runner.lo=0;runner.ln=0;}
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
  if(!isPl&&!runner.scene){
    const dots=el('div','progress-dots');
    runner.sess.items.forEach((_,i)=>{const d=el('i');if(i<runner.idx)d.classList.add('done');if(i===runner.idx)d.classList.add('now');dots.appendChild(d);});
    wrap.appendChild(dots);
    wrap.appendChild(el('div','small muted center',(runner.idx+1)+' de '+runner.sess.items.length));
  }
  /* A QUESTÃO ACONTECE DENTRO DA CENA (11/07/2026).
     - Missão/jogo: a cena é a do capítulo-FOCO e não muda (runner.scene). Item de outra
       habilidade/ilha = revisão -> selo 🔁, cenário preservado (trocar de conto a cada
       pergunta seria pior que caixa branca).
     - Exploração: não há foco; a cena segue o item (é um passeio pelo arquipélago).
     - O progresso vira o João SUBINDO a cena, no lugar das bolinhas abstratas. */
  const _sk=E.skillById(item.skill_id);
  const _icItem=_sk?chapterFor(_sk):null;
  const _sc=runner.scene||(_icItem?{axis:_sk.axis_id,tale:_icItem.tale,ch:_icItem.ch}:null);
  const _rev=!!(runner.scene&&_icItem&&_icItem.ch.id!==runner.scene.ch.id);
  if(_sc){
    const _amb=islandArt(_sc.axis);
    if(_amb){wrap.classList.add('tale-stage');wrap.style.backgroundImage="url('assets/img/"+_amb+"')";}
    const qs=el('div','quest-scene');
    const _a=chapterArt(_sc.axis,_sc.ch.id);
    if(_a)qs.style.backgroundImage="url('assets/img/"+_a+"')";
    // trilha do herói: n marcos; os já respondidos acendem, o João fica no marco atual
    if(!isPl){
      const n=runner.sess.items.length;
      const track=el('div','qs-track');
      for(let k=0;k<n;k++){
        const mk=el('i','qs-mark'+(k<runner.idx?' on':''));
        mk.style.left=(9+k*(78/Math.max(1,n-1)))+'%';
        mk.style.bottom=(16+k*(52/Math.max(1,n-1)))+'%';
        track.appendChild(mk);
      }
      qs.appendChild(track);
      if(_sc.axis===BEANSTALK_AXIS){
        const j=el('img','qs-hero');j.src=bsImg('joao.png');j.alt='';j.setAttribute('aria-hidden','true');
        j.style.left=(9+runner.idx*(78/Math.max(1,n-1)))+'%';
        j.style.bottom=(16+runner.idx*(52/Math.max(1,n-1)))+'%';
        qs.appendChild(j);
      }
    }else if(_sc.axis===BEANSTALK_AXIS){
      const j=el('img','qs-hero fixed');j.src=bsImg('joao.png');j.alt='';j.setAttribute('aria-hidden','true');qs.appendChild(j);
    }
    const cap=el('div','qs-cap');
    cap.appendChild(el('div','qg',propOf((_icItem&&_icItem.ch.id)||_sc.ch.id).g));
    const qtx=el('div');qtx.style.flex='1';
    qtx.appendChild(el('div','qt',_sc.ch.title));
    qtx.appendChild(el('div','qs','📖 '+_sc.tale.title));
    cap.appendChild(qtx);
    if(_rev)cap.appendChild(el('span','rev-chip','🔁 revisão'));
    qs.appendChild(cap);
    // bolha de fala do herói (transição): aparece antes da pergunta e é falada
    if(runner.pendingLine){
      const bb=el('div','qs-bubble '+(runner.pendingOk?'ok':'no'),runner.pendingLine);
      qs.appendChild(bb);
    }
    wrap.appendChild(qs);
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
  if(runner.pendingLine){
    const _l=runner.pendingLine;runner.pendingLine=null;
    voicedSay(_l,()=>maybeAutoPlay(item)); // encadeia: fala do João -> enunciado
  }else maybeAutoPlay(item);
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
  if(!isPl&&runner.scene&&!last){
    runner.pendingOk=!!res.correct;
    if(res.correct){runner.pendingLine=runner.lineOk[runner.lo%runner.lineOk.length];runner.lo++;}
    else{runner.pendingLine=runner.lineNo[runner.ln%runner.lineNo.length];runner.ln++;}
  }
}

/* ---------- renderizadores por tipo ---------- */
/* glifo do capítulo a que o item pertence (feijão/folha/nuvem...). null nas ilhas
   ainda não vestidas => manipulativo neutro, como antes. */
let ITEM_GLYPH=null;
function itemGlyph(item){
  const s=item&&E.skillById(item.skill_id);if(!s)return null;
  const ci=chapterFor(s);
  return (ci&&CHAPTER_PROPS[ci.ch.id])?CHAPTER_PROPS[ci.ch.id].g:null;
}
function renderItem(item,stage,cb,ropts){
  ITEM_GLYPH=itemGlyph(item);
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
  layout.forEach(r=>{const row=el('div','dc-row');
    for(let i=0;i<r;i++)row.appendChild(ITEM_GLYPH?el('span','dc-dot glyph',ITEM_GLYPH):el('span','dc-dot'));
    c.appendChild(row);});
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
  for(let f=0;f<frames;f++){const tf=el('div','tenframe'+(ITEM_GLYPH?' glyphed':''));for(let i=0;i<10;i++){const c=el('div','tf-cell');
    c.appendChild(ITEM_GLYPH?el('span','dot glyph',ITEM_GLYPH):el('span','dot'));
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
