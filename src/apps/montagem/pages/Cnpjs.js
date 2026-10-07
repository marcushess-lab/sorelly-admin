// Sorelly Admin · montagem — pages/Cnpjs.js
// Só o cadastro das empresas da Sorelly: um bloco de cor por CNPJ. O fiscal e a projeção ficam em Limite de faturamento.
// Cadastro editado fica em state.cnpjs.
import { CAMPOS_CNPJ, cnpjsDe } from "@/apps/montagem/domain/cnpjs";
import { use } from "@/apps/montagem/state/context";
import { INPUT } from "@/apps/montagem/ui/input";
import { PageHead } from "@/apps/montagem/ui/page";
import { e, useState } from "@/shared/react";
import React from "react";

var EDIT_INPUT = INPUT+" h-9! w-full border-white/30! bg-black/25! text-center text-white!";

function BlocoCnpj(p){
  var d = use().dispatch, c = p.c, ed = useState(false), editando = ed[0], setEditando = ed[1];
  return e("section",{className:"flex flex-col items-center gap-3 rounded-2xl p-4 shadow-lg", style:{background:c.cor}},
    e("div",{className:"flex flex-col items-center gap-0.5 text-center"},
      e("span",{className:"text-[11px] font-bold uppercase tracking-widest text-white/75"}, c.num ? "CNPJ "+c.num : "Empresa"),
      e("h2",{className:"font-heading text-xl font-semibold text-white"}, c.nome)),
    e("div",{className:"grid w-full grid-cols-2 gap-x-4 gap-y-2.5 sm:grid-cols-3"},
      CAMPOS_CNPJ.map(function(par){
        var k = par[0], v = c[k] || "", largo = k==="razao" || k==="endereco" || k==="email" || k==="socio";
        return e("div",{key:k, className:"flex min-w-0 flex-col items-center gap-0.5 text-center "+(largo ? "col-span-2 sm:col-span-3" : "")},
          e("span",{className:"text-[11px] font-semibold uppercase tracking-wide text-white/70"}, par[1]),
          editando
            ? e("input",{className:EDIT_INPUT, value:v, "aria-label":c.nome+" "+par[1], onChange:function(ev){ d({type:"CNPJ_SET", id:c.id, campo:k, valor:ev.target.value}); }})
            : e("span",{className:"break-words text-[14px] font-medium text-white"}, v || "—"));
      })),
    e("button",{onClick:function(){ setEditando(!editando); }, className:"rounded-lg border border-white/40 bg-black/20 px-4 py-1.5 text-[13px] font-semibold text-white hover:bg-black/35"},
      editando ? "Pronto" : "Editar dados"));
}
function AbaCnpjs(){
  var s = use().state;
  return e(React.Fragment,null,
    e(PageHead,{t:"CNPJs", sub:"Os dados de cada empresa da Sorelly. O fiscal e o limite de faturamento ficam na tela Limite de faturamento."}),
    e("div",{className:"mx-auto grid w-full max-w-5xl grid-cols-1 gap-3 lg:grid-cols-2"},
      cnpjsDe(s.cnpjs).map(function(c){ return e(BlocoCnpj,{key:c.id, c:c}); })));
}

export { AbaCnpjs };
