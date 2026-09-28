// Sorelly Admin · kits novos Curitiba — components/fluxo.js
// Extraído de sorelly_admin_kits_novos_curitiba.html sem alterar o corpo das funções.
import { COLS, Linha } from "@/apps/kits-novos/components/linha";
import { ETAPAS, aberto, atrasado, dataEtapa } from "@/apps/kits-novos/domain/etapas";
import { diasDesde, tsDe } from "@/apps/kits-novos/lib/datas";
import { use } from "@/apps/kits-novos/state/context";
import { Icon } from "@/apps/kits-novos/ui/icon";
import { MONO } from "@/apps/kits-novos/ui/input";
import { TH, Tabela } from "@/apps/kits-novos/ui/table";
import { e } from "@/shared/react";
import React from "react";

function Fluxo(p){
  var cx = use(), s = cx.state, d = cx.dispatch, cs = p.dados;
  var grupos = ETAPAS.concat([{k:"cancelado", nome:"Cancelado", ic:"ban"}]);
  return e("div",{className:"flex flex-col gap-3"}, grupos.map(function(g){
    var itens = cs.filter(function(c){ return c.st===g.k && (aberto(c) || diasDesde(c.ret) <= s.cfg.ocultarApos); })
      .sort(function(a,b){ if(!aberto(a)) return (tsDe(b.ret)||0)-(tsDe(a.ret)||0); return (atrasado(b,s.cfg)?1:0)-(atrasado(a,s.cfg)?1:0) || (tsDe(dataEtapa(a))||0)-(tsDe(dataEtapa(b))||0); });
    if(s.filtro.st && s.filtro.st!==g.k) return null;
    var ab = !!s.abertos[g.k], atr = itens.filter(function(c){return atrasado(c,s.cfg);}).length, prazo = s.cfg.prazos[g.k];
    var chip = function(t, cls){ return e("span",{className:MONO+" rounded-md px-2 py-0.5 text-xs font-semibold "+cls}, t); };
    return e("div",{key:g.k, className:"overflow-hidden rounded-xl border border-border bg-card"},
      e("div",{className:"flex flex-wrap items-center gap-3 px-3 py-2 "+(ab?"bg-linear-to-r from-primary to-primary/60 text-primary-foreground":"bg-sidebar")},
        e("button",{onClick:function(){d({type:"GRUPO", k:g.k});}, "aria-expanded":ab, className:"inline-flex h-8 items-center gap-2 rounded-lg border px-2.5 font-heading text-sm font-semibold "+(ab?"border-primary-foreground/40":"border-border")},
          e(Icon,{n:ab?"chevdown":"chevright", s:14}), g.nome),
        e("span",{className:"inline-flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-sm font-medium "+(ab?"bg-primary-foreground/15":"bg-muted")}, e(Icon,{n:"clock", s:14}), prazo ? "prazo "+prazo+(prazo>1?" dias":" dia") : "\u00faltimos "+s.cfg.ocultarApos+" dias"),
        chip(itens.length+(itens.length===1?" revendedora":" revendedoras"), ab?"bg-primary-foreground/15":"bg-muted"),
        atr>0 && chip(atr+(atr>1?" atrasadas":" atrasada"), "bg-destructive/20 text-destructive"),
        ab && itens.length>0 && e("span",{className:"h-1.5 w-28 overflow-hidden rounded-full bg-primary-foreground/20"}, e("i",{className:"block h-full bg-primary-foreground/70", style:{width:(itens.length?(itens.length-atr)/itens.length*100:0)+"%"}}))),
      ab && (itens.length ? e("div",{className:"overflow-x-auto"}, e("table",{className:"w-full min-w-[110rem] border-collapse text-sm"},
        e("thead",null, e("tr",{className:"bg-muted/30"}, COLS.map(function(c,i){ return e(TH,{key:i, r:c.r, className:c.cor||""}, c.t); }))),
        e("tbody",null, itens.slice(0,80).map(function(c){ return e(Linha,{key:c.id, c:c}); })),
        itens.length>80 && e("tfoot",null, e("tr",null, e("td",{colSpan:COLS.length, className:"px-3 py-2 text-sm text-muted-foreground"},"+ "+(itens.length-80)+" revendedoras, use os filtros")))))
        : e("p",{className:"px-4 py-3 text-sm text-muted-foreground"},"Nenhuma revendedora nesta etapa.")));
  }));
}
function Planilha(p){
  var cs = p.dados.slice().sort(function(a,b){ return (tsDe(b.cad)||0)-(tsDe(a.cad)||0); }).slice(0, 400);
  return e(React.Fragment,null,
    p.dados.length>400 && e("p",{className:"text-sm text-muted-foreground"},"Mostrando as 400 mais recentes de "+p.dados.length+". Use os filtros."),
    e(Tabela,{cols:COLS, min:"min-w-[110rem]", alto:true}, cs.map(function(c){ return e(Linha,{key:c.id, c:c}); })));
}

export { Fluxo, Planilha };
