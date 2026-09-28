// Sorelly Admin · kits novos Curitiba — components/dialogos.js
// Extraído de sorelly_admin_kits_novos_curitiba.html sem alterar o corpo das funções.
import { EntBadge, Etiquetas, StBadge } from "@/apps/kits-novos/components/badges";
import { ETAPAS, aberto, diasNaEtapa, etapaDe } from "@/apps/kits-novos/domain/etapas";
import { dataBR, hojeISO } from "@/apps/kits-novos/lib/datas";
import { direcionarParaRepresentante } from "@/apps/kits-novos/lib/bridge-montagem";
import { use } from "@/apps/kits-novos/state/context";
import { badge } from "@/apps/kits-novos/ui/badge";
import { Btn } from "@/apps/kits-novos/ui/button";
import { Icon } from "@/apps/kits-novos/ui/icon";
import { INPUT, MONO, MoneyInput } from "@/apps/kits-novos/ui/input";
import { Modal } from "@/apps/kits-novos/ui/modal";
import { e, useState } from "@/shared/react";

function Campo(p){ return e("label",{className:"flex flex-col gap-1.5 "+(p.className||"")}, e("span",{className:"text-sm font-medium"}, p.l), p.children); }
function linkWhats(tel){ var d = (tel||"").replace(/\D/g,""); if(!d) return null; return "https://wa.me/55"+d; }
// Uma linha de contato de referência: nome, telefone (com atalho pro WhatsApp), o que é da pessoa, e o confirmado (verde) de sempre.
function LinhaContato(p){
  var f = p.f, up = p.up, n = p.n, pre = "c"+n, link = linkWhats(f[pre+"t"]);
  return e("div",{className:"grid grid-cols-1 gap-2 sm:grid-cols-[1fr_1fr_1fr_auto_auto] sm:items-end"},
    e(Campo,{l:(n===1?"1º":n===2?"2º":"3º")+" contato"}, e("input",{className:INPUT, placeholder:"Nome", value:f[pre+"n"]||"", onChange:function(ev){up(pre+"n", ev.target.value);}})),
    e(Campo,{l:"Telefone"}, e("input",{className:INPUT, placeholder:"(41) 9…", value:f[pre+"t"]||"", onChange:function(ev){up(pre+"t", ev.target.value);}})),
    e(Campo,{l:"O que é da pessoa"}, e("input",{className:INPUT, placeholder:"Mãe, vizinha, amiga…", value:f[pre+"r"]||"", onChange:function(ev){up(pre+"r", ev.target.value);}})),
    e("a",{href:link||undefined, target:"_blank", rel:"noreferrer", "aria-disabled":!link, title:link?"Chamar no WhatsApp":"Sem telefone",
        className:"flex h-10 items-center gap-1.5 rounded-lg border px-3 text-sm font-semibold "+(link?"border-success/40 bg-success/10 text-success hover:bg-success/15":"pointer-events-none border-border text-muted-foreground/50"),
        onClick:function(ev){ if(!link) ev.preventDefault(); }}, e(Icon,{n:"send", s:15}),"WhatsApp"),
    e("label",{className:"flex h-10 items-center gap-2 text-sm font-medium"}, e("input",{type:"checkbox", checked:!!f["c"+n], onChange:function(){up("c"+n,!f["c"+n]);}, className:"size-4 accent-primary"}), "Confirmado"));
}
function DlgDetalhe(p){
  var cx = use(), s = cx.state, d = cx.dispatch, c = p.c, listas = p.listas;
  var st = useState({rep:c.rep, mod:c.mod, val:c.val||0, retirada:c.retirada, disp:c.disp, obs:c.obs, obs2:c.obs2, tipo:c.tipo, ent:c.ent, bai:c.bai, cid:c.cid, trab:c.trab, trabEnd:c.trabEnd,
    c1:c.c1, c2:c.c2, c3:c.c3, c1n:c.c1n, c1t:c.c1t, c1r:c.c1r, c2n:c.c2n, c2t:c.c2t, c2r:c.c2r, c3n:c.c3n, c3t:c.c3t, c3r:c.c3r});
  var f = st[0], set = st[1], up = function(k,v){ var n = Object.assign({}, f); n[k]=v; set(n); };
  var et = etapaDe(c), prox = et && ETAPAS[et.n];
  var inp = function(k, extra){ return e("input",Object.assign({className:INPUT, value:f[k]||"", onChange:function(ev){up(k, ev.target.value);}}, extra||{})); };
  var selecao = function(k, ops){ return e("select",{className:INPUT, value:f[k]||"", onChange:function(ev){up(k, ev.target.value);}},
    e("option",{value:""},"\u2014"), (ops.indexOf(f[k])<0 && f[k] ? [f[k]] : []).concat(ops).map(function(o){ return e("option",{key:o, value:o}, o); })); };
  var datas = [["Cadastro",c.cad],["Liberado",c.lib],["Solicitado",c.sol],["Bipado",c.bip],["Retorno",c.ret]];
  return e(Modal,{open:true, titulo:c.nome, sub:(c.bai?c.bai+", ":"")+c.cid+(c.op?" \u00b7 cadastro por "+c.op:"")+(c.entId?" \u00b7 campanha "+c.entId:""), confirmar:"Salvar altera\u00e7\u00f5es", icone:"save", onClose:p.fechar,
      onConfirmar:function(){ d({type:"SALVAR", id:c.id, campos:f}); }},
    e("div",{className:"flex flex-wrap gap-1.5"}, e(StBadge,{c:c}), e(EntBadge,{c:c}), e(Etiquetas,{c:c}), aberto(c) && badge(diasNaEtapa(c)+" dias na etapa","muted","clock")),
    e("div",{className:"grid grid-cols-5 gap-2 rounded-lg bg-muted/40 p-3"}, datas.map(function(x){ return e("div",{key:x[0]}, e("p",{className:"text-[11px] font-semibold uppercase tracking-wide text-muted-foreground"}, x[0]), e("p",{className:MONO+" text-sm"}, dataBR(x[1]))); })),
    e("div",{className:"flex flex-wrap gap-2"},
      aberto(c) && prox && e(Btn,{v:"primary", ic:"arrowright", onClick:function(){d({type:"DIALOGO", d:{tipo:"avancar", id:c.id}});}},"Avan\u00e7ar para "+prox.nome.toLowerCase()),
      aberto(c) && et.n>1 && e(Btn,{ic:"undo", onClick:function(){d({type:"DIALOGO", d:{tipo:"voltar", id:c.id}});}},"Voltar etapa"),
      aberto(c) && e(Btn,{ic:"calendar", v:(c.desm||0)>=s.cfg.maxDesmarcacoes-1?"destructive":"secondary", onClick:function(){d({type:"DESMARCOU", id:c.id});}}, "Desmarcou ("+(c.desm||0)+"/"+s.cfg.maxDesmarcacoes+")"),
      aberto(c) && e(Btn,{v:"destructive", ic:"ban", onClick:function(){d({type:"DIALOGO", d:{tipo:"cancelar", id:c.id}});}},"Cancelar revendedora"),
      c.st==="cancelado" && e(Btn,{v:"success", ic:"refresh", onClick:function(){d({type:"REATIVAR", id:c.id});}},"Reativar"),
      s.usuario==="nickolas" && e(Btn,{v:"destructive", ic:"trash", onClick:function(){d({type:"EXCLUIR", id:c.id});}},"Excluir")),
    (c.desm||0)>=s.cfg.maxDesmarcacoes && e("p",{className:"rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"},"J\u00e1 desmarcou "+c.desm+" vezes com a representante. Pela regra, pode cancelar."),
    e("div",{className:"grid grid-cols-1 gap-3 sm:grid-cols-2"},
      e(Campo,{l:"Representante"}, selecao("rep", listas.reps)), e(Campo,{l:"Cidade"}, selecao("cid", listas.cids)),
      e(Campo,{l:"Bairro"}, inp("bai")), e(Campo,{l:"Modelo do kit"}, selecao("mod", ["Misto","Prata"])),
      e(Campo,{l:"Valor do kit"}, e(MoneyInput,{value:f.val, onChange:function(v){up("val", v);}, label:"Valor do kit"})),
      e(Campo,{l:"Retirada na empresa"}, inp("retirada", {placeholder:"06/01 \u00e0s 13:30"})),
      e(Campo,{l:"Tipo"}, selecao("tipo", ["Vendedora","Retornando"])), e(Campo,{l:"Entrada"}, selecao("ent", listas.ents)),
      e(Campo,{l:"Trabalho (nome do local)"}, inp("trab")),
      e(Campo,{l:"Endere\u00e7o do trabalho"}, inp("trabEnd")),
      e(Campo,{l:"Disponibilidade", className:"sm:col-span-2"}, inp("disp")),
      e(Campo,{l:"Observa\u00e7\u00e3o", className:"sm:col-span-2"}, inp("obs")),
      e(Campo,{l:"Indica\u00e7\u00e3o / origem", className:"sm:col-span-2"}, inp("obs2"))),
    e("div",{className:"flex flex-col gap-3 rounded-lg bg-muted/40 p-3"},
      e("div",null, e("span",{className:"text-sm font-semibold"},"Contatos de refer\u00eancia"), e("p",{className:"text-[12.5px] text-muted-foreground"},"Vai junto pro app da representante, com bot\u00e3o direto pro WhatsApp.")),
      [1,2,3].map(function(n){ return e(LinhaContato,{key:n, f:f, up:up, n:n}); })),
    (c.hist||[]).length>0 && e("div",null, e("h4",{className:"mb-1 font-heading text-sm font-semibold"},"Hist\u00f3rico no sistema"),
      e("ol",{className:"ml-2 flex flex-col gap-1 border-l-2 border-primary pl-4"}, c.hist.slice().reverse().map(function(h,i){ return e("li",{key:i, className:"text-sm"}, e("span",{className:MONO+" text-muted-foreground"}, new Date(h.em).toLocaleString("pt-BR",{day:"2-digit",month:"2-digit",hour:"2-digit",minute:"2-digit"})), " ", e("b",null,h.quem), " ", h.txt); }))));
}
function DlgAvancar(p){
  var d = use().dispatch, c = p.c, et = etapaDe(c), prox = ETAPAS[et.n];
  var st = useState({data:hojeISO(), retirada:c.retirada||"", rep:c.rep||"", ok:false}), f = st[0], set = st[1], up = function(k,v){ var n = Object.assign({}, f); n[k]=v; set(n); };
  var precisaRep = prox.k==="solicitado" && !f.rep, precisaOk = prox.k==="entregue" && !f.ok;
  return e(Modal,{open:true, titulo:"Avan\u00e7ar para "+prox.nome, sub:c.nome+", hoje em "+et.nome, confirmar:"Confirmar", icone:"arrowright", desabilitado:!f.data||precisaRep||precisaOk,
      onClose:p.fechar, onConfirmar:function(){ var extra = {}; if(prox.k==="solicitado") extra.rep = f.rep; if(prox.k==="entregue") extra.retirada = f.retirada;
        d({type:"AVANCAR", id:c.id, data:f.data, extra:extra});
        if(prox.k==="solicitado" && f.rep) direcionarParaRepresentante(c, f.rep); }},
    e("div",{className:"grid grid-cols-1 gap-3 sm:grid-cols-2"},
      e(Campo,{l:"Data de "+prox.nome.toLowerCase()}, e("input",{type:"date", className:INPUT+" "+MONO, value:f.data, onChange:function(ev){up("data", ev.target.value);}})),
      prox.k==="solicitado" && e(Campo,{l:"Representante"}, e("select",{className:INPUT, value:f.rep, onChange:function(ev){up("rep", ev.target.value);}}, e("option",{value:""},"Escolha"), p.listas.reps.map(function(r){return e("option",{key:r, value:r}, r);}))),
      prox.k==="entregue" && e(Campo,{l:"Retirada na empresa (dia e hora)"}, e("input",{className:INPUT, value:f.retirada, placeholder:"24/09 \u00e0s 14:00", onChange:function(ev){up("retirada", ev.target.value);}}))),
    prox.k==="liberado" && e("p",{className:"text-sm text-muted-foreground"},"Liberado = cadastro ok, pode solicitar o kit."),
    prox.k==="solicitado" && e("p",{className:"text-sm text-muted-foreground"},"Direciona pra representante escolhida: entra em Kits \u2192 Kits novos (e no app dela) pra aceitar ou recusar, do jeito que j\u00e1 funciona hoje."),
    prox.k==="entregue" && e("label",{className:"flex items-center gap-2 text-sm font-medium"}, e("input",{type:"checkbox", checked:f.ok, onChange:function(){up("ok",!f.ok);}, className:"size-4 accent-primary"}), "Kit entregue \u00e0 revendedora"),
    precisaRep && e("p",{className:"text-sm text-warning"},"Para solicitar o kit \u00e9 preciso definir a representante."));
}
function DlgMotivo(p){
  var cx = use(), s = cx.state, d = cx.dispatch, c = p.c, canc = p.tipo==="cancelar";
  var mt = useState(canc && (c.desm||0)>=s.cfg.maxDesmarcacoes ? "Fica desmarcando com a representante" : ""), mot = mt[0], setMot = mt[1];
  return e(Modal,{open:true, titulo:canc?"Cancelar revendedora":"Voltar etapa", sub:c.nome, confirmar:canc?"Cancelar revendedora":"Voltar", icone:canc?"ban":"undo", perigo:true, desabilitado:!mot.trim(),
      onClose:p.fechar, onConfirmar:function(){ d({type:canc?"CANCELAR":"VOLTAR", id:c.id, motivo:mot.trim()}); }},
    canc ? e(Campo,{l:"Motivo"}, e("select",{className:INPUT, value:mot, onChange:function(ev){setMot(ev.target.value);}}, e("option",{value:""},"Escolha"), s.cfg.motivosCancel.map(function(m){return e("option",{key:m, value:m}, m);})))
         : e(Campo,{l:"Motivo"}, e("input",{className:INPUT, value:mot, autoFocus:true, onChange:function(ev){setMot(ev.target.value);}})));
}
function DlgNova(p){
  var cx = use(), s = cx.state, d = cx.dispatch, listas = p.listas;
  var st = useState({nome:"", cid:"Curitiba", bai:"", rep:"", mod:"Misto", val:s.cfg.valorPadrao, tipo:"Vendedora", ent:"", trab:"", trabEnd:"", disp:"", obs2:"", c1n:"", c1t:"", c1r:""}), f = st[0], set = st[1], up = function(k,v){ var n = Object.assign({}, f); n[k]=v; set(n); };
  var inp = function(k, ph){ return e("input",{className:INPUT, value:f[k], placeholder:ph||"", onChange:function(ev){up(k, ev.target.value);}}); };
  var sel = function(k, ops){ return e("select",{className:INPUT, value:f[k], onChange:function(ev){up(k, ev.target.value);}}, e("option",{value:""},"\u2014"), ops.map(function(o){return e("option",{key:o, value:o}, o);})); };
  return e(Modal,{open:true, titulo:"Nova revendedora", sub:"Entra como Cadastrada com a data de hoje", confirmar:"Cadastrar", icone:"plus", desabilitado:!f.nome.trim(), onClose:p.fechar, onConfirmar:function(){ d({type:"NOVA", dados:f}); }},
    e("div",{className:"grid grid-cols-1 gap-3 sm:grid-cols-2"},
      e(Campo,{l:"Nome", className:"sm:col-span-2"}, e("input",{className:INPUT, value:f.nome, autoFocus:true, onChange:function(ev){up("nome", ev.target.value);}})),
      e(Campo,{l:"Cidade"}, sel("cid", listas.cids)), e(Campo,{l:"Bairro"}, inp("bai")),
      e(Campo,{l:"Representante (pode definir depois)"}, sel("rep", listas.reps)), e(Campo,{l:"Entrada"}, sel("ent", listas.ents)),
      e(Campo,{l:"Modelo do kit"}, sel("mod", ["Misto","Prata"])), e(Campo,{l:"Valor do kit"}, e(MoneyInput,{value:f.val, onChange:function(v){up("val", v);}, label:"Valor do kit"})),
      e(Campo,{l:"Tipo"}, sel("tipo", ["Vendedora","Retornando"])), e(Campo,{l:"Trabalho (nome do local)"}, inp("trab")),
      e(Campo,{l:"Endere\u00e7o do trabalho"}, inp("trabEnd")),
      e(Campo,{l:"Disponibilidade"}, inp("disp", "Kit novo - Disponibilidade 24/09 a 02/10 ou VEM NA EMPRESA")),
      e(Campo,{l:"Indica\u00e7\u00e3o / origem", className:"sm:col-span-2"}, inp("obs2"))),
    e("div",{className:"flex flex-col gap-2 rounded-lg bg-muted/40 p-3"},
      e("span",{className:"text-sm font-semibold"},"1\u00ba contato de refer\u00eancia"),
      e("div",{className:"grid grid-cols-1 gap-2 sm:grid-cols-3"},
        inp("c1n","Nome"), inp("c1t","Telefone"), inp("c1r","O que \u00e9 da pessoa")),
      e("p",{className:"text-[12px] text-muted-foreground"},"O 2\u00ba e 3\u00ba contato d\u00e3o pra completar depois, no detalhe da revendedora.")));
}
function Dialogos(p){
  var cx = use(), s = cx.state, d = cx.dispatch, dg = s.dialogo; if(!dg) return null;
  var fechar = function(){ d({type:"DIALOGO", d:null}); };
  if(dg.tipo==="nova") return e(DlgNova,{fechar:fechar, listas:p.listas});
  var c = s.dados.find(function(x){return x.id===dg.id;}); if(!c) return null;
  var key = c.id+c.st+(c.hist||[]).length;
  if(dg.tipo==="detalhe") return e(DlgDetalhe,{key:key, c:c, fechar:fechar, listas:p.listas});
  if(dg.tipo==="avancar") return e(DlgAvancar,{key:key, c:c, fechar:fechar, listas:p.listas});
  return e(DlgMotivo,{key:key+dg.tipo, c:c, tipo:dg.tipo, fechar:fechar});
}

export { Campo, DlgDetalhe, DlgAvancar, DlgMotivo, DlgNova, Dialogos };
