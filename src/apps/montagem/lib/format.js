// Sorelly Admin · montagem e bipagem — lib/format.js
// Extraído de sorelly_admin_montagem_bipagem.html sem alterar o corpo das funções.

function BK(n){ return "R$ " + Number(n||0).toLocaleString("pt-BR",{maximumFractionDigits:0}); }
function N1(n){ return Number(n||0).toLocaleString("pt-BR",{minimumFractionDigits:1, maximumFractionDigits:1}); }
function hora(ts){ if(!ts) return "\u2014"; var d=new Date(ts);
  return String(d.getHours()).padStart(2,"0")+":"+String(d.getMinutes()).padStart(2,"0"); }
function hoje(h,m){ var d=new Date(); d.setHours(h,m,0,0); return d.getTime(); }
function dur(ms){ if(!ms||ms<0) return "0 s"; var s=Math.floor(ms/1000), m=Math.floor(s/60);
  return m>0 ? m+" min "+String(s%60).padStart(2,"0")+" s" : s+" s"; }
function durCurta(ms){ if(!ms||ms<0) return "\u2014"; var m=Math.round(ms/60000); return m<1 ? "<1 min" : m+" min"; }
function minutos(hhmm){ var p=hhmm.split(":"); return (+p[0])*60+(+p[1]); }
function isoDia(d){ return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0"); }
function B(nome){ return {breve:true, nome:nome}; }

export { B, BK, N1, hora, hoje, dur, durCurta, minutos, isoDia };
