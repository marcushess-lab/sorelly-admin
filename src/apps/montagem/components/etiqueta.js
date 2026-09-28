// Sorelly Admin · montagem e bipagem — components/etiqueta.js
// Extraído de sorelly_admin_montagem_bipagem.html sem alterar o corpo das funções.
import { CondChips, CondLista } from "@/apps/montagem/components/condicionais";
import { condOk } from "@/apps/montagem/domain/condicionais";
import { ehAtencao, listagemDe, pecasPara } from "@/apps/montagem/domain/regras";
import { TIPO_KIT } from "@/apps/montagem/domain/status";
import { media3 } from "@/apps/montagem/domain/vendas";
import { use } from "@/apps/montagem/state/context";
import { Icon } from "@/apps/montagem/ui/icon";
import { MONO } from "@/apps/montagem/ui/input";
import { Relogio } from "@/apps/montagem/ui/relogio";
import { e, useState } from "@/shared/react";

function Etiqueta(p){
  var cx = use(), s = cx.state, d = cx.dispatch, k = p.k, l = listagemDe(s, k);
  var ativo = k.status==="montando", atencao = ehAtencao(k.valor, s.cfg), m = media3(k.vendas), pecas = pecasPara(k.valor, s.cfg);
  // Condicionais: a montadora pega ao final da montagem e confirma antes de concluir
  var conds = (k.cond && k.cond.nums) || [], pc = useState(false), pegou = pc[0], setPegou = pc[1];
  var precisaCond = ativo && conds.length>0 && !k.cond.pegas;
  var row = function(lb, v){ return e("div",{className:"flex items-baseline justify-between gap-3"},
    e("span",{className:"text-[13px] text-[#8E8E93]"}, lb), e("b",{className:MONO+" text-[15px] font-semibold"}, v)); };
  var chip = function(txt, cls){ return e("span",{className:"rounded-full px-2.5 py-0.5 text-[12px] font-semibold "+cls}, txt); };
  var pref = function(cor, lb, v){ return e("li",{className:"flex items-center justify-between gap-2"},
    e("span",{className:"inline-flex items-center gap-2 text-[#8E8E93]"}, e("i",{className:"size-2 rounded-full "+cor}), lb), e("b",{className:"text-right"}, v)); };
  var anel = ativo ? " ring-2 ring-amber-300" : p.tipo==="pedido" ? " ring-2 ring-amber-400" : " ring-1 ring-white/10";
  return e("div",{className:"overflow-hidden rounded-3xl bg-[#1C1C1E]"+anel},
    e("div",{className:"flex items-center justify-between bg-linear-to-r from-[#B8862B] via-[#E8B84B] to-[#F1E4C6] px-4 py-2.5 text-[12px] font-semibold text-[#1B1409]"},
      e("span",{className:"truncate"}, l.rep+(l.viagem?", viagem para "+l.destino:"")),
      e("span",{className:"inline-flex shrink-0 items-center gap-1 rounded-full bg-black/25 px-2 py-0.5"}, e(Icon,{n:"clock", s:12}), "Retirada "+l.horario)),
    e("div",{className:"flex flex-col gap-3 p-4"},
      p.tipo==="pedido" && e("div",{className:"rounded-xl bg-amber-400/15 px-3 py-2 text-[12px] font-semibold text-amber-300"},"A Deysiane pediu este kit agora"),
      k.status==="ajuste" && e("div",{className:"rounded-xl bg-rose-500/15 px-3 py-2 text-[12px] font-semibold text-rose-300"},"Voltou para ajuste: "+k.motivo),
      e("div",null,
        e("p",{className:"text-xl font-bold leading-tight"}, k.rev),
        e("p",{className:"text-[13px] text-[#8E8E93]"}, k.bairro)),
      // A montadora não vê valores (vendas, valor do kit): vê o tipo do item e o que enviar
      e("div",{className:"flex items-center justify-between gap-3 rounded-2xl bg-black/50 p-3"},
        e("span",{className:"text-[13px] text-[#8E8E93]"},"Tipo"),
        e("b",{className:"text-[15px] text-amber-200"}, (TIPO_KIT[k.tipoKit]||TIPO_KIT.acerto_kit)[0])),
      conds.length>0 && !ativo && e("div",{className:"flex flex-col gap-1 rounded-2xl bg-black/50 p-3"},
        e("div",{className:"flex items-center justify-between gap-3"},
          e("span",{className:"text-[13px] text-[#8E8E93]"}, conds.length>1 ? conds.length+" condicionais para pegar" : "1 condicional para pegar"), e(CondChips,{k:k, papel:"m"})),
        e("p",{className:"text-[11px] text-[#8E8E93]/70"},"Só dá pra marcar depois de iniciar a montagem")),
      (k.prio || atencao || k.tipo==="ac_sai" || k.ultimaHora) && e("div",{className:"flex flex-wrap gap-1.5"},
        k.prio && chip("★ Prioritário","bg-amber-400/15 text-amber-300"),
        atencao && chip("Precisa de conferência","bg-rose-500/15 text-rose-300"),
        k.tipo==="ac_sai" && chip("Vai sair","bg-sky-500/15 text-sky-300"),
        k.ultimaHora && chip("Última hora","bg-orange-500/15 text-orange-300")),
      pecas && e("div",{className:"rounded-2xl bg-emerald-500/10 p-3.5 ring-1 ring-emerald-400/20"},
        e("div",{className:"mb-2 flex items-center justify-between"},
          e("p",{className:"text-[12px] font-semibold uppercase tracking-wide text-emerald-300"},"O que enviar"),
          e("span",{className:"rounded-full bg-black/30 px-2 py-0.5 text-[11px] font-semibold text-emerald-200"}, pecas.itens.reduce(function(t,x){return t+x.q;},0)+" peças")),
        e("div",{className:"grid grid-cols-2 gap-2"}, pecas.itens.map(function(x){ return e("div",{key:x.nome, className:"flex items-center gap-2 rounded-xl bg-black/40 px-2.5 py-2"},
          e("span",{className:MONO+" grid size-7 shrink-0 place-items-center rounded-lg bg-emerald-400/20 text-[13px] font-bold text-emerald-300"}, x.q),
          e("span",{className:"truncate text-[13px]"}, x.nome.toLowerCase())); }))),
      e("div",{className:"rounded-2xl border border-dashed border-sky-400/50 bg-sky-500/10 p-3"},
        e("p",{className:"text-[12px] font-semibold uppercase tracking-wide text-sky-300"},"O que ela vende · Vendas Vendas (em breve)"),
        e("p",{className:"mt-1 text-[12.5px] text-white/80"},"A IA vai mostrar quantos anéis, conjuntos e infantis ela vendeu, os tamanhos, e o que colocar neste kit.")),
      e("ul",{className:"flex flex-col gap-2 text-[13px]"},
        pref("bg-violet-400","Aro", k.pref.aro),
        e("li",{className:"flex flex-col gap-1"},
          e("div",{className:"flex items-center justify-between gap-2"},
            e("span",{className:"inline-flex items-center gap-2 text-[#8E8E93]"}, e("i",{className:"size-2 rounded-full bg-amber-400"}),"Metal"),
            e("b",null,(100-k.pref.ouro)+"% prata, "+k.pref.ouro+"% dourado")),
          e("div",{className:"flex h-1.5 overflow-hidden rounded-full bg-zinc-300"}, e("i",{className:"ml-auto block h-full bg-linear-to-r from-amber-300 to-yellow-500", style:{width:k.pref.ouro+"%"}}))),
        k.pref.evitar && pref("bg-rose-400","Pedido", k.pref.evitar),
        pref("bg-sky-400","Encomendas", k.pref.enc ? k.pref.enc+(k.pref.enc>1?" separadas":" separada") : "Nenhuma")),
      ativo
        ? e("div",{className:"flex flex-col gap-2"},
            e("div",{className:"flex items-center justify-between rounded-2xl bg-violet-500/15 px-3 py-2"},
              e("span",{className:"text-[13px] text-violet-200"}, k.pausadoEm?"Pausado em":"Montando há"),
              e(Relogio,{k:k, className:"text-lg font-bold text-violet-300"})),
            conds.length>0 && e("div",{className:"flex flex-col gap-2 rounded-2xl bg-amber-400/15 p-3 ring-1 ring-amber-400/30"},
              e("p",{className:"text-[12.5px] font-semibold text-amber-200"}, "Pegue e marque cada condicional ("+conds.length+"). Só conclui com todas marcadas."),
              e(CondLista,{k:k, papel:"m"})),
            e("button",{disabled:!condOk(k, "m"), onClick:function(){d({type:"CONCLUIR_M", id:k.id});}, className:"flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-linear-to-r from-emerald-400 to-teal-400 text-[15px] font-semibold text-black active:translate-y-px disabled:opacity-40"},
              e(Icon,{n:"check"}), atencao ? "Concluir e enviar para conferência" : "Concluir montagem"),
            e("div",{className:"flex gap-2"},
              e("button",{onClick:function(){d({type: k.pausadoEm?"RETOMAR":"PAUSAR", id:k.id});}, className:"flex h-10 flex-1 items-center justify-center gap-1.5 rounded-xl bg-white/10 text-sm font-semibold active:translate-y-px"}, e(Icon,{n:k.pausadoEm?"play":"pause", s:14}), k.pausadoEm?"Retomar":"Pausar"),
              e("button",{onClick:function(){d({type:"DEVOLVER", id:k.id});}, className:"flex h-10 flex-1 items-center justify-center gap-1.5 rounded-xl bg-white/10 text-sm font-semibold active:translate-y-px"}, e(Icon,{n:"undo", s:14}), "Devolver")))
        : e("button",{onClick:function(){d({type:"INICIAR_M", id:k.id, montId:p.montId});}, className:"flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-linear-to-r from-[#B8862B] via-[#E8B84B] to-[#F1E4C6] text-[15px] font-semibold text-[#1B1409] shadow-lg shadow-amber-500/20 active:translate-y-px"},
            e(Icon,{n:"play"}), k.status==="ajuste" ? "Iniciar ajuste" : "Iniciar montagem")));
}

export { Etiqueta };
