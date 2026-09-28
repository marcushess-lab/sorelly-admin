// Sorelly Admin · montagem e bipagem — components/kits-novos-rep.js
// Extraído de sorelly_admin_montagem_bipagem.html sem alterar o corpo das funções.
import { BK } from "@/apps/montagem/lib/format";
import { OURO_APP } from "@/apps/montagem/mobile/bipagem";
import { use } from "@/apps/montagem/state/context";
import { MONO } from "@/apps/montagem/ui/input";
import { e, useState } from "@/shared/react";

function foraDoPrazo(l, s){
  var p = l.horario.split(":"), ret = new Date(); ret.setHours(+p[0], +p[1], 0, 0);
  return (ret.getTime() - Date.now())/3600000 < s.cfg.prazoPedidoHoras;
}
function KitsNovosRep(p){
  var cx = use(), s = cx.state, d = cx.dispatch, l = p.l;
  var minhas = (s.novas||[]).filter(function(n){return n.rep===l.rep && n.status!=="aguardando";});
  // a representante define em qual listagem o kit novo vai
  var minhasL = s.listagens.filter(function(x){return x.rep===l.rep && !x.fechada;});
  var ls = useState(l.id), lidN = ls[0], setLidN = ls[1];
  var lN = minhasL.find(function(x){return x.id===lidN;}) || minhasL[0] || l;
  var fora = foraDoPrazo(lN, s);
  if(!minhas.length) return e("div",{className:"rounded-2xl bg-[#1C1C1E] p-4 text-center text-[13px] text-[#8E8E93]"},"Nenhuma revendedora nova direcionada para você.");
  return e("div",{className:"flex flex-col gap-2"},
    minhasL.length>0 && e("label",{className:"flex flex-col gap-1 px-1 text-[12px] font-semibold text-[#8E8E93]"}, "Em qual listagem colocar",
      e("select",{value:lN.id, onChange:function(ev){setLidN(ev.target.value);}, className:"h-10 rounded-xl px-3 text-sm font-semibold text-foreground outline-none ring-1 ring-white/10"},
        minhasL.map(function(x){ return e("option",{key:x.id, value:x.id}, "Retirada "+x.horario+" · "+x.destino); }))),
    fora && e("p",{className:"px-1 text-[12px] text-amber-200"},"Essa listagem retira em menos de "+s.cfg.prazoPedidoHoras+" h: o kit novo entra como atrasado."),
    minhas.map(function(n){ return e("div",{key:n.id, className:"flex flex-col gap-2 rounded-2xl bg-[#1C1C1E] p-3"},
      e("div",{className:"flex items-baseline justify-between gap-2"}, e("b",{className:"truncate text-[14px]"}, n.nome), e("span",{className:MONO+" text-amber-200"}, BK(n.valor))),
      e("p",{className:"text-[12px] text-[#8E8E93]"}, n.bairro+" · kit novo"+(n.expositor?" + expositor":"")),
      n.status==="na listagem" ? e("span",{className:"text-[12px] font-semibold text-emerald-300"},"✓ Na listagem")
      : e("div",{className:"flex gap-2"},
          e("button",{disabled:lN.fechada, onClick:function(){ d({type:"NOVA_INCLUIR", id:n.id, lid:lN.id, foraPrazo:fora, quem:"rep"}); },
            className:"h-9 flex-1 rounded-xl text-[13px] font-semibold disabled:opacity-40 "+OURO_APP},"Colocar na listagem das "+lN.horario),
          e("button",{onClick:function(){ d({type:"RECUSAR_NOVA", id:n.id}); }, title:"A recusa entra na sua avaliação",
            className:"h-9 rounded-xl px-3 text-[13px] font-semibold txt-branco", style:{background:"#DC2626"}},"Recusar"))); }),
    minhas.some(function(n){return n.status==="direcionada";}) && e("p",{className:"px-1 text-[11.5px] text-[#8E8E93]"},"Recusar kit novo entra na sua avaliação. Com "+s.cfg.recusasBloqueio+" recusas você deixa de receber revendedoras novas."));
}

export { foraDoPrazo, KitsNovosRep };
