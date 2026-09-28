// Sorelly Admin · montagem e bipagem — pages/CelularCondicionais.js
import { CelCondicionais } from "@/apps/montagem/mobile/condicionais";
import { IPhone15 } from "@/apps/montagem/mobile/iphone";
import { PageHead } from "@/apps/montagem/ui/page";
import { e } from "@/shared/react";
import React from "react";

function AbaCelularCond(){
  return e(React.Fragment,null,
    e(PageHead,{t:"Celular das condicionais", sub:"Modelo do app de quem confere as condicionais antes de liberar cada revendedora para a fila de montagem."}),
    e("div",{className:"flex justify-center"}, e(IPhone15,null, e(CelCondicionais))));
}

export { AbaCelularCond };
