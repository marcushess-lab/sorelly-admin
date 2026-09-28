// Sorelly Admin · montagem e bipagem — pages/ContasPagar.js
// Extraído de sorelly_admin_montagem_bipagem.html sem alterar o corpo das funções.
import { BlocoBarra } from "@/apps/montagem/components/equipe-blocos";
import { MESES_LONGO } from "@/apps/montagem/domain/financeiro";
import { BK } from "@/apps/montagem/lib/format";
import { use } from "@/apps/montagem/state/context";
import { badge } from "@/apps/montagem/ui/badge";
import { Btn } from "@/apps/montagem/ui/button";
import { KPI, Vazio } from "@/apps/montagem/ui/card";
import { MONO, MoneyInput } from "@/apps/montagem/ui/input";
import { PageHead } from "@/apps/montagem/ui/page";
import { e, useState } from "@/shared/react";
import React from "react";

// ── Contas a pagar: lançamento manual por mês (só Pago e A pagar; o Total é sempre calculado). Visão Total (consolidada) e Por CNPJ (pendente). ──
function LinhaMes(p){
  var cx = use(), d = cx.dispatch, i = p.i, m = p.m, atual = p.atual, ano = p.ano;
  var total = (m.pago||0) + (m.apagar||0);
  var passado = i < p.mesAtualIdx;
  var cor = atual ? "border-warning/60 bg-warning/5" : passado && m.apagar>0 ? "border-destructive/40 bg-destructive/5" : passado ? "border-success/30 bg-success/5" : "border-border bg-card";
  var money = function(campo, v){ return e(MoneyInput,{value:v, disabled:m.fixado, sm:true, className:"w-full", "aria-label":MESES_LONGO[i]+" "+campo,
    onChange:function(x){ d({type:"CP_SET", ano:ano, mes:i, campo:campo, valor:x}); }}); };
  return e("div",{className:"grid grid-cols-[9rem_1fr_1fr_1fr_5.5rem] items-center gap-2.5 rounded-xl border px-3 py-2 "+cor},
    e("span",{className:"flex items-center gap-1.5 truncate text-[13.5px] font-semibold"}, MESES_LONGO[i],
      atual && badge("atual","warning"), m.fixado && badge("fixado","muted","lock")),
    money("pago", m.pago||0), money("apagar", m.apagar||0),
    e("b",{className:MONO+" text-center text-[13.5px] "+(total>0?"text-primary":"text-muted-foreground")}, BK(total)),
    e(Btn,{v:"ghost", sm:true, ic: m.fixado?"unlock":"lock", onClick:function(){ d({type:"CP_FIXAR", ano:ano, mes:i}); }}, m.fixado?"Reabrir":"Fixar"));
}
function AbaContasPagar(){
  var cx = use(), s = cx.state, d = cx.dispatch;
  var hoje = new Date();
  var an = useState(hoje.getFullYear()), ano = an[0], setAno = an[1];
  var anoStr = String(ano);
  var dados = (s.contasPagar && s.contasPagar[anoStr]) || {};
  var mesAtualIdx = ano===hoje.getFullYear() ? hoje.getMonth() : -1;
  var linha = function(i){ return Object.assign({pago:0, apagar:0, fixado:false}, dados[i]); };
  var meses = [0,1,2,3,4,5,6,7,8,9,10,11].map(linha);
  var totPago = meses.reduce(function(t,m){return t+(m.pago||0);},0), totAPagar = meses.reduce(function(t,m){return t+(m.apagar||0);},0);
  var mesesComPago = meses.filter(function(m){return m.pago>0;}).length;
  var verFin = s.verFinanceiro || "total";
  return e(React.Fragment,null,
    e(PageHead,{t:"Contas a pagar", sub:"Lançamento manual por mês: só Pago e A pagar. Nada de conta por conta — o Total sai sozinho. Vermelho = mês passado com pendência, amarelo = mês atual, verde = ok."},
      e("div",{className:"flex items-center gap-1"},
        e(Btn,{v:"ghost", sm:true, ic:"chevron", onClick:function(){setAno(ano-1);}},""),
        e("span",{className:"grid h-9 min-w-[4.5rem] place-items-center rounded-lg border border-primary/40 bg-primary/10 px-3 text-sm font-bold"}, ano),
        e(Btn,{v:"ghost", sm:true, ic:"chevrondown", onClick:function(){setAno(ano+1);}},""))),
    e("div",{className:"flex gap-1 self-start rounded-lg bg-muted p-1 text-[12.5px] font-semibold"},
      e("button",{onClick:function(){d({type:"VER_FIN", v:"total"});}, className:"rounded-md px-3 py-1.5 "+(verFin==="total"?"bg-primary text-primary-foreground":"hover:bg-card")},"Total (consolidado)"),
      e("button",{onClick:function(){d({type:"VER_FIN", v:"cnpj"});}, className:"rounded-md px-3 py-1.5 "+(verFin==="cnpj"?"bg-primary text-primary-foreground":"hover:bg-card")},"Por CNPJ")),
    verFin==="cnpj"
      ? e(Vazio,{txt:"Aguardando a lista de CNPJs da Sorelly para separar por empresa. Quando chegar, esta visão soma para bater com o Total."})
      : e(React.Fragment,null,
        e("div",{className:"grid grid-cols-2 gap-2 md:grid-cols-4"},
          e(KPI,{compacto:true, l:"Valor médio pago no ano", v:BK(mesesComPago ? totPago/mesesComPago : 0), sub:mesesComPago+" meses com pagamento"}),
          e(KPI,{compacto:true, l:"Pago no ano", v:BK(totPago), tom:"text-success"}),
          e(KPI,{compacto:true, l:"A pagar no ano", v:BK(totAPagar), tom:totAPagar?"text-destructive":""}),
          e(KPI,{compacto:true, l:"Total do ano", v:BK(totPago+totAPagar)})),
        e(BlocoBarra,{t:"Contas a pagar de "+ano, sub:"cada mês só precisa do Pago e do A pagar; o Total é calculado"},
          e("div",{className:"flex flex-col gap-1.5 p-3"},
            e("div",{className:"grid grid-cols-[9rem_1fr_1fr_1fr_5.5rem] gap-2.5 px-3 text-center text-[11px] font-semibold uppercase tracking-wide text-muted-foreground"},
              e("span",{className:"text-left"},"Mês"), e("span",null,"Pago"), e("span",null,"A pagar"), e("span",null,"Total"), e("span",null,"")),
            meses.map(function(m,i){ return e(LinhaMes,{key:i, i:i, m:m, ano:anoStr, atual:i===mesAtualIdx, mesAtualIdx: mesAtualIdx<0 ? 12 : mesAtualIdx}); })))));
}

export { LinhaMes, AbaContasPagar };
