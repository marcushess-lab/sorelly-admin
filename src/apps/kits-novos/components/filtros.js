// Sorelly Admin · kits novos Curitiba — components/filtros.js
// Extraído de sorelly_admin_kits_novos_curitiba.html sem alterar o corpo das funções.
import { ETAPAS, aberto, atrasado, mesDe } from "@/apps/kits-novos/domain/etapas";
import { MESES } from "@/apps/kits-novos/lib/datas";
import { use } from "@/apps/kits-novos/state/context";
import { Btn } from "@/apps/kits-novos/ui/button";
import { Icon } from "@/apps/kits-novos/ui/icon";
import { INPUT, MONO } from "@/apps/kits-novos/ui/input";
import { e } from "@/shared/react";

function filtrar(s){ var f = s.filtro, b = f.busca.toLowerCase();
  return s.dados.filter(function(c){
    if(b && (c.nome+" "+c.bai+" "+c.cid+" "+c.rep).toLowerCase().indexOf(b)<0) return false;
    if(f.st && c.st!==f.st) return false; if(f.rep && c.rep!==f.rep) return false; if(f.cid && c.cid!==f.cid) return false;
    if(f.mes && mesDe(c)!==f.mes) return false; if(f.ent && c.ent!==f.ent) return false;
    if(f.so==="atrasadas" && !atrasado(c, s.cfg)) return false; if(f.so==="abertos" && !aberto(c)) return false;
    return true; }); }
function Chip(p){ return e("button",{onClick:p.onClick, className:"inline-flex h-9 items-center gap-2 rounded-lg border px-3 text-sm font-medium "+(p.on?"border-primary bg-primary/15 text-primary":"border-border bg-card text-foreground hover:bg-muted/50")},
  p.children, e("span",{className:MONO+" rounded-md px-1.5 text-xs "+(p.on?"bg-primary/20":"bg-muted")}, p.n)); }
function Filtros(p){
  var cx = use(), s = cx.state, d = cx.dispatch, f = s.filtro, up = function(k,v){ var o={}; o[k]=v; d({type:"FILTRO", f:o}); };
  var sel = function(k, lb, ops, ic){ return e("div",{className:"relative"}, e(Icon,{n:ic, s:15, className:"pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-primary"}),
    e("select",{className:INPUT+" max-w-60 pl-9 font-medium", value:f[k], "aria-label":lb, onChange:function(ev){up(k, ev.target.value);}},
      e("option",{value:""}, lb), ops.map(function(o){ return e("option",{key:o, value:o}, o); }))); };
  var l = p.listas, atras = s.dados.filter(function(c){return atrasado(c,s.cfg);}).length;
  return e("div",{className:"flex flex-wrap items-center gap-2"},
    e("div",{className:"relative"}, e(Icon,{n:"search", s:16, className:"pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"}),
      e("input",{className:INPUT+" w-64 pl-9", placeholder:"Buscar revendedora", value:f.busca, onChange:function(ev){up("busca", ev.target.value);}})),
    sel("rep","Todas as representantes", l.reps, "user"), sel("cid","Todas as cidades", l.cids, "map"), sel("ent","Todas as entradas", l.ents, "flag"),
    sel("mes","Todos os meses", MESES.filter(function(m){return l.meses.indexOf(m)>=0;}), "calendar"),
    atras>0 && e("button",{onClick:function(){up("so", f.so==="atrasadas"?"":"atrasadas");}, className:"inline-flex h-10 items-center gap-2 rounded-lg border px-3 text-sm font-medium "+(f.so==="atrasadas"?"border-destructive bg-destructive/15 text-destructive":"border-warning/50 bg-warning/10 text-warning")},
      e(Icon,{n:"alert", s:15}), atras+(atras>1?" revendedoras atrasadas":" revendedora atrasada")),
    (f.busca||f.st||f.rep||f.cid||f.mes||f.ent||f.so) && e(Btn,{v:"ghost", sm:true, ic:"x", onClick:function(){d({type:"FILTRO", f:{busca:"", st:"", rep:"", cid:"", mes:"", ent:"", so:""}});}},"Limpar"),
    e("span",{className:"ml-auto text-sm text-muted-foreground"}, p.n+" revendedoras"));
}
function ChipsStatus(p){
  var cx = use(), s = cx.state, d = cx.dispatch, ds = p.base, f = s.filtro;
  var n = function(k){ return ds.filter(function(c){return c.st===k;}).length; };
  return e("div",{className:"flex flex-wrap gap-2"},
    e(Chip,{on:!f.st, n:ds.length, onClick:function(){d({type:"FILTRO", f:{st:""}});}},"Todas"),
    ETAPAS.concat([{k:"cancelado", nome:"Cancelado"}]).map(function(et){ return e(Chip,{key:et.k, on:f.st===et.k, n:n(et.k), onClick:function(){d({type:"FILTRO", f:{st: f.st===et.k?"":et.k}});}}, et.nome); }));
}

export { filtrar, Chip, Filtros, ChipsStatus };
