// Sorelly Admin · montagem e bipagem — pages/VisaoGeral.js
// Extraído de sorelly_admin_montagem_bipagem.html; depois com o gráfico ganhando o mesmo seletor de janela (7 a 90 dias,
// mês atual ou história completa) e projeção da Previsão de faturamento, em vez de mostrar sempre o ano corrente fixo.
import { BlocoBarra } from "@/apps/montagem/components/equipe-blocos";
import { GraficoColunasRevendedoras } from "@/apps/montagem/components/grafico-revendedoras";
import { JANELAS_GRAFICO_REV, pontosRevendedoras, projetarAno } from "@/apps/montagem/domain/financeiro";
import { BK } from "@/apps/montagem/lib/format";
import { use } from "@/apps/montagem/state/context";
import { MONO } from "@/apps/montagem/ui/input";
import { PageHead } from "@/apps/montagem/ui/page";
import { e, useState } from "@/shared/react";
import React from "react";

// ── Visão geral (visível pra toda a equipe): crescimento de revendedoras + resultado do ano (30 dias de janela) ──
function AbaVisaoGeral(){
  var s = use().state;
  var hoje = new Date(), ano = hoje.getFullYear(), mes = hoje.getMonth(), anoStr = String(ano);
  var proj = projetarAno(s, anoStr, 2);   // janela fixa de 30 dias, pra não depender de escolha manual nesta tela
  var totAnoContas = [0,1,2,3,4,5,6,7,8,9,10,11].reduce(function(t,i){ var m = Object.assign({pago:0,apagar:0}, ((s.contasPagar||{})[anoStr]||{})[i]); return t+m.pago+m.apagar; },0);
  var recebidoAnoAteAgora = proj.porMes.reduce(function(t,x){ return x.mes<=mes ? t+x.valor : t; }, 0);
  var faturamentoFuturo = proj.porMes.reduce(function(t,x){ return x.tipo==="projetado" ? t+x.valor : t; }, 0);
  var faturamentoAnoPrevisto = recebidoAnoAteAgora + faturamentoFuturo;
  var resultadoAno = faturamentoAnoPrevisto - totAnoContas;
  var jg = useState(2), janelaGrafico = jg[0], setJanelaGrafico = jg[1];   // janela de exibição do gráfico (7/15/30/60/90 dias, mês atual ou história completa)
  var linha = function(lb, v, cor){ return e("div",{className:"flex items-start justify-between gap-2 py-0.5 text-[13px] leading-tight"},
    e("span",{className:"min-w-0"}, lb), e("b",{className:MONO+" shrink-0 whitespace-nowrap "+(cor||"")}, v)); };
  return e(React.Fragment,null,
    e(PageHead,{t:"Visão geral", sub:"Crescimento de revendedoras e resultado do ano, sempre atualizados."}),
    e("div",{className:"grid grid-cols-1 gap-4 lg:grid-cols-3"},
      e("div",{className:"lg:col-span-2"},
        e(BlocoBarra,{t:"Crescimento de revendedoras", sub:"escolha quantos dias mostrar — sempre com a projeção até dezembro junto"},
          e("div",{className:"flex flex-col gap-2 p-3"},
            e("div",{className:"flex flex-wrap gap-1.5"},
              JANELAS_GRAFICO_REV.map(function(x,i){ return e("button",{key:i, onClick:function(){setJanelaGrafico(i);},
                className:"rounded-lg px-2.5 py-1 text-[11.5px] font-semibold ring-1 "+(janelaGrafico===i ? "bg-primary/15 ring-2 ring-primary" : "bg-card ring-border hover:bg-muted/40")}, x.lb); })),
            e(GraficoColunasRevendedoras,{pontos:pontosRevendedoras(s, Object.assign({projetarMeses:11-mes, janela:2}, JANELAS_GRAFICO_REV[janelaGrafico]))})))),
      e(BlocoBarra,{cor:"roxo", t:"Resultado do ano "+ano, sub:"previsão com base no crescimento dos últimos 30 dias"},
        e("div",{className:"flex flex-col gap-2 p-3"},
          e("div",{className:"flex flex-col rounded-lg bg-black/10 px-2.5 py-1.5"},
            linha("Faturamento anual previsto", BK(faturamentoAnoPrevisto), "text-success"), linha("Contas a pagar anual previsto", BK(totAnoContas), "text-destructive"),
            e("div",{className:"my-1 h-px bg-border"}),
            e("div",{className:"flex items-center justify-between gap-3 py-0.5"},
              e("b",{className:"text-[13px] "+(resultadoAno<0?"text-destructive":"text-success")},"Resultado final do ano"),
              e("b",{className:MONO+" text-[15px] "+(resultadoAno<0?"text-destructive":"text-success")}, BK(resultadoAno)))),
          e("p",{className:"text-[11px] text-warning"},"Esse card mostra valor em dinheiro — hoje a regra do sistema é que só a diretoria e a Deysiane veem valores. Confirmar com o Marcus se pode ficar visível aqui pra toda a equipe.")))));
}

export { AbaVisaoGeral };
