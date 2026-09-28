// Sorelly Admin · kits novos Curitiba — pages/Kits.js
// Extraído de sorelly_admin_kits_novos_curitiba.html sem alterar o corpo das funções.
import { ChipsStatus, Filtros, filtrar } from "@/apps/kits-novos/components/filtros";
import { Fluxo, Planilha } from "@/apps/kits-novos/components/fluxo";
import { KPIs } from "@/apps/kits-novos/components/kpis";
import { use } from "@/apps/kits-novos/state/context";
import { Btn } from "@/apps/kits-novos/ui/button";
import { Icon } from "@/apps/kits-novos/ui/icon";
import { PageHead } from "@/apps/kits-novos/ui/page";
import { e } from "@/shared/react";
import React from "react";

function AbaKits(p){
  var cx = use(), s = cx.state, d = cx.dispatch;
  var base = filtrar(Object.assign({}, s, {filtro:Object.assign({}, s.filtro, {st:""})})), dados = filtrar(s);
  var seg = function(m, lb, ic){ return e("button",{onClick:function(){d({type:"MODO", modo:m});}, className:"inline-flex h-9 items-center gap-1.5 rounded-md px-3 text-sm font-medium "+(s.modo===m?"bg-primary text-primary-foreground":"text-muted-foreground hover:bg-muted/50")}, e(Icon,{n:ic, s:15}), lb); };
  return e(React.Fragment,null,
    e(PageHead,{t:"Kits novos", sub:"Curitiba e regi\u00e3o. Do cadastro at\u00e9 a entrega do kit, nas mesmas etapas da planilha."},
      e("div",{className:"flex rounded-lg border border-input bg-input/30 p-0.5"}, seg("fluxo","Fluxo","columns"), seg("planilha","Planilha","table")),
      e(Btn,{v:"primary", ic:"plus", onClick:function(){d({type:"DIALOGO", d:{tipo:"nova"}});}},"Nova revendedora")),
    e(KPIs), e(Filtros,{n:dados.length, listas:p.listas}),
    e("div",{className:"flex flex-wrap items-center gap-2"},
      s.modo==="fluxo" && e("div",{className:"flex rounded-lg border border-border bg-card"},
        e("button",{onClick:function(){d({type:"GRUPOS", v:true});}, className:"inline-flex h-9 items-center gap-1.5 px-3 text-sm font-medium hover:bg-muted/50"}, e(Icon,{n:"chevdown", s:14}),"Abrir todas"),
        e("button",{onClick:function(){d({type:"GRUPOS", v:false});}, className:"inline-flex h-9 items-center gap-1.5 border-l border-border px-3 text-sm font-medium hover:bg-muted/50"}, e(Icon,{n:"chevright", s:14}),"Fechar todas")),
      e(ChipsStatus,{base:base})),
    s.modo==="fluxo" ? e(Fluxo,{dados:dados}) : e(Planilha,{dados:dados}));
}

export { AbaKits };
