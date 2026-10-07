// Sorelly Admin · montagem — pages/LimiteFaturamento.js
// Um bloco por CNPJ com o fiscal do ano (faturamento, ILF, brindes, notas de entrada) e a projeção até 31/12 contra o limite anual.
// Em ordem do menor ILF para o maior. Quem lança: o resumo fiscal (botão no bloco, guardado em state.fiscal.hist) e as contas a pagar por CNPJ (tela Contas a pagar).
// Alerta pela projeção: verde até 90% do limite, amarelo até 100%, vermelho acima.
import { COLUNAS_CONTAS, SUBLIMITE_ANUAL, VERDE_ATE_PCT, cnpjsDe, fiscalAtual, indicadoresFiscais, projecaoCnpj } from "@/apps/montagem/domain/cnpjs";
import { use } from "@/apps/montagem/state/context";
import { INPUT, MONO, MoneyInput, brl } from "@/apps/montagem/ui/input";
import { PageHead } from "@/apps/montagem/ui/page";
import { e, useState } from "@/shared/react";
import React from "react";

var EDIT_INPUT = INPUT+" h-9! w-full border-white/30! bg-black/25! text-center text-white!";
var NIVEL = {verde:["✓ Dentro do limite","bg-white/90 text-black"], amarelo:["⚠ Perto do limite","bg-amber-300 text-black"], vermelho:["✕ Vai passar do limite","bg-red-600 text-white"]};
var BTN = "rounded-lg border border-white/40 bg-black/20 px-3 py-1.5 text-[12.5px] font-semibold text-white hover:bg-black/35";
function pct(n, dec){ return n.toLocaleString("pt-BR",{minimumFractionDigits:dec||1, maximumFractionDigits:dec||1})+"%"; }
function dataBR(iso){ var p = (iso||"").split("-"); return p.length===3 ? p[2]+"/"+p[1]+"/"+p[0] : "—"; }
function hojeIso(){ var d = new Date(); return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0"); }
function Info(p){
  return e("div",{className:"flex min-w-0 flex-col items-center gap-0.5 text-center"},
    e("span",{className:"text-[11px] font-semibold uppercase tracking-wide text-white/70"}, p.rot),
    p.children || e("span",{className:MONO+" font-semibold text-white "+(p.big?"text-[20px] font-bold":"text-[15px]")}, p.v));
}
function IrContas(){
  var d = use().dispatch;
  return e("button",{className:BTN, onClick:function(){ d({type:"VER_FIN", v:"cnpj"}); d({type:"ABA", aba:"contaspagar"}); }}, "Lançar contas a pagar");
}
function FormLancar(p){
  var d = use().dispatch, a = p.atual;
  var st = useState({data:hojeIso(), fatAnual:a.fatAnual||0, brindesMes:a.brindesMes||0, entradaMes:a.entradaMes||0, entradaAnual:a.entradaAnual||0}), l = st[0], setL = st[1];
  var campo = function(k, rot){
    return e(Info,{rot:rot}, e(MoneyInput,{value:l[k], label:p.c.nome+" "+rot, className:"w-full border-white/30! bg-black/25! text-white!", onChange:function(x){ setL(Object.assign({}, l, {[k]:x})); }}));
  };
  return e("div",{className:"flex flex-col items-center gap-3 rounded-xl border border-white/30 bg-black/25 p-3"},
    e("span",{className:"text-center text-[13px] text-white/85"}, "Digite os números do resumo fiscal (acumulado do ano até a data escolhida) e clique em Salvar. O ILF e a projeção se atualizam sozinhos."),
    e("div",{className:"grid w-full grid-cols-1 gap-3 sm:grid-cols-2"},
      e(Info,{rot:"Valem até o dia"}, e("input",{type:"date", className:EDIT_INPUT, value:l.data, "aria-label":"Data do resumo fiscal", onChange:function(ev){ setL(Object.assign({}, l, {data:ev.target.value})); }})),
      campo("fatAnual","Faturamento fiscal anual"), campo("brindesMes","Brindes do mês"), campo("entradaMes","Notas de entrada do mês"), campo("entradaAnual","Notas de entrada no ano")),
    e("div",{className:"flex gap-2"},
      e("button",{disabled:!l.data, onClick:function(){ d({type:"FISCAL_LANCAR", id:p.c.id, l:l}); p.onFim(); }, className:"rounded-lg bg-white px-5 py-1.5 text-[13px] font-bold text-black disabled:opacity-50"}, "Salvar lançamento"),
      e("button",{onClick:p.onFim, className:BTN}, "Cancelar")));
}
function Bloco(p){
  var cx = use(), s = cx.state, d = cx.dispatch, c = p.c, f = p.f, pr = p.pr, nv = NIVEL[pr.nivel], ind = indicadoresFiscais(f);
  var lc = useState(false), lancando = lc[0], setLancando = lc[1];
  var hist = (((s.fiscal||{}).hist||{})[c.id]||[]).slice().sort(function(a,b){ return a.data<b.data ? 1 : -1; });
  var temFiscal = !!f.data;
  return e("section",{className:"flex flex-col gap-3 rounded-2xl p-4 shadow-lg", style:{background:c.cor}},
    e("div",{className:"flex flex-col items-center gap-1.5 text-center"},
      e("span",{className:"text-[11px] font-bold uppercase tracking-widest text-white/75"}, c.num ? "CNPJ "+c.num : "Empresa"),
      e("h2",{className:"font-heading text-xl font-semibold text-white"}, c.nome),
      temFiscal && e("span",{className:"rounded-full px-2.5 py-1 text-[12px] font-bold "+nv[1]}, nv[0])),
    temFiscal
      ? e(React.Fragment,null,
        e("span",{className:"text-center text-[12px] text-white/70"}, "Fiscal até "+dataBR(f.data)),
        e("div",{className:"grid grid-cols-3 gap-2"},
          e(Info,{rot:"Faturamento fiscal anual", v:brl(f.fatAnual), big:true}),
          e(Info,{rot:"Falta p/ sublimite", v:brl(ind.falta), big:true}),
          e(Info,{rot:"ILF", v:pct(ind.ilf,2), big:true})),
        e("div",{className:"grid grid-cols-3 gap-2 rounded-xl bg-black/25 px-3 py-2.5"},
          e(Info,{rot:"Brindes do mês", v:brl(f.brindesMes)}),
          e(Info,{rot:"Notas de entrada do mês", v:brl(f.entradaMes)}),
          e(Info,{rot:"Notas de entrada no ano", v:brl(f.entradaAnual)})),
        e("div",{className:"grid grid-cols-3 gap-2"},
          e(Info,{rot:"+ Contas a pagar até 31/12", v:brl(pr.contas)}),
          e(Info,{rot:"= Projetado em 31/12", v:brl(pr.projetado), big:true}),
          e(Info,{rot:"Pode faturar por mês", v:brl(pr.porMes)})),
        e("div",{className:"flex flex-col gap-1"},
          e("div",{className:"relative h-3 overflow-hidden rounded-full bg-black/35", role:"img", "aria-label":pct(pr.pct)+" do limite na projeção"},
            e("div",{className:"h-full rounded-full "+(pr.nivel==="vermelho"?"bg-red-500":pr.nivel==="amarelo"?"bg-amber-300":"bg-white"), style:{width:Math.min(100, pr.pct)+"%"}}),
            e("div",{className:"absolute top-0 h-full w-0.5 bg-black/60", style:{left:VERDE_ATE_PCT+"%"}})),
          e("span",{className:"text-center text-[12px] text-white/75"}, pct(pr.pct)+" do limite de "+brl(SUBLIMITE_ANUAL)+" · "+(pr.sobra>=0 ? "sobram "+brl(pr.sobra) : "passa "+brl(-pr.sobra)))))
      : e("span",{className:"text-center text-[14px] text-white/80"}, "Sem informações fiscais por enquanto."),
    lancando
      ? e(FormLancar,{c:c, atual:f, onFim:function(){ setLancando(false); }})
      : e("div",{className:"flex flex-wrap justify-center gap-2"},
        e("button",{onClick:function(){ setLancando(true); }, className:"rounded-lg bg-white px-4 py-1.5 text-[12.5px] font-bold text-black"}, "Lançar resumo fiscal"),
        e(IrContas,null)),
    hist.length>0 && e("div",{className:"flex flex-col gap-1 border-t border-white/20 pt-2"},
      e("span",{className:"text-center text-[11px] font-semibold uppercase tracking-wide text-white/70"}, "Lançamentos fiscais"),
      hist.slice(0,3).map(function(h){
        return e("div",{key:h.data, className:"grid grid-cols-[1fr_1.5fr_1fr_auto] items-center gap-2 text-center text-[13px] text-white"},
          e("span",null, dataBR(h.data)), e("span",{className:MONO}, brl(h.fatAnual)), e("span",{className:MONO}, "ILF "+pct(indicadoresFiscais(h).ilf,2)),
          e("button",{onClick:function(){ d({type:"FISCAL_APAGAR", id:c.id, data:h.data}); }, className:"text-[12px] text-white/70 underline hover:text-white", "aria-label":"Apagar lançamento de "+dataBR(h.data)}, "apagar"));
      })));
}
function AbaLimiteFaturamento(){
  var s = use().state;
  var ano = String((fiscalAtual(s.fiscal,"34").data||"").slice(0,4) || new Date().getFullYear());
  var cc = (s.contasCnpj||{})[ano]||{};
  var lista = cnpjsDe(s.cnpjs).map(function(c){ var f = fiscalAtual(s.fiscal, c.id); return {c:c, f:f, pr:projecaoCnpj(c.id, f, s.contasCnpj), ilf: f.data ? indicadoresFiscais(f).ilf : Infinity}; })
    .sort(function(a,b){ return a.ilf-b.ilf; });   // menor ILF primeiro; sem dados fiscais por último
  var ate = fiscalAtual(s.fiscal,"34").data, mesAte = ate ? Number(ate.slice(5,7))-1 : -1;   // meses depois do último lançamento fiscal
  var restantes = [0,1,2,3,4,5,6,7,8,9,10,11].filter(function(m){ return m>mesAte; });
  var somaCol = function(id){ return restantes.reduce(function(t,m){ return t+(((cc[id]||{})[m])||0); },0); };
  var contasSem = somaCol("sem");
  var totalContas = COLUNAS_CONTAS.reduce(function(t,col){ return t+somaCol(col[0]); },0);
  var cor = "#374151";
  return e(React.Fragment,null,
    e(PageHead,{t:"Limite de faturamento", sub:"Fiscal do ano e contas a pagar até 31/12, contra o limite de "+brl(SUBLIMITE_ANUAL)+" por CNPJ. Em ordem do menor ILF. Verde até "+VERDE_ATE_PCT+"%."}),
    e("div",{className:"mx-auto flex w-full max-w-4xl flex-col gap-3"},
      e("div",{className:"grid grid-cols-2 gap-2 rounded-2xl p-4 text-center", style:{background:cor}},
        e(Info,{rot:"Total de contas a pagar até 31/12 (todos)", v:brl(totalContas), big:true}),
        e(Info,{rot:"Desse total, sem CNPJ", v:brl(contasSem), big:true})),
      lista.map(function(x){ return e(Bloco,{key:x.c.id, c:x.c, f:x.f, pr:x.pr}); }),
      e("section",{className:"flex flex-col items-center gap-2 rounded-2xl p-4 text-center", style:{background:cor}},
        e("h2",{className:"font-heading text-xl font-semibold text-white"}, "Contas sem CNPJ"),
        e(Info,{rot:"A pagar até 31/12", v:brl(contasSem), big:true}),
        e("span",{className:"text-[12px] text-white/70"}, "Não entram no limite de nenhum CNPJ. Ficam aqui para você enxergar o total."),
        e(IrContas,null))));
}

export { AbaLimiteFaturamento };
