// Sorelly Admin · montagem e bipagem — mobile/representante.js
// Extraído de sorelly_admin_montagem_bipagem.html sem alterar o corpo das funções.
import { codigoRetirada } from "@/apps/montagem/components/dialogos";
import { ETAPA } from "@/apps/montagem/components/fila";
import { KitsNovosRep, foraDoPrazo } from "@/apps/montagem/components/kits-novos-rep";
import { nomeDe } from "@/apps/montagem/domain/equipe";
import { SEM_KIT, STATUS_LB, STATUS_TP, TIPO_KIT } from "@/apps/montagem/domain/status";
import { comissaoRev } from "@/apps/montagem/domain/vendas";
import { BK, N1, hoje, hora } from "@/apps/montagem/lib/format";
import { IPhone15 } from "@/apps/montagem/mobile/iphone";
import { RecebimentoRep } from "@/apps/montagem/mobile/revendedora";
import { Avatar, PONTO_CEL } from "@/apps/montagem/mobile/theme";
import { use } from "@/apps/montagem/state/context";
import { Icon } from "@/apps/montagem/ui/icon";
import { MONO } from "@/apps/montagem/ui/input";
import { e, useState } from "@/shared/react";
import React from "react";

var MESES_ABR = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];
function mesesApp(){ var h = new Date(), r = []; for(var i=0;i<3;i++){ r.push(MESES_ABR[new Date(h.getFullYear(), h.getMonth()-i, 1).getMonth()]); } return r; } // [atual, anterior, retrasado] = índices de k.vendas
var PCT_REVENDEDORA = 0.30, PCT_REPRESENTANTE = 0.10;   // provisórios: comissão da revendedora (desconta do acerto) e da representante
var CARTEIRA_DEMO = {Dayanne:[
  {rev:"Luciana Prado", fone:"(41) 99812-4410", bairro:"Tatuquara", vendas:[4200,3800,5100], cond:9000, dias:1, hora:"14:00"},
  {rev:"Gisele Martins", fone:"(41) 98877-2031", bairro:"Pinheirinho", vendas:[6100,5400,4900], cond:12000, dias:2, hora:"10:30"},
  {rev:"Rafaela Costa", fone:"(41) 99650-7718", bairro:"Sítio Cercado", vendas:[0,0,0], cond:7000, dias:3, hora:"15:30"},
  {rev:"Tânia Mello", fone:"(41) 98421-9964", bairro:"Capão Raso", vendas:[2300,2900,1800], cond:6000, dias:5, hora:"09:00"},
  {rev:"Joice Andrade", fone:"(41) 99133-5520", bairro:"Tatuquara", vendas:[8800,7600,9200], cond:15000, dias:7, hora:"16:00"}]};
var REF_NOMES = ["Maria Aparecida","João Carlos","Rosângela Silva","Marcos Paulo","Cleusa Pereira","Adriana Santos","Sueli Ramos","Edson Luiz"];
var REF_REL = ["Mãe","Irmã","Vizinha","Esposo","Amiga","Prima","Tia","Cunhado"];
function refsDe(nome){ var h = 0; for(var i=0;i<nome.length;i++) h = (h*31 + nome.charCodeAt(i)) % 9973;
  return [0,1,2].slice(0, 2 + h%2).map(function(j){ var x = (h + j*7) % REF_NOMES.length;
    return {nome:REF_NOMES[x], rel:REF_REL[(h + j*3) % REF_REL.length], fone:"(41) 9"+String(8100 + (h*(j+3))%1800)+"-"+String(1000 + (h*(j+5))%9000).slice(-4)}; }); }
function carteiraRep(s, rep){
  var dm = function(dt){ return dt.toLocaleDateString("pt-BR",{day:"2-digit", month:"2-digit"}); };
  var lids = s.listagens.filter(function(x){return x.rep===rep;}).map(function(x){return x.id;});
  var hojeK = s.kits.filter(function(k){return lids.indexOf(k.lid)>=0;}).map(function(k){
    return {id:k.id, rev:k.rev, fone:k.fone||"", bairro:k.bairro, vendas:k.vendas||[], cond:k.valor, hora:k.horaAtend, hoje:true, data:dm(new Date()), nova:(k.tipoKit||"").indexOf("kit_novo")===0, tipoKit:k.tipoKit, status:k.status, lid:k.lid}; });
  return hojeK.concat((CARTEIRA_DEMO[rep]||[]).map(function(c,i){ var dt = new Date(); dt.setDate(dt.getDate()+c.dias);
    return Object.assign({id:"C"+i, hoje:false, data:dm(dt)}, c); }));
}
function AppRepresentante(p){
  var cx = use(), s = cx.state, d = cx.dispatch, l = p.l;
  var tb = useState("inicio"), tela = tb[0], setTela = tb[1];
  var ms = useState(0), mes = ms[0], setMes = ms[1];
  var bs = useState(""), busca = bs[0], setBusca = bs[1];
  var cop = useState(null), copiada = cop[0], setCopiada = cop[1];
  var ind = useState(["Priscila Moura","Ketlin Souza"]), indicadas = ind[0], setIndicadas = ind[1];
  var ni = useState(""), novaInd = ni[0], setNovaInd = ni[1];
  var sr = useState(null), selId = sr[0], setSel = sr[1];
  var lsel = useState(l.id), lidPed = lsel[0], setLidPed = lsel[1];
  var meses = mesesApp(), cart = carteiraRep(s, l.rep);
  var vendMes = function(r, i){ return r.vendas[i===undefined?mes:i] || 0; };
  var totMes = function(i){ return cart.reduce(function(t,r){return t+vendMes(r,i);},0); };
  var tot = totMes(mes);
  var BR = "txt-branco";
  var pd = useState({abrir:false, rev:""}), ped = pd[0], setPed = pd[1];
  var av = useState({}), notas = av[0], setNotas = av[1];
  var ks = s.kits.filter(function(k){return k.lid===l.id;}).sort(function(a,b){ return ETAPA[a.status]-ETAPA[b.status] || a.ordem-b.ordem; });
  var bip = ks.filter(function(k){return k.status==="bipado";}), ret = ks.filter(function(k){return k.status==="retirado";});
  var ouro = "bg-[#C9A13B] "+BR;
  var nAval = ret.filter(function(k){return !k.aval;}).length, nNovos = (s.novas||[]).filter(function(n){return n.rep===l.rep && n.status==="direcionada";}).length;
  var MENU = [["revs","Revendedoras","users","#2563EB", cart.length+" na carteira"], ["listagem","Listagem de kits","lista","#C9A13B", ks.length+" kits hoje"],
    ["agenda","Agendamento","calendario","#7C3AED","horários de atendimento"], ["retirada","Retirada","caixa","#16A34A", bip.length+" prontos"],
    ["avaliar","Avaliar kits","star","#EA580C", nAval ? nAval+" para avaliar" : "tudo avaliado"], ["novos","Kits novos","novas","#DB2777", nNovos ? nNovos+" direcionadas" : "revendedoras novas"],
    ["desempenho","Desempenho","grafico","#0891B2","vendas dos 3 meses"], ["msgs","Mensagens prontas","whats","#15803D","copiar e enviar"],
    ["indique","Indique & Ganhe","presente","#B45309","ganhe coins"]];
  var TITULO = {rev:"Revendedora"}; MENU.forEach(function(m){ TITULO[m[0]] = m[1]; });
  var minhasL = s.listagens.filter(function(x){return x.rep===l.rep && !x.fechada;});
  var voltar = e("div",{className:"flex items-center gap-2"},
    e("button",{onClick:function(){setTela("inicio");}, className:"flex h-8 items-center gap-1 rounded-full bg-[#1C1C1E] px-3 text-[12px] font-semibold text-amber-200"}, "‹ Início"),
    e("b",{className:"text-[16px]"}, TITULO[tela]));
  var pill = function(txt, cor){ return e("span",{className:"shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-bold "+BR, style:{background:cor}}, txt); };
  var col = function(lb, v, cor){ return e("div",null, e("p",{className:"text-[10px] font-bold tracking-wide text-[#8E8E93]"}, lb), e("p",{className:MONO+" text-[14px] font-bold", style:cor?{color:cor}:null}, v)); };
  var cartao = function(r, aberto){
    var ativa = r.vendas.some(function(v){return v>0;}), vd = vendMes(r);
    return e("button",{key:r.id, onClick:function(){ setSel(r.id); setTela("rev"); }, className:"block w-full overflow-hidden rounded-2xl bg-[#1C1C1E] text-left shadow-sm transition-transform active:scale-[.99]"},
      e("div",{className:"flex items-start justify-between gap-2 px-3 pt-3"},
        e("div",{className:"min-w-0"}, e("b",{className:"block truncate text-[15px]"}, r.rev), e("span",{className:"text-[12px] text-[#8E8E93]"}, r.fone+(r.bairro?" · "+r.bairro:""))),
        r.nova ? pill("Nova","#7C3AED") : ativa ? pill("Ativa","#16A34A") : pill("Sem vendas","#DC2626")),
      e("div",{className:"mx-3 mt-2 flex items-center justify-between rounded-lg px-2.5 py-1.5 text-[12px] font-semibold "+BR, style:{background: r.hoje ? "#2563EB" : "#64748B"}},
        e("span",null, r.hoje ? "Acerto hoje" : "Próximo acerto"), e("span",null, r.data+(r.hora ? " · "+r.hora : ""))),
      e("div",{className:"grid grid-cols-3 px-1 py-2.5 text-center"},
        col("VENDIDO", BK(vd), "#15803D"), col("ACERTO", BK(Math.round(vd*(1-((comissaoRev(vd, s.cfg)||{pct:0}).pct/100)))), "#2563EB"), col("CONDICIONAL", r.cond ? BK(r.cond) : "—", "#A67C12")),
      !aberto && e("p",{className:"border-t border-white/5 py-1.5 text-center text-[11.5px] font-semibold text-sky-300"}, "Ver contatos e opções ›"));
  };
  // Revendedora aberta: contatos de referência e pedidos (kit, reposição, saiu = só retirar a condicional)
  var sel = cart.find(function(r){return r.id===selId;});
  var lPed = minhasL.find(function(x){return x.id===lidPed;}) || minhasL[0];
  var pedir = function(tipo){ if(!lPed || !sel) return;
    var conds = SEM_KIT[tipo] ? [String(13000 + sel.rev.length*97 + sel.rev.charCodeAt(0)).padStart(6,"0")] : [];
    d({type:"ADD_KIT", lid:lPed.id, rev:sel.rev, bairro:sel.bairro||"", vendas: tipo==="reposicao" ? [] : sel.vendas, prio:false, atrasado:foraDoPrazo(lPed, s), tipoKit:tipo, conds:conds, fone:sel.fone, hora:sel.hora||null, porApp:true});
    setTela("listagem"); };
  var telaRev = sel && e("div",{className:"flex flex-col gap-2.5"},
    cartao(sel, true),
    e("div",{className:"rounded-2xl bg-[#1C1C1E] p-3"},
      e("p",{className:"mb-2 text-[12px] font-bold uppercase tracking-wide text-[#8E8E93]"},"Contatos de referência"),
      refsDe(sel.rev).map(function(c,i){ return e("div",{key:i, className:"flex items-center gap-2 border-b border-white/5 py-2 last:border-0"},
        e("span",{className:"grid size-9 shrink-0 place-items-center rounded-full text-[13px] font-bold "+BR, style:{background:["#2563EB","#7C3AED","#0891B2"][i]}}, c.nome.charAt(0)),
        e("div",{className:"min-w-0 flex-1"}, e("b",{className:"block truncate text-[13.5px]"}, c.nome), e("span",{className:"text-[12px] text-[#8E8E93]"}, c.rel+" · "+c.fone)),
        e("a",{href:"tel:"+c.fone.replace(/\D/g,""), className:"rounded-lg px-2.5 py-1.5 text-[12px] font-bold "+BR, style:{background:"#16A34A"}}, "Ligar")); })),
    sel.hoje
      ? e("div",{className:"rounded-2xl bg-[#1C1C1E] p-3 text-[13px]"}, e("b",null, "Está na listagem de hoje"), e("p",{className:"text-[12px] text-[#8E8E93]"}, (TIPO_KIT[sel.tipoKit]||TIPO_KIT.acerto_kit)[0]+" · "+(STATUS_LB[sel.status]||"")))
      : e("div",{className:"flex flex-col gap-2 rounded-2xl bg-[#1C1C1E] p-3"},
          e("p",{className:"text-[12px] font-bold uppercase tracking-wide text-[#8E8E93]"},"Colocar numa listagem"),
          minhasL.length===0 ? e("p",{className:"text-[13px] text-[#8E8E93]"},"Nenhuma listagem aberta.") : e(React.Fragment,null,
            e("select",{value:lPed.id, onChange:function(ev){setLidPed(ev.target.value);}, "aria-label":"Listagem", className:"h-10 rounded-xl px-3 text-sm font-semibold outline-none ring-1 ring-white/10"},
              minhasL.map(function(x){ return e("option",{key:x.id, value:x.id}, "Retirada "+x.horario+" · "+x.destino); })),
            foraDoPrazo(lPed, s) && e("p",{className:"text-[12px] text-amber-200"},"Menos de "+s.cfg.prazoPedidoHoras+" h para a retirada: entra como atrasado."),
            e("button",{onClick:function(){pedir("acerto_kit");}, className:"h-10 rounded-xl text-[13px] font-bold "+ouro},"Acerto + kit"),
            e("button",{onClick:function(){pedir("reposicao");}, className:"h-10 rounded-xl text-[13px] font-bold "+BR, style:{background:"#16A34A"}},"Só reposição (sem venda · até "+BK(s.cfg.reposicaoMax)+")"),
            e("button",{onClick:function(){pedir("saiu");}, className:"h-10 rounded-xl text-[13px] font-bold "+BR, style:{background:"#DC2626"}},"Saiu: só retirar a condicional"))));
  var MSGS = [["Lembrete de acerto","Oi {nome}! Seu acerto está marcado para hoje às {hora}. Separe as peças e o dinheiro das vendas, combinado?"],
    ["Kit pronto","Oi {nome}! Seu kit novo da Sorelly já está pronto. Te espero no horário combinado ({hora})."],
    ["Boas-vindas","Seja bem-vinda à Sorelly, {nome}! Qualquer dúvida sobre as peças ou o acerto, me chama aqui."],
    ["Sem vendas","Oi {nome}, tudo bem? Vi que o mês está mais parado. Quer ajuda com fotos das peças para divulgar?"]];
  var ponto = function(k){ return e("span",{className:"size-2 shrink-0 rounded-full "+PONTO_CEL[STATUS_TP[k.status]]}); };
  var estrelas = function(k){ var n = (notas[k.id]||{}).nota || 0;
    return e("div",{className:"flex gap-0.5"}, [1,2,3,4,5].map(function(i){ return e("button",{key:i, "aria-label":i+" estrelas",
      onClick:function(){ var o = Object.assign({}, notas); o[k.id] = Object.assign({faltas:0}, o[k.id], {nota:i}); setNotas(o); },
      className:"text-lg leading-none "+(i<=n?"text-amber-300":"text-white/25")}, "★"); })); };
  var faltasDe = function(k){ return (notas[k.id]||{}).faltas || 0; };
  var mudaFalta = function(k, dlt){ var o = Object.assign({}, notas); var at = Object.assign({nota:0, faltas:0}, o[k.id]); at.faltas = Math.max(0, at.faltas+dlt); o[k.id] = at; setNotas(o); };
  var agenda = cart.filter(function(r){return r.hoje;}).sort(function(a,b){ return (a.hora||"99").localeCompare(b.hora||"99"); });
  var filtradas = cart.filter(function(r){ return !busca || r.rev.toLowerCase().indexOf(busca.toLowerCase())>=0; });
  var primeiro = function(n){ return n.split(" ")[0]; };
  return e(IPhone15,null,
    e("div",null,
      e("div",{className:"flex items-center gap-3"},
        e(Avatar,{nome:l.rep, i:0}),
        e("div",{className:"min-w-0 flex-1"}, e("p",{className:"text-[12px] text-[#8E8E93]"},"Olá, representante"), e("p",{className:"truncate text-xl font-bold"}, l.rep)),
        e("span",{className:"rounded-full bg-[#1C1C1E] px-2.5 py-1 text-[11px] font-semibold text-amber-200"}, "Retirada "+l.horario)),
      e("div",{className:"mt-3 flex gap-1.5"}, meses.map(function(m,i){ return e("button",{key:m, onClick:function(){setMes(i);},
        className:"flex-1 rounded-full py-1.5 text-[12px] font-bold "+(mes===i ? ouro : "bg-[#1C1C1E] text-[#8E8E93]")}, m+(i===0?" (atual)":"")); })),
      e("div",{className:"mt-2.5 grid grid-cols-2 gap-2"},
        e("div",{className:"rounded-xl bg-[#1C1C1E] px-3 py-2"}, e("p",{className:"text-[11px] text-[#8E8E93]"},"Total vendido"), e("p",{className:MONO+" text-lg font-bold"}, BK(tot))),
        e("div",{className:"rounded-xl bg-[#1C1C1E] px-3 py-2"}, e("p",{className:"text-[11px] text-[#8E8E93]"},"Comissão prevista"), e("p",{className:MONO+" text-lg font-bold text-amber-200"}, BK(tot*PCT_REPRESENTANTE))))),
    e(RecebimentoRep,{l:l}),
    tela!=="inicio" && e("div",{className:"mb-3"}, tela==="rev" ? e("div",{className:"flex items-center gap-2"},
      e("button",{onClick:function(){setTela("revs");}, className:"flex h-8 items-center gap-1 rounded-full bg-[#1C1C1E] px-3 text-[12px] font-semibold text-amber-200"}, "‹ Revendedoras"),
      e("b",{className:"text-[16px]"}, "Revendedora")) : voltar),
    tela==="inicio" && e("div",{className:"grid grid-cols-2 gap-2.5"}, MENU.map(function(m){
      return e("button",{key:m[0], onClick:function(){setTela(m[0]);}, className:"flex flex-col items-start gap-2 rounded-2xl bg-[#1C1C1E] p-3 text-left active:translate-y-px"+(m[0]==="indique"?" col-span-2 flex-row! items-center!":"")},
        e("span",{className:"grid size-11 place-items-center rounded-2xl "+BR, style:{background:m[3], boxShadow:"0 4px 10px "+m[3]+"55"}}, e(Icon,{n:m[2], s:22, peso:"fill"})),
        e("span",{className:"min-w-0"}, e("b",{className:"block text-[14px] leading-tight"}, m[1]), e("span",{className:"text-[11.5px] text-[#8E8E93]"}, m[4]))); })),
    tela==="revs" && e("div",{className:"flex flex-col gap-2.5"},
      e("input",{value:busca, onChange:function(ev){setBusca(ev.target.value);}, placeholder:"Buscar revendedora",
        className:"h-10 rounded-xl px-3 text-sm outline-none ring-1 ring-white/10 placeholder:text-[#8E8E93]"}),
      e("p",{className:"px-1 text-[12px] text-[#8E8E93]"}, filtradas.length+" revendedoras · valores de "+meses[mes]), filtradas.map(cartao)),
    tela==="agenda" && e("div",{className:"flex flex-col gap-2"},
      e("p",{className:"px-1 text-[12px] text-[#8E8E93]"},"Organize os atendimentos de hoje. O horário aparece na coluna Horário das Listagens da empresa."),
      e("div",{className:"overflow-hidden rounded-2xl bg-[#1C1C1E]"}, agenda.map(function(r){
        return e("div",{key:r.id, className:"flex items-center gap-2 border-b border-white/5 px-3 py-2 text-[13px] last:border-0"},
          e("input",{type:"time", value:r.hora||"", "aria-label":"Horário de "+r.rev, disabled:l.fechada, onChange:function(ev){ if(ev.target.value) d({type:"SET_HORA", id:r.id, hora:ev.target.value}); },
            className:"h-8 w-[5.5rem] rounded-lg px-1.5 text-center font-mono text-[13px] font-bold outline-none ring-1 ring-white/10"}),
          e("span",{className:"min-w-0 flex-1 truncate font-medium"}, r.rev),
          e("span",{className:"shrink-0 text-[11px] text-[#8E8E93]"}, r.fone)); })),
      e("p",{className:"px-1 pt-1 text-[12px] font-semibold"},"Próximos acertos"),
      e("div",{className:"overflow-hidden rounded-2xl bg-[#1C1C1E]"}, cart.filter(function(r){return !r.hoje;}).map(function(r){
        return e("div",{key:r.id, className:"flex items-center gap-2 border-b border-white/5 px-3 py-2 text-[13px] last:border-0"},
          e("b",{className:MONO+" w-[5.5rem] text-center text-violet-300"}, r.data+" "+r.hora), e("span",{className:"min-w-0 flex-1 truncate"}, r.rev)); }))),
    tela==="desempenho" && e("div",{className:"flex flex-col gap-2.5"},
      e("div",{className:"rounded-2xl bg-[#1C1C1E] p-3"},
        e("p",{className:"mb-2 text-[12px] font-semibold text-[#8E8E93]"},"Vendas da carteira"),
        (function(){ var mx = Math.max(1, totMes(0), totMes(1), totMes(2));
          return [2,1,0].map(function(i){ return e("div",{key:i, className:"mb-1.5 grid grid-cols-[2.5rem_1fr_5rem] items-center gap-2 text-[12px]"},
            e("b",null, meses[i]), e("div",{className:"h-3 overflow-hidden rounded-full bg-black/40"}, e("i",{className:"block h-full rounded-full", style:{width:(totMes(i)/mx*100)+"%", background:i===0?"#C9A13B":"#2563EB"}})),
            e("span",{className:MONO+" text-right font-semibold"}, BK(totMes(i)))); }); })()),
      e("div",{className:"grid grid-cols-3 gap-2"},
        [[cart.filter(function(r){return r.vendas.some(function(v){return v>0;});}).length, "ativas", "#16A34A"],
         [cart.filter(function(r){return !r.vendas.some(function(v){return v>0;});}).length, "sem vendas", "#DC2626"],
         [ks.filter(function(k){return k.aval;}).length ? N1(ks.filter(function(k){return k.aval;}).reduce(function(t,k){return t+k.aval.nota;},0)/ks.filter(function(k){return k.aval;}).length) : "—", "nota dos kits", "#C9A13B"]
        ].map(function(x,i){ return e("div",{key:i, className:"rounded-2xl p-2.5 text-center "+BR, style:{background:x[2]}}, e("p",{className:MONO+" text-lg font-bold"}, x[0]), e("p",{className:"text-[11px]"}, x[1])); }))),
    tela==="msgs" && e("div",{className:"flex flex-col gap-2"},
      e("p",{className:"px-1 text-[12px] text-[#8E8E93]"},"Toque em Copiar e cole no WhatsApp. {nome} e {hora} são trocados pela revendedora do próximo atendimento."),
      MSGS.map(function(m,i){ var r0 = agenda[0] || {rev:"revendedora", hora:""}, txt = m[1].replace("{nome}", primeiro(r0.rev)).replace("{hora}", r0.hora||"");
        return e("div",{key:i, className:"flex flex-col gap-2 rounded-2xl bg-[#1C1C1E] p-3"},
          e("b",{className:"text-[14px]"}, m[0]), e("p",{className:"text-[13px] text-[#8E8E93]"}, txt),
          e("button",{onClick:function(){ try{ navigator.clipboard.writeText(txt); }catch(err){} setCopiada(i); setTimeout(function(){setCopiada(null);}, 1800); },
            className:"h-8 self-end rounded-lg px-4 text-[12px] font-bold "+BR, style:{background: copiada===i ? "#15803D" : "#22C55E"}}, copiada===i ? "✓ Copiada" : "Copiar")); })),
    tela==="indique" && e("div",{className:"flex flex-col gap-2.5"},
      e("div",{className:"rounded-2xl p-4 text-center "+ouro},
        e("p",{className:"text-[12px] font-semibold"},"Seus coins"), e("p",{className:MONO+" text-3xl font-bold"}, (indicadas.length*100)+""),
        e("p",{className:"mt-1 text-[12px]"},"100 coins por indicação que vira revendedora. O setor Kit novo (Michele) acompanha no Kommo.")),
      e("div",{className:"flex gap-2"},
        e("input",{value:novaInd, onChange:function(ev){setNovaInd(ev.target.value);}, placeholder:"Nome de quem você indica",
          className:"h-10 min-w-0 flex-1 rounded-xl px-3 text-sm outline-none ring-1 ring-white/10 placeholder:text-[#8E8E93]"}),
        e("button",{disabled:!novaInd.trim(), onClick:function(){ setIndicadas(indicadas.concat([novaInd.trim()])); setNovaInd(""); }, className:"h-10 rounded-xl px-4 text-sm font-bold disabled:opacity-40 "+ouro},"Indicar")),
      e("div",{className:"overflow-hidden rounded-2xl bg-[#1C1C1E]"}, indicadas.map(function(n,i){ return e("div",{key:i, className:"flex items-center justify-between border-b border-white/5 px-3 py-2 text-[13px] last:border-0"},
        e("span",null, n), i<2 ? pill("+100 coins","#16A34A") : pill("Em análise","#64748B")); }))),
    tela==="rev" && telaRev,
    tela==="novos" && e(KitsNovosRep,{l:l}),
    tela==="listagem" && e("div",{className:"flex flex-col gap-2.5"},
      e("div",{className:"rounded-2xl p-3 "+ouro},
        e("p",{className:"text-[12px] font-semibold opacity-80"}, l.viagem ? "Viagem para "+l.destino : l.destino),
        e("p",{className:"text-lg font-bold"}, ks.length+" kits na listagem"),
        e("div",{className:"mt-1.5 flex h-1.5 overflow-hidden rounded-full bg-black/15"},
          e("i",{className:"block h-full bg-[#1B1409]", style:{width:(ret.length/Math.max(1,ks.length)*100)+"%"}}),
          e("i",{className:"block h-full bg-[#1B1409]/45", style:{width:(bip.length/Math.max(1,ks.length)*100)+"%"}})),
        e("p",{className:"mt-1 text-[12px] font-medium"}, bip.length+" prontos · "+ret.length+" retirados · "+(ks.length-bip.length-ret.length)+" em produção")),
      e("div",{className:"overflow-hidden rounded-2xl bg-[#1C1C1E]"}, ks.map(function(k){
        return e("div",{key:k.id, className:"flex items-center gap-2 border-b border-white/5 px-3 py-2 text-[13px] last:border-0"},
          ponto(k), e("span",{className:"min-w-0 flex-1 truncate"}, k.prio && e("span",{className:"text-amber-300"},"★ "), k.rev,
            k.tipoKit && k.tipoKit!=="acerto_kit" && e("span",{className:"ml-1 rounded px-1 text-[10px] font-semibold txt-branco", style:{background: k.tipoKit==="saiu" ? "#DC2626" : k.tipoKit==="reposicao" ? "#16A34A" : k.tipoKit==="condicional" ? "#D97706" : "#7C3AED"}}, (TIPO_KIT[k.tipoKit]||TIPO_KIT.acerto_kit)[1]),
            k.atrasado && e("span",{className:"ml-1 rounded bg-[#9A4A00] px-1 text-[10px] font-semibold text-white"},"atrasado")),
          e("span",{className:"shrink-0 text-[11px] text-[#8E8E93]"}, STATUS_LB[k.status])); })),
      ped.abrir
        ? e("div",{className:"flex flex-col gap-2 rounded-2xl bg-[#1C1C1E] p-3"},
            e("p",{className:"text-[12px] text-amber-200"},"Pedido com menos de "+s.cfg.prazoPedidoHoras+" h de antecedência: entra como atrasado."),
            e("input",{value:ped.rev, placeholder:"Nome da revendedora", onChange:function(ev){setPed({abrir:true, rev:ev.target.value});},
              className:"h-10 rounded-xl bg-black/50 px-3 text-sm text-white outline-none ring-1 ring-white/10 placeholder:text-[#8E8E93]"}),
            e("div",{className:"flex gap-2"},
              e("button",{disabled:!ped.rev.trim() || l.fechada, onClick:function(){ d({type:"ADD_KIT", lid:l.id, rev:ped.rev.trim(), bairro:"", vendas:[], prio:false, atrasado:true}); setPed({abrir:false, rev:""}); },
                className:"h-10 flex-1 rounded-xl text-sm font-semibold disabled:opacity-40 "+ouro},"Enviar pedido"),
              e("button",{onClick:function(){setPed({abrir:false, rev:""});}, className:"h-10 rounded-xl bg-white/10 px-4 text-sm font-semibold"},"Cancelar")))
        : e("button",{disabled:l.fechada, onClick:function(){setPed({abrir:true, rev:""});}, className:"h-11 rounded-2xl bg-white/10 text-sm font-semibold disabled:opacity-40"},"+ Pedir kit fora do prazo")),
    tela==="retirada" && e("div",{className:"flex flex-col gap-2.5"},
      e("div",{className:"flex flex-col items-center rounded-2xl p-4 text-center "+ouro},
        e("p",{className:"text-[12px] font-semibold opacity-80"},"Código de retirada"),
        e("p",{className:"font-mono text-4xl font-bold tracking-[.35em]"}, codigoRetirada(l)),
        e("p",{className:"mt-1 text-[12px]"},"Informe este código no balcão e assine na tela. No sistema real ele muda a cada retirada.")),
      e("p",{className:"px-1 text-[13px] font-semibold"}, bip.length ? bip.length+(bip.length>1?" kits prontos para retirar":" kit pronto para retirar") : "Nenhum kit pronto ainda"),
      bip.length>0 && e("div",{className:"overflow-hidden rounded-2xl bg-[#1C1C1E]"}, bip.map(function(k){ return e("div",{key:k.id, className:"flex items-center gap-2 border-b border-white/5 px-3 py-2 text-[13px] last:border-0"},
        ponto(k), e("span",{className:"flex-1 truncate"}, k.rev), e("span",{className:MONO+" text-amber-200"}, BK(k.valor))); })),
      l.retiradas.length>0 && e("div",{className:"rounded-2xl bg-[#1C1C1E] p-3"},
        e("p",{className:"mb-1 text-[12px] font-semibold text-[#8E8E93]"},"Comprovantes"),
        l.retiradas.map(function(r,i){ return e("p",{key:i, className:"text-[13px]"}, "✓ "+hora(r.em)+" · "+r.qtd+(r.qtd>1?" kits":" kit")+" · entregue por "+nomeDe(r.por)+(r.codigo?" · código e assinatura":"")); }))),
    tela==="avaliar" && e("div",{className:"flex flex-col gap-2.5"},
      e("p",{className:"px-1 text-[12px] text-[#8E8E93]"},"Avalie cada kit depois de conferir com a revendedora. Peça faltando desconta de quem bipou."),
      ret.length===0 ? e("div",{className:"rounded-2xl bg-[#1C1C1E] p-4 text-center text-[13px] text-[#8E8E93]"},"Nenhum kit retirado ainda.")
      : ret.map(function(k){
          if(k.aval) return e("div",{key:k.id, className:"flex items-center gap-2 rounded-2xl bg-[#1C1C1E] px-3 py-2.5 text-[13px]"},
            e("span",{className:"flex-1 truncate"}, k.rev), e("span",{className:"text-amber-300"}, "★".repeat(k.aval.nota)),
            k.aval.faltas>0 && e("span",{className:"text-[11px] text-rose-300"}, k.aval.faltas+" faltando"), e("span",{className:"text-[11px] text-emerald-300"},"enviada"));
          var nt = (notas[k.id]||{}).nota || 0;
          return e("div",{key:k.id, className:"flex flex-col gap-2 rounded-2xl bg-[#1C1C1E] p-3"},
            e("div",{className:"flex items-center justify-between gap-2"}, e("b",{className:"truncate text-[14px]"}, k.rev), estrelas(k)),
            e("div",{className:"flex items-center justify-between gap-2 text-[13px]"},
              e("span",{className:"text-[#8E8E93]"},"Peças faltando"),
              e("div",{className:"flex items-center gap-2"},
                e("button",{onClick:function(){mudaFalta(k,-1);}, className:"size-7 rounded-lg bg-white/10 font-bold"},"−"),
                e("b",{className:MONO+" w-5 text-center"}, faltasDe(k)),
                e("button",{onClick:function(){mudaFalta(k,1);}, className:"size-7 rounded-lg bg-white/10 font-bold"},"+"))),
            e("button",{disabled:!nt, onClick:function(){ d({type:"AVALIAR", id:k.id, nota:nt, faltas:faltasDe(k)}); },
              className:"h-9 rounded-xl text-[13px] font-semibold disabled:opacity-40 "+ouro},"Enviar avaliação"));
        })));
}

export { MESES_ABR, mesesApp, PCT_REVENDEDORA, CARTEIRA_DEMO, REF_NOMES, REF_REL, refsDe, carteiraRep, AppRepresentante };
