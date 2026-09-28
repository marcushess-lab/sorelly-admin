// Sorelly Admin · montagem e bipagem — components/grafico-revendedoras.js
// Extraído de sorelly_admin_montagem_bipagem.html; depois ajustado para caber sempre na largura, mostrar o valor ao passar
// o mouse e marcar os meses (faixas alternadas + linha) quando a janela é grande demais pra ver a data de cada barra.
import { MESES_LONGO } from "@/apps/montagem/domain/financeiro";
import { e, useEffect, useRef, useState } from "@/shared/react";

var mesAbr = function(dt){ return MESES_LONGO[Number(dt.slice(5,7))-1].slice(0,3).toUpperCase(); };
var dataBR = function(dt){ return dt.split("-").reverse().join("/"); };
var num = function(v){ return Math.round(v).toLocaleString("pt-BR"); };
var SLOT_MIN = 2.2;   // abaixo disso a barra vira um fio ilegível; a partir daqui entra a rolagem (curta, não a história inteira esticada)

// gráfico de colunas, dia a dia; barra cheia = real, barra mais clara/tracejada = projeção (dia 1 de cada mês futuro).
// Em janelas normais as colunas se espremem para caber inteiras na largura da tela (como o gráfico da planilha). Só quando a
// janela é grande demais (história completa) a barra não fica um fio: aparece uma rolagem lateral curta (a barra dourada
// embaixo), e o gráfico abre já no fim, nos dias mais recentes. Faixas claras/escuras alternadas marcam cada mês (com uma
// linha na virada), pra dar pra identificar os meses mesmo quando a legenda de baixo não cabe todas as datas.
// Passando o mouse aparece o dia, a quantidade e a variação. As barras "flutuam" a partir do menor valor da janela, senão
// a variação de revendedoras (ex.: 1900 a 2100) fica quase invisível numa barra que começa do zero.
function GraficoColunasRevendedoras(p){
  var pts = p.pontos, n = pts.length, vals = pts.map(function(x){return x.v;});
  var mn = Math.min.apply(null, vals), mx = Math.max.apply(null, vals), pad = Math.max(1, Math.round((mx-mn)*0.06));
  var base0 = Math.max(0, mn-pad), topV = mx+pad, range = Math.max(1, topV-base0);
  var caixa = useRef(null), rol = useRef(null);
  var lg = useState(900), larg = lg[0], setLarg = lg[1];
  var hv = useState(null), sel = hv[0], setSel = hv[1];
  useEffect(function(){ if(!caixa.current) return; var ro = new ResizeObserver(function(x){ setLarg(x[0].contentRect.width); }); ro.observe(caixa.current);
    return function(){ ro.disconnect(); }; }, []);
  var H = 320, top = 14, base = H-30, esq = 44;   // esq: faixa dos valores do eixo
  var boxW = Math.max(larg, 300), rawSlot = (boxW-esq)/Math.max(n,1);
  var rolar = rawSlot < SLOT_MIN;   // só rola quando nem o fio mínimo cabe inteiro
  var slot = rolar ? SLOT_MIN : rawSlot;
  var W = rolar ? esq + n*slot + 8 : boxW;
  var barW = slot>=3 ? Math.min(28, slot*0.72) : slot;   // bem espremido, as barras encostam (vira uma área, igual à planilha)
  var xDe = function(i){ return esq + i*slot + (slot-barW)/2; };
  var y = function(v){ return base - (base-top)*(v-base0)/range; };
  useEffect(function(){ if(rolar && rol.current) rol.current.scrollLeft = rol.current.scrollWidth; }, [rolar, n, larg]);
  // meses (faixa de índices) e legendas embaixo: por dia em janelas curtas, por mês nas grandes; pula as que encostariam na anterior
  var porDia = n<=45, ultimaX = -99, rotulos = [], meses = [], inicioMes = 0;
  pts.forEach(function(pt, i){
    var novoMes = i===0 || pt.data.slice(0,7)!==pts[i-1].data.slice(0,7);
    if(novoMes){ if(i>0) meses.push({de:inicioMes, ate:i-1}); inicioMes = i; }
    if(!(porDia || novoMes || pt.tipo==="projetado")) return;
    var cx = esq + (i+0.5)*slot; if(cx-ultimaX < 40) return; ultimaX = cx;
    rotulos.push(e("text",{key:"r"+i, x:cx, y:base+16, textAnchor:"middle", fontSize:10, fontWeight:600, fill:"currentColor", fillOpacity:.75},
      pt.tipo==="projetado" ? mesAbr(pt.data) : porDia ? pt.data.slice(8,10)+"/"+pt.data.slice(5,7) : mesAbr(pt.data)+"/"+pt.data.slice(2,4)));
  });
  meses.push({de:inicioMes, ate:n-1});
  var mover = function(ev){ var r = ev.currentTarget.getBoundingClientRect(), i = Math.floor((ev.clientX-r.left-esq)/slot);
    setSel(i>=0 && i<n ? i : null); };
  var pt = sel!==null ? pts[sel] : null, ant = sel!==null && sel>0 ? pts[sel-1] : null;
  var delta = pt && ant ? pt.v-ant.v : null;
  var ultimaReal = pts.map(function(x){return x.tipo;}).lastIndexOf("real");
  var grafico = e("div",{className:"relative"},
    e("svg",{viewBox:"0 0 "+W+" "+H, style:{width:W, height:H, minWidth: rolar ? W : "100%"}, className:"block cursor-crosshair", role:"img", "aria-label":"Crescimento de revendedoras (colunas)",
        onMouseMove:mover, onMouseLeave:function(){ setSel(null); }},
      // faixas alternadas de mês (só a cada 2, pra marcar a virada sem pesar o desenho) + linha na virada
      meses.map(function(f,i){ return (i%2) && e("rect",{key:"faixa"+i, x:esq+f.de*slot, y:top, width:(f.ate-f.de+1)*slot, height:base-top, fill:"currentColor", fillOpacity:.035}); }),
      meses.slice(1).map(function(f,i){ return e("line",{key:"div"+i, x1:esq+f.de*slot, x2:esq+f.de*slot, y1:top, y2:base, stroke:"currentColor", strokeOpacity:.14}); }),
      [0,0.25,0.5,0.75,1].map(function(f,i){ var yy = base-(base-top)*f;
        return e("g",{key:"g"+i},
          e("line",{x1:esq, x2:W, y1:yy, y2:yy, stroke:"currentColor", strokeOpacity: i ? .08 : .2}),
          e("text",{x:esq-6, y:yy+3.5, textAnchor:"end", fontSize:10, fill:"currentColor", fillOpacity:.6}, num(base0+range*f))); }),
      pts.map(function(pt,i){
        var yy = y(pt.v), proj = pt.tipo==="projetado", on = sel===i;
        return e("rect",{key:pt.data, x:xDe(i), y:yy, width:barW, height:Math.max(base-yy,2), rx:Math.min(3, barW/3),
          fill: on ? "var(--color-primary)" : "var(--color-success)", fillOpacity: proj ? 0.35 : sel!==null && !on && slot>=3 ? 0.6 : 0.9,
          stroke: proj ? "var(--color-success)" : "none", strokeDasharray: proj ? "3 2" : "none", strokeWidth:1});
      }),
      pt && e("line",{x1:esq+(sel+0.5)*slot, x2:esq+(sel+0.5)*slot, y1:top, y2:base, stroke:"var(--color-primary)", strokeOpacity:.6, strokeDasharray:"3 3", pointerEvents:"none"}),
      rotulos),
    pt && e("div",{className:"pointer-events-none absolute z-10 -translate-x-1/2 whitespace-nowrap rounded-lg border border-border bg-popover px-2.5 py-1.5 text-center shadow-lg",
        style:{left:Math.min(W-70, Math.max(70, esq+(sel+0.5)*slot)), top:Math.max(0, y(pt.v)-62)}},
      e("p",{className:"text-[11px] text-muted-foreground"}, dataBR(pt.data)+(pt.tipo==="projetado" ? " · projeção" : "")),
      e("p",{className:"font-mono text-[14px] font-bold tabular-nums"}, num(pt.v)+" revendedoras"),
      delta!==null && e("p",{className:"font-mono text-[11px] font-semibold tabular-nums "+(delta>0 ? "text-success" : delta<0 ? "text-destructive" : "text-muted-foreground")},
        (delta>0 ? "+" : "")+delta+" "+(pt.tipo==="real" && ant.tipo==="real" ? "em relação ao dia anterior" : "em relação ao ponto anterior"))));
  return e("div",{ref:caixa},
    rolar ? e("div",{ref:rol, className:"rolagem-grafico overflow-x-auto pb-2"}, grafico) : grafico,
    e("p",{className:"mt-1 text-center text-[11px]"}, dataBR(pts[ultimaReal].data)+": "+num(vals[ultimaReal])+" revendedoras"+(pts.some(function(x){return x.tipo==="projetado";})?" · barra clara/tracejada: projeção (dia 1 de cada mês)":"")+" · passe o mouse nas barras para ver cada dia"));
}

export { GraficoColunasRevendedoras };
