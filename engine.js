/* Método Wanwan — engine.js (v2)
   Núcleo puro (sem DOM) do plano_avaliacao_niveis.md:
   EE por tentativa (§2), janela/AR (§3), níveis N0-N6 (§5), regressão (§6),
   confiança (§7), diagnóstico em escada (§8), revisão (§9), estrelas (§10).
   Exposto em window.Wanwan (browser) e module.exports (node, para smoke-test). */
'use strict';
(function(root){
const LEVELS=['N0','N1','N2','N3','N4','N5','N6'];
const FORMATS=['DIRECT','REPR','PROBLEM','EXPLAIN','VARIATION'];
const li=l=>LEVELS.indexOf(l);
const DAY=86400000;
/* §12 — parâmetros calibráveis */
const P={WINDOW_N:8,WINDOW_DAYS:30,WINDOW_CAP:12,RECENCY:0.85,COVER_EE:70,
 SUP:{none:1,hint:0.8,manip:0.6,guided:0.4,demo:0},RETRY2:0.5,
 EXPL:{clear:1,partial:0.6,none:0.3},
 AR:{N2:50,N3:55,N4:65,N5:80},RETAIN_DAYS:7,DECAY_DAYS:60,
 REM_WINDOW_DAYS:7,REM_INSERT_AT:2,REM_DEMOTE_AT:4,
 DIAG_MAX_PER_AXIS:4,DIAG_MAX_EXTENDED:8,DIAG_MAX_SECONDARY:2,DIAG_CORE_AXES:[1,2,3,4],REVIEW_QUOTA:0.3,FLU_RATE:0.6,MISSION_LEN:6,ATTEMPTS_CAP:500};
const SUP_RANK={none:0,hint:1,manip:2,guided:3,demo:4};

let D=null, skillById={}, itemsBySkill={}, PLAYABLE=[], prereqMap={}, axisSkills={};
function init(data){
  D=data; skillById={}; itemsBySkill={}; prereqMap={}; axisSkills={};
  D.skills.forEach(s=>{skillById[s.skill_id]=s;(axisSkills[s.axis_id]=axisSkills[s.axis_id]||[]).push(s);});
  D.items.forEach(it=>{(itemsBySkill[it.skill_id]=itemsBySkill[it.skill_id]||[]).push(it);});
  PLAYABLE=Object.keys(itemsBySkill);
  D.skills.forEach(s=>prereqMap[s.skill_id]=s.prerequisites||[]);
  Object.values(axisSkills).forEach(list=>list.sort((a,b)=>skey(a)-skey(b)));
}
function skey(s){const m=/-B(\d)-(\d+)$/.exec(s.skill_id);return (+m[1])*100+(+m[2]);}
function prereqsOf(id){return prereqMap[id]||[];}

/* ---------- estado (v3, 06/07/2026: modelo multi-criança — guardian + children[], sem ligar coleta/consentimento real) ---------- */
function genId(prefix){return prefix+'_'+Math.random().toString(36).slice(2,8)+Date.now().toString(36).slice(-4);}
function newState(){
  const gid=genId('gua'), cid=genId('chi'), now=Date.now();
  const child={child_id:cid,nickname:'Sofia',age_band:null,reading_profile:null,avatar:null,
    consent_status:'pending',active:true,created_at:now};
  return {v:3,devDayOffset:0,mode:'solo',surface:'child',
    guardian:{guardian_id:gid,auth_email:null,locale:'pt-BR',status:'active',created_at:now},
    children:[child],child:child,activeChildId:cid,
    onboarded:false,
    mastery:{},attempts:[],attemptSeq:0,attemptsTotal:0,sessions:[],remediationQueue:[],
    placement:{part:0,axisIdx:0,ladder:null,finished:false,seeded:[],lastSessionBoundary:false},
    stars:0,selos:[],starLog:[],collection:{owned:{}},consents:[]};
}
/* migração idempotente do estado local (design em modelo_dados_lgpd.md §6): v2 (1 criança fixa 'c1')
   -> v3 (guardian + children[]); remapeia as chaves de mastery e tageia attempts/sessions com child_id.
   Chamar sempre ao carregar do localStorage — nunca editar app-data.js nem backend aqui (é só o estado local). */
function migrateState(raw){
  if(!raw||typeof raw!=='object')return newState();
  if(raw.v===3){
    if(!Array.isArray(raw.children)||!raw.children.length){
      const c=raw.child||{child_id:genId('chi'),nickname:'Sofia',age_band:null,reading_profile:null,avatar:null,consent_status:'pending',active:true,created_at:Date.now()};
      raw.children=[c];
    }
    if(!raw.guardian)raw.guardian={guardian_id:genId('gua'),auth_email:null,locale:'pt-BR',status:'active',created_at:Date.now()};
    if(!raw.activeChildId||!raw.children.some(c=>c.child_id===raw.activeChildId))raw.activeChildId=raw.children[0].child_id;
    if(typeof raw.attemptsTotal!=='number')raw.attemptsTotal=(raw.attempts||[]).length;
    if(typeof raw.attemptSeq!=='number')raw.attemptSeq=(raw.attempts||[]).length;
    raw.child=raw.children.find(c=>c.child_id===raw.activeChildId)||raw.children[0];
    if(!raw.collection||typeof raw.collection!=='object')raw.collection={owned:{}};
    if(!raw.collection.owned)raw.collection.owned={};
    if(!Array.isArray(raw.consents))raw.consents=[];
    return raw;
  }
  if(raw.v===2){
    const newId=genId('chi');
    const child=Object.assign({},raw.child,{child_id:newId,avatar:null,consent_status:'pending',active:true,created_at:Date.now()});
    const mastery={};
    Object.keys(raw.mastery||{}).forEach(k=>{const i=k.indexOf('::');mastery[newId+'::'+(i>=0?k.slice(i+2):k)]=raw.mastery[k];});
    const attempts=(raw.attempts||[]).map(a=>Object.assign({child_id:newId},a));
    const sessions=(raw.sessions||[]).map(s=>Object.assign({child_id:newId},s));
    return Object.assign({},raw,{v:3,
      guardian:{guardian_id:genId('gua'),auth_email:null,locale:'pt-BR',status:'active',created_at:Date.now()},
      children:[child],child:child,activeChildId:newId,mastery,attempts,sessions,
      attemptSeq:attempts.length,attemptsTotal:attempts.length,collection:{owned:{}},consents:[]});
  }
  return newState();
}
/* prontos para quando o painel do responsável (UI) chegar — não usados por app.js ainda nesta sessão */
function addChild(S,profile){
  const c=Object.assign({child_id:genId('chi'),nickname:'Criança',age_band:null,reading_profile:null,
    avatar:null,consent_status:'pending',active:true,created_at:Date.now()},profile||{});
  S.children.push(c); return c;
}
function setActiveChild(S,childId){
  const c=S.children.find(x=>x.child_id===childId);
  if(c){S.child=c;S.activeChildId=childId;}
  return S.child;
}
function mastery(S,sk){
  const k=S.child.child_id+'::'+sk;
  if(!S.mastery[k]) S.mastery[k]={skill_id:sk,level:'N0',seeded:false,realAttempts:0,
    window:[],formatsEver:[],errorCounts:{},errorTimestamps:{},dominant_error:null,status:'not_started',
    next_review_at:null,reviews_done:0,review_fails:0,reconfirm:0,last_practiced_at:null,leveled_at:null,everConfirmed:false};
  return S.mastery[k];
}
/* ---------- EE (§2) ---------- */
function computeEE(res){
  const base=res.correct?100:(res.partial?50:0);
  const fs=P.SUP[res.support||'none']; if(fs===0)return {ee:null,teach:true};
  if(res.attempt>=3)return {ee:null,teach:true}; // C-03 / plano §2: 3ª+ tentativa vira ensino, não evidência
  const ft=res.attempt>=2?P.RETRY2:1;
  const fe=res.explanation_quality?P.EXPL[res.explanation_quality]:1;
  return {ee:Math.round(base*fs*ft*fe),teach:false};
}
/* ---------- janela e AR (§3) ---------- */
function pruneWindow(m,nowTs){
  // §3: a janela mantém "as ÚLTIMAS N (8) tentativas válidas OU as dos últimos 30 dias — o que for MAIOR", limitado a WINDOW_CAP.
  // NÃO filtrar por dias aqui: isso zeraria a recência de quem joga esporádico. O corte por 30d, PROTEGENDO as últimas N, é feito abaixo.
  while(m.window.length>P.WINDOW_CAP)m.window.shift();
  if(m.window.length>P.WINDOW_N){ // além de N, só mantém se dentro dos dias
    m.window=m.window.slice(-P.WINDOW_CAP).filter((e,i,arr)=>arr.length-i<=P.WINDOW_N||nowTs-e.ts<=P.WINDOW_DAYS*DAY);
  }
}
/* poda de S.attempts (dívida A-12): impede crescimento ilimitado do histórico no localStorage.
   Teto RÍGIDO por criança — mantém apenas as ÚLTIMAS ATTEMPTS_CAP tentativas de cada child_id,
   preservando a ordem cronológica (as mais recentes). Espelha o WINDOW_CAP do pruneWindow.
   attempt_id (attemptSeq) e o total vitalício (attemptsTotal) são monotônicos e NÃO dependem
   do array podado, então id continua único e 'Atividades feitas' segue somando a vida toda. */
function pruneAttempts(S){
  const cap=P.ATTEMPTS_CAP; const count={};
  for(const a of S.attempts)count[a.child_id]=(count[a.child_id]||0)+1;
  if(!Object.keys(count).some(c=>count[c]>cap))return; // nada a podar
  const seen={}, keep=new Set();
  for(let i=S.attempts.length-1;i>=0;i--){const a=S.attempts[i];const c=a.child_id;seen[c]=(seen[c]||0)+1;if(seen[c]<=cap)keep.add(a);}
  S.attempts=S.attempts.filter(a=>keep.has(a));
}
function AR(m){
  const w=m.window.slice().reverse(); if(!w.length)return 0;
  let num=0,den=0,p=1;
  w.forEach(e=>{num+=e.ee*p;den+=p;p*=P.RECENCY;});
  return num/den;
}
function coveredFormats(m){
  return FORMATS.filter(f=>m.window.some(e=>e.format===f&&e.ee>=P.COVER_EE&&e.support==='none'&&!e.overlap));
}
function unstable(m){
  const ns=m.window.filter(e=>e.support==='none'&&!e.overlap).slice(-2);
  return ns.length===2&&ns.every(e=>e.ee<50);
}
/* ---------- níveis (§5) ---------- */
function levelCandidate(m,skill){
  const w=m.window.filter(e=>!e.teach);
  if(w.length<2)return w.length?'N1':'N0';
  const ar=AR(m);
  const ent=(f,minEE,supMax,allowOverlap)=>w.filter(e=>e.format===f&&e.ee>=minEE&&SUP_RANK[e.support||'none']<=SUP_RANK[supMax]&&(allowOverlap||!e.overlap));
  const noSup=w.filter(e=>e.support==='none'&&!e.overlap&&e.ee>=70);
  const cov=coveredFormats(m);
  const flu=skill&&skill.fluency;
  const cls=skill&&skill.skill_class, isPre=cls==='precursora';
  // §5: formatos exigidos p/ o alvo = valid_formats declarados (fallback: formatos dos itens)
  const vfmts=(skill&&skill.valid_formats&&skill.valid_formats.length)?skill.valid_formats
    :[...new Set((itemsBySkill[(skill&&skill.skill_id)]||[]).map(i=>i.evidence_format))];
  let lvl='N1';
  if(ent('DIRECT',70,'hint',true).length>=2&&ar>=P.AR.N2)lvl='N2';
  if(ent('REPR',60,'manip',false).length>=2&&ar>=P.AR.N3)lvl='N3';
  const n4fmts=new Set(noSup.map(e=>e.format));
  // §5 classes: PROBLEM obrigatório em N4 só p/ conceitual/aplicada; precursora e fluência isentas
  const problemReqN4=!(isPre||flu);
  if(noSup.length>=3&&n4fmts.size>=2&&(!problemReqN4||n4fmts.has('PROBLEM'))&&ar>=P.AR.N4)lvl='N4';
  let n5;
  if(flu){ // fluência: cobre os valid_formats DECLARADOS (§5) + taxa de fluência
    const flurate=w.length?w.filter(e=>e.fluent).length/w.length:0;
    n5=vfmts.length>0&&vfmts.every(f=>cov.includes(f))&&ar>=P.AR.N5&&flurate>=P.FLU_RATE&&!unstable(m);
  }else if(isPre){ // precursora: sem PROBLEM obrigatório; cobre os valid_formats declarados
    n5=vfmts.length>0&&vfmts.every(f=>cov.includes(f))&&ar>=P.AR.N5&&!unstable(m);
  }else{ // conceitual/aplicada: §4.4 vale — ≥3 formatos com PROBLEM
    n5=cov.length>=3&&cov.includes('PROBLEM')&&ar>=P.AR.N5&&!unstable(m);
  }
  if(n5)lvl='N5';
  if(n5){
    const strong=w.filter(e=>e.ee>=70);
    const span=strong.length?Math.max(...strong.map(e=>e.ts))-Math.min(...strong.map(e=>e.ts)):0;
    const clearExp=w.some(e=>e.format==='EXPLAIN'&&e.quality==='clear'&&e.ee>=70);
    if(cov.includes('VARIATION')&&clearExp&&span>=P.RETAIN_DAYS*DAY)lvl='N6';
  }
  return lvl;
}
function applyLevel(S,m,skill,nowTs,ctx){
  const cand=levelCandidate(m,skill);
  const cur=m.level; const evts=[];
  if(m.seeded&&m.realAttempts>=3){ // correção de semeadura: descer pode ser direto (§8.5)…
    m.seeded=false;
    if(li(cand)>li(cur)){m.level=LEVELS[Math.min(li(cur)+1,li(cand))];evts.push('level_up');} // …subir respeita +1 (§4)
    else m.level=cand;
  }else if(li(cand)>li(cur)){
    m.level=LEVELS[Math.min(li(cur)+1,li(cand))]; evts.push('level_up');
  }
  // regressão por instabilidade sensível à confiança (§6, revisão 04/07/2026)
  if(unstable(m)&&!m.wasUnstable&&li(m.level)>2){
    const conf=confidenceCore(m);
    if(conf==='baixa'){ // inclui semeadura: rebaixa 1 imediatamente
      m.level=LEVELS[li(m.level)-1]; evts.push('regressed');
    }else if(conf==='media'){ // reconfirmação: 2 itens; rebaixa só se falhar (ctx reconfirm)
      m.reconfirm=2; m.status='reconfirm'; evts.push('reconfirm_pending');
    }else{ // alta: revisão prioritária; rebaixa só se a instabilidade se repetir na revisão (§9)
      m.status='review_needed'; m.next_review_at=nowTs; evts.push('review_priority');
    }
    queueDiagnostics(S,skill.skill_id);
  }
  m.wasUnstable=unstable(m);
  if(evts.includes('level_up')){m.leveled_at=nowTs;scheduleReview(m,nowTs);}
  // status
  const tgt=li(skill.level_target||'N5');
  if(!m.window.length&&!m.seeded)m.status='not_started';
  else if(m.reconfirm>0)m.status='reconfirm';
  else if(m.status==='review_needed'&&ctx!=='review')/*mantém*/;
  else if(li(m.level)>=tgt)m.status='mastered';
  else if(li(m.level)>=4)m.status='consolidating';
  else m.status='learning';
  return evts;
}
function scheduleReview(m,nowTs){
  const l=m.level;let d=null;
  if(l==='N6')d=30;else if(l==='N5')d=m.reviews_done>=1?16:6;
  else if(l==='N4')d=3;else if(l==='N3')d=1.5;
  m.next_review_at=d==null?null:nowTs+d*DAY;
}
function markReviews(S,nowTs){
  Object.values(S.mastery).forEach(m=>{
    if(m.next_review_at&&m.next_review_at<=nowTs&&li(m.level)>=3&&m.status!=='review_needed'&&m.reconfirm===0)
      m.status='review_needed';
    if(decayed(m,nowTs)&&m.status!=='review_needed'&&m.reconfirm===0){ /* C-05: revisão priorizada p/ decadas */
      m.status='review_needed';if(!m.next_review_at||m.next_review_at>nowTs)m.next_review_at=nowTs;
    }
  });
}
/* ---------- registrar tentativa (§14) ---------- */
function recordAttempt(S,item,res,nowTs,ctx,sessionId){
  const sk=skillById[item.skill_id]; const m=mastery(S,item.skill_id);
  const {ee,teach}=computeEE(res);
  const wasSeededFlag=m.seeded, wasConfirmed=n4Confirmed(m); // p/ implicação: estado ANTES das mutações
  S.attemptSeq=(S.attemptSeq||0)+1;
  S.attempts.push({attempt_id:'a'+S.attemptSeq,child_id:S.child.child_id,session_id:sessionId||null,skill_id:item.skill_id,task_id:item.item_id,
    evidence_format:item.evidence_format,correct:!!res.correct,support:res.support||'none',
    attempt_n:res.attempt||1,ee:teach?null:ee,error_pattern:res.errorPattern||null,
    explanation_quality:res.explanation_quality||null,ctx:ctx||'mission',mode:S.mode,ts:nowTs});
  S.attemptsTotal=(S.attemptsTotal||0)+1; pruneAttempts(S);
  m.last_practiced_at=nowTs;
  const evts=[];
  if(!teach){
    const before=coveredFormats(m).length;
    m.window.push({format:item.evidence_format,ee,support:res.support||'none',
      quality:res.explanation_quality||null,fluent:!!res.fluent,ts:nowTs});
    pruneWindow(m,nowTs);
    m.realAttempts++;
    if(ee>=P.COVER_EE&&(res.support||'none')==='none'){m.formatsEver=m.formatsEver||[];if(!m.formatsEver.includes(item.evidence_format))m.formatsEver.push(item.evidence_format);} // ledger p/ auditar N5 sem depender da janela deslizante
    if(coveredFormats(m).length>before)evts.push('new_format');
    // crédito cruzado (§6.5 do manual)
    if(res.correct&&item.evidence_format==='DIRECT'&&(res.support||'none')==='none'&&ee>=70&&sk.overlap_with){
      const tm=mastery(S,sk.overlap_with);
      if(tm.window.filter(e=>e.overlap).length<2){tm.window.push({format:'DIRECT',ee:60,support:'none',overlap:true,ts:nowTs});pruneWindow(tm,nowTs);}
    }
  }
  if(res.correct&&res.explanation_quality==='clear')evts.push('explain_clear');
  let patternDemote=false; // C-07: recuo por >=4 ocorrências (aplicado após applyLevel, guardado)
  if(!res.correct&&res.errorPattern){
    m.errorCounts[res.errorPattern]=(m.errorCounts[res.errorPattern]||0)+1;
    m.dominant_error=Object.entries(m.errorCounts).sort((a,b)=>b[1]-a[1])[0][0];
    /* C-07 (manual §8): remedia por RECORRÊNCIA, não por erro isolado. Janela de REM_WINDOW_DAYS dias:
       >=REM_INSERT_AT do mesmo código -> insere item da destino; >=REM_DEMOTE_AT -> recua 1 nível na
       origem + prioriza destino (após applyLevel, guardado). Deslize nunca conta (§8). */
    const remInfo=((D.error_remediation&&D.error_remediation.map)||{})[res.errorPattern];
    if(!(remInfo&&remInfo.cls==='deslize')){
      const tl=(m.errorTimestamps||(m.errorTimestamps={}))[res.errorPattern]||(m.errorTimestamps[res.errorPattern]=[]);
      tl.push(nowTs);
      const cutoff=nowTs-P.REM_WINDOW_DAYS*DAY; while(tl.length&&tl[0]<cutoff)tl.shift();
      if(tl.length>=P.REM_INSERT_AT)queueDiagnostics(S,item.skill_id,res.errorPattern);
      if(tl.length>=P.REM_DEMOTE_AT){patternDemote=true;tl.length=0;} // consome a janela ao acionar o recuo
    }
  }
  // revisão (§9)
  if(ctx==='review'&&!teach){
    if(ee>=70){m.reviews_done++;m.review_fails=0;if(m.status==='review_needed')m.status=li(m.level)>=li(sk.level_target||'N5')?'mastered':'consolidating';scheduleReview(m,nowTs);evts.push('review_ok');}
    else if(ee<50){m.review_fails++;m.reconfirm=2;m.status='reconfirm';
      if(m.review_fails>=2&&li(m.level)>2){m.level=LEVELS[li(m.level)-1];m.review_fails=0;evts.push('regressed');}}
    else{evts.push('review_neutral');} /* C-04 (4ª auditoria): 50-69 é neutro — não pune, não avança
      intervalo, segue review_needed e re-testa na próxima missão. Variante V2 validada por simulação
      (regressões da criança legítima ~24→~7/90d; vazamento do chute aleatório inalterado). */
  }else if(ctx==='reconfirm'&&!teach){
    if(ee>=70){m.reconfirmFails=0;m.reconfirm=Math.max(0,m.reconfirm-1);if(m.reconfirm===0){m.status='consolidating';scheduleReview(m,nowTs);}}
    else{m.reconfirmFails=(m.reconfirmFails||0)+1;
      if(li(m.level)>2){m.level=LEVELS[li(m.level)-1];evts.push('regressed');}
      if(m.reconfirmFails>=3){ /* C-19: 3 falhas seguidas → trocar cobrança por ensino */
        m.reconfirm=0;m.reconfirmFails=0;m.status='consolidating';scheduleReview(m,nowTs);
        queueDiagnostics(S,item.skill_id,res.errorPattern||m.dominant_error);evts.push('reconfirm_to_teaching');
      }else{m.reconfirm=2;}
    }
  }
  evts.push(...applyLevel(S,m,sk,nowTs,ctx));
  if(patternDemote&&li(m.level)>2&&!evts.includes('regressed')&&m.reconfirm===0){ /* C-07: recuo por padrão — guardado p/ não empilhar com a regressão por instabilidade nem atropelar reconfirmação */
    m.level=LEVELS[li(m.level)-1];m.status=li(m.level)>=4?'consolidating':'learning';evts.push('regressed_by_pattern');
    queueDiagnostics(S,sk.skill_id,res.errorPattern,true); // prioriza a habilidade de destino na fila
  }
  // implicação (§8, 04/07): semeada confirmada ≥N4 → ancestrais semeados confirmados
  if(wasSeededFlag&&!wasConfirmed&&n4Confirmed(m)&&li(m.level)>=4){evts.push('seeded_confirmed');
    if(coveredFormats(m).length>=2)confirmSeededAncestors(S,sk.skill_id); // 4ª auditoria: implicação exige confirmação forte (2 formatos)
  }
  if(n4Confirmed(m))m.everConfirmed=true; // histerese §4.3 (C-06): marca confirmação p/ não re-travar sucessoras ao cair a N3
  // selo: atingiu o alvo pela primeira vez
  if(li(m.level)>=li(sk.level_target||'N5')&&!S.selos.some(x=>x.skill_id===sk.skill_id)){
    S.selos.push({skill_id:sk.skill_id,gold:m.level==='N6',ts:nowTs});evts.push('selo');
  }
  markReviews(S,nowTs);
  return {m,ee:teach?null:ee,evts};
}
function queueDiagnostics(S,skillId,errorPattern,front){
  /* remediação por error_pattern (item 2 da auditoria, 18ª sessão): mapa
     D.error_remediation.map (código→{cls,remediate}). deslize → SEM remediação (só retry);
     alvo específico jogável → enfileira essa habilidade; conceitual sem alvo (ou código
     desconhecido) → fallback nos diagnostic_links da skill (comportamento antigo). */
  const rem=(D.error_remediation&&D.error_remediation.map)||{};
  const e=errorPattern?rem[errorPattern]:null;
  let targets=null;
  if(e){
    if(e.cls==='deslize')return;
    if(e.remediate&&PLAYABLE.includes(e.remediate))targets=[e.remediate];
  }
  if(!targets)targets=(skillById[skillId].diagnostic_links||[]);
  targets.filter(t=>PLAYABLE.includes(t)).forEach(t=>{
    const i=S.remediationQueue.findIndex(q=>q.skill===t);
    if(i>=0){ if(front){const[it]=S.remediationQueue.splice(i,1);S.remediationQueue.unshift(it);} }
    else{const entry={skill:t,from:skillId,via:errorPattern||null};front?S.remediationQueue.unshift(entry):S.remediationQueue.push(entry);}
  });
}
/* ---------- confiança (§7) ---------- */
function confidenceCore(m){ /* §6: confiança da estimativa p/ decidir regressão —
  sem penalizar a instabilidade corrente (senão 'alta' seria inalcançável no momento da queda) */
  if(m.seeded)return 'baixa';
  const n=m.window.filter(e=>!e.overlap).length;
  const fmts=new Set(m.window.filter(e=>!e.overlap).map(e=>e.format)).size;
  if(n>=8&&fmts>=3)return 'alta';
  if(n>=4&&fmts>=2)return 'media';
  return 'baixa';
}
function confidence(m,nowTs){ /* §7 — exibição: instabilidade rebaixa alta→media */
  let c=confidenceCore(m);
  if(c==='alta'&&unstable(m))c='media';
  if(decayed(m,nowTs))c=c==='alta'?'media':'baixa'; /* C-05: decaimento passivo rebaixa 1 degrau */
  return c;
}
function decayed(m,nowTs){ /* C-05 (4ª auditoria 07/07/2026): decaimento passivo (plano §6) —
  N5/N6 sem prática há >DECAY_DAYS: a exibição ganha "(a confirmar)", a confiança EXIBIDA cai
  1 degrau e a revisão é priorizada. O NÍVEL não muda (sem evidência negativa) e confidenceCore
  (que decide regressão) não é afetada. nowTs opcional: sem ele, comportamento antigo. */
  return nowTs!=null&&li(m.level)>=5&&!!m.last_practiced_at&&(nowTs-m.last_practiced_at)>P.DECAY_DAYS*DAY;
}
/* ---------- desbloqueio (manual v2 §4.3 + plano §8.6) ---------- */
function n4Confirmed(m){ /* N4_provisorio (semeado) NÃO conta; confirmação =
  >=2 acertos limpos (EE>=70 sem suporte) OU evidência em >=2 formatos.
  (4ª auditoria 07/07/2026: "3 tentativas reais" confirmava até errando —
  chute aleatório sobrevivia à regressão e a implicação propagava; plano §8.6 atualizado) */
  if(li(m.level)<4)return false;
  if(!m.seeded)return true;
  return cleanHits(m)>=2||coveredFormats(m).length>=2;
}
function cleanHits(m){return m.window.filter(e=>e.ee>=70&&(e.support||'none')==='none'&&!e.overlap).length;}
function unlocked(S,skId){
  /* pré-requisitos sem itens jogáveis não travam (não há como confirmá-los no protótipo) */
  return prereqsOf(skId).filter(p=>PLAYABLE.includes(p))
    .every(p=>{const m=mastery(S,p);return n4Confirmed(m)||(!!m.everConfirmed&&li(m.level)>=3);});
  /* histerese §4.3 (C-06): pré já confirmado ≥N4 que regride só até N3 NÃO re-trava sucessoras já praticadas; re-trava apenas abaixo de N3 (N2-) */
}
function confirmSeededAncestors(S,skId){
  /* semeada avançada confirmada ≥N4 → ancestrais semeados confirmados por implicação (§8, 04/07) */
  const seen={};
  (function walk(id){
    prereqsOf(id).forEach(p=>{
      if(seen[p])return; seen[p]=1;
      const m=mastery(S,p);
      if(m.seeded){m.seeded=false;m.confirmedByImpl=true;if(li(m.level)<4)m.level='N4';m.status='consolidating';m.everConfirmed=true;}
      walk(p);
    });
  })(skId);
}
function axisProgress(S,axisId){
  const list=(axisSkills[axisId]||[]).filter(s=>PLAYABLE.includes(s.skill_id));
  if(!list.length)return null;
  const v=list.reduce((a,s)=>{const m=mastery(S,s.skill_id);return a+Math.min(1,li(m.level)/li(s.level_target||'N5'));},0);
  return v/list.length;
}
/* ---------- diagnóstico em escada (§8) ---------- */
/* Sessões do diagnóstico (§8.4, 06/07/2026): fatiado em 3 sessões de eixos — a UI para no fim
   de cada uma (placement.lastSessionBoundary) e retoma quando a criança voltar a explorar;
   NÃO há corte por relógio (decisão do Wanderson: só por bloco de eixos).
   Sessão 1 = espinha inicial (SNC, CDT, AS). Sessão 2 = VP + um braço (MUL+DIV OU GEO).
   Sessão 3 = os eixos restantes.
   O critério de qual braço entra na sessão 2 NÃO está explícito no manual/plano — é uma escolha
   do dev, documentada aqui para revisão: bandas mais novas (5-6/7) recebem GEO (menos
   simbólico/abstrato); bandas 8 em diante recebem MUL+DIV (aritmética formal já esperada
   no currículo nessa idade, maior valor diagnóstico para montar as primeiras missões).
   Ajustável sem custo — é só trocar AGE_BANDS_MULDIV. */
const AXIS_SESSION1=[1,2,4]; // SNC, CDT, AS
const AXIS_VP=3;
const AXIS_MULDIV=[5,6]; // MUL, DIV
const AXIS_GEO_ARM=[8]; // GEO
/* 07/07/2026 (3ª auditoria, correção "faixas etárias sobrepostas"): as chaves '6-7','7-8','8-10',
   '10-11','11-12' eram ambíguas — cada idade de fronteira (6,7,8,10,11) pertencia a DUAS bandas
   ao mesmo tempo (ex.: idade 8 estava em '7-8' [braço GEO] E em '8-10' [braço MUL+DIV] — resultado
   dependia de qual botão a família clicasse, não da idade). As chaves NOVAS abaixo ('7','8','9-10',
   '11','12') não se sobrepõem; as chaves ANTIGAS continuam mapeadas (mesmo braço/tier de antes) só
   para não quebrar um S.child.age_band já salvo em localStorage de uma sessão anterior — não são
   mais oferecidas nos botões da UI (ver app.js). */
const AGE_BANDS_MULDIV=['8','9-10','11','12','8-10','10-11','11-12'/*legado*/];
const ALL_AXES=[1,2,3,4,5,6,7,8,9,10,11,12];
function sessionAxisGroups(ageBand){
  const arm=AGE_BANDS_MULDIV.includes(ageBand)?AXIS_MULDIV:AXIS_GEO_ARM;
  const s1=AXIS_SESSION1.slice();
  const s2=[AXIS_VP,...arm];
  const used=new Set([...s1,...s2]);
  const s3=ALL_AXES.filter(a=>!used.has(a));
  return [s1,s2,s3];
}
const ENTRY_LADDER={'5-6':['B1'],'7':['B2','B1'],'8':['B3','B2','B1'],
  '9-10':['B4','B3','B2','B1'],'11':['B5a','B4','B3','B2','B1'],
  '12':['B5b','B5a','B4','B3','B2','B1'],
  /* chaves legadas (pré-07/07/2026), mesmo tier de antes — só para estado salvo antigo: */
  '6-7':['B2','B1'],'7-8':['B3','B2','B1'],'8-10':['B4','B3','B2','B1'],
  '10-11':['B5a','B4','B3','B2','B1'],
  '10-12':['B5a','B4','B3','B2','B1'],/* legado mais antigo: nunca 10+→B5b indistinto (§8.1) */
  '11-12':['B5b','B5a','B4','B3','B2','B1']};
function entryMatches(s,tok){
  return tok==='B5a'||tok==='B5b'?(s.block==='B5'&&s.subblock===tok):s.block===tok;
}
function entryIndex(S,list){
  const band=S.child.age_band||'7';
  for(const tok of (ENTRY_LADDER[band]||['B2','B1'])){
    const idxs=list.map((s,i)=>({s,i})).filter(x=>entryMatches(x.s,tok));
    if(idxs.length)return idxs[Math.floor(idxs.length/2)].i;
  }
  return Math.floor(list.length/2);
}
function placementAxis(S){
  const pl=S.placement;
  if(pl.finished)return null;
  const part=sessionAxisGroups(S.child.age_band)[pl.part];
  if(!part)return null;
  return part[pl.axisIdx]!=null?part[pl.axisIdx]:null;
}
function nextPlacementItem(S){
  const ax=placementAxis(S);
  if(ax==null)return null;
  const pl=S.placement;
  if(!pl.ladder||pl.ladder.axis!==ax){
    const list=(axisSkills[ax]||[]).filter(s=>PLAYABLE.includes(s.skill_id));
    pl.ladder={axis:ax,order:list.map(s=>s.skill_id),pos:entryIndex(S,list),results:{},count:0,used:[]};
  }
  const L=pl.ladder;
  if(L.pos<0||L.pos>=L.order.length)return finishAxis(S);
  const sk=L.order[L.pos];
  const pool=(itemsBySkill[sk]||[]);
  const pick=f=>pool.find(i=>i.evidence_format===f&&!L.used.includes(i.item_id));
  const it=pick('DIRECT')||pick('REPR')||pool.find(i=>!L.used.includes(i.item_id))||pool[0];
  if(!it)return finishAxis(S);
  L.used.push(it.item_id);
  return it;
}
function recordPlacement(S,item,res,nowTs,sessionId){
  const pl=S.placement,L=pl.ladder;
  recordAttempt(S,item,res,nowTs,'placement',sessionId);
  const pos=L.order.indexOf(item.skill_id);
  L.results[pos]=!!res.correct;L.count++;
  let done=false;
  if(res.correct){
    if(L.results[pos+1]===false)done=true;else L.pos=pos+1;
  }else{
    if(L.results[pos-1]===true)done=true;else L.pos=pos-1;
  }
  if(L.pos<0||L.pos>=L.order.length)done=true;
  // carga por eixo (§8, 12 eixos 05/07): a ESPINHA (DIAG_CORE_AXES = SNC/CDT/VP/AS, que
  // gateiam o DAG) usa escada completa e ESTENDE ao gabaritar; os 8 eixos SECUNDÁRIOS usam
  // sonda curta (DIAG_MAX_SECONDARY) sem extensão — uma leitura grosseira basta p/ semear
  // (o jogo refina depois, semeadura é N4 provisório baixa confiança). Cobre os 12 eixos
  // sem alongar o diagnóstico p/ a criança.
  const allCorrect=L.count>0&&Object.values(L.results).every(v=>v===true);
  const isCore=(P.DIAG_CORE_AXES||[]).includes(L.axis);
  const cap=isCore?(allCorrect?(P.DIAG_MAX_EXTENDED||P.DIAG_MAX_PER_AXIS):P.DIAG_MAX_PER_AXIS)
                  :(P.DIAG_MAX_SECONDARY||P.DIAG_MAX_PER_AXIS);
  if(L.count>=cap)done=true;
  if(done)finishAxis(S,nowTs);
  return done;
}
function finishAxis(S,nowTs){
  const pl=S.placement,L=pl.ladder;
  if(L){ // fronteira = primeiro índice sem acerto conhecido acima do maior acerto
    let hi=-1;Object.entries(L.results).forEach(([i,ok])=>{if(ok)hi=Math.max(hi,+i);});
    const boundary=hi+1;
    // semeadura N4 provisório (§8.5): abaixo da fronteira + ancestrais no eixo
    for(let i=0;i<boundary&&i<L.order.length;i++){
      const m=mastery(S,L.order[i]);
      if(li(m.level)<4&&m.realAttempts===0){m.level='N4';m.seeded=true;m.status='consolidating';pl.seeded.push(L.order[i]);}
    }
  }
  pl.ladder=null;pl.axisIdx++;
  const groups=sessionAxisGroups(S.child.age_band);
  const part=groups[pl.part];
  pl.lastSessionBoundary=false;
  if(!part||pl.axisIdx>=part.length){
    pl.axisIdx=0;pl.part++;
    // cruzou de uma sessão pra outra (§8.4) — só é "fim de sessão" de verdade se ainda
    // sobrar sessão pela frente; se essa era a última, é o fim de tudo (pl.finished abaixo).
    if(pl.part<groups.length)pl.lastSessionBoundary=true;
  }
  if(pl.part>=groups.length)pl.finished=true;
  return null;
}
/* ---------- seleção de missão ---------- */
function pickItem(sk,opts){opts=opts||{};
  let pool=(itemsBySkill[sk]||[]).slice();
  if(opts.format)pool=pool.filter(i=>i.evidence_format===opts.format);
  if(opts.exclude)pool=pool.filter(i=>!opts.exclude.includes(i.item_id));
  if(!pool.length)pool=(itemsBySkill[sk]||[]).filter(i=>!(opts.exclude||[]).includes(i.item_id));
  return pool[Math.floor(Math.random()*pool.length)]||null;
}
function dagDepth(id,memo){memo=memo||{};if(memo[id]!=null)return memo[id];
  const ps=prereqsOf(id).filter(p=>PLAYABLE.includes(p));
  memo[id]=ps.length?1+Math.max(...ps.map(p=>dagDepth(p,memo))):0;return memo[id];}
function allPrereqs(id){ // pre-requisitos TRANSITIVOS (B-15: revisao prioriza os do foco, plano §9)
  const seen=new Set();const stack=prereqsOf(id).slice();
  while(stack.length){const p=stack.pop();if(seen.has(p))continue;seen.add(p);for(const q of prereqsOf(p))if(!seen.has(q))stack.push(q);}
  return seen;}
function playableOrder(){const memo={};return PLAYABLE.slice().sort((a,b)=>dagDepth(a,memo)-dagDepth(b,memo));}
function focusSkill(S,prefer){
  if(prefer&&PLAYABLE.includes(prefer)&&unlocked(S,prefer))return prefer;
  const ord=playableOrder();
  // 1º: semeadas para confirmar — a MAIS AVANÇADA primeiro (confirmação em escada
  // descendente, §8 04/07); isentas do gate `unlocked` (o diagnóstico já as avaliza).
  const seededList=ord.filter(sk=>{const m=mastery(S,sk);return m.seeded&&!n4Confirmed(m);});
  if(seededList.length){const memo={};
    return seededList.reduce((best,sk)=>dagDepth(sk,memo)>=dagDepth(best,memo)?sk:best);}
  for(const sk of ord){const m=mastery(S,sk),s=skillById[sk];
    if(unlocked(S,sk)&&li(m.level)<li(s.level_target||'N5'))return sk;}
  const rev=ord.find(sk=>mastery(S,sk).status==='review_needed');
  return rev||ord[ord.length-1];
}
function buildMission(S,nowTs,preferSkill){
  markReviews(S,nowTs);
  const plan=[],used=[];
  const push=(it,type,reason)=>{if(it&&!used.includes(it.item_id)){plan.push({item:it,rec_type:type,reason});used.push(it.item_id);}};
  // reconfirmação pós-falha de revisão (prioridade máxima)
  const rc=playableOrder().find(sk=>mastery(S,sk).reconfirm>0);
  if(rc)push(pickItem(rc,{exclude:used}),'reconfirm','reconfirmação');
  // foco calculado ANTES da revisão (B-15): a cota de revisão prioriza os pré-requisitos
  // do conteúdo novo da própria sessão (plano §9), não a ordem global do DAG.
  const fsk=focusSkill(S,preferSkill);const focusPre=allPrereqs(fsk);
  // cota de revisão (~30%) — prereqs (transitivos) do foco primeiro; empata pela ordem do DAG (sort estável)
  const revSks=playableOrder().filter(sk=>mastery(S,sk).status==='review_needed')
    .sort((a,b)=>(focusPre.has(b)?1:0)-(focusPre.has(a)?1:0));
  revSks.slice(0,Math.max(0,Math.max(1,Math.round(P.MISSION_LEN*P.REVIEW_QUOTA))-plan.length)).forEach(sk=>{
    const cov=coveredFormats(mastery(S,sk));
    push(pickItem(sk,{format:cov[0],exclude:used}),'review','revisão espaçada');
  });
  // remediação
  if(S.remediationQueue.length){const q=S.remediationQueue.shift();push(pickItem(q.skill,{exclude:used}),'remediate','remediação de '+q.from);}
  // foco: cobrir formatos que faltam (PROBLEM primeiro quando perto de N5)
  const fm=mastery(S,fsk); // fsk já calculado acima (B-15)
  const cov=coveredFormats(fm);
  let missing=FORMATS.filter(f=>!cov.includes(f)&&(itemsBySkill[fsk]||[]).some(i=>i.evidence_format===f));
  if(cov.length>=2&&missing.includes('PROBLEM'))missing=['PROBLEM',...missing.filter(f=>f!=='PROBLEM')];
  missing.forEach(f=>{if(plan.length<P.MISSION_LEN)push(pickItem(fsk,{format:f,exclude:used}),'practice','coletar '+f);});
  while(plan.length<Math.min(5,P.MISSION_LEN)){
    const it=pickItem(fsk,{exclude:used});if(!it)break;push(it,'practice','prática');
  }
  if(plan.length<4){const nx=playableOrder().find(sk=>sk!==fsk&&unlocked(S,sk)&&li(mastery(S,sk).level)<5);
    if(nx)push(pickItem(nx,{exclude:used}),'practice','avanço');}
  return {kind:'mission',mode:S.mode,items:plan.slice(0,P.MISSION_LEN),focus:fsk};
}
/* ---------- estrelas da sessão (§10) ---------- */
function sessionStars(sessionEvents,itemsAnswered,total,mistakes){
  let s=0;const why=[];
  const completed=itemsAnswered>=Math.min(3,total);
  if(completed){s++;why.push('Completou a missão');}
  if(sessionEvents.some(e=>e==='level_up'||e==='new_format'||e==='selo')){s++;why.push('Evidência nova');}
  /* 3ª estrela — modelo HÍBRIDO (08/07/2026, decisão do Wanderson). "Missão limpa": no máximo
     1 tropeço. Erro NUNCA remove as duas primeiras estrelas (§10: "erro é dado, não punição") e
     velocidade NUNCA conta (regra 7) — a 3ª é bônus de capricho por acertar, não medida de
     proficiência (essa segue só nas camadas N/EE). Alcançável no modo sozinho: corrige o beco em
     que a antiga 3ª estrela ("força de explicação", f=1,0) era impossível solo (C-09). Requer a
     contagem de erros da sessão; se não vier (chamador legado), a 3ª estrela não é concedida. */
  if(completed&&typeof mistakes==='number'&&mistakes<=1){s++;why.push(mistakes===0?'Missão sem erros':'Missão quase perfeita');}
  return {stars:s,why};
}
/* ---------- tesouros e coleção (camada narrativa; ver design_brief_narrativa_e_tesouros.md) ----------
   Baú abre quando um CAPÍTULO (conjunto de habilidades definido em D.tales) está no ALVO; a RARIDADE
   é conquistada por MÉRITO no momento da abertura, a partir de AR (acurácia recente §3) e do nível —
   ambos IGNORAM velocidade (regra inviolável nº 7). Nunca há sorteio. O Baú Real (ilha inteira no
   alvo) garante no mínimo ÉPICO; Lendário exige maestria alta (AR>=90 ou tudo N6). Idempotente:
   recalcula a coleção inteira a cada chamada e só concede/eleva (nunca rebaixa um tesouro obtido). */
const RARITY_RANK={comum:0,raro:1,epico:2,lendario:3};
function skillAtTarget(S,skId){const s=skillById[skId];if(!s)return false;return li(mastery(S,skId).level)>=li(s.level_target||'N5');}
function chapterComplete(S,skillIds){return !!(skillIds&&skillIds.length>0&&skillIds.every(id=>skillAtTarget(S,id)));}
function meanARof(S,skillIds){const ms=(skillIds||[]).map(id=>mastery(S,id)).filter(m=>m.window&&m.window.length);if(!ms.length)return 0;return ms.reduce((a,m)=>a+AR(m),0)/ms.length;}
function rarityForChapter(S,skillIds,isFinal){
  if(!chapterComplete(S,skillIds))return null;
  const ar=meanARof(S,skillIds);
  const allN6=skillIds.every(id=>li(mastery(S,id).level)>=6);
  if(isFinal)return (ar>=90||allN6)?'lendario':'epico'; // Baú Real: sempre alta raridade
  if(ar>=90||allN6)return 'epico';
  if(ar>=P.AR.N5)return 'raro'; // AR.N5 = 80
  return 'comum';
}
function axisPlayableSkills(axisId){return (axisSkills[axisId]||[]).filter(s=>PLAYABLE.includes(s.skill_id)).map(s=>s.skill_id);}
function evaluateTreasures(S,nowTs){
  if(!S.collection||typeof S.collection!=='object')S.collection={owned:{}};
  if(!S.collection.owned)S.collection.owned={};
  const owned=S.collection.owned, ts=nowTs||Date.now(), changes=[];
  const grant=(tid,rarity,meta)=>{ if(!rarity||!tid)return;
    const prev=owned[tid];
    if(!prev){owned[tid]=Object.assign({rarity,ts},meta);changes.push({treasure:tid,rarity,isNew:true});}
    else if(RARITY_RANK[rarity]>RARITY_RANK[prev.rarity]){const from=prev.rarity;prev.rarity=rarity;prev.ts=ts;changes.push({treasure:tid,rarity,isNew:false,upgradedFrom:from});}
  };
  const tales=D.tales||{};
  Object.keys(tales).forEach(axKey=>{
    const tale=tales[axKey], ax=+axKey;
    (tale.chapters||[]).forEach(ch=>grant(ch.treasure,rarityForChapter(S,ch.skills,false),{axis:ax,chapter:ch.id}));
    if(tale.final_treasure)grant(tale.final_treasure,rarityForChapter(S,axisPlayableSkills(ax),true),{axis:ax,chapter:'FINAL'});
  });
  return changes;
}
function collectionStatus(S){
  const owned=(S.collection&&S.collection.owned)||{};
  const cat=(D.treasures||[]);
  const items=cat.map(t=>{const o=owned[t.id];return Object.assign({},t,{owned:!!o,rarity:o?o.rarity:null,earned_at:o?o.ts:null});});
  const byRarity={comum:0,raro:0,epico:0,lendario:0};
  items.forEach(i=>{if(i.rarity)byRarity[i.rarity]++;});
  return {items,total:cat.length,have:items.filter(i=>i.owned).length,byRarity};
}
function taleOf(axisId){return (D.tales&&D.tales[String(axisId)])||null;}
function treasureChapter(axisId,chapterId){const t=taleOf(axisId);if(!t)return null;if(chapterId==='FINAL')return {id:'FINAL',title:t.title,beat:t.goal};return (t.chapters||[]).find(c=>c.id===chapterId)||null;}
/* ---------- escada de recompensas por estrelas (place value 10:1) ----------
   Derivada de S.stars (total acumulado, §10): 10 estrelas = 1 safira, 10 safiras = 1 diamante,
   10 diamantes = 1 coroa. É pura leitura do total (base 10) — não guarda estado novo, não sorteia;
   é conquista por mérito, coexiste com os tesouros/baús narrativos. */
function rewardTiers(S){
  var n=Math.max(0,(S&&S.stars)||0);
  var r=n%10;
  return {total:n,coroas:Math.floor(n/1000),diamantes:Math.floor(n/100)%10,
    safiras:Math.floor(n/10)%10,estrelas:r,toNextSafira:(r===0?10:10-r)};
}
/* qual maior tier foi cruzado indo de 'before' para 'after' estrelas totais (para celebrar 1x). */
function tierCrossed(before,after){
  before=Math.max(0,before||0);after=Math.max(0,after||0);
  if(Math.floor(after/1000)>Math.floor(before/1000))return 'coroa';
  if(Math.floor(after/100)>Math.floor(before/100))return 'diamante';
  if(Math.floor(after/10)>Math.floor(before/10))return 'safira';
  return null;
}
/* ---------- consentimento (LGPD Art. 14) — escopo (a): completo client-side, local-only ----------
   Registro append-only de consentimento do responsavel; consent_status da crianca deriva do ultimo registro.
   Sem backend/e-mail: evidencia carimba data ISO + user_agent (sem IP; nao ha servidor p/ ip_hash). */
var TERMS_VERSION='2026-07-08';
var CONSENT_SCOPES=['progresso_pedagogico','telemetria_uso'];
function recordConsent(S,action,scope,ua){
  if(!Array.isArray(S.consents))S.consents=[];
  var rec={consent_id:genId('con'),guardian_id:(S.guardian&&S.guardian.guardian_id)||null,
    child_id:S.child.child_id,action:action,
    scope:Array.isArray(scope)?scope.slice():CONSENT_SCOPES.slice(),
    terms_version:TERMS_VERSION,method:'painel',
    evidence:{at:new Date().toISOString(),user_agent:ua||null},created_at:Date.now()};
  S.consents.push(rec);
  S.child.consent_status=(action==='withdraw')?'withdrawn':'granted';
  return rec;
}
function hasConsent(S){return !!(S&&S.child&&S.child.consent_status==='granted');}
function currentConsent(S){
  if(!S||!Array.isArray(S.consents)||!S.consents.length)return null;
  var cid=S.child.child_id;
  for(var i=S.consents.length-1;i>=0;i--)if(S.consents[i].child_id===cid)return S.consents[i];
  return null;
}
function exportData(S){
  var cid=S.child.child_id, mastery={};
  Object.keys(S.mastery||{}).forEach(function(k){if(k.indexOf(cid+'::')===0)mastery[k]=S.mastery[k];});
  return {_schema:'wanwan-export/v1',exported_at:new Date().toISOString(),terms_version:TERMS_VERSION,
    guardian:S.guardian,child:S.child,
    consents:(S.consents||[]).filter(function(c){return c.child_id===cid;}),
    mastery:mastery,
    attempts:(S.attempts||[]).filter(function(a){return a.child_id===cid;}),
    sessions:(S.sessions||[]).filter(function(s){return s.child_id===cid;}),
    placement:S.placement,stars:S.stars,selos:S.selos,collection:S.collection};
}
const api={init,newState,migrateState,addChild,setActiveChild,mastery,computeEE,recordAttempt,levelCandidate,confidence,confidenceCore,decayed,n4Confirmed,confirmSeededAncestors,entryIndex,unstable,AR,pruneWindow,pruneAttempts,
  evaluateTreasures,collectionStatus,rarityForChapter,chapterComplete,taleOf,treasureChapter,
  coveredFormats,unlocked,axisProgress,buildMission,focusSkill,pickItem,playableOrder,
  nextPlacementItem,recordPlacement,placementAxis,sessionAxisGroups,markReviews,scheduleReview,sessionStars,rewardTiers,tierCrossed,
  prereqsOf,LEVELS,FORMATS,P,li,
  recordConsent,hasConsent,currentConsent,exportData,TERMS_VERSION,CONSENT_SCOPES,
  skills:()=>D.skills,items:()=>D.items,skillById:id=>skillById[id],itemsBySkill:id=>itemsBySkill[id]||[],
  playable:()=>PLAYABLE,axisSkills:id=>axisSkills[id]||[]};
if(typeof module!=='undefined'&&module.exports)module.exports=api;
root.Wanwan=api;
})(typeof window!=='undefined'?window:globalThis);
