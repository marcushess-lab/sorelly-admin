// Sorelly Admin · montagem e bipagem — pages/CelularBipagem.js
// Extraído de sorelly_admin_montagem_bipagem.html sem alterar o corpo das funções.
import { BIPADORAS } from "@/apps/montagem/domain/equipe";
import { AppBipagemRetirada } from "@/apps/montagem/mobile/bipagem";
import { Avatar } from "@/apps/montagem/mobile/theme";
import { Card } from "@/apps/montagem/ui/card";
import { PageHead } from "@/apps/montagem/ui/page";
import { e, useState } from "@/shared/react";
import React from "react";

function AbaCelularBip(){
  var sl = useState(BIPADORAS[0].id), bid = sl[0], setBid = sl[1];
  var bip = BIPADORAS.find(function(b){return b.id===bid;});
  return e(React.Fragment,null,
    e(PageHead,{t:"Celular da bipagem", sub:"Modelo do app da bipadora que faz a retirada com as representantes, em paralelo com o balcão. A retirada só vale depois que a representante confirma no app dela."}),
    e("div",{className:"flex flex-col items-center gap-6 lg:flex-row lg:items-start lg:justify-center"},
      e(AppBipagemRetirada,{key:bid, bip:bip}),
      e(Card,{className:"flex w-full max-w-sm flex-col gap-1 p-2!"},
        e("p",{className:"px-2 pb-1 pt-1 text-sm font-semibold uppercase tracking-wide text-muted-foreground"},"Conectar como"),
        BIPADORAS.map(function(b){ var on = b.id===bid; return e("button",{key:b.id, onClick:function(){setBid(b.id);},
          className:"flex items-center gap-3 rounded-lg px-2 py-2 text-left "+(on?"bg-sidebar-accent ring-1 ring-primary/40":"hover:bg-muted/50")},
          e(Avatar,{nome:b.nome, i:0, className:"size-8 text-sm"}), e("b",{className:"text-sm"}, b.nome)); }))));
}

export { AbaCelularBip };
