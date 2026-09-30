// Sorelly Admin · montagem e bipagem — domain/seed.js
// Extraído de sorelly_admin_montagem_bipagem.html sem alterar o corpo das funções.
import { BIPADORAS, KITNOVO, MONTADORAS } from "@/apps/montagem/domain/equipe";
import { SEM_KIT } from "@/apps/montagem/domain/status";
import { vendasPara } from "@/apps/montagem/domain/vendas";
import { hoje, isoDia } from "@/apps/montagem/lib/format";

var AROS = ["14 a 17","16 a 19","17 a 20","15 a 18","12 a 16"];
var OURO = [30,50,60,70,80,20];
var EVITAR = ["Sem pe\u00e7as religiosas","Sem infantil","Sem pe\u00e7as pesadas",null,null,"Prefere pe\u00e7as de luxo"];
var seq = 0;
function kit(lid, rev, bairro, alvo, prio, ex){
  seq++; ex = ex || {};
  var nv = ex.nv===undefined ? 3 : ex.nv;
  var k = {
    id:"K"+seq, lid:lid, rev:rev, bairro:bairro, endereco:ex.endereco||null, prio:!!prio, tipo:ex.tipo||"ac_kit",
    vendas: vendasPara(alvo, nv, seq),
    valor: ex.sem ? null : (ex.manual || alvo), manual: !!ex.manual,
    defPor: ex.sem ? null : 11, defEm: ex.sem ? null : hoje(7, 30+(seq%25)),
    pref:{aro:AROS[seq%5], ouro:OURO[seq%6], evitar:EVITAR[seq%6], enc:seq%4},
    status: ex.sem ? "semvalor" : "pendente", designada:null, motivo:null, ajustes:0,
    montId:null, iniM:null, fimM:null, pausaMs:0, pausadoEm:null, tempoM:null, supId:null, supEm:null,
    bipId:null, iniB:null, fimB:null, valorReal:null, divReg:false, corrigido:false,
    retEm:null, retPor:null, ultimaHora:false, atrasado:!!ex.atrasado, aval:null
  };
  if(ex.st){ Object.assign(k, ex.st); if(k.fimM && k.iniM) k.tempoM = k.fimM - k.iniM; }
  return k;
}
function novoDia(){
  seq = 0;
  var dataHoje = isoDia(new Date());
  var L = [
    {id:"L1", rep:"Dayanne", destino:"Curitiba", viagem:false, horario:"10:00", data:dataHoje, fechada:false, retiradas:[]},
    {id:"L1B", rep:"Dayanne", destino:"Curitiba", viagem:false, horario:"13:00", data:dataHoje, fechada:false, retiradas:[]},
    {id:"L2", rep:"Lysie", destino:"Curitiba", viagem:false, horario:"10:00", data:dataHoje, fechada:false, retiradas:[]},
    {id:"L4", rep:"Jessica", destino:"Curitiba", viagem:false, horario:"15:00", data:dataHoje, fechada:false, retiradas:[]}
  ];
  // Base de demonstra\u00e7\u00e3o enxuta (2026-09-30, a pedido do Marcus): 3 listagens s\u00f3, poucas revendedoras por
  // representante, pra facilitar edi\u00e7\u00e3o manual. Mais revendedoras entram depois, uma a uma, pelo Kits novos.
  var K = [
    kit("L1","Andrielle Taborda","Tatuquara",12000,1,{endereco:"Rua Enette Dubard, 1150 - Tatuquara, Curitiba - PR", st:{status:"bipado",montId:1,iniM:hoje(8,5),fimM:hoje(8,34),bipId:9,iniB:hoje(8,40),fimB:hoje(8,45),valorReal:12300}}),
    kit("L1","Silvana Ramos","S\u00edtio Cercado",8000,1,{endereco:"Rua Padre Anchieta, 1785 - Bigorrilho, Curitiba - PR", st:{status:"montado",montId:2,iniM:hoje(8,10),fimM:hoje(8,41)}}),
    kit("L1","Fernanda Lopes","Cabral",9000,0,{endereco:"Rua General Carneiro, 480 - Cabral, Curitiba - PR", st:{status:"bipando",montId:3,iniM:hoje(8,15),fimM:hoje(8,42),bipId:12,iniB:hoje(9,10)}}),
    kit("L1","Juliana Prado","Cristo Rei",7000,0,{endereco:"Rua Mateus Leme, 900 - Cristo Rei, Curitiba - PR", st:{status:"montado",montId:1,iniM:hoje(8,20),fimM:hoje(8,50)}}),
    kit("L1B","Camila Duarte","Uberaba",8500,0,{endereco:"Rua Doutor Faivre, 620 - Uberaba, Curitiba - PR", st:{status:"bipado",montId:2,iniM:hoje(9,0),fimM:hoje(9,25),bipId:9,iniB:hoje(9,30),fimB:hoje(9,36),valorReal:8500}}),
    kit("L1B","Renata Silva","Boa Vista",6000,0,{endereco:"Rua Nilo Pe\u00e7anha, 340 - Boa Vista, Curitiba - PR"}),

    kit("L2","Rosana Kaminski","Port\u00e3o",10000,1,{st:{status:"bipado",montId:5,iniM:hoje(8,2),fimM:hoje(8,30),bipId:10,iniB:hoje(8,35),fimB:hoje(8,39),valorReal:9800}}),
    kit("L2","Cl\u00e1udia Wosniak","\u00c1gua Verde",20000,1)
  ];
  [["Elis\u00e2ngela Faria","Boqueir\u00e3o",12000,1],["Ros\u00e2ngela Pinto","Xaxim",8000,1]
  ].forEach(function(r){ K.push(kit("L4",r[0],r[1],r[2],r[3],{sem:true})); });
  K.forEach(function(k){ var l=L.find(function(x){return x.id===k.lid;}); l.n=(l.n||0)+1; k.ordem=l.n; });
  // Metade dos kits do dia já vem com o valor calculado (simula quem a Deysiane já processou hoje,
  // incluindo condicional já conferida); a outra metade fica pendente de verdade, pra testar o "Definir".
  K.forEach(function(k, i){ if(k.status==="pendente" && i%2!==0){ k.valor = null; k.manual = false; k.defPor = null; k.defEm = null; k.status = "semvalor"; } });
  // Desligado por pedido do Marcus (2026-09-28): antes, essa parte "adiantava" boa parte dos kits do
  // dia pra "bipado" sozinha, pulando a Calculadora. Agora só ficam com valor pronto os que já vêm
  // com etapa avançada escrita explicitamente ali em cima (ex.st) — o resto fica pendente de verdade,
  // pra testar o "Definir" em quase todas as revendedoras do dia.
  // var bipsD = [9,10,12,13,14,15], nb = 0, hm2 = function(t){ return hoje(Math.floor(t/60), t%60); };
  // K.forEach(function(k, i){ if((k.status==="pendente" || k.status==="semvalor") && i%2===0 && i%7!==6){ var mi = 6*60+30+nb*4, bi = mi+32;
  //   if(!k.valor){ k.valor = 6000 + (i%4)*2000; k.defPor = 11; k.defEm = hm2(mi-10); }
  //   Object.assign(k, {status:"bipado", montId:1+(nb%8), iniM:hm2(mi), fimM:hm2(mi+28), bipId:bipsD[nb%6], iniB:hm2(bi), fimB:hm2(bi+5), valorReal:k.valor+((i%3)-1)*150});
  //   k.tempoM = k.fimM - k.iniM; nb++; } });
  K.forEach(function(k, i){ if(k.status==="montando"){ k.iniM = Date.now() - (6 + i%14)*60000; } if(k.status==="bipando"){ k.iniB = Date.now() - (2 + i%5)*60000; } });
  // Tipo de cada item da listagem e condicionais (números vêm da DevMaster; por enquanto digitados)
  var CICLO = ["acerto_kit","acerto_kit","kit_novo","acerto_kit","acerto_kit_exp","acerto_kit","kit_novo_exp","condicional"];
  K.forEach(function(k, i){
    var livre = k.status==="pendente" || k.status==="semvalor";
    k.tipoKit = CICLO[i % CICLO.length];
    if(SEM_KIT[k.tipoKit] && !livre) k.tipoKit = "acerto_kit";
    if(k.tipoKit.indexOf("kit_novo")===0){
      k.vendas = [];            // revendedora nova: sem vendas, valor já vem do setor Kit novo
      // Não passa pela Calculadora: o valor já chegou pronto do Kit novo (NOVA_INCLUIR faz isso de verdade; aqui é só simular)
      if(k.status==="semvalor"){ k.valor = 6000 + (i%4)*2000; k.status = "pendente"; k.manual = false; k.defPor = KITNOVO.id; k.defEm = hoje(7, 30+(i%25)); }
    }
    var nc = k.tipoKit.indexOf("acerto")===0 ? (i===4 ? 5 : 1+(i%3)) : SEM_KIT[k.tipoKit] ? 1+(i%2) : 0;   // às vezes são 5 condicionais
    var nums = []; for(var j=0;j<nc;j++) nums.push(String(12000 + i*137 + j*29).padStart(6,"0"));
    // previsão de devolução: das peças, sempre pertinho (a DevMaster só traz o que vence nos próximos 90 dias);
    // a do expositor é marcada anos pra frente, de propósito, pra não aparecer misturada num acerto comum
    var prev = {}; nums.forEach(function(n, j){ prev[n] = new Date(Date.now() + (10 + j*20)*86400000).toISOString(); });
    var temExp = k.tipoKit.indexOf("_exp")>=0;
    if(temExp){ var numExp = String(19000 + i*89).padStart(6,"0"); nums.push(numExp); prev[numExp] = new Date(Date.now() + 1100*86400000).toISOString(); }
    var pronto = ["montado","bipando","bipado","retirado","supervisao"].indexOf(k.status)>=0;
    var fechado = ["bipado","retirado"].indexOf(k.status)>=0, chkB = {};
    if(fechado) nums.forEach(function(n){ chkB[n] = true; });
    // nova condicional: normalmente uma, às vezes várias
    var novas = fechado ? [String(12500 + i*211).padStart(6,"0")].concat(i%4===0 ? [String(12520 + i*211).padStart(6,"0")] : []) : [];
    k.cond = {nums:nums, prev:prev, pegas: pronto && nc>0, chkM:{}, chkB:chkB, chkP: fechado ? nums.reduce(function(o,n){o[n]=true; return o;},{}) : {}, faltas:{}, impressas:{}, novas:novas};
    // ainda não começou e tem condicional pra conferir: fica esperando a funcionária de condicionais liberar
    // (quem já tem valor calculado — metade par — já passou por tudo isso hoje, não gate de novo)
    if(!SEM_KIT[k.tipoKit] && livre && nc>0 && i%2!==0) k.status = "precond";
    if(SEM_KIT[k.tipoKit]){ k.status = "condicional"; k.valor = null; k.prio = false; k.vendas = []; }
    // horário de atendimento da revendedora (a representante organiza pelo app): a partir das 13:00, de 30 em 30 min
    var min = 13*60 + (k.ordem-1)*30; k.horaAtend = String(Math.floor(min/60)).padStart(2,"0")+":"+String(min%60).padStart(2,"0");
    // dados da revendedora que aparecem no app da representante (demonstração)
    k.fone = "(41) 9"+String(8800+i*37).slice(0,4)+"-"+String(1000+i*271).slice(-4);
  });
  // Já deixa 2 revendedoras pendentes de análise de vendas na demonstração (pra não abrir a tela vazia)
  var precisamAnalise = 2;
  K.forEach(function(k){ if(precisamAnalise>0 && k.status==="pendente" && k.valor>2500 && (k.tipoKit||"").indexOf("kit_novo")!==0){
    k.analiseVendas = {obrigatoria:true, enviada:false, media:k.valor}; precisamAnalise--; } });
  return {listagens:L, kits:K};
}
var REGISTROS0 = [
  {tipo:"aval", montId:8, rev:"Veridiana Lemke", nota:1, obs:"Mandaram um monte de anel do 7 ao 12, serve pra quem? Minha maleta t\u00e1 muito inferior.", dia:"22/09"},
  {tipo:"aval", montId:4, rev:"Nat\u00e1lia Prestes", nota:2, obs:"N\u00e3o veio nada do que pedi nas encomendas.", dia:"21/09"},
  {tipo:"aval", montId:7, rev:"Gisele Andrade", nota:2, obs:"Pedi 80% prata e veio quase tudo dourado.", dia:"20/09"},
  {tipo:"aval", montId:8, rev:"Tain\u00e1 Rocha", nota:2, obs:"Marquei sem religioso no app e vieram 5 pe\u00e7as religiosas.", dia:"19/09"},
  {tipo:"aval", montId:2, rev:"Priscila Martins", nota:3, obs:"Pedi pe\u00e7as de luxo e s\u00f3 veio ponto de luz.", dia:"18/09"},
  {tipo:"div", montId:8, rev:"Luciana Ribeiro", esperado:8000, real:11400, pct:42.5, dia:"23/09"},
  {tipo:"div", montId:4, rev:"Aline Castro", esperado:10000, real:12600, pct:26, dia:"23/09"},
  {tipo:"div", montId:7, rev:"Cleide Barros", esperado:12000, real:9100, pct:-24.2, dia:"22/09"},
  {tipo:"div", montId:8, rev:"Regina Matos", esperado:10000, real:12900, pct:29, dia:"22/09"}
];
var CONSOLIDADO_REPS = [
  {rep:"Dayanne", kits:142, nota:4.3, top:"Pamela"},
  {rep:"Lysie", kits:128, nota:4.1, top:"Paula"},
  {rep:"Marcus Hess", kits:196, nota:4.4, top:"Eduarda"},
  {rep:"Jessica", kits:118, nota:3.9, top:"Ivanete"},
  {rep:"Demais 21 representantes", kits:462, nota:4.0, top:"Pamela"}
];
var HISTORICO0 = [
  {mes:"Agosto de 2026", total:2984.40, pagoEm:"15/09/2026", situacao:"Pago"},
  {mes:"Julho de 2026", total:2810.20, pagoEm:"15/08/2026", situacao:"Pago"}
];
function histDemo(){
  var reps = [["Dayanne","Curitiba",false,"10:00",5],["Lysie","Curitiba",false,"10:00",4],["Marcus Hess","Ponta Grossa",true,"12:00",1],
              ["Jessica","Curitiba",false,"15:00",5],["Priscila","Londrina",true,"09:00",4],["Rosana","Curitiba",false,"14:00",4]];
  var nomes = ["Ana Paula Ribeiro","Bianca Moraes","Cristiane Lopes","Daiane Freitas","Edna Carvalho","Fabiana Rocha","Gislaine Prado","Helena Duarte",
    "Ingrid Macedo","Joana Pires","Kelly Andrade","Luciane Brito","Marta Siqueira","Neide Fontes","Olga Teles","Patrícia Nunes","Raquel Viana","Sandra Melo",
    "Tatiana Rezende","Vanessa Goulart","Priscila Amaral","Roberta Cunha","Simone Dias","Larissa Queiroz"];
  var tamanhos = [5,7,8,12], valores = [5000,6000,8000,10000,12000,15000,17000,20000];
  var out = [], hoje0 = new Date(); hoje0.setHours(0,0,0,0);
  var hm = function(ts){ var d = new Date(ts); return String(d.getHours()).padStart(2,"0")+":"+String(d.getMinutes()).padStart(2,"0"); };
  reps.forEach(function(r, i){
    for(var n=0; n<r[4]; n++){
      var dias = 2 + n*4 + i;                     // uma listagem a cada ~4 dias
      var dt = new Date(hoje0.getTime() - dias*86400000); if(dt.getDay()===0) dt = new Date(dt.getTime() - 86400000);
      var qtd = r[0]==="Marcus Hess" ? 12 : tamanhos[(n+i)%tamanhos.length], hh = +r[3].split(":")[0], base = dt.getTime() + (hh-3)*3600000, ks = [];
      for(var j=0;j<qtd;j++){
        var v = valores[(n*3+i*2+j*5)%valores.length], tm = (22 + (n+j*3)%25)*60000, tb = (3 + (i+j)%6)*60000;
        var fimM = base + j*18*60000 + tm, fimB = fimM + 10*60000 + tb, div = (n+i+j)%13===0;
        var tp = ["acerto_kit","acerto_kit","kit_novo","acerto_kit_exp","acerto_kit","kit_novo_exp","acerto_kit","condicional","reposicao","acerto_kit","saiu"][(n+i*3+j)%11];
        var nc = tp.indexOf("acerto")===0 ? 1+(j%3) : SEM_KIT[tp] ? 1 : 0, nums = [];
        for(var q=0;q<nc;q++) nums.push(String(11000 + i*977 + n*131 + j*37 + q*7).padStart(6,"0"));
        var semKit = !!SEM_KIT[tp], chkB = {}, imps = {};
        nums.forEach(function(x, q){ chkB[x] = true; if((i+n+j+q)%17===0) imps[x] = {por:11}; });
        if(tp==="reposicao") v = 1500 + (j%3)*500;
        ks.push({rev:nomes[(i*7+n*5+j)%nomes.length], prio:!semKit && j<1+(n+i)%2, valor:semKit?null:v, real: semKit?null: div ? Math.round(v*1.24) : v + ((j%3)-1)*200, div:!semKit && div,
          tipoKit:tp, media: tp.indexOf("kit_novo")===0||semKit||tp==="reposicao" ? null : Math.round(v*0.115/10)*10,
          cond:{nums:nums, pegas:nc>0, chkB:chkB, impressas:imps, novas: semKit ? [] : [String(12800 + i*613 + n*97 + j*11).padStart(6,"0")].concat(j%5===0 ? [String(12840 + i*613 + n*97 + j*11).padStart(6,"0")] : [])},
          aval: semKit ? null : {nota: 3 + ((i+n+j)%3), faltas: (i+n+j)%9===0 ? 1 : 0},
          atrasado:(i+n+j)%7===3, mont:MONTADORAS[(n+i+j)%MONTADORAS.length].nome, tempoM:tm, fimM:hm(fimM), bip:BIPADORAS[(n+j+i)%BIPADORAS.length].nome,
          tempoB:tb, fimB:hm(fimB), ret:String(hh).padStart(2,"0")+":"+String((n*7+i*11+j)%60).padStart(2,"0")});
      }
      out.push({id:"H"+i+"-"+n, lid:null, hoje:false, ts:dt.getTime()+hh*3600000, data:dt.toLocaleDateString("pt-BR"), rep:r[0], destino:r[1], viagem:r[2], horario:r[3],
        concluida:String(hh+1).padStart(2,"0")+":"+String((n*11+i*7)%60).padStart(2,"0"), qtd:qtd, total:ks.reduce(function(t,k){return t+k.valor;},0),
        divs:ks.filter(function(k){return k.div;}).length, atrasados:ks.filter(function(k){return k.atrasado;}).length, retiradas:1+((n+i)%2), kits:ks});
    }
  });
  return out;
}

export { AROS, OURO, EVITAR, seq, kit, novoDia, REGISTROS0, CONSOLIDADO_REPS, HISTORICO0, histDemo };
