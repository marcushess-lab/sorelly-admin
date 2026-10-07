// Sorelly Admin · montagem e bipagem — mobile/revendedora.js
// Extraído de sorelly_admin_montagem_bipagem.html sem alterar o corpo das funções.
import { condNovas } from "@/apps/montagem/domain/condicionais";
import { modalidadeDe, versaoVigente } from "@/apps/montagem/domain/consignado";
import { nomeDe } from "@/apps/montagem/domain/equipe";
import { listagemDe, pecasPara } from "@/apps/montagem/domain/regras";
import { TIPO_KIT } from "@/apps/montagem/domain/status";
import { BK, isoDia } from "@/apps/montagem/lib/format";
import { OURO_APP } from "@/apps/montagem/mobile/bipagem";
import { IPhone15 } from "@/apps/montagem/mobile/iphone";
import { Avatar } from "@/apps/montagem/mobile/theme";
import { use } from "@/apps/montagem/state/context";
import { Icon } from "@/apps/montagem/ui/icon";
import { MONO } from "@/apps/montagem/ui/input";
import { e, useState } from "@/shared/react";

function RecebimentoRep(p){
  var cx = use(), s = cx.state, d = cx.dispatch;
  var pend = (s.retPend||[]).find(function(r){return r.lid===p.l.id;}); if(!pend) return null;
  var ks = s.kits.filter(function(k){return pend.ids.indexOf(k.id)>=0;});
  return e("div",{className:"mb-3 flex flex-col gap-2 rounded-2xl bg-amber-400/15 p-3 ring-2 ring-amber-400/50"},
    e("p",{className:"text-[12px] font-semibold uppercase tracking-wide text-amber-200"},"Confirmar recebimento"),
    e("p",{className:"text-[13px]"}, nomeDe(pend.por)+" está entregando "+ks.length+(ks.length>1?" kits:":" kit:")),
    e("div",{className:"overflow-hidden rounded-xl bg-black/40"}, ks.map(function(k){ return e("div",{key:k.id, className:"flex justify-between gap-2 border-b border-white/5 px-3 py-1.5 text-[13px] last:border-0"},
      e("span",{className:"truncate"}, k.rev), e("span",{className:MONO+" text-amber-200"}, k.valor ? BK(k.valor) : "cond.")); })),
    e("div",{className:"flex gap-2"},
      e("button",{onClick:function(){ d({type:"RESP_RET", id:pend.id, aceita:true}); }, className:"h-10 flex-1 rounded-xl text-sm font-semibold "+OURO_APP},"Recebi os kits"),
      e("button",{onClick:function(){ d({type:"RESP_RET", id:pend.id, aceita:false}); }, className:"h-10 rounded-xl bg-white/10 px-4 text-sm font-semibold"},"Recusar")));
}
function AppRevendedora(p){
  var cx = use(), s = cx.state, d = cx.dispatch, k = p.k;
  var f0 = {confere:null, gostou:0, obs:"", pont:0, expl:0, whats:0}, st = useState(f0), f = st[0], set = st[1];
  var estrelasRep = function(campo, lb){ return e("div",{className:"flex items-center justify-between gap-2 py-1"},
    e("span",{className:"text-[13px]"}, lb),
    e("div",{className:"flex gap-1"}, [1,2,3,4,5].map(function(i){ return e("button",{key:i, "aria-label":lb+": "+i, onClick:function(){ var o = {}; o[campo] = i; up(o); },
      className:"text-2xl leading-none "+(i<=f[campo]?"text-amber-300":"text-white/20")}, "★"); }))); };
  var up = function(o){ set(Object.assign({}, f, o)); };
  var l = listagemDe(s, k), pecas = k.valor ? pecasPara(k.valor, s.cfg) : null, cr = k.confRev;
  // Modalidade do kit (Padrão | 100% Prata): ela mesma pode trocar, mas com no mínimo "trocaModalidadeDias" (10) de antecedência da data do acerto.
  var modAtual = modalidadeDe(s, k.rev), perfilRev = s.perfisRev[k.rev] || {}, vigRev = versaoVigente(s);
  var minDias = vigRev && vigRev.prata ? vigRev.prata.gerais.trocaModalidadeDias : 10;
  var diasAteAcerto = perfilRev.dataAcerto ? Math.round((new Date(perfilRev.dataAcerto+"T12:00:00") - new Date(isoDia(new Date())+"T12:00:00")) / 86400000) : null;
  var podeTrocar = diasAteAcerto!==null && diasAteAcerto>=minDias;
  var blocoModalidade = e("div",{className:"mb-3 flex flex-col gap-2 rounded-2xl bg-[#1C1C1E] p-3"},
    e("div",{className:"flex items-center justify-between gap-2"},
      e("p",{className:"text-[13px] font-semibold"},"Modalidade do meu kit"),
      modAtual==="prata" && e("span",{className:"rounded-full bg-slate-300 px-2 py-0.5 text-[10px] font-black tracking-wider text-slate-900"},"100% PRATA")),
    e("label",{className:"flex items-center justify-between gap-2 text-[12px] text-[#8E8E93]"},"Data do meu acerto",
      e("input",{type:"date", value:perfilRev.dataAcerto||"", onChange:function(ev){ d({type:"SALVAR_PERFIL_REV", chave:k.rev, patch:{dataAcerto:ev.target.value}}); },
        className:"h-9 rounded-lg bg-black/50 px-2 text-[13px] text-white outline-none ring-1 ring-white/10 [color-scheme:dark]"})),
    e("div",{className:"flex gap-2"}, [["padrao","Kit Padrão"],["prata","Kit 100% Prata"]].map(function(o){ var on = modAtual===o[0];
      return e("button",{key:o[0], disabled:!on && !podeTrocar, "aria-pressed":on,
        onClick:function(){ if(!on && podeTrocar) d({type:"SET_MODALIDADE", chave:k.rev, modalidade:o[0], por:k.rev, origem:"revendedora"}); },
        className:"h-10 flex-1 rounded-xl text-[13px] font-semibold disabled:opacity-40 "+(on ? "bg-amber-300 text-[#1B1409]" : "bg-white/10 text-white/80")}, (on?"✓ ":"")+o[1]); })),
    e("p",{className:"text-[11.5px] leading-snug "+(podeTrocar || diasAteAcerto===null ? "text-[#8E8E93]" : "text-amber-300")},
      diasAteAcerto===null ? "Informe a data do seu acerto. Para trocar de modalidade é preciso avisar com pelo menos "+minDias+" dias de antecedência."
      : podeTrocar ? "Faltam "+diasAteAcerto+" dias para o seu acerto: você pode trocar de modalidade."
      : "Faltam "+diasAteAcerto+" dias para o acerto. Para trocar de modalidade é preciso avisar com pelo menos "+minDias+" dias de antecedência."));
  var opt = function(on, txt, onClick, cor){ return e("button",{onClick:onClick, className:"h-10 flex-1 rounded-xl text-[13px] font-semibold "+(on ? cor : "bg-white/10 text-white/80")}, txt); };
  return e(IPhone15,null,
    e("div",{className:"mb-3 flex items-center gap-3"},
      e(Avatar,{nome:k.rev, i:0}),
      e("div",{className:"min-w-0 flex-1"}, e("p",{className:"text-[12px] text-[#8E8E93]"},"App da revendedora"), e("p",{className:"truncate text-xl font-bold"}, k.rev.split(" ")[0]))),
    e("div",{className:"mb-3 rounded-2xl p-3 "+OURO_APP},
      e("p",{className:"text-[12px] font-semibold opacity-80"}, "Seu kit chegou · representante "+l.rep),
      e("p",{className:"text-2xl font-bold"}, k.valor ? BK(k.valor) : "Condicional"),
      e("p",{className:"text-[12px]"}, (TIPO_KIT[k.tipoKit]||TIPO_KIT.acerto_kit)[0]+(condNovas(k).length ? " · condicional "+condNovas(k).join(", ") : ""))),
    blocoModalidade,
    pecas && e("div",{className:"mb-3 rounded-2xl bg-[#1C1C1E] p-3"},
      e("p",{className:"mb-1.5 text-[12px] font-semibold text-[#8E8E93]"},"O que veio no kit"),
      e("div",{className:"flex flex-wrap gap-1.5"}, pecas.itens.map(function(x){ return e("span",{key:x.nome, className:"rounded-lg bg-black/40 px-2.5 py-1 text-[13px]"}, e("b",{className:MONO+" text-amber-200"}, x.q), " "+x.nome.toLowerCase()); }))),
    cr ? e("div",{className:"flex flex-col items-center gap-2 rounded-2xl bg-emerald-400/10 p-4 text-center ring-1 ring-emerald-400/30"},
        e(Icon,{n:"check", s:26, className:"text-emerald-300"}),
        e("b",{className:"text-[15px] text-emerald-200"},"Kit confirmado"),
        e("p",{className:"text-[13px] text-white/75"}, (cr.confere ? "Peças conferem" : "Informou diferença nas peças")+" · "+"★".repeat(cr.gostou)),
        cr.obs && e("p",{className:"text-[12px] italic text-white/60"}, "“"+cr.obs+"”"))
    : e("div",{className:"flex flex-col gap-3"},
        e("div",{className:"rounded-2xl bg-[#1C1C1E] p-3"},
          e("p",{className:"mb-2 text-[13px] font-semibold"},"As peças conferem com o que veio?"),
          e("div",{className:"flex gap-2"},
            opt(f.confere===true, "Sim, conferem", function(){up({confere:true});}, "bg-emerald-400/25 text-emerald-200 ring-1 ring-emerald-400/50"),
            opt(f.confere===false, "Falta peça", function(){up({confere:false});}, "bg-rose-500/25 text-rose-200 ring-1 ring-rose-400/50"))),
        e("div",{className:"rounded-2xl bg-[#1C1C1E] p-3"},
          e("p",{className:"mb-2 text-[13px] font-semibold"},"Gostou do kit?"),
          e("div",{className:"flex justify-center gap-2"}, [1,2,3,4,5].map(function(i){ return e("button",{key:i, "aria-label":i+" estrelas", onClick:function(){up({gostou:i});},
            className:"text-3xl leading-none "+(i<=f.gostou?"text-amber-300":"text-white/20")}, "★"); })),
          e("textarea",{value:f.obs, rows:2, placeholder:"Conte o que achou (opcional)", onChange:function(ev){up({obs:ev.target.value});},
            className:"mt-2 w-full resize-none rounded-xl bg-black/50 px-3 py-2 text-[13px] text-white outline-none ring-1 ring-white/10 placeholder:text-[#8E8E93]"})),
        e("div",{className:"rounded-2xl bg-[#1C1C1E] p-3"},
          e("p",{className:"mb-1 text-[13px] font-semibold"},"Como foi o atendimento da "+l.rep+"?"),
          estrelasRep("pont","Pontualidade"), estrelasRep("expl","Explicou direito"), estrelasRep("whats","Responde o WhatsApp")),
        e("button",{disabled:f.confere===null || !f.gostou || !f.pont || !f.expl || !f.whats, onClick:function(){
            d({type:"CONF_REV", id:k.id, confere:f.confere, gostou:f.gostou, obs:f.obs});
            d({type:"AVAL_REP", rep:l.rep, rev:k.rev, kitId:k.id, pont:f.pont, expl:f.expl, whats:f.whats}); },
          className:"h-12 rounded-2xl text-[15px] font-semibold disabled:opacity-40 "+OURO_APP},"Confirmar e enviar")));
}

export { RecebimentoRep, AppRevendedora };
