// Sorelly Admin · kits novos Curitiba — components/kpis.js
// Extraído de sorelly_admin_kits_novos_curitiba.html sem alterar o corpo das funções.
import { aberto, atrasado, mesDe } from "@/apps/kits-novos/domain/etapas";
import { MESES, diasEntre } from "@/apps/kits-novos/lib/datas";
import { N1 } from "@/apps/kits-novos/lib/format";
import { use } from "@/apps/kits-novos/state/context";
import { KPI } from "@/apps/kits-novos/ui/card";
import { e } from "@/shared/react";

function KPIs(){
  var s = use().state, ds = s.dados, cfg = s.cfg, mesAtual = MESES[new Date().getMonth()];
  var abertos = ds.filter(aberto), noMes = ds.filter(function(c){return mesDe(c)===mesAtual;});
  var entMes = noMes.filter(function(c){return c.st==="entregue";}), cancMes = noMes.filter(function(c){return c.st==="cancelado";});
  var atras = abertos.filter(function(c){return atrasado(c,cfg);}).length;
  var tempos = ds.filter(function(c){return c.st==="entregue" && c.cad && c.ret;}).map(function(c){return diasEntre(c.cad, c.ret);}).filter(function(x){return x>=0;});
  var med = tempos.length ? tempos.slice().sort(function(a,b){return a-b;})[Math.floor(tempos.length/2)] : 0;
  var dentro = tempos.length ? tempos.filter(function(x){return x<=cfg.metaDias;}).length/tempos.length*100 : 0;
  return e("div",{className:"grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6"},
    e(KPI,{l:"Entradas em "+mesAtual.toLowerCase(), v:noMes.length, sub:ds.length+" no ano"}),
    e(KPI,{l:"Em aberto", v:abertos.length, tom:"text-primary", sub:"sem kit entregue"}),
    e(KPI,{l:"Atrasadas", v:atras, tom:atras?"text-destructive":"", sub:"passaram do prazo da etapa"}),
    e(KPI,{l:"Entregues no m\u00eas", v:entMes.length, tom:"text-success", sub:N1(noMes.length?entMes.length/noMes.length*100:0)+"% das entradas"}),
    e(KPI,{l:"Canceladas no m\u00eas", v:cancMes.length, tom:cancMes.length?"text-warning":""}),
    e(KPI,{l:"Meta "+cfg.metaDias+" dias", v:N1(dentro)+"%", tom:dentro>=70?"text-success":"text-warning", sub:"entregues no prazo, mediana "+med+" d"}));
}

export { KPIs };
