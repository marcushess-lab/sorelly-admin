// Sorelly Admin · montagem e bipagem — state/store.js
// Extraído de sorelly_admin_montagem_bipagem.html sem alterar o corpo das funções.
import { CFG0 } from "@/apps/montagem/domain/config";
import { MONTADORAS, SUPERVISORA, nomeDe } from "@/apps/montagem/domain/equipe";
import { NOVAS0, RECUSAS0, VIRADA0, avalRepDemo } from "@/apps/montagem/domain/representantes";
import { HISTORICO0, REGISTROS0, histDemo, novoDia } from "@/apps/montagem/domain/seed";
import { CONTAS_PAGAR_DEMO, CONTAS_PAGAS_DIARIO_DEMO, FATURAMENTO_DIARIO_DEMO, META_MENSAL_DEMO, VENDIDO_PONTA_DEMO } from "@/apps/montagem/domain/financeiro";
import { REVENDEDORAS_DIARIO_DEMO } from "@/apps/montagem/domain/revendedoras-diario";
import { media3 } from "@/apps/montagem/domain/vendas";
import { hoje, hora } from "@/apps/montagem/lib/format";

var CHAVE = "sorelly_montagem_v9"; // v4: tipos de item, condicionais, kit novo e retirada pelo app
function novo(){
  var d = novoDia();
  return {v:4, cfg:JSON.parse(JSON.stringify(CFG0)), montadoras:JSON.parse(JSON.stringify(MONTADORAS)),
    listagens:d.listagens, kits:d.kits, registros:REGISTROS0.slice(), historico:HISTORICO0.slice(), histListagens:histDemo(), histV:2, novas:JSON.parse(JSON.stringify(NOVAS0)), retPend:[],
    avalRep:avalRepDemo(), recusas:RECUSAS0.slice(), virada:JSON.parse(JSON.stringify(VIRADA0)), bloqueioNovas:{Jessica:true},
    contasPagar:JSON.parse(JSON.stringify(CONTAS_PAGAR_DEMO)), verFinanceiro:"total",
    faturamentoDiario:JSON.parse(JSON.stringify(FATURAMENTO_DIARIO_DEMO)), metaMensal:JSON.parse(JSON.stringify(META_MENSAL_DEMO)),
    revendedorasDiario:JSON.parse(JSON.stringify(REVENDEDORAS_DIARIO_DEMO)), vendidoPonta:JSON.parse(JSON.stringify(VENDIDO_PONTA_DEMO)),
    contasPagasDiario:JSON.parse(JSON.stringify(CONTAS_PAGAS_DIARIO_DEMO)),
    mesFechado:null, visao:"supervisao", bipadora:9, usuario:11, aba:"painel", celular:1, telaCel:"proximo",
    abertas:{L1:true, L2:true, L3:false, L4:false}, kitAberto:null, extrato:null, filtroReg:"todas", aviso:null};
}
function inicial(){
  try { var j = localStorage.getItem(CHAVE); if(j){ var s = JSON.parse(j); if(s && s.v===4){ s.aviso=null;
    // campos novos da configuração entram com o padrão em dados já salvos
    ["tabelaAtiva","tabelaKitBaixo","minVendaApp","limiteMelhores","categorias","pecasKit","pecasSugCat","reposicaoMax","limiteMarcus","limiteAnaliseVendas","comissoesRev"].forEach(function(f){ if(s.cfg[f]===undefined) s.cfg[f] = JSON.parse(JSON.stringify(CFG0[f])); });
    ["valorBipNormal","valorBipEspecial","limiteBipEspecial","perdaFalta"].forEach(function(f){ if(s.cfg[f]===undefined) s.cfg[f] = CFG0[f]; });
    // histórico antigo (sem data completa e sem kits) é trocado pela demonstração nova; o que foi concluído de verdade fica
    // histórico de demonstração v2 (4 a 5 listagens por representante); o que foi concluído de verdade hoje fica
    if(s.histV!==2){ s.histListagens = (s.histListagens||[]).filter(function(h){return h.hoje && h.lid;}).concat(histDemo()); s.histV = 2; }
    if(s.cfg.prazoPedidoHoras===undefined) s.cfg.prazoPedidoHoras = 48;
    ["bonusNotaMin","bonusValor","perdaRecusa","recusasBloqueio","perdaDiaParado","diasParadosTolerancia"].forEach(function(f){ if(s.cfg[f]===undefined) s.cfg[f] = CFG0[f]; });
    if(!s.avalRep){ s.avalRep = avalRepDemo(); s.recusas = RECUSAS0.slice(); s.virada = JSON.parse(JSON.stringify(VIRADA0)); s.bloqueioNovas = {Jessica:true}; }
    if(!s.contasPagar){ s.contasPagar = JSON.parse(JSON.stringify(CONTAS_PAGAR_DEMO)); s.verFinanceiro = "total"; }
    if(!s.faturamentoDiario) s.faturamentoDiario = JSON.parse(JSON.stringify(FATURAMENTO_DIARIO_DEMO));
    if(!s.revendedorasDiario) s.revendedorasDiario = JSON.parse(JSON.stringify(REVENDEDORAS_DIARIO_DEMO));
    if(!s.vendidoPonta) s.vendidoPonta = JSON.parse(JSON.stringify(VENDIDO_PONTA_DEMO));
    if(!s.metaMensal) s.metaMensal = JSON.parse(JSON.stringify(META_MENSAL_DEMO));
    if(!s.contasPagasDiario) s.contasPagasDiario = JSON.parse(JSON.stringify(CONTAS_PAGAS_DIARIO_DEMO));
    if(!s.usuario) s.usuario = SUPERVISORA.id;
    if(s.aba==="comissoes") s.aba = "equipe";
    s.visao = "supervisao";
    return s; } } } catch(x){}
  return novo();
}
function mapKit(s, id, fn){ return s.kits.map(function(k){ return k.id===id ? Object.assign({},k,fn(k)) : k; }); }
function com(s, patch, txt, tom){ var n = Object.assign({}, s, patch); if(txt) n.aviso = {txt:txt, tom:tom||"ok", t:Date.now()}; return n; }
function kitDe(s,id){ return s.kits.find(function(k){return k.id===id;}); }
function ajustaDiv(s, montId, delta){
  return s.montadoras.map(function(m){ return m.id!==montId ? m :
    Object.assign({}, m, {mes:Object.assign({}, m.mes, {div:Math.max(0, m.mes.div+delta)})}); });
}
function registroListagem(l, kits, agora){
  var ks = kits.filter(function(k){return k.lid===l.id;});
  return {id:l.id+"-"+agora, lid:l.id, hoje:true, ts:agora, data:new Date(agora).toLocaleDateString("pt-BR"), rep:l.rep, destino:l.destino, viagem:l.viagem,
    horario:l.horario, concluida:hora(agora), qtd:ks.length, total:ks.reduce(function(t,k){return t+(k.valor||0);},0),
    divs:ks.filter(function(k){return k.divReg;}).length, retiradas:l.retiradas.length+1,
    atrasados:ks.filter(function(k){return k.atrasado;}).length,
    kits:ks.map(function(k){ return {rev:k.rev, prio:k.prio, valor:k.valor, real:k.valorReal, div:k.divReg, atrasado:k.atrasado,
      media: k.vendas && k.vendas.length ? media3(k.vendas) : null, tipoKit:k.tipoKit, cond:k.cond, aval:k.aval, confRev:k.confRev||null,
      mont:nomeDe(k.montId), tempoM:k.tempoM, fimM:hora(k.fimM), bip:nomeDe(k.bipId), tempoB:k.fimB&&k.iniB?k.fimB-k.iniB:null, fimB:hora(k.fimB), ret:hora(k.retEm)}; })};
}

export { CHAVE, novo, inicial, mapKit, com, kitDe, ajustaDiv, registroListagem };
