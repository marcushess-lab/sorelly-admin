// Sorelly Admin · montagem e bipagem — App.js (casca)
//
// Mesma casca do HTML original (menu por setores, cabeçalho, apps do topo).
// A única diferença: a tela ativa deixou de ser escolhida por um mapa
// `aba -> componente` aqui dentro e passou a vir da rota — o conteúdo entra
// pelo <Outlet/>, e cada página é um chunk carregado sob demanda.
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { e, useEffect, useState, useReducer } from "@/shared/react";
import React from "react";
import "@/apps/montagem/styles/montagem.css";
import { abaDoCaminho, caminhoDaAba } from "@/apps/montagem/router/slugs";
import { useRotaAba } from "@/router/use-rota-aba";
import { Aviso } from "@/apps/montagem/components/aviso";
import { SeletorAcesso } from "@/apps/montagem/components/seletor-acesso";
import { ABAS, COR_ABA, GRUPOS_MENU } from "@/apps/montagem/navigation/abas";
import { MARCAS, MarcaTela, marcaDe } from "@/apps/montagem/navigation/marcas";
import { ABAS_PERFIL, PAPEL_LB } from "@/apps/montagem/navigation/perfis";
import { APPS_TOPO, SETORES, SETORES_BAIXO, ondeEsta } from "@/apps/montagem/navigation/setores";
import { nomeDe, papelDe } from "@/apps/montagem/domain/equipe";
import { CHAVE, inicial } from "@/apps/montagem/state/store";
import { Ctx } from "@/apps/montagem/state/context";
import { reducer } from "@/apps/montagem/state/reducer";
import { Icon } from "@/apps/montagem/ui/icon";

function App(){
  var r = useReducer(reducer, null, inicial), s = r[0], d = r[1];
  var navigate = useNavigate();
  var loc = useLocation();
  var naURL = abaDoCaminho(loc.pathname), abaURL = naURL.aba, breveURL = naURL.breve;
  var mn = useState(false), menu = mn[0], setMenu = mn[1];
  var ga = useState({}), gruposAb = ga[0], setGruposAb = ga[1];
  var so = useState(function(){ var o = ondeEsta(abaURL); return o ? o.setor.id : "kits"; }), setorAb = so[0], setSetorAb = so[1];
  var ca = useState(null), colArea = ca[0], setColArea = ca[1];
  var gg = useState(0), grupoAb = gg[0], setGrupoAb = gg[1];   // grupo aberto dentro da coluna (um de cada vez)   // {setor, i}: área com a coluna lateral aberta
  useEffect(function(){ try{ localStorage.setItem(CHAVE, JSON.stringify(Object.assign({}, s, {aviso:null}))); }catch(x){} }, [s]);
  useEffect(function(){ document.documentElement.classList.add("app-montagem");
    return function(){ document.documentElement.classList.remove("app-montagem"); }; }, []);
  var papel = papelDe(s.usuario), permitidas = ABAS_PERFIL[papel];
  var abas = ABAS.filter(function(a){ return !permitidas || permitidas.indexOf(a[0])>=0; });
  var aba = abaURL==="breve" && !permitidas ? "breve" : abas.some(function(a){return a[0]===abaURL;}) ? abaURL : abas[0][0];
  useRotaAba({aba:aba, abaURL:abaURL, breve:breveURL, estado:s, dispatch:d, caminhoDaAba:caminhoDaAba});
  var titulo = aba==="breve" ? (breveURL||s.breveNome||"Em breve") : ABAS.find(function(a){return a[0]===aba;})[1];
  var onde = ondeEsta(aba);
  // telas que este perfil pode abrir (as "em breve" só a supervisão vê)
  var visao = s.visaoMenu || "tudo";
  var pode = function(t){ if(visao==="admin" && t.breve && !t.enviar) return false; if(visao==="sistema" && t.breve) return false;
    return t.breve ? !permitidas : (!permitidas || permitidas.indexOf(t.aba)>=0); };
  var setoresV = SETORES.map(function(st){ if(st.direto) return pode(st.direto) ? st : null;
    var ars = st.areas.map(function(ar){ var ts = ar.telas.filter(pode); if(!ts.length) return null;
      var gs = ar.grupos ? ar.grupos.map(function(g){ return {titulo:g.titulo, telas:g.telas.filter(pode)}; }).filter(function(g){ return g.telas.length; }) : null;
      return Object.assign({}, ar, {telas:ts, grupos:gs}); }).filter(Boolean);
    return ars.length ? Object.assign({}, st, {areas:ars}) : null; }).filter(Boolean);
  var abrirTela = function(t){ navigate(t.breve ? caminhoDaAba("breve", t.nome) : caminhoDaAba(t.aba)); setMenu(false); };
  var ativaTela = function(t){ return t.breve ? (aba==="breve" && s.breveNome===t.nome) : t.aba===aba; };
  var tileSetor = function(st, on){ return e("span",{className:"grid size-7 shrink-0 place-items-center rounded-lg", style: on ? {background:st.cor, color:"#fff", boxShadow:"0 2px 8px "+st.cor+"55"} : {background:st.cor+"33", color:st.cor, boxShadow:"inset 0 0 0 1px "+st.cor+"55"}},
    e(Icon,{n:st.ic, s:15, peso: on ? "fill" : "duotone"})); };
  var linhaSetor = function(st){ var aberto = setorAb===st.id, ativo = st.direto ? ativaTela(st.direto) : st.areas.some(function(ar){ return ar.telas.some(ativaTela); });
    return e("div",{key:st.id, className:"flex flex-col"},
      e("button",{"aria-expanded": st.direto ? undefined : aberto,
          onClick:function(){ if(st.direto){ abrirTela(st.direto); setSetorAb(null); return; } setSetorAb(aberto ? null : st.id); setColArea(null); },
          className:"flex h-9 w-full items-center gap-2.5 rounded-lg px-1.5 text-left text-sm "+(ativo || aberto ? "bg-sidebar-accent font-medium" : "text-foreground/85 hover:bg-white/5")},
        tileSetor(st, ativo), e("span",{className:"min-w-0 flex-1 truncate whitespace-nowrap"}, st.nome),
        !st.direto && e(Icon,{n: aberto ? "chevrondown" : "chevron", s:13, className:"text-foreground/50"})),
      !st.direto && aberto && e("div",{className:"ml-[1.1rem] mt-0.5 mb-1 flex flex-col gap-0.5 border-l border-sidebar-border pl-2.5"},
        st.areas.map(function(ar, i){ var sel = colArea && colArea.setor===st.id && colArea.i===i, temAtiva = ar.telas.some(ativaTela);
          // área com uma única tela: abre ela direto, sem passar pela coluna de escolha
          var unica = ar.telas.length===1 ? ar.telas[0] : null;
          return e("button",{key:i, onClick:function(){ if(unica){ abrirTela(unica); setSetorAb(null); return; } setColArea(sel ? null : {setor:st.id, i:i}); setGrupoAb(0); },
            className:"flex h-8 w-full items-center gap-2 rounded-md px-2 text-left text-[13px] whitespace-nowrap "+(sel ? "bg-primary/15 font-semibold text-primary" : temAtiva ? "font-semibold text-foreground" : "text-foreground/80 hover:bg-white/5")},
            e("span",{className:"size-1.5 shrink-0 rounded-full", style:{background: temAtiva || sel ? st.cor : "#ffffff33"}}),
            e("span",{className:"min-w-0 flex-1 truncate"}, ar.nome),
            e("span",{className:"flex shrink-0 gap-0.5"}, Object.keys(MARCAS).filter(function(k){ return ar.telas.some(function(t){ return marcaDe(t)===k; }); }).map(function(k){
              return e(MarcaTela,{key:k, k:k, mini:true}); }))); }))); };
  var colSt = colArea && setoresV.find(function(x){return x.id===colArea.setor;}), colAr = colSt && colSt.areas[colArea.i];
  // largura da coluna pelo maior texto (tela, sistema ou título), entre 13 e 22 rem
  var colW = colAr ? Math.max(208, Math.min(352, 80 + 7.4 * Math.max.apply(null, [colAr.nome.length, colSt.nome.length].concat(colAr.telas.map(function(t){return t.nome.length;}), (colAr.grupos||[]).map(function(g){return g.titulo.length+4;}))))) : 0;
  var toggleTema = function(){ document.documentElement.classList.toggle("dark"); };
  var navItem = function(key, lb, ic, on, onClick){ var cor = COR_ABA[key] || "#D9A63A";
    return e("button",{key:key, onClick:onClick,
    className:"flex h-9 w-full items-center gap-2.5 rounded-lg px-1.5 text-left text-sm "+(on?"bg-sidebar-accent font-medium text-sidebar-accent-foreground":"text-foreground/85 hover:bg-white/5 hover:text-foreground")},
    e("span",{className:"grid size-7 shrink-0 place-items-center rounded-lg", style: on ? {background:cor, color:"#fff", boxShadow:"0 2px 8px "+cor+"55"} : {background:cor+"33", color:cor, boxShadow:"inset 0 0 0 1px "+cor+"55"}},
      e(Icon,{n:ic, s:15, peso: on ? "fill" : "duotone"})), e("span",{className:"min-w-0 truncate whitespace-nowrap"}, lb)); };
  return e(Ctx.Provider,{value:{state:s, dispatch:d}},
    e("aside",{className:"fixed inset-y-0 left-0 z-40 w-[18.5rem] flex-col border-r border-sidebar-border bg-sidebar "+(menu?"flex":"hidden md:flex")},
      e("div",{className:"flex h-14 items-center gap-2 border-b border-sidebar-border px-4"},
        e("span",{className:"grid size-7 place-items-center rounded-md bg-primary text-primary-foreground"}, e(Icon,{n:"gem", s:15})),
        e("span",{className:"font-heading text-sm font-semibold"},"Sorelly Admin")),
      !permitidas && e("div",{className:"flex items-center gap-1.5 border-b border-sidebar-border px-3 py-2.5 text-[12px] font-semibold"},
        [["tudo","Completo","Completo: HTML, admin e o que vamos criar"],["admin","Admin + HTML","O que já existe: no admin e aqui no HTML"],["sistema","HTML","Só o que já está pronto aqui no HTML"]].map(function(x){
          return e("button",{key:x[0], title:x[2], onClick:function(){ d({type:"VISAO_MENU", v:x[0]}); }, className:"flex-1 rounded-lg px-2 py-1.5 whitespace-nowrap ring-1 "+(visao===x[0] ? "bg-primary text-primary-foreground ring-primary" : "bg-muted/60 ring-border hover:bg-muted")}, x[1]); })),
      e("nav",{className:"flex min-h-0 flex-1 flex-col gap-0.5 overflow-y-auto px-3 pb-2 pt-3"},
        setoresV.map(linhaSetor),
        !permitidas && e("div",{className:"my-2 border-t border-sidebar-border"}),
        !permitidas && SETORES_BAIXO.filter(function(st){ return pode(st.direto); }).map(linhaSetor),
        false && Object.keys(GRUPOS_MENU).map(function(g){
          var itens = abas.filter(function(a){return a[3]===g;}); if(!itens.length) return null;
          var aberto = gruposAb[g]!==false, ativo = itens.some(function(a){return a[0]===aba;});
          return e("div",{key:g, className:"flex flex-col gap-0.5 pb-1"},
            e("button",{onClick:function(){ var o = Object.assign({}, gruposAb); o[g] = !aberto; setGruposAb(o); }, "aria-expanded":aberto,
                className:"mt-2 flex h-8 w-full items-center gap-2 rounded-lg px-2.5 text-left text-xs font-semibold uppercase tracking-wider hover:bg-muted/40 "+(ativo?"text-primary":"text-muted-foreground")},
              e(Icon,{n:GRUPOS_MENU[g][1], s:14}), e("span",{className:"flex-1"}, GRUPOS_MENU[g][0]), e(Icon,{n: aberto?"chevrondown":"chevron", s:14})),
            aberto && e("div",{className:"ml-3 flex flex-col gap-0.5 border-l border-sidebar-border pl-2"},
              itens.map(function(a){ return navItem(a[0], a[1], a[2], aba===a[0], function(){d({type:"ABA", aba:a[0]}); setMenu(false);}); })));
        }),
        !permitidas && e("div",{className:"sticky bottom-0 -mx-3 mt-auto grid grid-cols-2 gap-x-2 gap-y-1.5 border-t border-sidebar-border bg-sidebar px-4 py-2.5"},
          Object.keys(MARCAS).map(function(k){ var m = MARCAS[k];
            return e("div",{key:k, title:m.lb+" · "+m.sub, className:"flex items-center gap-1.5 whitespace-nowrap text-[11.5px] font-semibold"}, e(MarcaTela,{k:k, mini:true}), e("span",{style:{color:m.cor}}, m.lb)); })),
        e("p",{className:(permitidas ? "mt-auto " : "mt-2 ")+"px-2.5 text-xs text-muted-foreground"},"Acesso de "+nomeDe(s.usuario)+" · "+PAPEL_LB[papel]))),
    menu && e("div",{className:"fixed inset-0 z-30 bg-black/60 md:hidden", onClick:function(){setMenu(false);}}),
    colAr && e("div",{className:"fixed inset-y-0 left-[18.5rem] z-40 hidden flex-col border-r border-sidebar-border bg-sidebar md:flex", style:{width:colW}},
      e("div",{className:"flex h-14 items-center gap-2 border-b border-sidebar-border px-4"},
        tileSetor(colSt, true),
        e("div",{className:"min-w-0 flex-1"}, e("p",{className:"truncate text-[11px] font-bold uppercase tracking-wider", style:{color:colSt.cor}}, colSt.nome), e("p",{className:"truncate text-[13.5px] font-semibold"}, colAr.nome)),
        e("button",{onClick:function(){ setColArea(null); }, "aria-label":"Fechar", className:"grid size-7 place-items-center rounded-md hover:bg-white/10"}, e(Icon,{n:"fechar", s:14}))),
      e("div",{className:"flex flex-col gap-0.5 overflow-y-auto p-3"}, (colAr.grupos && colAr.grupos.length>1 ? [].concat.apply([], colAr.grupos.map(function(g, gi){
          // cada sistema abre para baixo; abrir um fecha o outro
          var ab = grupoAb===gi;
          var cab = e("button",{key:"g"+gi, onClick:function(){ setGrupoAb(ab ? -1 : gi); }, "aria-expanded":ab,
            className:"flex h-9 w-full items-center gap-2 rounded-lg px-2 text-left text-[12px] font-bold uppercase tracking-wider whitespace-nowrap "+(gi ? "mt-1 " : "")+(ab ? "bg-white/5" : "hover:bg-white/5"), style:{color:colSt.cor}},
            e(Icon,{n: ab ? "chevrondown" : "chevron", s:13}), e("span",{className:"min-w-0 flex-1 truncate"}, g.titulo),
            e("span",{className:"rounded-full bg-white/10 px-1.5 text-[10.5px] text-foreground/80"}, g.telas.length));
          return [cab].concat(ab ? g.telas.map(function(t){ return {t:t, k:gi+t.nome, dentro:true}; }) : []); })) : colAr.telas.map(function(t){ return {t:t, k:t.nome}; })).map(function(x, i){
        if(!x.t) return x; var t = x.t, on = ativaTela(t);
        return e("button",{key:x.k, onClick:function(){ abrirTela(t); },
          className:"flex h-10 w-full items-center gap-2.5 rounded-lg text-left text-[13.5px] whitespace-nowrap "+(x.dentro ? "pl-6 pr-2 " : "px-2 ")+(on ? "bg-primary/15 font-semibold text-primary" : "hover:bg-white/5")},
          e(MarcaTela,{t:t}),
          e("span",{className:"min-w-0 flex-1 truncate"+(t.breve ? " text-foreground/85" : "")}, t.nome)); }))),
    e("div",{className:"transition-[margin] duration-200 md:ml-[18.5rem]", style: colAr && window.innerWidth>=768 ? {marginLeft:296+colW} : undefined},
      e("header",{className:"sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border bg-background/80 px-4 backdrop-blur md:px-6"},
        e("button",{className:"grid size-9 place-items-center rounded-lg hover:bg-muted/50 md:hidden", "aria-label":"Menu", onClick:function(){setMenu(!menu);}}, e(Icon,{n:"menu"})),
        e("span",{className:"min-w-0 flex-1 truncate text-sm text-muted-foreground whitespace-nowrap"}, onde ? onde.setor.nome : "Sorelly", onde && e(React.Fragment,null, e("span",{className:"mx-1.5"},"/"), onde.area.nome), e("span",{className:"mx-1.5"},"/"), e("span",{className:"text-foreground"}, titulo)),
        e("span",{className:"hidden whitespace-nowrap text-sm text-muted-foreground "+(colAr ? "min-[2200px]:inline" : "min-[1800px]:inline")}, new Date().toLocaleDateString("pt-BR",{weekday:"long", day:"numeric", month:"long"})),
        e("div",{className:"flex shrink-0 items-center gap-1.5"}, APPS_TOPO.filter(function(x){ return !permitidas || permitidas.indexOf(x[0])>=0; }).map(function(x){ var on = aba===x[0];
          return e("button",{key:x[0], title:x[1], onClick:function(){ navigate(caminhoDaAba(x[0])); setColArea(null); },
            className:"flex h-9 items-center gap-1.5 whitespace-nowrap rounded-lg px-2.5 text-[12.5px] font-bold transition-transform hover:-translate-y-px", style: on ? {background:x[3], color:"#fff", boxShadow:"0 2px 10px "+x[3]+"66"} : {background:x[3]+"26", color:x[3], boxShadow:"inset 0 0 0 1px "+x[3]+"55"}},
            e(Icon,{n:x[2], s:15, peso:"fill"}), x[1]); })),

        e(SeletorAcesso),
        e("button",{className:"grid size-9 place-items-center rounded-lg hover:bg-muted/50", "aria-label":"Alternar tema", onClick:toggleTema}, e(Icon,{n:"sunmoon"}))),
      e("main",{className:"flex flex-col gap-5 p-4 md:p-6"}, e(Outlet))),
    e(Aviso));
}

export default App;
