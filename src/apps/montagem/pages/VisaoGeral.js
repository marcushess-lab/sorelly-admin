// Sorelly Admin · montagem e bipagem — pages/VisaoGeral.js
// Extraído de sorelly_admin_montagem_bipagem.html; depois com o gráfico ganhando o mesmo seletor de janela (7 a 90 dias,
// mês atual ou história completa) e projeção da Previsão de faturamento, em vez de mostrar sempre o ano corrente fixo.
import { BlocoBarra } from "@/apps/montagem/components/equipe-blocos";
import { GraficoColunasRevendedoras } from "@/apps/montagem/components/grafico-revendedoras";
import { JANELAS_GRAFICO_REV, MESES_LONGO, pontosRevendedoras, projetarAno, resumoMensalRevendedoras } from "@/apps/montagem/domain/financeiro";
import { statusLinhaFin } from "@/apps/montagem/domain/atendimento-interno";
import { CampoDinheiro } from "@/apps/montagem/mobile/campos";
import { podeConferirPag, nomeDe, papelDe } from "@/apps/montagem/domain/equipe";
import { formasPagamentoPadrao } from "@/apps/montagem/domain/consignado";
import { Btn } from "@/apps/montagem/ui/button";
import { INPUT, NumInput } from "@/apps/montagem/ui/input";
import { BK, isoDia } from "@/apps/montagem/lib/format";
import { use } from "@/apps/montagem/state/context";
import { MONO } from "@/apps/montagem/ui/input";
import { PageHead } from "@/apps/montagem/ui/page";
import { e, useState } from "@/shared/react";
import React from "react";

// ── Pagamentos do atendimento interno para conferir: a diretoria e a Ana Maria definem a conta de cada pagamento, esperam o comprovante e confirmam ──
var hm = function(ts){ var n = new Date(ts); return String(n.getHours()).padStart(2,"0")+":"+String(n.getMinutes()).padStart(2,"0"); };
function PagamentosAConferir(p){
  var cx = use(), s = cx.state, d = cx.dispatch, quem = nomeDe(s.usuario);
  var formas = (s.formasPagamento || formasPagamentoPadrao()).filter(function(f){ return f.k!=="pix_representante"; });
  var formaDe = function(k){ return formas.find(function(f){ return f.k===k; }) || {k:k, label:k, descricoes:[]}; };
  var lista = s.lancFin || [], pend = lista.filter(function(x){ return !x.conferido; }), feitos = lista.filter(function(x){ return x.conferido; });
  var CP = INPUT+" h-9! w-full text-[13px]!";
  var SK = {aguardando:["Definir as contas","#F59E0B"], conta:["Falta comprovante / OK","#38BDF8"], ok:["✓ Conferido","#22C55E"], isento:["Isento","#9CA3AF"]};
  // todas as formas de pagamento com todas as contas (a da própria linha vem primeiro)
  var opcoesContas = function(forma){ var ordem = formas.filter(function(fm){ return fm.k===forma; }).concat(formas.filter(function(fm){ return fm.k!==forma; }));
    return ordem.map(function(fm){ return e("optgroup",{key:fm.k, label:fm.label}, (fm.descricoes||[]).map(function(c){ return e("option",{key:fm.k+c, value:c}, c); })); }); };
  // uma linha enviada (ex.: Pix R$ 7.000) pode ser dividida em várias contas; o comprovante quem anexa é a funcionária que bipa
  var linha = function(x, l, i){
    var sk = statusLinhaFin(l), brinde = l.tipo==="brinde", ps = l.partes || [];
    var soma = ps.reduce(function(t,q){ return t+(q.valor||0); }, 0), difere = Math.abs(soma-l.valor)>0.009;
    var linhaPatch = function(pt){ d({type:"FIN_LINHA", id:x.id, i:i, patch:pt, por:quem}); };
    var partePatch = function(j, pt){ linhaPatch({partes:ps.map(function(q,k){ return k===j ? Object.assign({}, q, pt) : q; })}); };
    return e("div",{key:i, className:"flex flex-col gap-1.5 rounded-lg bg-black/20 px-3 py-2 text-left text-[13px]"},
      e("div",{className:"flex flex-wrap items-center gap-x-3 gap-y-1"},
        e("b",{className:"text-[14px]"}, brinde ? "Diferença do brinde" : formaDe(l.forma).label), e("b",{className:MONO+" text-[15px] text-primary"}, BK(l.valor)),
        e("span",{className:"rounded-md px-2 py-0.5 text-[11.5px] font-bold", style:{background:SK[sk][1]+"26", color:SK[sk][1]}}, SK[sk][0]),
        brinde && sk!=="ok" && e(Btn,{v:l.isento ? "secondary" : "ghost", sm:true, onClick:function(){ linhaPatch({isento:!l.isento}); }}, l.isento ? "Desfazer isenção" : "Isentar")),
      !l.isento && ps.map(function(q,j){ var fechado = q.ok;
        return e("div",{key:j, className:"grid grid-cols-1 items-center gap-2 pl-2 xl:grid-cols-[minmax(0,1.6fr)_9rem_minmax(0,1fr)_auto]"},
          e("select",{value:q.descricao||"", disabled:fechado, "aria-label":"Conta de entrada", className:CP, onChange:function(ev){ partePatch(j, {descricao:ev.target.value}); }},
            e("option",{value:""},"Definir a conta…"), opcoesContas(l.forma || (formas[0] && formas[0].k))),
          e(CampoDinheiro,{value:q.valor, disabled:fechado, label:"Valor desta conta", className:CP+" font-mono", onChange:function(v){ partePatch(j, {valor:v||0}); }}),
          e("span",{className:"text-[12.5px]"}, q.comprovante ? e("a",{href:q.comprovante.url, target:"_blank", rel:"noreferrer", className:"font-semibold text-primary underline"},"Ver comprovante") : e("span",{className:"text-muted-foreground"},"Aguardando comprovante da bipagem")),
          e("span",{className:"flex items-center gap-1.5"},
            fechado ? e(React.Fragment,null, e("span",{className:"font-bold text-success"},"✓ Conferido"), e("button",{onClick:function(){ partePatch(j, {ok:false}); }, className:"rounded-md bg-white/10 px-2 py-0.5 text-[12px] font-semibold hover:bg-white/15"},"Desfazer"))
            : e(React.Fragment,null,
                e(Btn,{v:"primary", sm:true, ic:"check", disabled:!(x.finalizado && q.descricao && q.comprovante && q.valor>0 && !difere), onClick:function(){ partePatch(j, {ok:true}); }}, "Confirmar"),
                ps.length>1 && e("button",{onClick:function(){ linhaPatch({partes:ps.filter(function(z,k){ return k!==j; })}); }, "aria-label":"Remover esta conta", className:"grid size-7 place-items-center rounded-full bg-muted text-base font-bold text-muted-foreground hover:bg-destructive/20 hover:text-destructive"},"×"))));
      }),
      !l.isento && sk!=="ok" && e("div",{className:"flex flex-wrap items-center gap-3 pl-2"},
        e(Btn,{v:"ghost", sm:true, onClick:function(){ linhaPatch({partes:ps.concat([{descricao:"", valor:Math.max(0, Math.round((l.valor-soma)*100)/100), comprovante:null, ok:false}])}); }}, "+ Dividir em outra conta"),
        e("b",{className:MONO+" text-[12.5px] "+(difere ? "text-destructive" : "text-success")}, "Soma "+BK(soma)+" / "+BK(l.valor))));
  };
  // cada acerto é um dropdown fechado (resumo na linha); clica para abrir e definir as contas
  var card = function(x, aberto){
    var nDef = x.linhas.filter(function(l){ return statusLinhaFin(l)==="aguardando"; }).length, nCmp = x.linhas.filter(function(l){ return statusLinhaFin(l)==="conta"; }).length;
    var total = x.linhas.reduce(function(t,l){ return l.isento ? t : t+l.valor; },0);
    return e("details",{key:x.id, open:aberto || undefined, className:"group rounded-xl ring-1 ring-[#E8B84B]/30", style:{background:"#E8B84B10"}},
      e("summary",{className:"flex cursor-pointer list-none flex-wrap items-center gap-x-3 gap-y-1 px-3 py-2 [&::-webkit-details-marker]:hidden"},
        e("span",{className:"text-primary transition-transform group-open:rotate-90"},"▶"), e("b",{className:"text-[14px]"}, x.nome), e("span",{className:"text-[12px] text-muted-foreground"},"enviado às "+hm(x.enviadoTs)+(x.por ? " por "+x.por : "")),
        nDef>0 && e("span",{className:"rounded-md bg-warning/20 px-2 py-0.5 text-[11.5px] font-bold text-warning"}, nDef+(nDef===1 ? " forma sem conta" : " formas sem conta")),
        nCmp>0 && e("span",{className:"rounded-md bg-info/20 px-2 py-0.5 text-[11.5px] font-bold text-info"}, nCmp+(nCmp===1 ? " aguardando comprovante" : " aguardando comprovante")),
        x.conferido ? e("span",{className:"rounded-md bg-success/20 px-2 py-0.5 text-[11.5px] font-bold text-success"},"✓ conferido")
          : e("span",{className:"rounded-md px-2 py-0.5 text-[11.5px] font-bold "+(x.finalizado ? "bg-primary/20 text-primary" : "bg-white/10 text-muted-foreground")}, x.finalizado ? "Pronto para conferir" : "Bipagem ainda não finalizou"),
        e("b",{className:MONO+" ml-auto text-primary"}, BK(total))),
      e("div",{className:"flex flex-col gap-1.5 px-2.5 pb-2.5"}, x.linhas.map(function(l,i){ return linha(x,l,i); })));
  };
  // consolidado: quanto entrou em cada conta (conferido) e quanto ainda falta conferir
  var porConta = {};
  lista.forEach(function(x){ x.linhas.forEach(function(l){ if(l.isento) return; (l.partes||[]).forEach(function(q){ if(!q.descricao) return; var c = porConta[q.descricao] || (porConta[q.descricao] = {ok:0, falta:0}); if(q.ok) c.ok += q.valor||0; else c.falta += q.valor||0; }); }); });
  var contas = Object.keys(porConta).sort(function(a,b){ return (porConta[b].ok+porConta[b].falta)-(porConta[a].ok+porConta[a].falta); });
  var totOk = contas.reduce(function(t,c){ return t+porConta[c].ok; },0), totFalta = contas.reduce(function(t,c){ return t+porConta[c].falta; },0);
  return e(BlocoBarra,{t:"Pagamentos para conferir", sub:"atendimento interno · clique no acerto para definir as contas"},
    e("div",{className:"flex max-h-[30rem] flex-col gap-2 overflow-y-auto p-3"},
      e("p",{className:"text-[13px] font-semibold"}, pend.length ? pend.length+(pend.length===1 ? " acerto pendente" : " acertos pendentes") : "Nada pendente por enquanto."),
      pend.map(function(x){ return card(x, pend.length===1); }),
      contas.length>0 && e("div",{className:"mt-1 overflow-hidden rounded-xl ring-1 ring-[#E8B84B]/30"},
        e("div",{className:"flex items-center justify-between bg-linear-to-r from-[#B8862B] via-[#E8B84B] to-[#F1E4C6] px-3 py-1.5 text-[12.5px] font-bold text-[#1B1409]"}, e("span",null,"Consolidado por conta"), e("span",{className:MONO}, "conferido "+BK(totOk)+" · falta "+BK(totFalta))),
        e("table",{className:"w-full border-collapse text-[12.5px]"},
          e("thead",null, e("tr",null, ["Conta","Conferido","A conferir"].map(function(h,k){ return e("th",{key:h, className:"border-b border-border/60 px-3 py-1.5 text-[10.5px] font-semibold uppercase tracking-wide text-muted-foreground "+(k ? "text-right" : "text-left")}, h); }))),
          e("tbody",null, contas.map(function(c){ return e("tr",{key:c, className:"border-b border-border/40 last:border-0"}, e("td",{className:"px-3 py-1"}, c), e("td",{className:"px-3 py-1 text-right "+MONO+" text-success"}, BK(porConta[c].ok)), e("td",{className:"px-3 py-1 text-right "+MONO+" "+(porConta[c].falta>0 ? "text-warning" : "text-muted-foreground")}, BK(porConta[c].falta))); })))),
      feitos.length>0 && e("details",{className:"text-[13px]"}, e("summary",{className:"cursor-pointer text-muted-foreground"},"Já conferidos ("+feitos.length+")"), e("div",{className:"mt-2 flex flex-col gap-2"}, feitos.slice(0,10).map(function(x){ return card(x, false); })))));
}

// ── Visão geral (visível pra toda a equipe): crescimento de revendedoras + resultado do ano (30 dias de janela) ──
// atualização diária do total de revendedoras: UMA por dia (às 10h da manhã); sábado e domingo ficam no último valor
function AtualizacaoHoje(p){
  var s = p.s, d = p.d, hojeIso = isoDia(new Date()), hist = s.revendedorasDiario || {}, ks = Object.keys(hist).sort();
  var ultimo = ks.length ? hist[ks[ks.length-1]] : 0;
  var q = useState(ultimo), qtd = q[0], setQtd = q[1];
  var feito = (s.revAtualizadoEm||{})[hojeIso], hora = feito ? new Date(feito).toLocaleTimeString("pt-BR",{hour:"2-digit", minute:"2-digit"}) : "";
  return e("div",{className:"flex flex-wrap items-center gap-2 rounded-lg bg-black/15 px-3 py-2"},
    e("b",{className:"text-[12.5px]"}, "Hoje, "+hojeIso.split("-").reverse().slice(0,2).join("/")+" · total de revendedoras"),
    e(NumInput,{value:feito ? hist[hojeIso] : qtd, onChange:setQtd, className:"w-28! text-center!"+(feito ? " opacity-60" : "")}),
    e(Btn,{v:"primary", sm:true, ic:"save", disabled:!!feito || !(qtd>0), onClick:function(){ d({type:"REV_LANCAR", data:hojeIso, quantidade:qtd, unico:true}); }}, feito ? "✓ Atualizado às "+hora : "Atualizar hoje"),
    e("span",{className:"text-[11.5px] text-muted-foreground"}, feito ? "Só uma atualização por dia." : "Uma por dia, às 10h da manhã. Fim de semana fica no último valor."));
}

// tabela mês a mês (1 a 12): quantas revendedoras o mês começou e terminou, e o aumento ou a queda; o mês atual vai até hoje, em tempo real
function TabelaRevendedorasMeses(p){
  var linhas = resumoMensalRevendedoras(p.s, p.ano);
  var n = function(v){ return v===null || v===undefined ? "—" : Math.round(v).toLocaleString("pt-BR"); };
  var th = function(t){ return e("th",{key:t, className:"border-b border-r border-border px-2 py-2 text-center text-[11px] font-semibold uppercase tracking-wide last:border-r-0"}, t); };
  var td = function(v, c){ return e("td",{className:"border-r border-border/60 px-2 py-1.5 text-center text-[13px] last:border-r-0 "+(c||"")}, v); };
  return e(BlocoBarra,{cor:"azul", t:"Revendedoras mês a mês", sub:"quantas começamos e terminamos cada mês · o mês atual atualiza em tempo real"},
    e("div",{className:"overflow-x-auto p-3"},
      e("table",{className:"w-full border-collapse"},
        e("thead",null, e("tr",{className:"bg-sidebar"}, ["Mês","Começou com","Terminou com","Aumento / queda","%"].map(th))),
        e("tbody",null, linhas.map(function(l){
          var cor = l.delta>0 ? "text-success" : l.delta<0 ? "text-destructive" : "text-muted-foreground";
          return e("tr",{key:l.mes, className:"border-b border-border/50 "+(l.atual ? "bg-primary/10 font-bold" : l.futuro ? "opacity-45" : "")},
            td(e("span",{className:"inline-flex items-center gap-1.5"}, (l.mes+1)+" · "+MESES_LONGO[l.mes], l.atual && e("span",{className:"rounded bg-success/20 px-1.5 text-[10.5px] font-bold text-success"},"ao vivo")), "text-left! "),
            td(n(l.ini), MONO), td(n(l.fim), MONO),
            td(l.delta===null ? "—" : (l.delta>0 ? "+" : "")+n(l.delta), MONO+" font-bold "+cor),
            td(l.pct===null ? "—" : (l.pct>0 ? "+" : "")+l.pct.toFixed(1).replace(".",",")+"%", MONO+" "+cor)); })))));
}

function AbaVisaoGeral(){
  var cx = use(), s = cx.state;
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
      e("div",{className:"flex flex-col gap-4 lg:col-span-2"},
        podeConferirPag(s.usuario) && e(PagamentosAConferir,null),
        e(BlocoBarra,{t:"Crescimento de revendedoras", sub:"escolha quantos dias mostrar — sempre com a projeção até dezembro junto"},
          e("div",{className:"flex flex-col gap-2 p-3"},
            papelDe(s.usuario)==="supervisao" && e(AtualizacaoHoje,{s:s, d:cx.dispatch}),
            e("div",{className:"flex flex-wrap gap-1.5"},
              JANELAS_GRAFICO_REV.map(function(x,i){ return e("button",{key:i, onClick:function(){setJanelaGrafico(i);},
                className:"rounded-lg px-2.5 py-1 text-[11.5px] font-semibold ring-1 "+(janelaGrafico===i ? "bg-primary/15 ring-2 ring-primary" : "bg-card ring-border hover:bg-muted/40")}, x.lb); })),
            e(GraficoColunasRevendedoras,{pontos:pontosRevendedoras(s, Object.assign({projetarMeses:11-mes, janela:2}, JANELAS_GRAFICO_REV[janelaGrafico])),
              opcoes:{janelas:JANELAS_GRAFICO_REV, indice:janelaGrafico, calcular:function(i){ return pontosRevendedoras(s, Object.assign({projetarMeses:11-mes, janela:2}, JANELAS_GRAFICO_REV[i])); }}}))),
        e(TabelaRevendedorasMeses,{s:s, ano:ano})),
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
