// Sorelly Admin · montagem e bipagem — mobile/representante.js
// Extraído de sorelly_admin_montagem_bipagem.html sem alterar o corpo das funções.
import { codigoRetirada } from "@/apps/montagem/components/dialogos";
import { ETAPA } from "@/apps/montagem/components/fila";
import { KitsNovosRep, foraDoPrazo } from "@/apps/montagem/components/kits-novos-rep";
import { calcularAcerto, versaoDoKit } from "@/apps/montagem/domain/consignado";
import { nomeDe } from "@/apps/montagem/domain/equipe";
import { capacidadeListagem, kitsNaListagem, listagemCheia } from "@/apps/montagem/domain/regras";
import { SEM_KIT, STATUS_LB, STATUS_TP, TIPO_KIT } from "@/apps/montagem/domain/status";
import { badge } from "@/apps/montagem/ui/badge";
import { comissaoRev, sugerido } from "@/apps/montagem/domain/vendas";
import { N1, hoje, hora, isoDia } from "@/apps/montagem/lib/format";
import { IPhone17ProMax } from "@/apps/montagem/mobile/iphone";
import { RecebimentoRep } from "@/apps/montagem/mobile/revendedora";
import { Avatar, PONTO_CEL } from "@/apps/montagem/mobile/theme";
import { use } from "@/apps/montagem/state/context";
import { Icon } from "@/apps/montagem/ui/icon";
import { MONO } from "@/apps/montagem/ui/input";
import { e, useState } from "@/shared/react";
import React from "react";

// Moeda com centavos (,00) sempre visíveis: usada só no app da representante — o BK() global (lib/format) fica arredondado pras outras telas do admin.
function BK(n){ return "R$ " + Number(n||0).toLocaleString("pt-BR",{minimumFractionDigits:2, maximumFractionDigits:2}); }
var MESES_ABR = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];
function mesesApp(){ var h = new Date(), r = []; for(var i=0;i<3;i++){ r.push(MESES_ABR[new Date(h.getFullYear(), h.getMonth()-i, 1).getMonth()]); } return r; } // [atual, anterior, retrasado] = índices de k.vendas
var PCT_REVENDEDORA = 0.30, PCT_REPRESENTANTE = 0.10;   // provisórios: comissão da revendedora (desconta do acerto) e da representante
// Base de demonstração fictícia: 20 revendedoras distribuídas entre as representantes existentes (Dayanne/Lysie em Curitiba,
// Jessica em São José dos Pinhais, Marcus Hess em Ponta Grossa). Telefones e endereços são placeholders, não correspondem a locais reais.
function revDemo(rev, fone, endereco, cidade, total, dias, hora){
  return {rev:rev, fone:fone, bairro:endereco, cidade:cidade, vendas:[total, Math.round(total*0.92/10)*10, Math.round(total*0.85/10)*10], cond:Math.round(total*3/500)*500, dias:dias, hora:hora};
}
var CARTEIRA_DEMO = {
  Dayanne:[
    revDemo("Amanda Ribeiro","(41) 00000-0001","Avenida Nossa Senhora da Luz, 725 - Jardim Social, Curitiba - PR","Curitiba/PR",2500,1,"09:00"),
    revDemo("Daniela Moreira","(41) 00000-0004","Avenida Brasil, 1480 - Eucaliptos, Fazenda Rio Grande - PR","Curitiba/PR",1900,4,null)],
  Lysie:[
    revDemo("Fernanda Azevedo","(41) 00000-0006","Rua Fictícia C, 206","Curitiba/PR",1700,1,"09:30"),
    revDemo("Gabriela Mendes","(41) 00000-0007","Rua Fictícia D, 107","Curitiba/PR",1600,2,"10:30")],
  Jessica:[
    revDemo("Larissa Almeida","(41) 00000-0011","Rua Fictícia F, 111","São José dos Pinhais/PR",2200,1,"09:00"),
    revDemo("Mariana Costa","(41) 00000-0012","Rua Fictícia F, 212","São José dos Pinhais/PR",1900,2,"10:15")],
  "Marcus Hess":[
    revDemo("Renata Cavalcanti","(42) 00000-0016","Rua Fictícia I, 116","Ponta Grossa/PR",2400,1,"09:00"),
    revDemo("Sabrina Lopes","(42) 00000-0017","Rua Fictícia I, 217","Ponta Grossa/PR",2000,2,"10:30"),
    revDemo("Tatiane Rocha","(42) 00000-0018","Rua Fictícia J, 118","Ponta Grossa/PR",1600,3,"12:00"),
    revDemo("Vanessa Pires","(42) 00000-0019","Rua Fictícia J, 219","Ponta Grossa/PR",1400,4,"14:00"),
    revDemo("Vitória Andrade","(42) 00000-0020","Rua Fictícia K, 120","Ponta Grossa/PR",1100,5,"15:30")]
};
var REF_NOMES = ["Maria Aparecida","João Carlos","Rosângela Silva","Marcos Paulo","Cleusa Pereira","Adriana Santos","Sueli Ramos","Edson Luiz"];
var REF_REL = ["Mãe","Irmã","Vizinha","Esposo","Amiga","Prima","Tia","Cunhado"];
function refsDe(nome){ var h = 0; for(var i=0;i<nome.length;i++) h = (h*31 + nome.charCodeAt(i)) % 9973;
  return [0,1,2].slice(0, 2 + h%2).map(function(j){ var x = (h + j*7) % REF_NOMES.length;
    return {nome:REF_NOMES[x], rel:REF_REL[(h + j*3) % REF_REL.length], fone:"(41) 9"+String(8100 + (h*(j+3))%1800)+"-"+String(1000 + (h*(j+5))%9000).slice(-4)}; }); }
function carteiraRep(s, rep){
  var dm = function(dt){ return dt.toLocaleDateString("pt-BR",{day:"2-digit", month:"2-digit"}); };
  var dmISO = function(iso){ var p = (iso||"").split("-"); return p.length===3 ? p[2]+"/"+p[1] : ""; };
  var perfis = s.perfisRev||{};
  var lids = s.listagens.filter(function(x){return x.rep===rep;}).map(function(x){return x.id;});
  var hojeK = s.kits.filter(function(k){return lids.indexOf(k.lid)>=0;}).map(function(k){
    return {id:k.id, rev:k.rev, fone:k.fone||"", bairro:k.endereco||k.bairro, vendas:k.vendas||[], cond:k.valor, hora:k.horaAtend, hoje:true, data:dm(new Date()), nova:(k.tipoKit||"").indexOf("kit_novo")===0, tipoKit:k.tipoKit, status:k.status, lid:k.lid}; });
  return hojeK.concat((CARTEIRA_DEMO[rep]||[]).map(function(c,i){ var dt = new Date(); dt.setDate(dt.getDate()+c.dias);
    var ag = (perfis[c.rev]||{}).agendado;
    return Object.assign({id:"C"+i, hoje:false, data: ag && ag.data ? dmISO(ag.data) : dm(dt), hora: ag ? (ag.hora||null) : c.hora}, c); }));
}
function AppRepresentante(p){
  var cx = use(), s = cx.state, d = cx.dispatch, l = p.l;
  var tb = useState("inicio"), tela = tb[0], setTela = tb[1];
  var ms = useState(0), mes = ms[0], setMes = ms[1];
  var bs = useState(""), busca = bs[0], setBusca = bs[1];
  var sr = useState(null), selId = sr[0], setSel = sr[1];
  var af = useState({vendaBruta:null, devolvida:0, garantia:0, pagouIntegral:true}), acertoForm = af[0], setAcertoForm = af[1];
  var rf = useState({comExpositor:false, especial:false, valorEspecial:0}), reposForm = rf[0], setReposForm = rf[1];
  var mc = useState("acerto"), modoCalc = mc[0], setModoCalc = mc[1];
  var ab = useState(1), blocoAberto = ab[0], setBlocoAberto = ab[1];
  var lsel = useState(l.id), lidPed = lsel[0], setLidPed = lsel[1];
  var so = useState("data"), sortBy = so[0], setSortBy = so[1];
  var fa = useState(false), filtrosAbertos = fa[0], setFiltrosAbertos = fa[1];
  var me = useState(false), menuAberto = me[0], setMenuAberto = me[1];
  var mso = useState(false), mostrarSolicitar = mso[0], setMostrarSolicitar = mso[1];
  var flForm = useState({destino:"Curitiba", horario:"10:00"}), formListagem = flForm[0], setFormListagem = flForm[1];
  var agA = useState(false), agendarAberto = agA[0], setAgendarAberto = agA[1];
  var agF = useState({data:"", hora:""}), agendaForm = agF[0], setAgendaForm = agF[1];
  var lvA = useState(""), lidVista = lvA[0], setLidVista = lvA[1];
  var lvB = useState(""), buscaListagem = lvB[0], setBuscaListagem = lvB[1];
  var ep = useState(false), editandoPerfil = ep[0], setEditandoPerfil = ep[1];
  var meses = mesesApp(), cart = carteiraRep(s, l.rep);
  var vendMes = function(r, i){ return r.vendas[i===undefined?mes:i] || 0; };
  var totMes = function(i){ return cart.reduce(function(t,r){return t+vendMes(r,i);},0); };
  var tot = totMes(mes);
  var BR = "txt-branco";
  var cp = useState(null), copiadoId = cp[0], setCopiado = cp[1];
  var copiarEndereco = function(id, texto){ if(!texto) return; navigator.clipboard.writeText(texto).then(function(){ setCopiado(id); setTimeout(function(){ setCopiado(null); }, 1500); }); };
  var av = useState({}), notas = av[0], setNotas = av[1];
  var ks = s.kits.filter(function(k){return k.lid===l.id;}).sort(function(a,b){ return ETAPA[a.status]-ETAPA[b.status] || a.ordem-b.ordem; });
  var bip = ks.filter(function(k){return k.status==="bipado";}), ret = ks.filter(function(k){return k.status==="retirado";});
  var ouro = "bg-[#C9A13B] "+BR;
  var nAval = ret.filter(function(k){return !k.aval;}).length, nNovos = (s.novas||[]).filter(function(n){return n.rep===l.rep && n.status==="direcionada";}).length;
  var MENU = [["revs","Revendedoras","users","#2563EB", cart.length+" na carteira · "+ks.length+" kits hoje"],
    ["retirada","Retirada","caixa","#16A34A", bip.length+" prontos"],
    ["avaliar","Avaliar kits","star","#EA580C", nAval ? nAval+" para avaliar" : "tudo avaliado"],
    ["novos","Kits novos","novas","#DB2777", nNovos ? nNovos+" aguardando" : "revendedoras novas", nNovos],
    ["listagens","Listagens","lista","#7C3AED", "Em breve"],
    ["desempenho","Desempenho","trofeu","#16A34A", "Em breve"],
    ["indique","Indique & Ganhe","presente","#CA8A04", "Em breve"]];
  var TITULO = {rev:"Revendedora"}; MENU.forEach(function(m){ TITULO[m[0]] = m[1]; });
  // Tela inicial (dashboard): totais somados da carteira, no mesmo critério dos cards de revendedora (vendido/acerto/comissão 8%).
  var vendidoTotal = tot, acertoTotal = cart.reduce(function(t,r){ var vd = vendMes(r); return t + Math.round(vd*(1-((comissaoRev(vd, s.cfg)||{pct:0}).pct/100))); }, 0),
    comissaoRepTotal = Math.round(acertoTotal*0.08);
  if(l.rep==="Dayanne"){ vendidoTotal = 125215; acertoTotal = 70120.40; comissaoRepTotal = 5609.63; } // valores fictícios de demonstração pedidos pro perfil da Dayanne
  var minhasL = s.listagens.filter(function(x){return x.rep===l.rep && !x.fechada;});
  var LISTA_INICIO = [
    {tela:"revs", titulo:"Revendedoras", sub:"Veja e acompanhe sua rede", icone:"users", cor:"#EA580C", ativo:true},
    {tela:"novos", titulo:"Kits Novos", sub: nNovos ? nNovos+" aguardando" : "Revendedoras novas direcionadas", icone:"novas", cor:"#DB2777", ativo:true},
    {tela:"listagens", titulo:"Listagens", sub: minhasL.length+(minhasL.length===1?" listagem aberta":" listagens abertas"), icone:"lista", cor:"#7C3AED", ativo:true},
    {tela:"desempenho", titulo:"Desempenho", sub:"Em breve", icone:"trofeu", cor:"#16A34A", ativo:false},
    {tela:"indique", titulo:"Indique & Ganhe", sub:"Em breve", icone:"presente", cor:"#CA8A04", ativo:false}];
  var voltar = e("div",{className:"flex items-center gap-2"},
    e("button",{onClick:function(){setTela("inicio");}, className:"flex h-8 items-center gap-1 rounded-full bg-[#1C1C1E] px-3 text-[12px] font-semibold text-amber-200"}, "‹ Início"),
    e("b",{className:"text-[16px]"}, TITULO[tela]));
  var PCT_COMISSAO_REP_CARD = 0.08; // comissão da representante exibida no card: 8% do valor do acerto
  var LINHA_CARD = "border-[#E9DDBB]";
  var col = function(lb, v, cor){ return e("div",{className:"px-1"}, e("p",{className:"text-[9px] font-bold leading-tight tracking-wide text-[#9A8B63]"}, lb), e("p",{className:MONO+" mt-0.5 text-[13px] font-bold", style:cor?{color:cor}:null}, v)); };
  var cartao = function(r){
    var vd = vendMes(r), acerto = Math.round(vd*(1-((comissaoRev(vd, s.cfg)||{pct:0}).pct/100))), comissaoRep = Math.round(acerto*PCT_COMISSAO_REP_CARD);
    var estado = r.hoje ? {lb:"Acerto hoje", cor:"#B45309"} : r.hora ? {lb:"Acerto previsto", cor:"#1D4ED8"} : {lb:"Acerto previsto", cor:"#9CA3AF"};
    return e("div",{key:r.id, onClick:function(){ setSel(r.id); setTela("rev"); }, role:"button", tabIndex:0,
        className:"block w-full cursor-pointer overflow-hidden rounded-2xl border "+LINHA_CARD+" text-left shadow-sm transition-transform active:scale-[.99]",
        style:{background:"linear-gradient(135deg,#FFFFFF 0%,#F5E6BE 100%)"}},
      e("div",{className:"flex items-center justify-between gap-2 px-2.5 py-2"},
        e("b",{className:"min-w-0 truncate text-[14px] text-[#111827]"}, r.rev),
        e("div",{className:"flex shrink-0 items-center gap-1.5"},
          e("span",{className:"text-[13px] font-medium text-[#4B5563]"}, r.fone||"—"),
          r.fone && e("a",{href:"https://wa.me/55"+r.fone.replace(/\D/g,""), target:"_blank", rel:"noreferrer", onClick:function(ev){ev.stopPropagation();},
            "aria-label":"WhatsApp de "+r.rev, className:"grid size-6 shrink-0 place-items-center rounded-full bg-emerald-500 text-white"}, e(Icon,{n:"whats", s:12})))),
      e("div",{className:"grid grid-cols-3 divide-x divide-[#E9DDBB] border-t "+LINHA_CARD+" py-2 text-center"},
        col("VENDIDO", BK(vd), "#15803D"), col("ACERTO", BK(acerto), "#2563EB"), col("COMISSÃO", BK(comissaoRep), "#A67C12")),
      e("div",{className:"flex items-start justify-between gap-2 border-t "+LINHA_CARD+" px-2.5 py-1.5"},
        e("p",{className:"min-w-0 flex-1 text-[11px] leading-snug text-[#6B7280]"}, r.bairro||"—"),
        r.bairro && e("button",{onClick:function(ev){ ev.stopPropagation(); copiarEndereco(r.id, r.bairro); }, "aria-label":"Copiar endereço de "+r.rev,
          className:"flex shrink-0 items-center gap-1 rounded-full bg-black/5 px-2 py-0.5 text-[10px] font-semibold text-[#4B5563]"},
          e(Icon,{n:"copiar", s:11}), copiadoId===r.id ? "Copiado" : "Copiar")),
      e("div",{className:"flex items-center justify-between border-t "+LINHA_CARD+" px-2.5 py-1.5 text-[11.5px] font-semibold", style:{color:estado.cor}},
        e("span",null, estado.lb), e("span",null, r.data+(r.hora ? " · "+r.hora : ""))));
  };
  // Revendedora aberta: contatos de referência e pedidos (kit, reposição, saiu = só retirar a condicional)
  var sel = cart.find(function(r){return r.id===selId;});
  var lPed = minhasL.find(function(x){return x.id===lidPed;}) || minhasL[0];
  var pedir = function(tipo, opts){ opts = opts || {};
    var lidUse = opts.lid || (lPed && lPed.id), lUse = s.listagens.find(function(x){return x.id===lidUse;});
    if(!lUse || !sel) return;
    var conds = SEM_KIT[tipo] ? [String(13000 + sel.rev.length*97 + sel.rev.charCodeAt(0)).padStart(6,"0")] : [];
    d({type:"ADD_KIT", lid:lUse.id, rev:sel.rev, bairro:sel.bairro||"", vendas: tipo==="reposicao" ? [] : sel.vendas, prio:false, atrasado:foraDoPrazo(lUse, s), tipoKit:tipo, conds:conds, fone:sel.fone, hora:(opts.hora!==undefined?opts.hora:sel.hora)||null, porApp:true});
    if(!opts.ficarNaTela) setTela("revs"); };
  var kitSel = sel && sel.hoje ? s.kits.find(function(k){return k.id===sel.id;}) : null;
  var jaAcertado = kitSel && (kitSel.status==="acertado" || kitSel.acerto || kitSel.reposicaoEntregue);
  var versaoSel = kitSel ? versaoDoKit(s, kitSel) : null;
  var previaAcerto = kitSel && versaoSel && acertoForm.vendaBruta!=null
    ? calcularAcerto({vendaBruta:acertoForm.vendaBruta, devolvida:acertoForm.devolvida||0, garantia:acertoForm.garantia||0, vez:kitSel.remarcacoes||0,
        comAviso:kitSel.ultimaRemarcacaoComAviso!==false, pagouIntegral:acertoForm.pagouIntegral!==false}, versaoSel)
    : null;
  var kitNovoSugerido = kitSel ? sugerido(sel.vendas, s.cfg) : null;
  // Acordeão da Calculadora de acertos: aparece direto dentro da tela da revendedora (não é uma tela separada).
  var BR2 = BR;
  var checkOk = e("span",{className:"grid size-6 shrink-0 place-items-center rounded-full bg-emerald-500/20 text-emerald-400"}, e(Icon,{n:"check", s:13}));
  var badgeTxt = function(txt, cor){ return e("span",{className:"shrink-0 rounded-full px-2 py-0.5 text-[10.5px] font-bold "+BR2, style:{background:cor}}, txt); };
  var blocoAcordeao = function(idx, icone, cor, titulo, subtitulo, status, conteudo){
    var aberto = blocoAberto===idx;
    return e("div",{key:idx, className:"overflow-hidden rounded-2xl bg-[#1C1C1E]"},
      e("button",{onClick:function(){ setBlocoAberto(aberto?null:idx); }, className:"flex w-full items-center gap-3 p-3 text-left"},
        e("span",{className:"grid size-9 shrink-0 place-items-center rounded-xl", style:{background:cor+"26", color:cor}}, e(Icon,{n:icone, s:18})),
        e("div",{className:"min-w-0 flex-1"}, e("b",{className:"block text-[14px]"}, titulo), e("span",{className:"block truncate text-[11.5px] text-[#8E8E93]"}, subtitulo)),
        status,
        e(Icon,{n: aberto?"chevrondown":"chevron", s:15, className:"text-[#8E8E93]"})),
      aberto && e("div",{className:"flex flex-col gap-2.5 border-t border-white/5 p-3"}, conteudo));
  };
  var calcAcertoScreen = kitSel && e("div",{className:"flex flex-col gap-2.5"},
    e("div",{className:"flex items-center gap-2"},
      e("button",{onClick:function(){setTela("rev");}, className:"flex h-8 items-center gap-1 rounded-full bg-[#1C1C1E] px-3 text-[13px] font-semibold text-amber-200"}, "‹"),
      e("b",{className:"truncate text-[18px]"}, sel.rev)),
    blocoAcordeao(1, "grafico", "#2563EB", "Vendas", acertoForm.vendaBruta ? BK(acertoForm.vendaBruta) : "Preencha o valor vendido",
      acertoForm.vendaBruta ? checkOk : badgeTxt("Pendente","#64748B"),
      [e("div",{key:"v1"},
        e("p",{className:"mb-1 text-[12px] text-[#8E8E93]"},"Vendido"),
        e("input",{inputMode:"numeric", value:acertoForm.vendaBruta==null?"":acertoForm.vendaBruta, placeholder:"R$ 0,00",
          onChange:function(ev){ var n = ev.target.value.replace(/\D/g,""); setAcertoForm(Object.assign({}, acertoForm, {vendaBruta:n?Number(n)/100:null})); },
          className:"h-11 w-full rounded-xl bg-black/50 px-3 text-left text-[15px] font-semibold text-white outline-none ring-1 ring-white/10"})),
      e("div",{key:"v2", className:"flex items-center justify-between gap-2 text-[12px] text-[#8E8E93]"},
        e("span",null,"Devolvido (se houver)"),
        e("input",{inputMode:"numeric", value:acertoForm.devolvida||"", placeholder:"R$ 0,00",
          onChange:function(ev){ var n = ev.target.value.replace(/\D/g,""); setAcertoForm(Object.assign({}, acertoForm, {devolvida:n?Number(n)/100:0})); },
          className:"h-8 w-28 rounded-lg bg-black/50 px-2 text-right text-[13px] text-white outline-none ring-1 ring-white/10"})),
      e("label",{key:"v3", className:"flex items-center gap-2 text-[12px] text-[#8E8E93]"},
        e("input",{type:"checkbox", checked:acertoForm.pagouIntegral!==false, onChange:function(ev){ setAcertoForm(Object.assign({}, acertoForm, {pagouIntegral:ev.target.checked})); }}),
        "Pagou 100% do acerto (brinde garantido)"),
      previaAcerto && e("div",{key:"v4", className:"flex flex-col gap-1 border-t border-white/10 pt-2.5 text-[13px]"},
        previaAcerto.semFaixa
          ? e("p",{className:"text-amber-200"},"Abaixo de "+BK(versaoSel.gerais.minRenovar)+": sem comissão nesta tabela"+(previaAcerto.taxaDeslocamento?" · taxa de deslocamento "+BK(previaAcerto.taxaDeslocamento):""))
          : e(React.Fragment,null,
              e("p",null, e("b",null,"Comissão: "+previaAcerto.comissaoPct+"%")),
              e("p",null, e("b",{className:"text-amber-200"},"Valor do acerto: "+BK(previaAcerto.valorAcerto)))))]),
    blocoAcordeao(2, "calendario", "#7C3AED", "Remarcações",
      (kitSel.remarcacoes||0)>0 ? (kitSel.remarcacoes)+"ª vez · "+(kitSel.ultimaRemarcacaoComAviso?"avisou 48h+":"sem aviso") : "Nenhuma remarcação neste kit",
      badgeTxt((kitSel.remarcacoes||0)>0 ? String(kitSel.remarcacoes) : "—", (kitSel.remarcacoes||0)>0 ? "#7C3AED" : "#374151"),
      [e("div",{key:"r1", className:"flex gap-2"},
        e("button",{onClick:function(){ d({type:"KIT_REMARCAR", id:kitSel.id, comAviso:true}); }, className:"h-8 flex-1 rounded-lg text-[12px] font-bold "+BR2, style:{background:"#64748B"}},"+ Avisou 48h+"),
        e("button",{onClick:function(){ d({type:"KIT_REMARCAR", id:kitSel.id, comAviso:false}); }, className:"h-8 flex-1 rounded-lg text-[12px] font-bold "+BR2, style:{background:"#DC2626"}},"+ Sem aviso")),
      previaAcerto && previaAcerto.descontoRemarcacao && (previaAcerto.descontoRemarcacao.comissaoPct>0 || previaAcerto.descontoRemarcacao.brindePct>0) && e("div",{key:"r2", className:"flex flex-col gap-0.5 text-[13px]"},
        previaAcerto.descontoRemarcacao.comissaoPct>0 && e("p",{className:"text-rose-300"},"−"+previaAcerto.descontoRemarcacao.comissaoPct+"% de comissão por remarcação"),
        previaAcerto.descontoRemarcacao.brindePct>0 && e("p",{className:"text-rose-300"},"−"+previaAcerto.descontoRemarcacao.brindePct+"% de brinde por remarcação"))]),
    blocoAcordeao(3, "star", "#D97706", "Crédito de garantia",
      acertoForm.garantia>0 ? "Desconto de "+BK(acertoForm.garantia)+" na venda" : "Sem desconto de garantia",
      acertoForm.garantia>0 ? checkOk : badgeTxt("—","#374151"),
      [e("div",{key:"g1"},
        e("p",{className:"mb-1 text-[12px] text-[#8E8E93]"},"Valor de garantia a descontar da venda"),
        e("input",{inputMode:"numeric", value:acertoForm.garantia||"", placeholder:"R$ 0,00",
          onChange:function(ev){ var n = ev.target.value.replace(/\D/g,""); setAcertoForm(Object.assign({}, acertoForm, {garantia:n?Number(n)/100:0})); },
          className:"h-10 w-full rounded-xl bg-black/50 px-3 text-left text-sm text-white outline-none ring-1 ring-white/10"}))]),
    blocoAcordeao(4, "presente", "#DB2777", "Brindes",
      previaAcerto && !previaAcerto.semFaixa ? "Normal "+BK(previaAcerto.brindeNormal)+" · Select "+BK(previaAcerto.brindeSelect) : "Calculado após informar a venda",
      !previaAcerto || previaAcerto.semFaixa ? badgeTxt("—","#374151") : acertoForm.pagouIntegral===false ? badgeTxt("Bloqueado","#DC2626") : checkOk,
      [previaAcerto && !previaAcerto.semFaixa
        ? e("div",{key:"b1", className:"flex flex-col gap-1 text-[13px]"},
            e("p",null,"Brinde normal: "+BK(previaAcerto.brindeNormal)),
            e("p",null,"Brinde select: "+BK(previaAcerto.brindeSelect)),
            acertoForm.pagouIntegral===false && e("p",{className:"text-rose-300"},"Ficou valor pendente: sem brinde neste ciclo"))
        : e("p",{key:"b2", className:"text-[13px] text-[#8E8E93]"},"Preencha as vendas para calcular o brinde.")]),
    blocoAcordeao(5, "novas", "#16A34A", "Kit novo",
      acertoForm.pagouIntegral!==false ? "Libera peças do próximo kit após o acerto" : "Só libera com o acerto pago 100%",
      acertoForm.pagouIntegral!==false ? checkOk : badgeTxt("Bloqueado","#DC2626"),
      [e("p",{key:"k1", className:"text-[13px] text-[#8E8E93]"},"Peças do próximo kit só são liberadas depois do pagamento integral deste acerto.")]),
    blocoAcordeao(6, "caixa", "#0891B2", "Peças próximo mês",
      kitNovoSugerido ? "Sugestão: "+BK(kitNovoSugerido) : "Sem histórico suficiente",
      badgeTxt(kitNovoSugerido ? BK(kitNovoSugerido) : "—", "#0891B2"),
      [e("p",{key:"p1", className:"text-[13px] text-[#8E8E93]"},"Valor sugerido pra montar o próximo kit, com base na média de vendas dos últimos meses.")]),
    e("button",{disabled:!acertoForm.vendaBruta, onClick:function(){
        d({type:"ACERTO_REGISTRAR", id:kitSel.id, vendaBruta:acertoForm.vendaBruta, devolvida:acertoForm.devolvida||0, garantia:acertoForm.garantia||0, pagouIntegral:acertoForm.pagouIntegral!==false});
        setTela("rev"); },
      className:"h-11 rounded-2xl text-[14px] font-bold disabled:opacity-40 "+ouro},"Confirmar acerto"));
  var blocoClaro = "rounded-2xl border "+LINHA_CARD+" bg-white p-3 text-[13px] text-[#111827]";
  var perfilAtual = sel ? (s.perfisRev[sel.rev] || {}) : {};
  var fone1 = perfilAtual.fone1!==undefined ? perfilAtual.fone1 : (sel && sel.fone) || "";
  var fone2 = perfilAtual.fone2 || "";
  var refsBase = sel ? refsDe(sel.rev) : [];
  var refsAtuais = (perfilAtual.refs || refsBase).slice(0,3);
  var salvarPerfil = function(patch){ if(sel) d({type:"SALVAR_PERFIL_REV", chave:sel.rev, patch:patch}); };
  var setRef = function(i, campo, valor){ var novo = [0,1,2].map(function(j){ return Object.assign({nome:"",rel:"",fone:""}, refsAtuais[j]); });
    novo[i][campo] = valor; salvarPerfil({refs:novo}); };
  var enderecoCasa = perfilAtual.enderecoCasa!==undefined ? perfilAtual.enderecoCasa : (sel && sel.bairro) || "";
  var enderecoTrabalho = perfilAtual.enderecoTrabalho || "";
  var profissao = perfilAtual.profissao || "";
  var formatarFone = function(v){
    var d = (v||"").replace(/\D/g,"").slice(0,11);
    if(d.length<=2) return d.length ? "("+d : d;
    if(d.length<=6) return "("+d.slice(0,2)+") "+d.slice(2);
    if(d.length<=10) return "("+d.slice(0,2)+") "+d.slice(2,6)+"-"+d.slice(6);
    return "("+d.slice(0,2)+") "+d.slice(2,7)+"-"+d.slice(7);
  };
  var campoEdit = function(label, chave, placeholder, defaultVal, formatador){
    var val = perfilAtual[chave]!==undefined ? perfilAtual[chave] : (defaultVal||"");
    return e("div",{key:chave, className:"py-1.5"},
      e("p",{className:"mb-1 text-[10.5px] font-semibold uppercase tracking-wide text-[#9A8B63]"}, label),
      e("input",{value:val, placeholder:placeholder||"", inputMode: formatador?"tel":undefined,
        onChange:function(ev){ var o={}; o[chave]= formatador ? formatador(ev.target.value) : ev.target.value; salvarPerfil(o); },
        className:"h-9 w-full rounded-lg bg-[#F4F5F7] px-2 text-[13px] text-[#111827] outline-none ring-1 ring-black/10"}));
  };
  var linhaInfo = function(label, valor, opts){ opts = opts||{};
    return e("div",{key:label, className:"flex items-start justify-between gap-2 py-1.5"+(opts.primeiro?"":" border-t "+LINHA_CARD)},
      e("div",{className:"min-w-0 flex-1"},
        e("p",{className:"text-[10px] font-bold uppercase tracking-wide", style:{color:opts.cor||"#9A8B63"}}, label),
        valor ? e("p",{className:"mt-0.5 text-[13.5px] font-semibold leading-snug text-[#111827]"}, valor)
              : e("p",{className:"mt-0.5 text-[12.5px] font-semibold text-amber-700"}, "Pendente")),
      opts.copiar && valor && e("button",{onClick:function(){ copiarEndereco(opts.id, valor); }, "aria-label":"Copiar "+label,
        className:"grid size-7 shrink-0 place-items-center rounded-full "+(copiadoId===opts.id ? "bg-emerald-500 text-white" : "bg-black/5 text-[#4B5563]")},
        e(Icon,{n: copiadoId===opts.id ? "check" : "copiar", s:13})));
  };
  var vdSel = sel ? vendMes(sel) : 0;
  var acertoSel = sel ? Math.round(vdSel*(1-((comissaoRev(vdSel, s.cfg)||{pct:0}).pct/100))) : 0;
  var comissaoRepSel = Math.round(acertoSel*PCT_COMISSAO_REP_CARD);
  var linhaFone = function(fone, id, label){ return e("div",{className:"flex items-center justify-between gap-2"},
    e("span",{className:MONO+" text-[15px] font-bold text-[#4B3B14]"}, fone),
    e("div",{className:"flex shrink-0 items-center gap-1.5"},
      e("button",{onClick:function(){ copiarEndereco(id, fone); }, "aria-label":"Copiar "+label,
        className:"grid size-8 shrink-0 place-items-center rounded-full "+(copiadoId===id ? "bg-emerald-500 text-white" : "bg-black/10 text-[#6B5A2E]")},
        e(Icon,{n: copiadoId===id ? "check" : "copiar", s:13})),
      e("a",{href:"https://wa.me/55"+fone.replace(/\D/g,""), target:"_blank", rel:"noreferrer", "aria-label":label,
        className:"grid size-8 shrink-0 place-items-center rounded-full bg-emerald-500 text-white"}, e(Icon,{n:"whats", s:14})))); };
  var blocoNome = sel && e("div",{className:"overflow-hidden rounded-2xl border "+LINHA_CARD, style:{background:"linear-gradient(135deg,#FFFFFF 0%,#F5E6BE 100%)"}},
    e("div",{className:"flex items-center justify-between gap-2 px-3.5 py-3"},
      e("b",{className:"min-w-0 truncate text-[19px] font-extrabold tracking-tight text-[#111827]"}, sel.rev),
      e("button",{onClick:function(){ setEditandoPerfil(!editandoPerfil); }, "aria-label":editandoPerfil?"Concluir edição":"Editar dados",
        className:"grid size-8 shrink-0 place-items-center rounded-full "+(editandoPerfil?"bg-emerald-500 text-white":"bg-black/10 text-[#6B5A2E]")},
        e(Icon,{n: editandoPerfil?"check":"pencil", s:14}))),
    e("div",{className:"flex flex-col gap-1.5 border-t "+LINHA_CARD+" px-3.5 py-2"},
      editandoPerfil
        ? e(React.Fragment,null,
            campoEdit("Telefone (WhatsApp)","fone1","(41) 90000-0000", sel.fone, formatarFone),
            campoEdit("2º telefone (opcional)","fone2","(41) 90000-0000", null, formatarFone))
        : e(React.Fragment,null,
            fone1 && linhaFone(fone1, "fone1-"+sel.id, "WhatsApp de "+sel.rev),
            fone2 && e("div",{className:"border-t "+LINHA_CARD+" pt-1.5"}, linhaFone(fone2, "fone2-"+sel.id, "2º WhatsApp de "+sel.rev)))),
    e("div",{className:"grid grid-cols-3 divide-x divide-[#E9DDBB] border-t "+LINHA_CARD+" py-1.5 text-center"},
      col("VENDIDO", BK(vdSel), "#15803D"), col("ACERTO", BK(acertoSel), "#2563EB"), col("COMISSÃO", BK(comissaoRepSel), "#A67C12")));
  var GRAD_OURO = "linear-gradient(135deg,#FFFFFF 0%,#F5E6BE 100%)";
  var CorEnd = "#A67C12";
  var blocoEnderecos = sel && e("div",{className:"rounded-2xl border "+LINHA_CARD+" p-3", style:{background:GRAD_OURO}},
    editandoPerfil
      ? e(React.Fragment,null,
          campoEdit("Endereço residencial","enderecoCasa","Rua, número - bairro, cidade - UF", sel.bairro),
          campoEdit("Endereço de trabalho","enderecoTrabalho","Rua, número - bairro, cidade - UF"),
          campoEdit("Profissão","profissao","Ex.: Cabeleireira"))
      : e(React.Fragment,null,
          linhaInfo("Endereço residencial", enderecoCasa, {copiar:true, id:"end-"+sel.id, primeiro:true, cor:CorEnd}),
          linhaInfo("Endereço de trabalho", enderecoTrabalho, {copiar:true, id:"endtrab-"+sel.id, cor:CorEnd}),
          linhaInfo("Profissão", profissao, {cor:CorEnd})));
  var CorRef = "#A67C12";
  var blocoRefs = sel && e("div",{className:"flex flex-col gap-2 rounded-2xl border "+LINHA_CARD+" p-3", style:{background:GRAD_OURO}},
    e("p",{className:"text-[11px] font-bold uppercase tracking-wide", style:{color:CorRef}},"Contatos de referência"),
    [0,1,2].map(function(i){
      var r = Object.assign({nome:"",rel:"",fone:""}, refsAtuais[i]); var vazio = !r.nome && !r.rel && !r.fone;
      if(editandoPerfil) return e("div",{key:i, className:"flex flex-col gap-1.5 rounded-xl bg-white p-2.5"},
        e("div",{className:"flex gap-1.5"},
          e("input",{value:r.nome, placeholder:"Nome", onChange:function(ev){setRef(i,"nome",ev.target.value);},
            className:"h-9 flex-1 rounded-lg bg-[#F4F5F7] px-2 text-[13px] text-[#111827] outline-none ring-1 ring-black/10"}),
          e("input",{value:r.rel, placeholder:"Relação", onChange:function(ev){setRef(i,"rel",ev.target.value);},
            className:"h-9 w-24 rounded-lg bg-[#F4F5F7] px-2 text-[13px] text-[#111827] outline-none ring-1 ring-black/10"})),
        e("input",{value:r.fone, placeholder:"Telefone", onChange:function(ev){setRef(i,"fone",ev.target.value);},
          className:"h-9 w-full rounded-lg bg-[#F4F5F7] px-2 text-[13px] text-[#111827] outline-none ring-1 ring-black/10"}));
      return e("div",{key:i, className:"flex items-center gap-2 rounded-xl bg-white px-2.5 py-2"},
        e("span",{className:"grid size-8 shrink-0 place-items-center rounded-full text-white", style:{background:CorRef}}, e(Icon,{n:"user", s:14})),
        e("div",{className:"min-w-0 flex-1"},
          vazio
            ? e("p",{className:"text-[12.5px] font-semibold text-amber-700"},"Pendente")
            : e(React.Fragment,null,
                e("p",{className:"truncate text-[13px] font-semibold text-[#111827]"}, r.nome+(r.rel?" · "+r.rel:"")),
                e("p",{className:"text-[12px] text-[#6B7280]"}, r.fone||"—"))),
        !vazio && r.fone && e("a",{href:"https://wa.me/55"+r.fone.replace(/\D/g,""), target:"_blank", rel:"noreferrer", "aria-label":"WhatsApp de "+r.nome,
          className:"grid size-8 shrink-0 place-items-center rounded-full bg-emerald-500 text-white"}, e(Icon,{n:"whats", s:14}))); }));
  var botaoCondicionais = e("button",{className:"flex w-full items-center gap-3 "+blocoClaro+" text-left"},
    e("span",{className:"grid size-9 shrink-0 place-items-center rounded-xl", style:{background:"#0891B21F", color:"#0891B2"}}, e(Icon,{n:"lock", s:16})),
    e("b",{className:"text-[14px] text-[#111827]"},"Condicionais"));
  var blocoStatusHoje = sel && sel.hoje && e("div",{className:"flex flex-col gap-2"},
    e("div",{className:"flex items-center justify-between gap-2 rounded-2xl border "+LINHA_CARD+" bg-white px-3 py-2"},
      e("div",{className:"min-w-0 flex-1"},
        e("b",{className:"text-[13px] text-[#111827]"}, "Está na listagem de hoje"),
        e("p",{className:"truncate text-[11.5px] text-[#6B7280]"}, (TIPO_KIT[sel.tipoKit]||TIPO_KIT.acerto_kit)[0])),
      badge(STATUS_LB[sel.status]||"", STATUS_TP[sel.status])),
    jaAcertado && kitSel.acerto && e("div",{className:"rounded-2xl border border-emerald-200 bg-emerald-50 p-2.5 text-[12.5px]"},
      e("b",{className:"text-emerald-700"},"Acerto registrado"),
      e("p",{className:"text-[11.5px] text-emerald-900/70"}, "Venda líquida "+BK(kitSel.acerto.vendaLiquida)+" · comissão "+BK(kitSel.acerto.comissao)+" ("+kitSel.acerto.comissaoPct+"%) · valor do acerto "+BK(kitSel.acerto.valorAcerto)),
      (kitSel.acerto.brindeNormal>0 || kitSel.acerto.brindeSelect>0) && e("p",{className:"text-[11.5px] text-emerald-900/70"}, "Brinde: normal "+BK(kitSel.acerto.brindeNormal)+" · select "+BK(kitSel.acerto.brindeSelect))),
    jaAcertado && kitSel.reposicaoEntregue && e("div",{className:"rounded-2xl border border-emerald-200 bg-emerald-50 p-2.5 text-[12.5px]"},
      e("b",{className:"text-emerald-700"},"Reposição entregue"), kitSel.comissaoFixa ? e("p",{className:"text-[11.5px] text-emerald-900/70"},"Comissão "+BK(kitSel.comissaoFixa)) : null));
  var botaoAgendar = sel && e("button",{onClick:function(){ setAgendarAberto(!agendarAberto); setMenuAberto(false); }, className:"flex h-12 w-full flex-col items-center justify-center gap-0.5 rounded-2xl text-[12px] font-extrabold leading-none "+ouro},
    e("span",null,"Agendar"), e("span",null,"atendimento"));
  var listagensNaData = sel && agendaForm.data ? s.listagens.filter(function(x){return x.rep===l.rep && !x.fechada && x.data===agendaForm.data;}) : [];
  var blocoAgendaForm = sel && agendarAberto && e("div",{className:"flex flex-col gap-2 rounded-2xl border "+LINHA_CARD+" bg-white p-3 shadow-sm"},
      e("div",{className:"flex gap-2"},
        e("input",{type:"date", value:agendaForm.data, onChange:function(ev){setAgendaForm(Object.assign({}, agendaForm, {data:ev.target.value}));},
          className:"h-10 flex-1 rounded-xl bg-[#F4F5F7] px-2 text-sm text-[#111827] outline-none ring-1 ring-black/10"}),
        e("input",{type:"time", value:agendaForm.hora, placeholder:"Horário", onChange:function(ev){setAgendaForm(Object.assign({}, agendaForm, {hora:ev.target.value}));},
          className:"h-10 w-24 rounded-xl bg-[#F4F5F7] px-2 text-sm text-[#111827] outline-none ring-1 ring-black/10"})),
      !agendaForm.data
        ? e("p",{className:"text-[12px] text-[#6B7280]"},"Escolha o dia do atendimento com a revendedora.")
        : listagensNaData.length>0
          ? e("div",{className:"flex flex-col gap-2"}, listagensNaData.map(function(x){
              var kitsX = s.kits.filter(function(k){return k.lid===x.id;});
              var cheiaX = listagemCheia(s, x.id), foraX = foraDoPrazo(x, s);
              return e("div",{key:x.id, className:"flex flex-col gap-1.5 rounded-xl border "+LINHA_CARD+" bg-[#F4F5F7] p-2.5"},
                e("div",{className:"flex items-center justify-between gap-2"},
                  e("div",null,
                    e("b",{className:"text-[13px] text-[#111827]"}, "Retirada "+x.horario+" · "+x.destino),
                    e("p",{className:"text-[11px] text-[#6B7280]"}, x.viagem?"Viagem":"")),
                  e("span",{className:"shrink-0 rounded-full px-2 py-0.5 text-[11px] font-bold",
                    style: cheiaX ? {background:"#DC26261F", color:"#DC2626"} : {background:"#16A34A1F", color:"#16A34A"}},
                    kitsNaListagem(s,x.id)+"/"+(x.viagem?"∞":capacidadeListagem(x)))),
                kitsX.length>0 && e("div",{className:"flex flex-col gap-0.5 border-t "+LINHA_CARD+" pt-1.5"},
                  kitsX.map(function(k){ return e("p",{key:k.id, className:"truncate text-[11px] text-[#6B7280]"},
                    (k.horaAtend?k.horaAtend+" · ":"")+k.rev+(k.bairro?" · "+k.bairro:"")); })),
                foraX && e("p",{className:"text-[11px] text-amber-700"},"Menos de "+s.cfg.prazoPedidoHoras+" h: entra como atrasado."),
                e("button",{disabled:cheiaX || x.fechada, onClick:function(){ pedir("acerto_kit", {lid:x.id, hora:agendaForm.hora||null, ficarNaTela:true}); setAgendarAberto(false); },
                  className:"h-9 rounded-lg text-[12.5px] font-bold disabled:opacity-40 "+ouro}, cheiaX ? "Listagem cheia" : "Agendar nessa listagem"));
            }))
          : e(React.Fragment,null,
              e("p",{className:"text-[12px] text-[#6B7280]"},"Nenhuma listagem aberta para esse dia ainda."),
              e("div",{className:"flex gap-2"},
                e("input",{value:formListagem.destino, placeholder:"Destino", onChange:function(ev){setFormListagem(Object.assign({}, formListagem, {destino:ev.target.value}));},
                  className:"h-10 flex-1 rounded-xl bg-[#F4F5F7] px-2 text-sm text-[#111827] outline-none ring-1 ring-black/10"}),
                e("input",{type:"time", value:formListagem.horario, onChange:function(ev){setFormListagem(Object.assign({}, formListagem, {horario:ev.target.value}));},
                  className:"h-10 w-24 rounded-xl bg-[#F4F5F7] px-2 text-sm text-[#111827] outline-none ring-1 ring-black/10"})),
              e("button",{onClick:function(){ d({type:"CRIAR_LISTAGEM", rep:l.rep, destino:formListagem.destino, horario:formListagem.horario, data:agendaForm.data}); },
                className:"h-10 rounded-xl text-[13px] font-bold "+ouro}, "Criar listagem para esse dia")));
  var blocoSolicitar = sel && !sel.hoje && mostrarSolicitar && e("div",{className:"flex flex-col gap-2 "+blocoClaro},
    e("p",{className:"text-[12px] font-bold uppercase tracking-wide text-[#6B7280]"},"Solicitar kit pra retirada"),
    minhasL.length===0
      ? e("div",{className:"flex flex-col gap-2"},
          e("p",{className:"text-[12px] text-[#6B7280]"},"Nenhuma listagem aberta ainda. Crie uma para continuar."),
          e("div",{className:"flex gap-2"},
            e("input",{value:formListagem.destino, placeholder:"Destino", onChange:function(ev){setFormListagem(Object.assign({}, formListagem, {destino:ev.target.value}));},
              className:"h-10 flex-1 rounded-xl bg-[#F4F5F7] px-2 text-sm text-[#111827] outline-none ring-1 ring-black/10"}),
            e("input",{type:"time", value:formListagem.horario, onChange:function(ev){setFormListagem(Object.assign({}, formListagem, {horario:ev.target.value}));},
              className:"h-10 w-24 rounded-xl bg-[#F4F5F7] px-2 text-sm text-[#111827] outline-none ring-1 ring-black/10"})),
          e("button",{onClick:function(){ d({type:"CRIAR_LISTAGEM", rep:l.rep, destino:formListagem.destino, horario:formListagem.horario}); },
            className:"h-10 rounded-xl text-[13px] font-bold "+ouro},"Criar listagem"))
      : e(React.Fragment,null,
          e("select",{value:lPed.id, onChange:function(ev){setLidPed(ev.target.value);}, "aria-label":"Listagem",
            className:"h-10 rounded-xl bg-[#F4F5F7] px-3 text-sm font-semibold text-[#111827] outline-none ring-1 ring-black/10"},
            minhasL.map(function(x){ var cheiaX = listagemCheia(s, x.id);
              return e("option",{key:x.id, value:x.id, disabled:cheiaX}, "Retirada "+x.horario+" · "+x.destino+" ("+kitsNaListagem(s,x.id)+"/"+capacidadeListagem(x)+")"+(cheiaX?" · Lotada":"")); })),
          foraDoPrazo(lPed, s) && e("p",{className:"text-[12px] text-amber-700"},"Menos de "+s.cfg.prazoPedidoHoras+" h para a retirada: entra como atrasado."),
          listagemCheia(s, lPed.id) && e("p",{className:"text-[12px] font-semibold text-rose-600"},"Essa listagem já está cheia. Escolha outra."),
          e("button",{disabled:listagemCheia(s, lPed.id), onClick:function(){pedir("acerto_kit"); setMostrarSolicitar(false);},
            className:"h-10 rounded-xl text-[13px] font-bold disabled:opacity-40 "+ouro},"Confirmar: acerto + kit")));
  var opcoesAtendimento = [
    {lb:"Realizar Acerto", icone:"calc", cor:"#16A34A", ativo:true, onClick:function(){ setMenuAberto(false);
      if(sel.hoje){ if(!jaAcertado && kitSel){ setAcertoForm({vendaBruta:null, devolvida:0, garantia:0, pagouIntegral:true}); setBlocoAberto(1); setTela("calcacerto"); } }
      else { setMostrarSolicitar(true); } }},
    {lb:"Entregar Kit Novo", icone:"novas", cor:"#DB2777", ativo:false},
    {lb:"Entregar Reposição", icone:"caixa", cor:"#0891B2", ativo:false}];
  var botaoRealizar = sel && e("button",{onClick:function(){ setMenuAberto(!menuAberto); setAgendarAberto(false); }, className:"relative flex h-12 w-full flex-col items-center justify-center gap-0.5 rounded-2xl px-2 text-[12px] font-extrabold leading-none "+ouro},
    e(Icon,{n: menuAberto?"chevrondown":"chevron", s:12, className:"absolute right-2 top-1/2 -translate-y-1/2 opacity-80"}),
    e("span",null,"Realizar"), e("span",null,"atendimento"));
  var painelRealizar = sel && menuAberto && e("div",{className:"overflow-hidden rounded-2xl border "+LINHA_CARD+" bg-white shadow-sm"},
    opcoesAtendimento.map(function(op, i){
      return e("button",{key:i, disabled:!op.ativo, onClick:op.onClick,
        className:"flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-[13px] font-semibold text-[#111827] disabled:opacity-50 "+(i>0?"border-t "+LINHA_CARD:"")},
        e("span",{className:"grid size-8 shrink-0 place-items-center rounded-xl", style:{background:op.cor+"1F", color:op.cor}}, e(Icon,{n:op.icone, s:15})),
        e("span",{className:"min-w-0 flex-1 leading-tight"}, op.lb),
        !op.ativo && e("span",{className:"shrink-0 text-[10.5px] font-semibold text-[#9CA3AF]"},"Em breve")); }));
  var linhaAtendimento = sel && e("div",{className:"flex flex-col gap-2"},
    e("div",{className:"grid grid-cols-2 gap-2"}, botaoAgendar, botaoRealizar),
    blocoAgendaForm, painelRealizar);
  var telaRev = sel && e("div",{className:"mt-3 flex flex-col gap-2"},
    blocoNome, blocoStatusHoje, linhaAtendimento, blocoEnderecos, blocoRefs, botaoCondicionais, blocoSolicitar);
  var ponto = function(k){ return e("span",{className:"size-2 shrink-0 rounded-full "+PONTO_CEL[STATUS_TP[k.status]]}); };
  var fmtDataISO = function(iso){ if(!iso) return ""; var p = iso.split("-"); return p[2]+"/"+p[1]; };
  var hojeISOStr = isoDia(new Date());
  var minhasLOrdenadas = minhasL.slice().sort(function(a,b){ return (a.data||"").localeCompare(b.data||"") || a.horario.localeCompare(b.horario); });
  var listagemVista = minhasLOrdenadas.find(function(x){return x.id===lidVista;}) || minhasLOrdenadas.find(function(x){return x.data===hojeISOStr;}) || minhasLOrdenadas[0];
  var kitsVista = listagemVista ? s.kits.filter(function(k){return k.lid===listagemVista.id;}).sort(function(a,b){return ETAPA[a.status]-ETAPA[b.status] || a.ordem-b.ordem;}) : [];
  var buscaLNorm = buscaListagem.trim().toLowerCase();
  var kitsVistaFiltrados = buscaLNorm ? kitsVista.filter(function(k){return k.rev.toLowerCase().indexOf(buscaLNorm)>=0;}) : kitsVista;
  var resultadosForaDaVista = buscaLNorm ? s.kits.filter(function(k){ return (!listagemVista || k.lid!==listagemVista.id) && minhasL.some(function(x){return x.id===k.lid;}) && k.rev.toLowerCase().indexOf(buscaLNorm)>=0; }) : [];
  var telaListagens = e("div",{className:"mt-3 flex flex-col gap-2.5"},
    minhasL.length>0 && e("input",{value:buscaListagem, onChange:function(ev){setBuscaListagem(ev.target.value);}, placeholder:"Buscar revendedora nas listagens",
      className:"h-10 rounded-xl bg-white px-3 text-sm text-[#111827] outline-none ring-1 ring-black/5 placeholder:text-[#9CA3AF]"}),
    minhasLOrdenadas.length===0
      ? e("div",{className:"rounded-2xl bg-[#1C1C1E] p-4 text-center text-[13px] text-[#8E8E93]"},"Nenhuma listagem aberta no momento.")
      : e(React.Fragment,null,
          e("div",{className:"flex gap-1.5 overflow-x-auto pb-1"}, minhasLOrdenadas.map(function(x){ var ativo = listagemVista && listagemVista.id===x.id;
            return e("button",{key:x.id, onClick:function(){setLidVista(x.id);}, className:"shrink-0 rounded-full px-3 py-1.5 text-[12px] font-bold whitespace-nowrap "+(ativo?ouro:"bg-[#1C1C1E] text-[#8E8E93]")},
              fmtDataISO(x.data)+(x.data===hojeISOStr?" · Hoje":"")+" · "+x.horario); })),
          listagemVista && e("div",{className:"overflow-hidden rounded-2xl border "+LINHA_CARD, style:{background:"linear-gradient(135deg,#FFFFFF 0%,#F5E6BE 100%)"}},
            e("div",{className:"flex items-center justify-between gap-2 px-3.5 py-3"},
              e("div",null,
                e("b",{className:"text-[15px] text-[#111827]"}, "Retirada "+listagemVista.horario+" · "+listagemVista.destino),
                e("p",{className:"text-[12px] text-[#6B7280]"}, fmtDataISO(listagemVista.data)+(listagemVista.data===hojeISOStr?" (hoje)":"")+(listagemVista.viagem?" · Viagem":""))),
              e("span",{className:"shrink-0 rounded-full px-2.5 py-1 text-[12px] font-bold",
                style: listagemCheia(s,listagemVista.id) ? {background:"#DC26261F", color:"#DC2626"} : {background:"#16A34A1F", color:"#16A34A"}},
                kitsNaListagem(s,listagemVista.id)+"/"+(listagemVista.viagem?"∞":capacidadeListagem(listagemVista))))),
          listagemVista && kitsVistaFiltrados.length===0 && e("p",{className:"rounded-2xl bg-[#1C1C1E] p-3 text-center text-[12px] text-[#8E8E93]"},
            buscaLNorm ? "Ninguém com esse nome nessa listagem." : "Nenhuma revendedora nessa listagem ainda."),
          listagemVista && kitsVistaFiltrados.length>0 && e("div",{className:"overflow-hidden rounded-2xl border "+LINHA_CARD+" bg-white"}, kitsVistaFiltrados.map(function(k){
            return e("button",{key:k.id, onClick:function(){ var alvo = cart.find(function(r){return r.rev===k.rev;}); if(alvo){ setSel(alvo.id); setTela("rev"); } },
                className:"flex w-full items-center gap-2 border-b "+LINHA_CARD+" px-3 py-2 text-left last:border-0"},
              ponto(k),
              e("div",{className:"min-w-0 flex-1"},
                e("p",{className:"truncate text-[13px] text-[#111827]"}, k.rev),
                k.bairro && e("p",{className:"truncate text-[11px] text-[#9A8B63]"}, k.bairro)),
              e("div",{className:"shrink-0 text-right"},
                k.horaAtend && e("p",{className:MONO+" text-[11.5px] text-[#6B7280]"}, k.horaAtend),
                e("p",{className:MONO+" text-[12px] font-semibold text-[#A67C12]"}, k.valor?BK(k.valor):"—"))); })),
          resultadosForaDaVista.length>0 && e("div",{className:"flex flex-col gap-1.5"},
            resultadosForaDaVista.map(function(k){ var lk = minhasL.find(function(x){return x.id===k.lid;});
              return e("button",{key:k.id, onClick:function(){setLidVista(k.lid); setBuscaListagem("");},
                  className:"flex items-center justify-between gap-2 rounded-xl border "+LINHA_CARD+" bg-white px-3 py-2 text-left text-[12.5px]"},
                e("span",{className:"min-w-0 flex-1 truncate text-[#111827]"}, k.rev+" está em outra listagem"),
                e("span",{className:MONO+" shrink-0 text-[#A67C12]"}, lk ? fmtDataISO(lk.data)+" · "+lk.horario : "")); }))),
    e("button",{onClick:function(){setTela("revs");}, className:"h-11 rounded-2xl border "+LINHA_CARD+" bg-white text-[13px] font-bold text-[#111827]"},"+ Adicionar revendedora numa listagem"));
  var estrelas = function(k){ var n = (notas[k.id]||{}).nota || 0;
    return e("div",{className:"flex gap-0.5"}, [1,2,3,4,5].map(function(i){ return e("button",{key:i, "aria-label":i+" estrelas",
      onClick:function(){ var o = Object.assign({}, notas); o[k.id] = Object.assign({faltas:0}, o[k.id], {nota:i}); setNotas(o); },
      className:"text-lg leading-none "+(i<=n?"text-amber-300":"text-white/25")}, "★"); })); };
  var faltasDe = function(k){ return (notas[k.id]||{}).faltas || 0; };
  var mudaFalta = function(k, dlt){ var o = Object.assign({}, notas); var at = Object.assign({nota:0, faltas:0}, o[k.id]); at.faltas = Math.max(0, at.faltas+dlt); o[k.id] = at; setNotas(o); };
  var dataChave = function(r){ var p = (r.data||"").split("/"); return p.length===2 ? (+p[1])*100+(+p[0]) : 0; };
  var filtradas = cart.filter(function(r){ return !busca || r.rev.toLowerCase().indexOf(busca.toLowerCase())>=0; }).sort(function(a,b){
    if(sortBy==="vendasMais") return vendMes(b)-vendMes(a);
    if(sortBy==="vendasMenos") return vendMes(a)-vendMes(b);
    var ph = (a.hoje?0:1)-(b.hoje?0:1); if(ph) return ph;
    var pd = dataChave(a)-dataChave(b); if(pd) return pd;
    return (a.hora||"").localeCompare(b.hora||""); });
  var flameLogo = e("svg",{viewBox:"0 0 24 30", width:13, height:16, "aria-hidden":true},
    e("defs",null, e("linearGradient",{id:"repFlame", x1:"0%", y1:"0%", x2:"0%", y2:"100%"},
      e("stop",{offset:"0%", stopColor:"#F1E4C6"}), e("stop",{offset:"55%", stopColor:"#E8B84B"}), e("stop",{offset:"100%", stopColor:"#B8862B"}))),
    e("path",{fill:"url(#repFlame)", d:"M12 0c2 4-3 6-3 10a3 3 0 0 0 6 0c0-1-.4-2-.4-2 2 1.5 3.4 4.2 3.4 7a6 6 0 1 1-12 0c0-6 4-8 6-15Z"}));
  var headerInicio = e("div",{className:"relative -mx-4 -mt-2 overflow-hidden rounded-b-[34px] bg-[#0B0B0D] px-5 pb-5 pt-4"},
    e("svg",{viewBox:"0 0 380 190", preserveAspectRatio:"none", className:"pointer-events-none absolute inset-0 h-full w-full", "aria-hidden":true},
      e("defs",null, e("linearGradient",{id:"repGoldA", x1:"0%", y1:"0%", x2:"100%", y2:"100%"},
        e("stop",{offset:"0%", stopColor:"#B8862B", stopOpacity:0.9}),
        e("stop",{offset:"55%", stopColor:"#E8B84B", stopOpacity:0.5}),
        e("stop",{offset:"100%", stopColor:"#F1E4C6", stopOpacity:0}))),
      e("path",{d:"M80 -30 C 200 15 250 65 410 35 L 410 -30 Z", fill:"url(#repGoldA)"}),
      e("path",{d:"M-30 140 C 90 95 220 175 410 105 L 410 210 L -30 210 Z", fill:"url(#repGoldA)", opacity:.35})),
    e("div",{className:"relative flex items-center justify-between gap-2"},
      e("div",{className:"flex min-w-0 items-center gap-2"},
        e(Avatar,{nome:l.rep, i:0, className:"size-10 shrink-0 text-base"}),
        e("span",{className:"flex min-w-0 items-center gap-1"},
          e("b",{className:"max-w-[6.5rem] truncate text-[15px] font-bold "+BR}, l.rep),
          e(Icon,{n:"chevrondown", s:12, className:"shrink-0 text-white/50"}))),
      e("span",{className:"flex shrink-0 items-center gap-1.5"}, flameLogo, e("b",{className:"text-[12.5px] font-black tracking-[.25em] text-amber-200"},"SORELLY")),
      e("button",{className:"relative grid size-9 shrink-0 place-items-center rounded-full bg-white/10"},
        e(Icon,{n:"sino", s:15, className:BR}),
        nAval>0 && e("span",{className:"absolute -right-1 -top-1 grid min-w-[1.1rem] place-items-center rounded-full bg-rose-500 px-1 text-[10px] font-bold "+BR}, nAval))),
    e("div",{className:"relative mt-3 flex items-center gap-1.5"}, [
      e(Icon,{key:"ic", n:"calendario", s:12, className:"shrink-0 text-white/40"}),
      meses.map(function(m,i){ return e("button",{key:m, onClick:function(){setMes(i);},
        className:"rounded-full px-2.5 py-1 text-[11px] font-semibold "+(mes===i ? "bg-amber-200 text-[#1B1409]" : "bg-white/8 "+BR)}, m+(i===0?" (atual)":"")); })]),
    e("div",{className:"relative mt-3 flex flex-col gap-1.5"},
      [{lb:"Vendido Total", v:BK(vendidoTotal), ic:"grafico", cor:"#F3D8A0"},
        {lb:"Acerto Total", v:BK(acertoTotal), ic:"wallet", cor:"#C6DFF8"},
        {lb:"Comissão Rep.", v:BK(comissaoRepTotal), ic:"coins", cor:"#C1EDD1"}].map(function(m){
        return e("div",{key:m.lb, className:"flex items-center justify-between gap-2 rounded-xl bg-white/8 px-3 py-2"},
          e("span",{className:"flex min-w-0 items-center gap-2"},
            e("span",{className:"grid size-6 shrink-0 place-items-center rounded-full bg-white/10", style:{color:m.cor}}, e(Icon,{n:m.ic, s:13, peso:"fill"})),
            e("b",{className:"truncate text-[12.5px] font-semibold "+BR}, m.lb)),
          e("span",{className:MONO+" shrink-0 whitespace-nowrap text-[13.5px] font-extrabold text-amber-200"}, m.v));
      })));
  var listaInicio = e("div",{className:"mt-3.5 flex flex-col gap-2.5"}, LISTA_INICIO.map(function(m){
    var conteudo = [
      e("span",{key:"ic", className:"grid size-11 shrink-0 place-items-center rounded-2xl", style:{background:m.cor+"1F", color:m.cor}}, e(Icon,{n:m.icone, s:20, peso:"fill"})),
      e("div",{key:"tx", className:"min-w-0 flex-1"}, e("b",{className:"block text-[15px] text-[#111827]"}, m.titulo), e("span",{className:"block truncate text-[12.5px] text-[#6B7280]"}, m.sub)),
      m.ativo ? e(Icon,{key:"ch", n:"chevron", s:16, className:"shrink-0 text-[#9CA3AF]"})
        : e("span",{key:"ch", className:"shrink-0 rounded-full bg-[#F3F4F6] px-2 py-0.5 text-[10.5px] font-semibold text-[#9CA3AF]"}, "Em breve")];
    return m.ativo
      ? e("button",{key:m.tela, onClick:function(){setTela(m.tela);}, className:"flex w-full items-center gap-3 rounded-2xl bg-white p-3 text-left shadow-sm active:scale-[.99]"}, conteudo)
      : e("div",{key:m.tela, className:"flex w-full items-center gap-3 rounded-2xl bg-white/70 p-3 opacity-70"}, conteudo); }));
  return e(IPhone17ProMax,null,
    tela==="calcacerto" && calcAcertoScreen,
    tela==="inicio" && headerInicio,
    tela!=="calcacerto" && tela!=="inicio" && tela!=="revs" && tela!=="rev" && tela!=="novos" && tela!=="listagens" && e("div",null,
      e("div",{className:"flex items-center gap-3"},
        e(Avatar,{nome:l.rep, i:0}),
        e("div",{className:"min-w-0 flex-1"}, e("p",{className:"text-[12px] text-[#8E8E93]"},"Olá, representante"), e("p",{className:"truncate text-xl font-bold"}, l.rep)),
        e("span",{className:"rounded-full bg-[#1C1C1E] px-2.5 py-1 text-[11px] font-semibold text-amber-200"}, "Retirada "+l.horario)),
      e("div",{className:"mt-3 flex gap-1.5"}, meses.map(function(m,i){ return e("button",{key:m, onClick:function(){setMes(i);},
        className:"flex-1 rounded-full py-1.5 text-[12px] font-bold "+(mes===i ? ouro : "bg-[#1C1C1E] text-[#8E8E93]")}, m+(i===0?" (atual)":"")); })),
      e("div",{className:"mt-2.5 grid grid-cols-2 gap-2"},
        e("div",{className:"rounded-xl bg-[#1C1C1E] px-3 py-2"}, e("p",{className:"text-[11px] text-[#8E8E93]"},"Total vendido"), e("p",{className:MONO+" text-lg font-bold"}, BK(tot))),
        e("div",{className:"rounded-xl bg-[#1C1C1E] px-3 py-2"}, e("p",{className:"text-[11px] text-[#8E8E93]"},"Comissão prevista"), e("p",{className:MONO+" text-lg font-bold text-amber-200"}, BK(tot*PCT_REPRESENTANTE))))),
    tela==="revs" && e("div",{className:"sticky -top-2 z-20 -mx-4 -mt-2 flex flex-col gap-3 bg-[#0B0B0D] px-4 pb-3 pt-4"},
      e("div",{className:"flex items-center gap-2"},
        e("button",{onClick:function(){setTela("inicio");}, "aria-label":"Voltar ao início", className:"grid size-8 shrink-0 place-items-center rounded-full bg-white/10 text-white"},
          e(Icon,{n:"chevron", s:15, className:"rotate-180"})),
        e("b",{className:"text-[13px] font-black uppercase tracking-[.18em] "+BR}, "Revendedoras")),
      e("div",{className:"flex items-center gap-2"},
        e("input",{value:busca, onChange:function(ev){setBusca(ev.target.value);}, placeholder:"Buscar revendedora",
          className:"h-10 flex-1 rounded-xl bg-white px-3 text-sm text-[#111827] outline-none ring-1 ring-black/5 placeholder:text-[#9CA3AF]"}),
        e("button",{onClick:function(){setFiltrosAbertos(!filtrosAbertos);}, "aria-label":"Filtros",
          className:"grid size-10 shrink-0 place-items-center rounded-xl "+(filtrosAbertos ? "bg-amber-200 text-[#1B1409]" : "bg-white/10 "+BR)},
          e(Icon,{n:"settings", s:16}))),
      filtrosAbertos && e("div",{className:"flex items-center gap-1.5"}, [
        {k:"data", lb:"Data"}, {k:"vendasMais", lb:"+ Vendas"}, {k:"vendasMenos", lb:"− Vendas"}].map(function(o){
        return e("button",{key:o.k, onClick:function(){setSortBy(o.k);},
          className:"rounded-full px-2.5 py-1 text-[11px] font-semibold "+(sortBy===o.k ? "bg-amber-200 text-[#1B1409]" : "bg-white/8 "+BR)}, o.lb); }))),
    tela==="rev" && sel && e("div",{className:"sticky -top-2 z-20 -mx-4 -mt-2 flex items-center gap-2 bg-[#0B0B0D] px-4 pb-3 pt-4"},
      e("button",{onClick:function(){setTela("revs");}, "aria-label":"Voltar pra Revendedoras", className:"grid size-8 shrink-0 place-items-center rounded-full bg-white/10 text-white"},
        e(Icon,{n:"chevron", s:15, className:"rotate-180"})),
      e("b",{className:"text-[13px] font-black uppercase tracking-[.18em] "+BR}, "Revendedora")),
    tela==="novos" && e("div",{className:"sticky -top-2 z-20 -mx-4 -mt-2 flex items-center gap-2 bg-[#0B0B0D] px-4 pb-3 pt-4"},
      e("button",{onClick:function(){setTela("inicio");}, "aria-label":"Voltar ao início", className:"grid size-8 shrink-0 place-items-center rounded-full bg-white/10 text-white"},
        e(Icon,{n:"chevron", s:15, className:"rotate-180"})),
      e("b",{className:"text-[13px] font-black uppercase tracking-[.18em] "+BR}, "Kits novos")),
    tela==="listagens" && e("div",{className:"sticky -top-2 z-20 -mx-4 -mt-2 flex items-center gap-2 bg-[#0B0B0D] px-4 pb-3 pt-4"},
      e("button",{onClick:function(){setTela("inicio");}, "aria-label":"Voltar ao início", className:"grid size-8 shrink-0 place-items-center rounded-full bg-white/10 text-white"},
        e(Icon,{n:"chevron", s:15, className:"rotate-180"})),
      e("b",{className:"text-[13px] font-black uppercase tracking-[.18em] "+BR}, "Listagens")),
    tela!=="calcacerto" && e(RecebimentoRep,{l:l}),
    tela!=="calcacerto" && tela!=="inicio" && tela!=="revs" && tela!=="rev" && tela!=="novos" && tela!=="listagens" && e("div",{className:"mb-3"}, voltar),
    tela==="inicio" && listaInicio,
    tela==="revs" && e("div",{className:"mt-3 flex flex-col gap-2.5"},
      filtradas.map(cartao)),
    tela==="rev" && telaRev,
    tela==="novos" && e("div",{className:"mt-3"}, e(KitsNovosRep,{l:l})),
    tela==="listagens" && telaListagens,
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
