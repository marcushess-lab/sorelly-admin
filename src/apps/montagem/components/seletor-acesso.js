// Sorelly Admin · montagem e bipagem — components/seletor-acesso.js
// Extraído de sorelly_admin_montagem_bipagem.html sem alterar o corpo das funções.
import { BIPADORAS, DIRETORIA, KITNOVO, LISTAGENS_RESP, MONTADORAS, SUPERVISORA } from "@/apps/montagem/domain/equipe";
import { use } from "@/apps/montagem/state/context";
import { Icon } from "@/apps/montagem/ui/icon";
import { e } from "@/shared/react";

function SeletorAcesso(){
  var cx = use(), s = cx.state, d = cx.dispatch;
  return e("label",{className:"relative flex items-center"},
    e(Icon,{n:"user", s:15, className:"pointer-events-none absolute left-2.5 text-primary"}),
    e("select",{value:s.usuario, "aria-label":"Acesso (simulação do login)", onChange:function(ev){d({type:"LOGIN", id:+ev.target.value});},
        className:"h-9 cursor-pointer rounded-lg border border-primary/40 bg-primary/10 pl-8 pr-2 text-sm font-semibold outline-none hover:bg-primary/15"},
      e("optgroup",{label:"Supervisão"}, e("option",{value:SUPERVISORA.id}, SUPERVISORA.nome)),
      e("optgroup",{label:"Diretoria"}, DIRETORIA.map(function(x){return e("option",{key:x.id, value:x.id}, x.nome);})),
      e("optgroup",{label:"Kit novo"}, e("option",{value:KITNOVO.id}, KITNOVO.nome)),
      e("optgroup",{label:"Listagens e condicionais"}, e("option",{value:LISTAGENS_RESP.id}, LISTAGENS_RESP.nome)),
      e("optgroup",{label:"Atendimento e bipagem"}, BIPADORAS.map(function(b){return e("option",{key:b.id, value:b.id}, b.nome);})),
      e("optgroup",{label:"Montagem de kits"}, MONTADORAS.map(function(m){return e("option",{key:m.id, value:m.id}, m.nome);}))));
}

export { SeletorAcesso };
