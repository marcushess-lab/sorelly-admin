// Sorelly Admin · montagem e bipagem — state/reducer.js
// Extraído de sorelly_admin_montagem_bipagem.html sem alterar o corpo das funções.
import { condNums, condOk } from "@/apps/montagem/domain/condicionais";
import { calcularAcerto, novaVersaoRegras, versaoDoKit, versaoVigente } from "@/apps/montagem/domain/consignado";
import { BIPADORAS, KITNOVO, SUPERVISORA, nomeDe, papelDe } from "@/apps/montagem/domain/equipe";
import { capacidadeListagem, dataPagamento, ehAtencao, kitsNaListagem, listagemCheia, nomeMes, resumoBipadora, resumoMontadora } from "@/apps/montagem/domain/regras";
import { kit } from "@/apps/montagem/domain/seed";
import { SEM_KIT } from "@/apps/montagem/domain/status";
import { sugerido } from "@/apps/montagem/domain/vendas";
import { BK, N1, hora, isoDia } from "@/apps/montagem/lib/format";
import { CHAVE, ajustaDiv, com, kitDe, mapKit, novo, registroListagem } from "@/apps/montagem/state/store";

function reducer(s, a){
  var k, agora = Date.now();
  switch(a.type){
    case "VISAO": return com(s, {visao:a.v, bipadora:a.b||s.bipadora});
    case "LOGIN": {
      var pp = papelDe(a.id);
      return com(s, {usuario:a.id, aba: pp==="montadora" || pp==="bipadora" || pp==="listagens" ? "painel" : pp==="kitnovo" ? "kitnovo" : s.aba,
        celular: pp==="montadora" ? a.id : s.celular, telaCel:"proximo"}, "Acesso de "+nomeDe(a.id));
    }
    case "ABA": return com(s, {aba:a.aba, breveNome: a.breve || s.breveNome});
    case "ABRIR_CALC": return com(s, {aba:"calc", calcKit:a.id});
    case "VISAO_MENU": return com(s, {visaoMenu:a.v});
    case "VER_FIN": return com(s, {verFinanceiro:a.v});
    // Lançamento diário do faturamento: sempre referente ao dia anterior. "revendedoras" é o total absoluto naquele dia —
    // a Amanda lança os 3 números juntos aqui (recebido, acertos, revendedoras), e o total de revendedoras também atualiza
    // revendedorasDiario (o mesmo dado que o gráfico de crescimento usa), pra não precisar de uma tela separada só pra isso.
    case "FAT_LANCAR": {
      var fd = Object.assign({}, s.faturamentoDiario); fd[a.data] = {recebido:a.recebido||0, acertos:a.acertos||0, revendedoras:a.revendedoras||0};
      var patchFat = {faturamentoDiario:fd};
      if(a.revendedoras>0){ var rd = Object.assign({}, s.revendedorasDiario); rd[a.data] = a.revendedoras; patchFat.revendedorasDiario = rd; }
      return com(s, patchFat, "Lançamento de "+a.data.split("-").reverse().join("/")+" salvo");
    }
    // Lançamento diário da quantidade de revendedoras (total geral), sempre referente ao dia anterior. Fonte: DevMaster/admin.
    case "REV_LANCAR": {
      var rd = Object.assign({}, s.revendedorasDiario); rd[a.data] = a.quantidade||0;
      return com(s, {revendedorasDiario:rd}, "Revendedoras de "+a.data.split("-").reverse().join("/")+" salvo");
    }
    // Contas pagas: lançamento diário por CNPJ (foto do dia, não mexe na grade mensal de Contas a pagar).
    case "CPD_SET": {
      var cpd = JSON.parse(JSON.stringify(s.contasPagasDiario||{}));
      cpd[a.data] = Object.assign({cnpjs:{}, contasPorFora:0, faturado:0}, cpd[a.data]);
      if(a.cnpj) cpd[a.data].cnpjs[a.cnpj] = a.valor; else cpd[a.data][a.campo] = a.valor;
      return com(s, {contasPagasDiario:cpd}, "Lançamento de "+a.data.split("-").reverse().join("/")+" salvo");
    }
    // Meta mensal do Agendamento: revendedoras com kit no início do mês e acertos previstos para o mês
    case "META_SET": {
      var mm = JSON.parse(JSON.stringify(s.metaMensal||{})); mm[a.ano] = mm[a.ano]||{};
      mm[a.ano][a.mes] = Object.assign({base:0, previstos:0}, mm[a.ano][a.mes]); mm[a.ano][a.mes][a.campo] = a.valor;
      return com(s, {metaMensal:mm});
    }
    // Contas a pagar: lançamento manual por mês (só Pago e A pagar; o Total é calculado). ano é string "2026", mes é 0-11.
    case "CP_SET": {
      var cp = JSON.parse(JSON.stringify(s.contasPagar||{}));
      cp[a.ano] = cp[a.ano] || {};
      cp[a.ano][a.mes] = Object.assign({pago:0, apagar:0, fixado:false}, cp[a.ano][a.mes]);
      cp[a.ano][a.mes][a.campo] = a.valor;
      return com(s, {contasPagar:cp});
    }
    case "CP_FIXAR": {
      var cp2 = JSON.parse(JSON.stringify(s.contasPagar||{}));
      cp2[a.ano] = cp2[a.ano] || {}; cp2[a.ano][a.mes] = Object.assign({pago:0, apagar:0, fixado:false}, cp2[a.ano][a.mes]);
      cp2[a.ano][a.mes].fixado = !cp2[a.ano][a.mes].fixado;
      return com(s, {contasPagar:cp2}, cp2[a.ano][a.mes].fixado ? "Mês fixado" : "Mês reaberto");
    }
    case "CEL": return com(s, {celular:a.id, telaCel:"proximo"});
    case "TELACEL": return com(s, {telaCel:a.t});
    case "TOGGLE": var o = Object.assign({}, s.abertas); o[a.id] = !o[a.id]; return com(s, {abertas:o});
    case "TODAS": var t = {}; s.listagens.forEach(function(l){ t[l.id] = a.v; }); return com(s, {abertas:t});
    case "KIT_ABERTO": return com(s, {kitAberto: s.kitAberto===a.id ? null : a.id});
    case "EXTRATO": return com(s, {extrato: s.extrato===a.id ? null : a.id});
    case "FILTRO_REG": return com(s, {filtroReg:a.v});
    case "LIMPAR_AVISO": return com(s, {aviso:null});

    case "DEFINIR_VALOR": {
      k = kitDe(s, a.id); if(!k || !(a.valor>0)) return s;
      if(["semvalor","pendente"].indexOf(k.status)<0) return com(s, {}, "O valor s\u00f3 pode ser alterado antes da montagem", "alerta");
      var sug = sugerido(k.vendas, s.cfg);
      // m\u00e9dia de vendas acima do limite: obrigat\u00f3rio mandar a an\u00e1lise de vendas (prints) pro relat\u00f3rio
      var obrigaAnalise = a.media>s.cfg.limiteAnaliseVendas;
      return com(s, {kits: mapKit(s, a.id, function(x){ return {valor:a.valor, manual:a.valor!==sug,
        defPor:SUPERVISORA.id, defEm:agora, status:"pendente",
        analiseVendas: obrigaAnalise ? Object.assign({obrigatoria:true, enviada:false, media:a.media}, x.analiseVendas) : x.analiseVendas}; })},
        "Valor do kit de "+k.rev+" definido em "+BK(a.valor)+(obrigaAnalise?" \u00b7 an\u00e1lise de vendas obrigat\u00f3ria":""));
    }
    // Deysiane marca que j\u00e1 mandou a an\u00e1lise (prints) pro relat\u00f3rio de vendas daquela revendedora
    case "ANALISE_VENDAS_ENVIADA": {
      k = kitDe(s, a.id); if(!k) return s;
      return com(s, {kits: mapKit(s, a.id, function(x){ return {analiseVendas: Object.assign({}, x.analiseVendas, {enviada:true, enviadaPor:a.por||null, enviadaEm:agora, resumo:a.resumo||""})}; })},
        "An\u00e1lise de vendas de "+k.rev+" registrada");
    }
    case "CONFIRMAR_SUGERIDOS": {
      var n = 0;
      var kits = s.kits.map(function(x){ if(x.lid!==a.lid || x.status!=="semvalor") return x; n++;
        return Object.assign({}, x, {valor:sugerido(x.vendas, s.cfg), manual:false, defPor:SUPERVISORA.id, defEm:agora, status:"pendente"}); });
      return com(s, {kits:kits}, n+(n>1?" valores confirmados":" valor confirmado")+" pela sugest\u00e3o");
    }
    case "DESIGNAR": {
      k = kitDe(s, a.id); if(!k || k.status!=="pendente") return s;
      return com(s, {kits: mapKit(s, a.id, function(){ return {designada:a.montId||null}; })},
        a.montId ? k.rev+" designado para "+nomeDe(a.montId) : "Designa\u00e7\u00e3o cancelada, o kit voltou para a fila");
    }
    case "INICIAR_M": {
      if(s.kits.some(function(x){return x.montId===a.montId && x.status==="montando";}))
        return com(s, {}, "Conclua ou devolva o kit atual antes de iniciar outro", "alerta");
      k = kitDe(s, a.id); if(!k) return s;
      // Duas montadoras não pegam o mesmo kit: quem apertou primeiro fica com ele
      if(["pendente","ajuste"].indexOf(k.status)<0)
        return com(s, {}, k.rev+" já foi pego por "+nomeDe(k.montId)+". Seu próximo kit já foi atualizado.", "atencao");
      if(k.status==="pendente" && k.designada && k.designada!==a.montId && !a.forcar)
        return com(s, {}, "Esse kit foi pedido para "+nomeDe(k.designada)+".", "atencao");
      var aj = k.status==="ajuste";
      return com(s, {kits: mapKit(s, a.id, function(x){ return {status:"montando", montId:a.montId, iniM:agora,
        fimM:null, tempoM:null, pausaMs:0, pausadoEm:null, designada:null, ajustes: x.ajustes + (aj?1:0)}; })},
        aj ? "Ajuste iniciado" : nomeDe(a.montId)+" iniciou a montagem de "+k.rev);
    }
    case "PAUSAR": return com(s, {kits: mapKit(s, a.id, function(){ return {pausadoEm:agora}; })}, "Montagem pausada", "atencao");
    case "RETOMAR": return com(s, {kits: mapKit(s, a.id, function(x){
      return {pausaMs: x.pausaMs + (agora - x.pausadoEm), pausadoEm:null}; })}, "Montagem retomada");
    case "CONCLUIR_M": {
      k = kitDe(s, a.id); if(!k || k.status!=="montando") return s;
      if(!a.condPegas && !condOk(k, "m")) return com(s, {}, "Marque as condicionais que pegou antes de concluir", "alerta");
      var sup = ehAtencao(k.valor, s.cfg);
      var pms = k.pausaMs + (k.pausadoEm ? agora - k.pausadoEm : 0);
      return com(s, {kits: mapKit(s, a.id, function(){ return {status: sup?"supervisao":"montado", fimM:agora,
        pausaMs:pms, pausadoEm:null, tempoM: Math.max(0, agora - k.iniM - pms), motivo:null,
        cond: k.cond && condNums(k).length ? Object.assign({}, k.cond, {pegas:true, pegasPor:k.montId, pegasEm:agora}) : k.cond}; })},
        sup ? "Kit enviado para confer\u00eancia da Deysiane" : "Montagem conclu\u00edda", sup?"atencao":"ok");
    }
    case "DEVOLVER": {
      k = kitDe(s, a.id); if(!k) return s;
      var eraAjuste = k.ajustes > 0 && k.motivo;
      return com(s, {kits: mapKit(s, a.id, function(){ return eraAjuste
        ? {status:"ajuste", iniM:null, pausaMs:0, pausadoEm:null}
        : {status:"pendente", montId:null, iniM:null, pausaMs:0, pausadoEm:null}; })}, k.rev+" voltou para a fila", "atencao");
    }
    case "APROVAR": return com(s, {kits: mapKit(s, a.id, function(){ return {status:"montado", supId:SUPERVISORA.id, supEm:agora, motivo:null}; })},
      "Kit conferido e liberado para a bipagem");
    case "REPROVAR": {
      k = kitDe(s, a.id); if(!k) return s;
      return com(s, {kits: mapKit(s, a.id, function(){ return {status:"ajuste", motivo:a.motivo, supId:SUPERVISORA.id, supEm:agora,
        fimM:null, tempoM:null}; })}, k.rev+" voltou para ajuste com "+nomeDe(k.montId), "atencao");
    }
    case "INICIAR_B":
      if(s.kits.some(function(x){return x.bipId===a.bipId && x.status==="bipando";})) return s;
      return com(s, {kits: mapKit(s, a.id, function(){ return {status:"bipando", bipId:a.bipId, iniB:agora}; })}, "Bipagem iniciada");
    case "CONCLUIR_B":
    case "CORRIGIR_B": {
      k = kitDe(s, a.id); if(!k || !(a.real>0)) return s;
      if(a.type==="CONCLUIR_B" && !condOk(k, "b")) return com(s, {}, "Confira as condicionais antes de concluir o kit (se faltar, peça para a Deysiane imprimir)", "alerta");
      var pct = (a.real - k.valor)/k.valor*100, div = Math.abs(pct) > s.cfg.divPct;
      var patch = {kits: mapKit(s, a.id, function(x){ var p = {valorReal:a.real, divReg:div};
        var nv2 = a.novas || (a.nova ? [a.nova] : null);
        if(nv2) p.cond = Object.assign({nums:[], pegas:false}, x.cond, {novas:nv2, nova:null}); // números das novas condicionais (pode ser mais de uma), digitados pela bipadora
        if(a.type==="CONCLUIR_B"){ p.status="bipado"; p.fimB=agora; } else p.corrigido=true; return p; })};
      var eraDiv = a.type==="CORRIGIR_B" && k.divReg;
      if(div && !eraDiv){
        patch.montadoras = ajustaDiv(s, k.montId, 1);
        patch.registros = [{tipo:"div", kitId:k.id, montId:k.montId, rev:k.rev, esperado:k.valor, real:a.real,
          pct:Math.round(pct*10)/10, dia:"Hoje "+hora(agora)}].concat(s.registros);
      } else if(!div && eraDiv){
        patch.montadoras = ajustaDiv(s, k.montId, -1);
        patch.registros = s.registros.filter(function(r){return r.kitId!==k.id;});
      } else if(div && eraDiv){
        patch.registros = s.registros.map(function(r){ return r.kitId!==k.id ? r :
          Object.assign({}, r, {real:a.real, pct:Math.round(pct*10)/10}); });
      }
      var txt = a.type==="CORRIGIR_B" ? "Valor bipado corrigido para "+BK(a.real) :
        div ? "Diverg\u00eancia de "+N1(pct)+"% registrada para "+nomeDe(k.montId) : "Bipagem conclu\u00edda, valor confere";
      return com(s, patch, txt, div?"alerta":"ok");
    }
    case "RETIRAR":
    case "RETIRAR_KIT": {
      // Retirada em lote (todos os bipados da listagem) ou de um kit só, pelo menu ⋯
      var lidR = a.type==="RETIRAR_KIT" ? (kitDe(s, a.id)||{}).lid : a.lid;
      // a.ids = kits marcados na retirada; sem a.ids (lote antigo) vão todos os bipados
      var ids = s.kits.filter(function(x){return x.lid===lidR && x.status==="bipado" &&
        (a.type==="RETIRAR_KIT" ? x.id===a.id : (!a.ids || a.ids.indexOf(x.id)>=0));}).map(function(x){return x.id;});
      if(!ids.length) return s;
      var por = a.por || SUPERVISORA.id;
      var kits2 = s.kits.map(function(x){ return ids.indexOf(x.id)>=0 ? Object.assign({},x,{status:"retirado", retEm:agora, retPor:por, retConf: a.app ? "confirmação no app da representante" : a.codigo && a.assinatura ? "código e assinatura" : "sem confirmação"}) : x; });
      var todos = kits2.filter(function(x){return x.lid===lidR;}).every(function(x){return x.status==="retirado";});
      var lst = s.listagens.find(function(l){return l.id===lidR;});
      var patchR = {kits:kits2, listagens: s.listagens.map(function(l){ return l.id!==lidR ? l : Object.assign({}, l,
        {fechada:todos, concluidaEm: todos ? agora : null, retiradas:l.retiradas.concat([{em:agora, por:por, qtd:ids.length, kits:ids,
          codigo:!!a.codigo, assinatura:a.assinatura||null}])}); })};
      // Listagem concluída: vai para o Consolidado com o retrato dos kits
      if(todos) patchR.histListagens = [registroListagem(lst, kits2, agora)].concat(s.histListagens||[]);
      var nomeK = a.type==="RETIRAR_KIT" ? kitDe(s, a.id).rev+" retirado" : ids.length+(ids.length>1?" kits retirados":" kit retirado");
      return com(s, patchR, nomeK+(todos?", listagem de "+lst.rep+" concluída e salva no Consolidado":""));
    }
    case "REABRIR": return com(s, {
        listagens: s.listagens.map(function(l){ return l.id===a.lid ? Object.assign({}, l, {fechada:false, concluidaEm:null}) : l; }),
        histListagens: (s.histListagens||[]).filter(function(h){ return !(h.lid===a.lid && h.hoje); })},
      "Listagem reaberta e de volta ao Painel");
    case "ADD_KIT": {
      var l = s.listagens.find(function(x){return x.id===a.lid;}); if(!l || l.fechada) return s;
      if(listagemCheia(s, a.lid)) return com(s, {}, "Listagem de "+l.horario+" j\u00e1 est\u00e1 com "+kitsNaListagem(s, a.lid)+"/"+capacidadeListagem(l)+" revendedoras: escolha outra listagem", "alerta");
      var nk = kit(a.lid, a.rev, a.bairro||"\u2014", 5000, a.prio, {sem:true});
      nk.id = "U"+agora; nk.vendas = a.vendas||[]; nk.ultimaHora = true; nk.atrasado = !!a.atrasado;
      nk.ordem = s.kits.filter(function(x){return x.lid===a.lid;}).length + 1;
      nk.tipoKit = a.tipoKit || "acerto_kit"; nk.fone = a.fone || ""; nk.porApp = !!a.porApp;
      nk.cond = {nums:a.conds||[], pegas:false, chkM:{}, chkB:{}, faltas:{}, impressas:{}, novas:[]};
      nk.horaAtend = a.hora || null;
      // Carimba a vers\u00e3o de regras de comiss\u00e3o/brinde vigente agora: o acerto deste kit sempre vai usar esta vers\u00e3o,
      // mesmo que as regras mudem antes do acerto acontecer (a mudan\u00e7a s\u00f3 vale a partir do pr\u00f3ximo kit).
      var vv = versaoVigente(s); nk.regrasVersaoId = vv ? vv.id : null; nk.remarcacoes = 0;
      // revendedora que saiu (ou s\u00f3 condicional): n\u00e3o tem kit, s\u00f3 a condicional vai para a representante retirar
      if(SEM_KIT[nk.tipoKit]){ nk.status = "condicional"; nk.valor = null; nk.prio = false; }
      var txtAdd = SEM_KIT[nk.tipoKit] ? a.rev+" entrou s\u00f3 para retirar a condicional" : nk.tipoKit==="reposicao" ? "Reposi\u00e7\u00e3o de "+a.rev+" inclu\u00edda: defina o valor (at\u00e9 o m\u00e1ximo liberado)" : "Kit de \u00faltima hora inclu\u00eddo, defina o valor para ele entrar na fila";
      return com(s, {kits: s.kits.concat([nk])}, txtAdd+(nk.atrasado?" \u00b7 atrasado":""));
    }
    case "SALVAR_PERFIL_REV": {
      var perfis = Object.assign({}, s.perfisRev);
      perfis[a.chave] = Object.assign({}, perfis[a.chave], a.patch);
      return com(s, {perfisRev:perfis}, "Dados de "+a.chave+" atualizados");
    }
    case "CRIAR_LISTAGEM": {
      var novaL = {id:"L"+agora, rep:a.rep, destino:a.destino||"Curitiba", viagem:!!a.viagem, horario:a.horario||"10:00",
        data:a.data||isoDia(new Date(agora)), fechada:false, retiradas:[]};
      return com(s, {listagens: s.listagens.concat([novaL])}, "Listagem de "+a.horario+" criada para "+a.rep);
    }
    case "FECHAR_MES": {
      if(s.mesFechado) return s;
      var total = s.montadoras.reduce(function(t,m){return t+resumoMontadora(m,s).liquido;},0)
        + BIPADORAS.reduce(function(t,b){return t+resumoBipadora(b,s).liquido;},0);
      return com(s, {mesFechado:agora, historico:[{mes:nomeMes(), total:total, pagoEm:dataPagamento(s.cfg),
        situacao:"Aguardando pagamento"}].concat(s.historico)}, "M\u00eas fechado, pagamento em "+dataPagamento(s.cfg));
    }
    case "CFG": {
      var c = JSON.parse(JSON.stringify(s.cfg));
      if(a.lista) c[a.lista][a.i][a.campo] = a.valor; else c[a.campo] = a.valor;
      return com(s, {cfg:c});
    }
    // Condicionais: a montadora confirma que pegou ao final da montagem; item "só condicional" fica pronto para retirada
    case "PEGAR_COND": {
      k = kitDe(s, a.id); if(!k) return s;
      return com(s, {kits: mapKit(s, a.id, function(x){ return {cond:Object.assign({}, x.cond, {pegas:true, pegasPor:a.por||null, pegasEm:agora}),
        status: x.status==="condicional" ? "bipado" : x.status}; })}, "Condicionais de "+k.rev+" pegas");
    }
    // Check de cada condicional: papel "m" = montadora pegou, "b" = bipadora conferiu ao fechar o kit
    case "COND_CHK": {
      k = kitDe(s, a.id); if(!k) return s;
      return com(s, {kits: mapKit(s, a.id, function(x){
        var c = Object.assign({chkM:{}, chkB:{}}, x.cond), campo = a.papel==="b" ? "chkB" : "chkM", o = Object.assign({}, c[campo]); o[a.num] = !!a.v;
        c[campo] = o;
        if(a.papel!=="b"){ c.pegas = condNums(x).every(function(n){ return o[n]; }); if(c.pegas){ c.pegasPor = a.por||x.montId||null; c.pegasEm = agora; } }
        return {cond:c, status: x.status==="condicional" && c.pegas ? "bipado" : x.status}; })});
    }
    // Condicional não está no kit: vai o pedido para a Deysiane imprimir; ela marca como impressa
    case "COND_FALTA": {
      k = kitDe(s, a.id); if(!k) return s;
      return com(s, {kits: mapKit(s, a.id, function(x){ var f = Object.assign({}, (x.cond||{}).faltas); f[a.num] = {por:a.por||null, em:agora};
        return {cond:Object.assign({}, x.cond, {faltas:f})}; })}, "Pedido para imprimir a condicional "+a.num+" enviado à Deysiane", "atencao");
    }
    case "COND_IMPRESSA": {
      k = kitDe(s, a.id); if(!k) return s;
      return com(s, {kits: mapKit(s, a.id, function(x){ var im = Object.assign({}, (x.cond||{}).impressas); im[a.num] = {por:a.por||null, em:agora};
        return {cond:Object.assign({}, x.cond, {impressas:im})}; })}, "Condicional "+a.num+" impressa");
    }
    // Conferência prévia, antes do item entrar na fila de montagem: quem confere aqui não é a montadora nem a bipadora,
    // é a funcionária de condicionais — por isso um campo (chkP) separado do chkM/chkB, sem mexer no fluxo delas.
    case "COND_CHK_PRE": {
      k = kitDe(s, a.id); if(!k) return s;
      return com(s, {kits: mapKit(s, a.id, function(x){ var p = Object.assign({}, (x.cond||{}).chkP); p[a.num] = !!a.v;
        return {cond:Object.assign({}, x.cond, {chkP:p})}; })});
    }
    // A funcionária de condicionais achou um número que não veio da DevMaster (ou a lista dela estava errada)
    // e digita na mão. Já entra conferida, porque ela só digita o que já está com ela em mãos.
    case "COND_ADD_NUM": {
      k = kitDe(s, a.id); var num = (a.num||"").trim(); if(!k || !num) return s;
      if(condNums(k).indexOf(num)>=0) return com(s, {}, num+" já está na lista dessa revendedora", "atencao");
      return com(s, {kits: mapKit(s, a.id, function(x){
        var c = Object.assign({}, x.cond), p = Object.assign({}, c.chkP), prev = Object.assign({}, c.prev);
        p[num] = true; prev[num] = new Date().toISOString();
        return {cond:Object.assign(c, {nums:(c.nums||[]).concat([num]), chkP:p, prev:prev})}; })}, "Condicional "+num+" adicionada");
    }
    // Libera pra fila de montagem: só chega até aqui quando as condicionais da revendedora já foram todas conferidas.
    case "LIBERAR_COND": {
      var idsSet = {}; (a.ids||[]).forEach(function(id){ idsSet[id] = true; });
      var revNome = null;
      var novosKits = s.kits.map(function(x){
        if(!idsSet[x.id] || x.status!=="precond") return x;
        revNome = x.rev;
        return Object.assign({}, x, {status: x.valor===null ? "semvalor" : "pendente",
          cond: Object.assign({}, x.cond, {liberadoPor:a.por||null, liberadoEm:agora})});
      });
      return com(s, {kits: novosKits}, (revNome||"Revendedora")+" liberada para a fila de montagem");
    }
    // Retirada pelo celular da bipagem: a bipadora solicita, a representante confirma o recebimento no app dela
    case "SOLICITAR_RET": {
      if(!a.ids || !a.ids.length) return s;
      var lr = s.listagens.find(function(x){return x.id===a.lid;});
      return com(s, {retPend:(s.retPend||[]).filter(function(p){return p.lid!==a.lid;}).concat([{id:"R"+agora, lid:a.lid, ids:a.ids, por:a.por, em:agora}])},
        "Retirada enviada para o app de "+lr.rep+" confirmar");
    }
    case "RESP_RET": {
      var pr = (s.retPend||[]).find(function(p){return p.id===a.id;}); if(!pr) return s;
      var s2 = Object.assign({}, s, {retPend:(s.retPend||[]).filter(function(p){return p.id!==a.id;})});
      if(!a.aceita) return com(s2, {}, "A representante recusou a retirada", "atencao");
      return reducer(s2, {type:"RETIRAR", lid:pr.lid, ids:pr.ids, por:pr.por, codigo:true, app:true});
    }
    // App da revendedora: confirma que recebeu, se as peças conferem e se gostou do kit
    // Representante organiza os atendimentos: horário de cada revendedora
    case "SET_HORA": return com(s, {kits: mapKit(s, a.id, function(){ return {horaAtend:a.hora}; })}, "Atendimento marcado para "+a.hora);
    case "CONF_REV": return com(s, {kits: mapKit(s, a.id, function(){ return {confRev:{recebeu:true, confere:a.confere, gostou:a.gostou, obs:a.obs||"", em:agora}}; })}, "Confirmação da revendedora registrada");
    // Revendedora avalia a representante no fim do acerto: pontualidade, explicou direito, responde o WhatsApp
    case "AVAL_REP": {
      var na = {rep:a.rep, rev:a.rev, kitId:a.kitId||null, data:new Date(agora).toLocaleDateString("pt-BR",{day:"2-digit",month:"2-digit"}), pont:a.pont, expl:a.expl, whats:a.whats, obs:a.obs||""};
      return com(s, {avalRep:[na].concat(s.avalRep||[]), kits: a.kitId ? mapKit(s, a.kitId, function(){ return {avalRepFeita:true}; }) : s.kits}, "Avaliação da representante enviada");
    }
    // Representante recusou a revendedora nova: volta para a Michele direcionar; recusas entram na avaliação e podem bloquear novos envios
    case "RECUSAR_NOVA": {
      var nr = (s.novas||[]).find(function(n){return n.id===a.id;}); if(!nr || !nr.rep) return s;
      var rec2 = [{rep:nr.rep, rev:nr.nome, data:new Date(agora).toLocaleDateString("pt-BR",{day:"2-digit",month:"2-digit"}), motivo:a.motivo||"Recusou pelo app"}].concat(s.recusas||[]);
      var qtdR = rec2.filter(function(x){return x.rep===nr.rep;}).length, bl = Object.assign({}, s.bloqueioNovas);
      var bloqueou = qtdR >= s.cfg.recusasBloqueio && !bl[nr.rep]; if(bloqueou) bl[nr.rep] = true;
      return com(s, {recusas:rec2, bloqueioNovas:bl, novas:s.novas.map(function(n){ return n.id!==a.id ? n : Object.assign({}, n, {status:"aguardando", rep:null, recusadaPor:(n.recusadaPor||[]).concat([nr.rep])}); })},
        nr.rep+" recusou "+nr.nome+(bloqueou ? ": "+qtdR+" recusas, não recebe mais kits novos" : ""), "atencao");
    }
    case "BLOQ_NOVAS": { var b2 = Object.assign({}, s.bloqueioNovas); if(a.v) b2[a.rep] = true; else delete b2[a.rep];
      return com(s, {bloqueioNovas:b2}, a.v ? a.rep+" não recebe mais kits novos" : a.rep+" voltou a receber kits novos"); }
    // Setor Kit novo: direciona a revendedora nova para uma representante ou coloca direto numa listagem
    case "NOVA_DIRECIONAR": return com(s, {novas:(s.novas||[]).map(function(n){ return n.id!==a.id ? n : Object.assign({}, n, {rep:a.rep, status:"direcionada"}); })},
      "Revendedora direcionada para "+a.rep);
    case "NOVA_INCLUIR": {
      var nv = (s.novas||[]).find(function(n){return n.id===a.id;}), ln = s.listagens.find(function(x){return x.id===a.lid;});
      if(!nv || !ln || ln.fechada) return s;
      if(listagemCheia(s, a.lid)) return com(s, {}, "Listagem de "+ln.horario+" já está com "+kitsNaListagem(s, a.lid)+"/"+capacidadeListagem(ln)+" revendedoras: escolha outra listagem", "alerta");
      // dentro do prazo não precisa de nada; fora do prazo: Michele só com autorização da diretoria, representante entra como atrasado
      if(a.foraPrazo && a.quem==="kitnovo" && !a.autorizador) return com(s, {}, "Fora do prazo: precisa da autorização do Marcus ou do Nickolas", "alerta");
      var nk = kit(a.lid, nv.nome, nv.bairro, nv.valor, 0, {nv:0});
      nk.id = "KN"+agora; nk.vendas = []; nk.valor = nv.valor; nk.status = "pendente"; nk.manual = false; nk.defPor = KITNOVO.id; nk.defEm = agora;
      nk.tipoKit = nv.expositor ? "kit_novo_exp" : "kit_novo"; nk.cond = {nums:[], pegas:false, nova:""};
      nk.atrasado = !!a.foraPrazo; nk.autorizadoPor = a.autorizador || null; nk.origemNova = nv.id;
      nk.ordem = s.kits.filter(function(x){return x.lid===a.lid;}).length + 1;
      return com(s, {kits:s.kits.concat([nk]), novas:s.novas.map(function(n){ return n.id!==a.id ? n : Object.assign({}, n, {status:"na listagem", lid:a.lid, rep:ln.rep, autorizadoPor:a.autorizador||null}); })},
        nv.nome+" entrou na listagem de "+ln.rep+(a.autorizador ? " (autorizado por "+nomeDe(a.autorizador)+")" : a.foraPrazo ? " como atrasado" : ""));
    }
    // Avaliação da representante no app dela: nota do kit e peças faltando (desconta da bipadora)
    case "AVALIAR": return com(s, {kits: mapKit(s, a.id, function(){ return {aval:{nota:a.nota, faltas:a.faltas}}; })}, "Avaliação enviada");
    // Representante marca uma remarcação deste kit (antes do acerto): conta a "vez" e se avisou com 48h+ de antecedência.
    case "KIT_REMARCAR": {
      k = kitDe(s, a.id); if(!k) return s;
      return com(s, {kits: mapKit(s, a.id, function(x){ return {remarcacoes:(x.remarcacoes||0)+1, ultimaRemarcacaoComAviso:!!a.comAviso}; })},
        "Remarcação registrada para "+k.rev+(a.comAviso ? " (avisou com antecedência)" : " (sem aviso / em cima da hora)"), "atencao");
    }
    // Fecha o acerto de um kit de revenda normal: calcula comissão/brinde pela regra carimbada no kit e grava no consolidado.
    case "ACERTO_REGISTRAR": {
      k = kitDe(s, a.id); if(!k) return s;
      var versaoK = versaoDoKit(s, k); if(!versaoK) return s;
      var res = calcularAcerto({vendaBruta:a.vendaBruta, devolvida:a.devolvida||0, garantia:a.garantia||0, vez:k.remarcacoes||0,
        comAviso:k.ultimaRemarcacaoComAviso!==false, pagouIntegral:a.pagouIntegral}, versaoK);
      var registro = Object.assign({id:"AC"+agora, kitId:k.id, rev:k.rev, rep:(function(){ var l = s.listagens.find(function(x){return x.id===k.lid;}); return l?l.rep:null; })(),
        tipo:"acerto", data:new Date(agora).toISOString().slice(0,10), regrasVersaoId:versaoK.id}, res);
      return com(s, {kits: mapKit(s, a.id, function(){ return {acerto:res, status:"acertado"}; }),
        acertosConsignado:[registro].concat(s.acertosConsignado||[])},
        "Acerto de "+k.rev+" registrado: "+BK(res.valorAcerto)+" (comissão "+BK(res.comissao)+")");
    }
    // Reposição ou expositor: nunca passa pela tabela de faixas, comissão fixa (kit) ou manual (reposição especial).
    case "REPOSICAO_ENTREGAR": {
      k = kitDe(s, a.id); if(!k) return s;
      var comissaoFixa = a.especial ? (a.comissaoManual||0) : (a.comExpositor ? 35 : 20);
      var registroRep = {id:"AC"+agora, kitId:k.id, rev:k.rev, rep:(function(){ var l = s.listagens.find(function(x){return x.id===k.lid;}); return l?l.rep:null; })(),
        tipo: a.especial ? "reposicao_especial" : "reposicao", data:new Date(agora).toISOString().slice(0,10), comissao:comissaoFixa, valorAcerto:0, vendaLiquida:0};
      return com(s, {kits: mapKit(s, a.id, function(){ return {reposicaoEntregue:true, comissaoFixa:comissaoFixa, status:"acertado"}; })},
        "Reposição de "+k.rev+" entregue"+(comissaoFixa ? " · comissão "+BK(comissaoFixa) : ""));
    }
    // Nova versão das regras de comissão/brinde/remarcação: só vale a partir do próximo kit criado (kits em aberto mantêm a regra antiga carimbada).
    case "REGRAS_CONSIGNADO_ATUALIZAR": {
      var atualAntes = versaoVigente(s);
      var novaV = novaVersaoRegras(a.campos, atualAntes ? atualAntes.id : null);
      return com(s, {regrasConsignado:{versoes:(s.regrasConsignado.versoes||[]).concat([novaV]), atualId:novaV.id}},
        "Regras do consignado atualizadas: vale a partir do próximo kit de cada revendedora");
    }
    case "PECAS": {
      var cp = JSON.parse(JSON.stringify(s.cfg)); cp.pecasKit[a.i].q[a.j] = a.valor; return com(s, {cfg:cp});
    }
    case "RESET": try{ localStorage.removeItem(CHAVE); }catch(x){} return com(novo(), {}, "Dados de demonstra\u00e7\u00e3o restaurados");
    default: return s;
  }
}

export { reducer };
