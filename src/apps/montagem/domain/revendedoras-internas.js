// Sorelly Admin — domain/revendedoras-internas.js
// Kits → Atendimento interno → Revendedoras internas. Controle das revendedoras que acertam na própria Sorelly:
// ciclo de acerto (30/45/60 dias), próxima data, agendamento (feito pela agendadora) e mensagens prontas.
// A data do próximo acerto = último acerto + ciclo, a não ser que alguém digite uma data à mão (proximoManual).

var CICLOS = [30, 45, 60];
var SITUACOES = [
  {k:"contatar", t:"A contatar", cor:"bg-muted/60 text-foreground ring-border"},
  {k:"contato", t:"Entrei em contato", cor:"bg-info/15 text-info ring-info/40"},
  {k:"agendada", t:"Agendada", cor:"bg-primary/20 text-primary ring-primary/40"},
  {k:"confirmada", t:"Confirmada na véspera", cor:"bg-success/15 text-success ring-success/40"},
  {k:"lembrete", t:"Lembrete enviado", cor:"bg-success/25 text-success ring-success/50"}
];
var DIAS_ALERTA = 5;   // até 5 dias do vencimento sem contato = linha em alerta

function parteData(iso){ var p = iso.split("-"); return new Date(+p[0], +p[1]-1, +p[2]); }
function isoDe(d){ return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0"); }
function somaDias(iso, n){ var d = parteData(iso); d.setDate(d.getDate()+n); return isoDe(d); }
function diasEntre(deIso, ateIso){ return Math.round((parteData(ateIso).getTime() - parteData(deIso).getTime())/86400000); }
function fmtDataBR(iso){ return iso ? iso.split("-").reverse().join("/") : ""; }

function proximoAcerto(r){ return r.proximoManual || somaDias(r.hist[0].data, r.ciclo); }
function emAlerta(r, hojeIso){ return r.situacao==="contatar" && diasEntre(hojeIso, proximoAcerto(r)) <= DIAS_ALERTA; }
function primeiroNome(nome){ var p = (nome||"").trim().split(/\s+/)[0] || ""; return p.charAt(0).toUpperCase()+p.slice(1).toLowerCase(); }

// Textos prontos (a agendadora só copia e cola no WhatsApp)
function mensagens(r, hojeIso){
  var nome = primeiroNome(r.nome), venc = fmtDataBR(proximoAcerto(r));
  var ag = r.agend || {}, dataAg = fmtDataBR(ag.data), hora = ag.hora || "";
  return [
    {k:"contato", t:"1º contato (até 5 dias antes)", x:"Olá, "+nome+"! Tudo bem? Aqui é da Sorelly Joias. O seu acerto vence em "+venc+". Vamos agendar o seu atendimento? Me diga qual dia e horário ficam melhores para você."},
    {k:"vespera", t:"Confirmação na véspera", x:"Olá, "+nome+"! Passando para confirmar o seu acerto amanhã"+(dataAg ? ", "+dataAg : "")+(hora ? ", às "+hora : "")+", aqui na Sorelly Joias. Posso confirmar o seu horário?"},
    {k:"dia", t:"Lembrete do dia", x:"Bom dia, "+nome+"! Lembrete: o seu acerto é hoje"+(hora ? ", às "+hora : "")+", aqui na Sorelly Joias. Te esperamos!"}
  ];
}

// 8 revendedoras internas (lista passada pelo Marcus em 06/10/2026). Vendas/acertos dos meses anteriores são simulados.
var BASE = [
  ["MARIA LUYSA CANDIDO OTTOMAIER", 3081.00, 1905.00, "2026-10-05", 30, false],
  ["LARYSSA FLAVIA SOARES ANDRADE", 308.00, 261.80, "2026-10-05", 30, false],
  ["VITORIA ADAMSKI FARIA DA SILVA", 1755.80, 1094.60, "2026-10-05", 45, false],
  ["LAIS GUEDIN RODRIGUES DE MELO", 2795.40, 1469.50, "2026-10-02", 60, false],
  ["KATIA REGINA DA ROCHA SANTOS", 937.40, 674.00, "2026-10-02", 30, false],
  ["EDUARDA CRISTINE PORTELLA", 3526.00, 2175.60, "2026-10-03", 30, true],
  ["BRUNA MAYARA BARBOZA DE CARVALHO", 2230.80, 1421.60, "2026-09-11", 30, false],
  ["KETLYN LACERDAS DA LUZ", 5836.00, 3111.25, "2026-09-02", 30, true]
];
var FATOR = [[0.88, 0.91], [1.12, 1.07]];          // mês anterior e o outro mês, em relação ao último (só demonstração)
var PARENTES = ["Mãe","Irmã","Marido","Amiga","Filha","Cunhada","Pai","Prima"];
function revInternasDemo(){
  return BASE.map(function(b, i){
    var hist = [{data:b[3], venda:b[1], acerto:b[2]}];
    for(var m=0;m<2;m++) hist.push({data:somaDias(b[3], -b[4]*(m+1)), venda:Math.round(b[1]*FATOR[m][(i+m)%2]*100)/100, acerto:Math.round(b[2]*FATOR[m][(i+m+1)%2]*100)/100});
    var fone = function(q){ return "(41) 9"+String(8100+i*131+q*47).slice(0,4)+"-"+String(2000+i*377+q*91).slice(-4); };
    var r = {id:"RI"+(i+1), nome:b[0], ciclo:b[4], proximoManual:null, situacao:"contatar", agend:null, hist:hist,
      contatos:[{nome:PARENTES[i%8], fone:fone(0)}, {nome:PARENTES[(i+3)%8], fone:fone(1)}], prata:b[5]};
    return r;
  }).map(function(r){
    if(r.nome.indexOf("EDUARDA")===0){ r.situacao = "agendada"; r.agend = {data:"2026-11-02", hora:"15:00"}; }
    if(r.nome.indexOf("KATIA")===0){ r.situacao = "contato"; }
    return r;
  });
}

// Item da agenda da Atendimento Sorelly criado a partir de uma agendada (a condicional vem da DevMaster; aqui é inventada para testar a calculadora)
function internoDeAgendada(r, versaoId, agora, extra){
  var n = r.id.replace("RI","");
  var venda = (r.hist[1] && r.hist[1].venda) || (r.hist[0] && r.hist[0].venda) || 1500;
  return Object.assign({id:"I"+agora+n, nome:r.nome, fone:(r.contatos[0]||{}).fone||"", devmaster:"", data:r.agend.data, hora:r.agend.hora,
    condicionais:[{numero:String(90000+Number(n)*173), valor:Math.round(venda*1.35/10)*10, pecas:30+Number(n)*3}], obs:"Agendada em Revendedoras internas", remarcacoesLista:[],
    status:"agendado", regrasVersaoId:versaoId||null, criadoPor:"Agendamento", criadoEm:agora, vendaApp:0, vendaFonte:"app_revendedora",
    vendasAnt:[r.hist[1] && r.hist[1].venda, r.hist[2] && r.hist[2].venda].filter(function(v){ return v>0; }), revIntId:r.id}, extra||{});
}
// 4 atendimentos já marcados para hoje (pedido do Marcus: poder testar a Atendimento Sorelly e a calculadora)
var HOJE_DEMO = [["KETLYN","09:30"],["BRUNA","11:00"],["KATIA","13:30"],["MARIA LUYSA","15:00"]];
function agendaHojeDemo(lista, hojeIso, versaoId, agora){
  var itens = [];
  HOJE_DEMO.forEach(function(h, i){
    var r = lista.find(function(x){ return x.nome.indexOf(h[0])===0; }); if(!r) return;
    r.agend = {data:hojeIso, hora:h[1]}; r.situacao = "agendada";
    var it = internoDeAgendada(r, versaoId, agora+i, {demoHoje:true}); r.internoId = it.id; itens.push(it);
  });
  return itens;
}

export { internoDeAgendada, agendaHojeDemo, CICLOS, SITUACOES, DIAS_ALERTA, parteData, isoDe, somaDias, diasEntre, fmtDataBR, proximoAcerto, emAlerta, primeiroNome, mensagens, revInternasDemo };
