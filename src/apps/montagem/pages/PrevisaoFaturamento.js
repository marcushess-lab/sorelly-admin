// Sorelly Admin · montagem e bipagem — pages/PrevisaoFaturamento.js
// Extraído de sorelly_admin_montagem_bipagem.html; depois com a janela/meta reaproveitadas na tabela anual, a cadeia de
// cálculo em cartões (em vez de texto corrido) e a projeção do gráfico podendo passar de dezembro, com a queda de janeiro.
import { BlocoBarra } from "@/apps/montagem/components/equipe-blocos";
import { GraficoColunasRevendedoras } from "@/apps/montagem/components/grafico-revendedoras";
import { CRESCIMENTO_REVENDEDORAS, FATOR_SAZONAL, JANELAS_GRAFICO_REV, MESES_LONGO, QUEDA_JANEIRO, isoOntem, pontosRevendedoras, projetarAno, projetarVariosAnos } from "@/apps/montagem/domain/financeiro";
import { BK, N1 } from "@/apps/montagem/lib/format";
import { use } from "@/apps/montagem/state/context";
import { Btn } from "@/apps/montagem/ui/button";
import { Icon } from "@/apps/montagem/ui/icon";
import { INPUT, MONO, MoneyInput, NumInput } from "@/apps/montagem/ui/input";
import { PageHead } from "@/apps/montagem/ui/page";
import { TD, TR, Tabela } from "@/apps/montagem/ui/table";
import { e, useState } from "@/shared/react";
import React from "react";

// abreviação do rótulo da janela ("7 dias" → "7d", "Último mês (ago)" → "Últ. mês"), pra caber num botão pequeno
var jLb = function(lb){ return lb.indexOf("Último")===0 ? "Últ. mês" : lb.replace(" dias","d"); };

function AbaPrevisaoFaturamento(){
  var cx = use(), s = cx.state, d = cx.dispatch, c = s.cfg;
  var hoje = new Date(), ano = hoje.getFullYear(), mes = hoje.getMonth(), anoStr = String(ano);
  var entradas = Object.keys(s.faturamentoDiario||{}).sort();
  var doMes = entradas.filter(function(k){ return k.slice(0,7)===anoStr+"-"+String(mes+1).padStart(2,"0"); });
  var ultimaMes = doMes.length ? s.faturamentoDiario[doMes[doMes.length-1]] : null;
  // quantidade de revendedoras é lançada aqui mesmo, junto com o faturamento (1 lançamento só, sempre do dia anterior)
  var revDatas = Object.keys(s.revendedorasDiario||{}).sort();
  var revendedoras = revDatas.length ? s.revendedorasDiario[revDatas[revDatas.length-1]] : 0;
  var fdata = useState(isoOntem()), dataForm = fdata[0], setDataForm = fdata[1];
  var frec = useState(ultimaMes ? ultimaMes.recebido : 0), recForm = frec[0], setRecForm = frec[1];
  var face = useState(ultimaMes ? ultimaMes.acertos : 0), aceForm = face[0], setAceForm = face[1];
  var frev = useState(revendedoras), revForm = frev[0], setRevForm = frev[1];
  var mp = useState(95), metaPct = mp[0], setMetaPct = mp[1];   // meta usada na previsão: 94/95/96%, padrão 95 (o meio do caminho)
  var jc = useState(2), janela = jc[0], setJanela = jc[1];   // janela de crescimento escolhida (índice em CRESCIMENTO_REVENDEDORAS; 2 = 30 dias)
  var ad = useState(false), abrirDetalhe = ad[0], setAbrirDetalhe = ad[1];
  var salvar = function(){ d({type:"FAT_LANCAR", data:dataForm, recebido:recForm, acertos:aceForm, revendedoras:revForm}); };
  var recebidoMes = ultimaMes ? ultimaMes.recebido : 0, acertosRealizados = ultimaMes ? ultimaMes.acertos : 0;
  // meta mensal vem do Agendamento: quantas revendedoras tinham kit no início do mês e quantos acertos eles previram para o mês
  var meta = Object.assign({base:0, previstos:0}, ((s.metaMensal||{})[anoStr]||{})[mes]);
  var metaAlvo = Math.round(meta.previstos*metaPct/100);   // o que a Financeiro assume que vai realmente acontecer este mês
  var restantes = Math.max(0, metaAlvo-acertosRealizados);
  var mediaAcerto = acertosRealizados>0 ? recebidoMes/acertosRealizados : 0;
  var faturamentoPrevisto = metaAlvo*mediaAcerto;
  var aReceber = Math.max(0, faturamentoPrevisto-recebidoMes);
  // vem direto da tela Contas a pagar — o mesmo dado, sempre batendo
  var cpMes = Object.assign({pago:0, apagar:0}, ((s.contasPagar||{})[anoStr]||{})[mes]);
  var resultadoAgora = recebidoMes - cpMes.pago;
  var resultadoMes = faturamentoPrevisto - (cpMes.pago+cpMes.apagar);
  var totAnoContas = [0,1,2,3,4,5,6,7,8,9,10,11].reduce(function(t,i){ var m = Object.assign({pago:0,apagar:0}, ((s.contasPagar||{})[anoStr]||{})[i]); return t+m.pago+m.apagar; },0);
  var totPagoAno = [0,1,2,3,4,5,6,7,8,9,10,11].reduce(function(t,i){ var m = Object.assign({pago:0,apagar:0}, ((s.contasPagar||{})[anoStr]||{})[i]); return t+m.pago; },0);
  var totAPagarAno = totAnoContas - totPagoAno;
  // proporções médias, ponderadas pelo tamanho de cada mês, calculadas em cima de todos os meses FECHADOS (Jan até o mês anterior);
  // a conversão previstos→realizados dos meses futuros usa a meta (94/95/96%) escolhida acima, não mais só a média histórica
  var proj = projetarAno(s, anoStr, janela, metaPct);
  var mesesFaltando = [];
  for(var mfi=0; mfi<mes; mfi++){ if(!proj.fechados.some(function(m){return m.mes===mfi;})) mesesFaltando.push(MESES_LONGO[mfi]); }
  var recebidoAnoAteAgora = proj.porMes.reduce(function(t,x){ return x.mes<=mes ? t+x.valor : t; }, 0); // meses fechados + mês atual (parcial)
  var faturamentoFuturo = proj.porMes.reduce(function(t,x){ return x.tipo==="projetado" ? t+x.valor : t; }, 0);
  var aReceberAno = aReceber + faturamentoFuturo;   // o que falta do mês atual + o previsto inteiro dos meses que ainda não chegaram
  var faturamentoAnoPrevisto = recebidoAnoAteAgora + aReceberAno;
  var resultadoAno = faturamentoAnoPrevisto - totAnoContas;
  var resultadoAnoAgora = recebidoAnoAteAgora - totPagoAno;
  // projeção de revendedoras para o início do próximo mês, pela janela de crescimento escolhida
  var inicioProxMes = new Date(ano, mes+1, 1), diasAteProxMes = Math.round((inicioProxMes-hoje)/86400000);
  var projRevendedoras = Math.round(revendedoras + CRESCIMENTO_REVENDEDORAS[janela].dia*diasAteProxMes);
  var projPrevistos = Math.round(projRevendedoras*proj.ratioPB);
  var projRealizados = Math.round(projPrevistos*proj.ratioRPUsado);
  var projFaturamento = projRealizados*proj.mediaAcertoHist;
  var ac = useState(true), abrirGrafico = ac[0], setAbrirGrafico = ac[1];
  var jg = useState(2), janelaGrafico = jg[0], setJanelaGrafico = jg[1];   // janela de exibição do gráfico (7/15/30/60/90 dias, mês atual ou história completa)
  // até quando o gráfico projeta: por padrão até dezembro deste ano, mas dá pra escolher até dezembro do ano que vem
  var maxMesesProj = (11-mes) + 12;
  var opcoesProj = []; for(var mip=1; mip<=maxMesesProj; mip++){ var dtp = new Date(ano, mes+mip, 1);
    opcoesProj.push({v:mip, lb:MESES_LONGO[dtp.getMonth()].slice(0,3)+"/"+String(dtp.getFullYear()).slice(2)}); }
  var mpj = useState(11-mes), mesesProj = mpj[0], setMesesProj = mpj[1];
  var mesFinalLbl = (opcoesProj.find(function(o){return o.v===mesesProj;})||{}).lb;
  // pontos do gráfico (calculados uma vez, pra também tirar as estatísticas do período mostrado, ao lado dos botões de janela)
  var pontosGrafico = pontosRevendedoras(s, Object.assign({projetarMeses:mesesProj, janela:janela}, JANELAS_GRAFICO_REV[janelaGrafico]));
  var reaisGrafico = pontosGrafico.filter(function(x){return x.tipo==="real";});
  var aumentoPeriodo = reaisGrafico.length>1 ? reaisGrafico[reaisGrafico.length-1].v-reaisGrafico[0].v : 0;
  var diasPeriodo = reaisGrafico.length>1 ? Math.round((new Date(reaisGrafico[reaisGrafico.length-1].data)-new Date(reaisGrafico[0].data))/86400000) : 0;
  var mediaDiariaPeriodo = diasPeriodo>0 ? aumentoPeriodo/diasPeriodo : 0;
  var revendedorasNoFinal = pontosGrafico[pontosGrafico.length-1].v;   // revendedoras previstas no mês final escolhido em "Projetar até"
  var num = function(v){ return Math.round(v).toLocaleString("pt-BR"); };
  // histórico do ano até agora (meses fechados + o atual, em andamento): de onde vêm os % usados na previsão
  var linhasHistorico = proj.fechados.map(function(m){ return {mes:m.mes, base:m.base, previstos:m.previstos, realizados:m.realizados, atual:false}; })
    .concat([{mes:mes, base:meta.base, previstos:meta.previstos, realizados:acertosRealizados, atual:true}]);
  // tabela "Ano inteiro, mês a mês": agora encadeia este ano + o ano seguinte inteiro (24 meses)
  var projAnos = projetarVariosAnos(s, ano, 24, janela, metaPct);
  var notasSazonais = [10,11,0,1].map(function(mi){ var f = FATOR_SAZONAL[mi]; return MESES_LONGO[mi]+(f>1?" +":" −")+N1(Math.abs((f-1)*100))+"%"; });
  var chipMini = function(lb, v, cor){ return e("div",{className:"flex items-center gap-1.5 rounded-lg bg-black/15 px-2.5 py-1.5 text-[11px]"},
    e("span",{className:"font-semibold text-muted-foreground"}, lb+":"),
    e("b",{className:MONO+" text-[12.5px] "+(cor||"")}, v)); };
  var stat = function(lb, v, cor){ return e("div",{className:"flex flex-col items-center gap-0.5 rounded-lg bg-black/15 px-1 py-2 text-center"},
    e("span",{className:"text-[10px] font-semibold uppercase leading-tight tracking-wide text-foreground/70"}, lb),
    e("b",{className:MONO+" text-[15px] leading-tight "+(cor||"")}, v)); };
  var linha = function(lb, v, cor){ return e("div",{className:"flex items-start justify-between gap-2 py-0.5 text-[12.5px] leading-tight"},
    e("span",{className:"min-w-0"}, lb), e("b",{className:MONO+" shrink-0 whitespace-nowrap "+(cor||"")}, v)); };
  var rotulo = "flex flex-col items-center gap-1 text-center text-[12.5px] font-semibold";
  // cartão da cadeia de cálculo (revendedoras → previstos → realizados → faturamento), pra substituir o parágrafo corrido
  var elo = function(lb, v, destaque){ return e("div",{className:"flex flex-col items-center gap-0.5 rounded-lg px-3 py-2 text-center "+(destaque?"bg-primary/15 ring-1 ring-primary/40":"bg-black/15")},
    e("span",{className:"text-[10px] font-semibold uppercase leading-tight tracking-wide text-foreground/70"}, lb),
    e("b",{className:MONO+" text-[14px]"}, v)); };
  var seta = function(lb){ return e("div",{className:"flex flex-col items-center gap-0.5 px-0.5"},
    e(Icon,{n:"seta", s:13, className:"text-primary/70"}),
    e("span",{className:"whitespace-nowrap text-[10px] font-semibold text-primary/80"}, lb)); };
  // ícone e cor de cada situação da tabela anual, no lugar do texto (Consolidado/Em andamento/Projetado)
  var SIT = {real:{ic:"check", cor:"text-success", lb:"Consolidado"}, atual:{ic:"clock", cor:"text-warning", lb:"Em andamento"}, projetado:{ic:"pontilhado", cor:"text-muted-foreground", lb:"Projetado"}};
  var pillJanela = function(compacto){ return e("div",{className:"flex flex-wrap gap-1"}, CRESCIMENTO_REVENDEDORAS.map(function(x,i){
    return e("button",{key:i, onClick:function(){setJanela(i);}, title:x.lb,
      className:"rounded-md px-2 py-1 text-[11px] font-semibold ring-1 "+(janela===i?"bg-primary/15 ring-2 ring-primary":"bg-card ring-border hover:bg-muted/40")}, jLb(x.lb)); })); };
  var pillMeta = function(){ return e("div",{className:"flex gap-1"}, [94,95,96].map(function(x){
    return e("button",{key:x, onClick:function(){setMetaPct(x);},
      className:"rounded-md px-2 py-1 text-[11px] font-bold "+(metaPct===x?"bg-warning text-black":"ring-1 ring-border hover:bg-muted/40")}, x+"%"); })); };
  return e(React.Fragment,null,
    e(PageHead,{t:"Previsão de faturamento", sub:"Lançamento diário, sempre referente ao dia anterior. A Amanda preenche toda manhã; se ela faltar, o Lucas preenche."}),
    e("div",{className:"grid grid-cols-1 gap-4 xl:grid-cols-3"},
      e(BlocoBarra,{t:"Lançar o dia anterior", sub:"digite o total acumulado do mês até ontem — não o valor do dia"},
        e("div",{className:"flex flex-col items-center gap-3 p-4"},
          e("label",{className:rotulo},"Referente ao dia",
            e("input",{type:"date", value:dataForm, max:isoOntem(), onChange:function(ev){setDataForm(ev.target.value);}, className:INPUT+" h-10! w-full text-center [color-scheme:dark]"})),
          e("label",{className:rotulo+" w-full"},"Valor recebido (total do mês até ontem)",
            e(MoneyInput,{value:recForm, onChange:setRecForm, className:"w-full text-center!"})),
          e("label",{className:rotulo+" w-full"},"Acertos realizados (total do mês até ontem)",
            e(NumInput,{value:aceForm, onChange:setAceForm, className:"w-full! text-center!"})),
          e("label",{className:rotulo+" w-full"},"Quantidade de revendedoras (total geral)",
            e(NumInput,{value:revForm, onChange:setRevForm, className:"w-full! text-center!"})),
          e(Btn,{v:"primary", ic:"save", className:"w-full", onClick:salvar},"Salvar lançamento"),
          entradas.length>0 && e("p",{className:"text-[12px]"},"Último lançamento: "+entradas[entradas.length-1].split("-").reverse().join("/")))),
      e(BlocoBarra,{cor:"azul", t:MESES_LONGO[mes]+" ao vivo", sub:"o total mais recente do mês + o mês atual da tela Contas a pagar"},
        e("div",{className:"flex flex-col gap-2 p-3"},
          e("div",{className:"grid grid-cols-2 gap-1.5 rounded-lg bg-black/10 p-2"},
            stat("Revendedoras c/ kit (início do mês)", meta.base), stat("Acertos previstos (Agendamento)", meta.previstos)),
          e("p",{className:"text-center text-[11px] italic"},"Esses 2 números só editam em Agendamento → Painel dos acertos."),
          e("div",{className:"grid grid-cols-5 gap-1.5"},
            stat("Revendedoras", revendedoras), stat("Meta "+metaPct+"%", metaAlvo, "text-warning"),
            stat("Realizados", acertosRealizados), stat("Restam", restantes, restantes?"text-warning":"text-success"),
            stat("Média/acerto", BK(mediaAcerto))),
          e("div",{className:"flex flex-col items-center gap-1 rounded-lg bg-warning/10 px-2 py-1.5 text-center text-[11.5px] font-semibold text-warning"},
            e("span",null, "Meta sobre os "+meta.previstos+" previstos"),
            e("div",{className:"flex gap-1.5"}, [94,95,96].map(function(x){ return e("button",{key:x, onClick:function(){setMetaPct(x);}, className:"rounded px-2 py-0.5 "+(metaPct===x?"bg-warning text-black":"opacity-60 hover:opacity-100")}, x+"%"); })),
            e("span",{className:"text-[10.5px] font-normal opacity-80"}, "95% é o meio do caminho")),
          // 3 blocos: até agora (recebido/pago) · o que falta (a receber/a pagar) · total do mês (faturamento/contas a pagar/resultado)
          e("div",{className:"flex flex-col rounded-lg bg-black/10 px-2.5 py-1.5"},
            linha("Valor recebido", BK(recebidoMes), "text-success"), linha("Valor pago", BK(cpMes.pago), "text-destructive"),
            linha("Resultado até agora", BK(resultadoAgora), resultadoAgora<0?"text-destructive":"text-success")),
          e("div",{className:"flex flex-col rounded-lg bg-black/10 px-2.5 py-1.5"},
            linha("Valor a receber", BK(aReceber), "text-success"), linha("Valor a pagar", BK(cpMes.apagar), "text-destructive")),
          e("div",{className:"flex flex-col rounded-lg bg-black/10 px-2.5 py-1.5"},
            linha("Faturamento total", BK(faturamentoPrevisto), "text-success"), linha("Contas a pagar total", BK(cpMes.pago+cpMes.apagar), "text-destructive"),
            e("div",{className:"my-1 h-px bg-border"}),
            e("div",{className:"flex items-center justify-between gap-3 py-0.5"},
              e("b",{className:"text-[13px] "+(resultadoMes<0?"text-destructive":"text-success")},"Resultado mês"),
              e("b",{className:MONO+" text-[15px] "+(resultadoMes<0?"text-destructive":"text-success")}, BK(resultadoMes)))))),
      e(BlocoBarra,{cor:"roxo", t:"Resumo do ano "+ano, sub:"mesmo cálculo do mês, só que pro ano inteiro"},
        e("div",{className:"flex flex-col gap-2 p-3"},
          e("div",{className:"flex flex-col rounded-lg bg-black/10 px-2.5 py-1.5"},
            linha("Valor recebido (até agora)", BK(recebidoAnoAteAgora), "text-success"), linha("Valor pago", BK(totPagoAno), "text-destructive"),
            linha("Resultado até agora", BK(resultadoAnoAgora), resultadoAnoAgora<0?"text-destructive":"text-success")),
          e("div",{className:"flex flex-col rounded-lg bg-black/10 px-2.5 py-1.5"},
            linha("Valor a receber", BK(aReceberAno), "text-success"), linha("Valor a pagar", BK(totAPagarAno), "text-destructive")),
          e("div",{className:"flex flex-col rounded-lg bg-black/10 px-2.5 py-1.5"},
            linha("Faturamento anual previsto", BK(faturamentoAnoPrevisto), "text-success"), linha("Contas a pagar anual previsto", BK(totAnoContas), "text-destructive"),
            e("div",{className:"my-1 h-px bg-border"}),
            e("div",{className:"flex items-center justify-between gap-3 py-0.5"},
              e("b",{className:"text-[13px] "+(resultadoAno<0?"text-destructive":"text-success")},"Resultado final do ano"),
              e("b",{className:MONO+" text-[15px] "+(resultadoAno<0?"text-destructive":"text-success")}, BK(resultadoAno)))),
          e("p",{className:"text-[11px]"},"Contas a pagar: os 12 meses já lançados de verdade. Faturamento: "+(mesesFaltando.length ? "faltam lançar "+mesesFaltando.join(", ")+"; " : "todos os meses fechados já foram lançados; ")+MESES_LONGO[(mes+1)%12]+" a "+MESES_LONGO[11]+" são projeção, pela janela de crescimento escolhida abaixo.")))),
    e(BlocoBarra,{t:"Crescimento de revendedoras", sub:"histórico do ano até agora + o gráfico dia a dia embaixo"},
      e("div",{className:"flex flex-col gap-2.5 p-3"},
        // histórico do ano até agora (meses fechados + o mês atual, em andamento): de onde vêm os % usados na previsão
        e(Tabela,{semLimite:true, min:"min-w-[36rem]", cols:[{t:"Mês",c:true},{t:"Revendedoras",c:true},{t:"Previstos",c:true},{t:"% previstos",c:true},{t:"Realizados",c:true},{t:"% realizados",c:true}]},
          linhasHistorico.map(function(h,i){ var sit = h.atual ? SIT.atual : SIT.real;
            var pctP = h.base>0 ? h.previstos/h.base*100 : 0, pctR = h.previstos>0 ? h.realizados/h.previstos*100 : 0;
            return e("tr",{key:i, className:TR},
              e(TD,{c:true, className:"font-semibold "+sit.cor, title:sit.lb}, MESES_LONGO[h.mes]),
              e(TD,{c:true, className:MONO+" text-foreground"}, num(h.base)),
              e(TD,{c:true, className:MONO+" text-foreground"}, num(h.previstos)),
              e(TD,{c:true, className:MONO+" text-primary"}, N1(pctP)+"%"),
              e(TD,{c:true, className:MONO+" text-foreground"}, num(h.realizados)),
              e(TD,{c:true, className:MONO+" text-primary"}, N1(pctR)+"%")); })),
        proj.fechados.length<3 && e("p",{className:"text-[11.5px] text-warning"},"Ainda só "+proj.fechados.length+" mês(es) fechado(s) — quanto mais meses forem lançados, mais confiável fica a % usada na previsão.")),
      e("div",{className:"border-t border-border p-3"},
        e("button",{onClick:function(){setAbrirGrafico(!abrirGrafico);}, className:"flex w-full items-center justify-between gap-2 text-left"},
          e("span",{className:"text-[13px] font-semibold"},"Crescimento de revendedoras — em colunas"),
          e(Icon,{n:abrirGrafico?"chevrondown":"chevron", s:16})),
        abrirGrafico && e("div",{className:"mt-3 flex flex-col gap-2"},
          e("div",{className:"flex flex-wrap items-center gap-1.5"},
            JANELAS_GRAFICO_REV.map(function(x,i){ return e("button",{key:i, onClick:function(){setJanelaGrafico(i);},
              className:"rounded-lg px-2.5 py-1 text-[11.5px] font-semibold ring-1 "+(janelaGrafico===i ? "bg-primary/15 ring-2 ring-primary" : "bg-card ring-border hover:bg-muted/40")}, x.lb); }),
            reaisGrafico.length>1 && chipMini("Aumento em "+JANELAS_GRAFICO_REV[janelaGrafico].lb.toLowerCase(), (aumentoPeriodo>=0?"+":"")+Math.round(aumentoPeriodo).toLocaleString("pt-BR"), aumentoPeriodo>=0?"text-success":"text-destructive"),
            reaisGrafico.length>1 && chipMini("Média diária", (mediaDiariaPeriodo>=0?"+":"")+N1(mediaDiariaPeriodo)+"/dia", mediaDiariaPeriodo>=0?"text-success":"text-destructive"),
            chipMini("Revendedoras em "+mesFinalLbl, num(revendedorasNoFinal), "text-primary")),
          e("label",{className:"flex items-center gap-1.5 text-[11.5px] font-semibold text-muted-foreground"},"Projetar até",
            e("select",{value:mesesProj, onChange:function(ev){setMesesProj(Number(ev.target.value));}, className:INPUT+" h-8! w-auto py-0! pl-2! pr-6! text-[12px]! font-semibold text-foreground"},
              opcoesProj.map(function(o){ return e("option",{key:o.v, value:o.v}, o.lb); }))),
          e(GraficoColunasRevendedoras,{pontos:pontosGrafico}),
          e("p",{className:"text-[11px]"},"Barra cheia: histórico real. Barra clara/tracejada: previsão do dia 1 de cada mês até "+mesFinalLbl+", pela janela de crescimento escolhida acima — com uma queda sazonal de "+QUEDA_JANEIRO+" revendedoras em janeiro (sempre saem algumas no início do ano) e o crescimento normal de volta a partir de fevereiro. Faixas alternadas no fundo do gráfico marcam cada mês.")))),
    e(BlocoBarra,{t:"Ano inteiro, mês a mês", sub:anoStr+" e "+(ano+1)+" — consolidado (real) e pendente (a preencher) lado a lado, pra saber o que falta mandar"},
      e("div",{className:"p-3"},
        e("div",{className:"mb-3 flex flex-wrap items-center gap-2.5 rounded-lg bg-black/10 px-2.5 py-2"},
          e("span",{className:"text-[11px] font-semibold text-muted-foreground"},"Projeção usa:"),
          pillJanela(), e("span",{className:"text-foreground/25"},"·"), pillMeta()),
        e("button",{onClick:function(){setAbrirDetalhe(!abrirDetalhe);}, className:"mb-2 flex items-center gap-1.5 text-[12.5px] font-semibold text-primary"},
          e(Icon,{n:abrirDetalhe?"chevrondown":"chevron", s:14}), abrirDetalhe ? "Esconder vendido na ponta e custo (com/sem brinde)" : "Mostrar vendido na ponta e custo (com/sem brinde)"),
        e(Tabela,{semLimite:true, cols:[{t:"Mês",c:true},{t:"Revendedoras",c:true},{t:"Acertos realizados",c:true},{t:"Contas a pagar",c:true},{t:"Faturamento",c:true},{t:"Resultado",c:true}]
          .concat(abrirDetalhe ? [{t:"Vendido na ponta (c/ brindes)",c:true},{t:"Vendido na ponta (s/ brinde)",c:true},{t:"Custo (c/ brindes)",c:true},{t:"Custo (s/ brinde)",c:true}] : [])},
          projAnos.porMes.map(function(pm, linha){
            var anoDaLinha = String(pm.ano), cpI = Object.assign({pago:0,apagar:0}, ((s.contasPagar||{})[anoDaLinha]||{})[pm.mes]), cpTotal = cpI.pago+cpI.apagar;
            var fatI = pm.tipo==="atual" ? faturamentoPrevisto : pm.valor;
            var resultadoI = fatI - cpTotal;
            var vp = ((s.vendidoPonta||{})[anoDaLinha]||{})[pm.mes];
            var sit = SIT[pm.tipo];
            var mesLbl = MESES_LONGO[pm.mes]+(pm.ano!==ano ? "/"+anoDaLinha.slice(2) : "");
            return e("tr",{key:linha, className:TR},
              e(TD,{c:true, className:"font-semibold "+sit.cor, title:sit.lb}, mesLbl),
              e(TD,{c:true, className:MONO+" text-foreground"}, num(pm.revendedoras||0)),
              e(TD,{c:true, className:MONO+" text-foreground"}, num(pm.realizados||0)),
              e(TD,{c:true, className:MONO+" text-destructive"}, BK(cpTotal)),
              e(TD,{c:true, className:MONO+" text-success"}, BK(fatI)+(pm.sazonal?" *":"")),
              e(TD,{c:true, className:MONO+" "+(resultadoI<0?"text-destructive":"text-success")}, BK(resultadoI)),
              abrirDetalhe && e(TD,{c:true, className:MONO+" text-foreground"}, vp?BK(vp.comBrindes):"—"),
              abrirDetalhe && e(TD,{c:true, className:MONO+" text-foreground"}, vp?BK(vp.semBrinde):"—"),
              abrirDetalhe && e(TD,{c:true, className:MONO+" text-foreground"}, "—"),
              abrirDetalhe && e(TD,{c:true, className:MONO+" text-foreground"}, "—"));
          })),
        notasSazonais.length>0 && e("p",{className:"mt-2 text-[11px] text-warning"}, "* Ajuste sazonal sobre a média de faturamento por revendedora (provisório, a confirmar com dados reais de anos anteriores): "+notasSazonais.join(" · ")+"."),
        e("p",{className:"mt-1 text-[11px]"}, abrirDetalhe
          ? "Vendido na ponta: relatório de notas fiscais (Fev a Jul já enviados; Jan e Ago em diante ainda faltam). Custo (com e sem brinde): ainda não veio — aparece em — até você mandar."
          : "Clique acima pra ver o detalhamento de vendido na ponta e custo, com e sem brinde."),
        e("p",{className:"mt-1 text-[11px] text-muted-foreground"}, "Faltam os números reais de "+(ano+1)+" (meta mensal e contas a pagar de janeiro e fevereiro em diante) — entram assim que você mandar; até lá, aparecem como projeção."))));
}

export { AbaPrevisaoFaturamento };
