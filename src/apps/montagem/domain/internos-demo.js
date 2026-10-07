// Sorelly Admin — domain/internos-demo.js
// Listagem do atendimento interno passada pelo Marcus (outubro/2026): 02/10 já foi atendida (vira acerto feito, aparece no Consolidado) e 05/10 é a agenda de hoje.
// Dados reais da listagem: nome, horário, condicional, venda, chegada, encomenda e observação. Quem bipou vem da observação (nome da bipadora).
//
// PARA O LEONARDO (desenvolvimento): o VALOR DA VENDA do atendimento interno tem que vir DIRETO DO APP DA REVENDEDORA, não é digitado.
// Ponto de ligação: campo `vendaApp` de cada item de `s.internos` (a Atendimento Sorelly preenche "Quanto ela vendeu" sozinho com ele).
// Hoje `vendaApp` fica 0 (= ainda não puxou do app). Ao integrar, gravar o total vendido do mês da revendedora em `vendaApp`.
import { FORM_ACERTO_VAZIO } from "@/apps/montagem/domain/acerto-derivado";
import { calcularAcerto, textoRegras, versaoVigente } from "@/apps/montagem/domain/consignado";
import { BIPADORAS } from "@/apps/montagem/domain/equipe";

var ANO = "2026-10";
// [dia, hora, nome, condicional, venda, chegada, encomenda, observação, feito]
var LISTAGEM_INTERNA = [
  [ANO+"-02","09:00","Dely de Araujo Primo","",400,"","","Brinde de indicação — Nataly Fernando / Maria Aparecida",true],
  [ANO+"-02","09:00","Ana Claudia Adriano","",1944,"","","Brinde de indicação",true],
  [ANO+"-02","09:30","Barbara dos Santos de Oliveira","089957",0,"09:49","","Edna Pereira / Leci Rosa — chegou 12:42",true],
  [ANO+"-02","13:00","Elaine de Abreu Lima","",400,"12:55","","Brinde de indicação — Stefany Marques / Maria Aparecida",true],
  [ANO+"-02","13:00","Katia Regina da Rocha Santos","089870",0,"13:06","091780","Kauany Coutinho / Katie Danielle",true],
  [ANO+"-05","11:00","Juliane Costa Hipolito de Souza","089276",0,"","","",false],
  [ANO+"-05","12:00","Camille Vitória Peixoto","090146",0,"","","",false],
  [ANO+"-05","13:30","Luana Renata Hass","090748",0,"","","",false],
  [ANO+"-05","14:00","Janine Silva Alberti","090015",0,"","","",false],
  [ANO+"-05","15:00","Emelyn Carvalho de Oliveira","089793",0,"","","",false]];
var VERSAO_INTERNOS = 5;   // sobe quando a lista muda: o estado salvo troca os de demonstração antigos

// Quem bipou: o primeiro nome da observação que for de uma bipadora da equipe (Edna, Kawany, Sthefany, Nataly…)
function bipouDe(obs){
  var t = (obs||"").toLowerCase(), ach = null;
  BIPADORAS.forEach(function(b){ var p = b.nome.toLowerCase(); var variantes = [p, p.replace("kawany","kauany").replace("sthefany","stefany").replace("nataly","nataly fernando")];
    if(!ach && variantes.some(function(v){ return t.indexOf(v)>=0; })) ach = b; });
  return ach;
}

function internosDemo(s){
  var v = versaoVigente(s), r2 = function(n){ return Math.round(n*100)/100; };
  var internos = [], acertos = [];
  LISTAGEM_INTERNA.forEach(function(x, i){
    var dia = x[0], hora = x[1], nome = x[2], cond = x[3], venda = x[4], feito = x[8], bip = bipouDe(x[7]);
    var it = {id:"ID"+(i+1), nome:nome, fone:"", devmaster:"", data:dia, hora:hora, condicionais:cond ? [{numero:cond, pecas:0}] : [], obs:x[7], chegada:x[5]||"", encomenda:x[6]||"",
      remarcacoesLista:[], status:"agendado", regrasVersaoId:v ? v.id : null, criadoPor:"Natasha", criadoEm:Date.parse(dia+"T08:00:00"),
      vendaApp:0, vendaFonte:"app_revendedora", demo:true};
    if(feito && v){
      var res = calcularAcerto({vendaBruta:venda, devolvida:0, garantia:0, vez:0, valorPago:null, atrasoDias:0, semTaxa:true}, v);
      var pagamentos = res.valorDevido>0 ? [{forma:"acerto_loja", descricao:"ACERTO - LOJA INTERNO", parcelas:1, data:dia, valor:res.valorDevido, anexo:null}] : [];
      var form = Object.assign({}, FORM_ACERTO_VAZIO, {vendaBruta:venda, pagamentos:pagamentos, condicionaisSelecionadas:cond ? [cond] : []});
      it.status = "acertado"; it.acerto = res; it.formSnapshot = form; it.bipou = bip ? bip.nome : ""; it.kitNovo = false; it.vendaApp = venda;
      acertos.push(Object.assign({id:"ACI"+(i+1), internoId:it.id, rev:nome, rep:"Atendimento interno", origem:"interno", tipo:"acerto", tipoKit:venda>0 ? "acerto_kit" : "saiu", data:dia, hora:hora,
        regrasVersaoId:v.id, modalidade:"padrao", atrasoDias:0, vendaBruta:venda, garantia:0, pecasCond:0, reagendamentos:0, formSnapshot:form, recebimento:null,
        condicionaisSelecionadas:cond ? [cond] : [], pagamentos:pagamentos, acordo:null, recusouNegociar:false, brindesLancados:[], excedenteBrinde:0, pecasProxCodigos:[], pecasProxLiberadas:0,
        kitNovoOk:false, expositoresMarcados:[], assinatura:null, regrasLidas:true, por:bip ? bip.nome : "", demo:true}, res));
    }
    internos.push(it);
  });
  // Duas vendas em andamento hoje, preenchidas quase até o final (demonstração pedida pelo Marcus):
  //  • Juliane: enviou os pagamentos, o financeiro ainda vai dividir nas contas (aparece na Visão geral);
  //  • Camille: pagamentos conferidos, brindes lançados; falta condicional nova e as regras com a assinatura.
  var lancFin = [];
  if(v){
    var hojeD = ANO+"-05", ts = function(hhmm){ return Date.parse(hojeD+"T"+hhmm+":00"); };
    var devido = function(venda, pago){ return calcularAcerto({vendaBruta:venda, devolvida:0, garantia:0, vez:0, valorPago:pago, atrasoDias:0, semTaxa:true}, v); };
    var pgto = function(forma, valor){ return {forma:forma, descricao:"", parcelas:1, data:hojeD, valor:valor, anexo:null}; };
    var png = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";
    internos.forEach(function(it){
      if(it.id==="ID6"){   // Juliane
        var r6 = devido(3200, null), pix6 = Math.round(r6.valorDevido*0.6), cre6 = r2(r6.valorDevido-pix6);
        Object.assign(it, {chegada:"11:05", inicio:"11:08", inicioTs:ts("11:08"), atendeu:"Natasha", bipou:"Natasha", escolhaIni:ts("11:10"), escolhaFim:ts("11:34"),
          condicionais:[{numero:"089276", valor:3150, pecas:42, vendidas:26}], vendasAnt:[2800, 3000],
          rascunho:Object.assign({}, FORM_ACERTO_VAZIO, {vendaBruta:3200, pagamentos:[pgto("pix", pix6), pgto("credito", cre6)]})});
        lancFin.push({id:"LF"+it.id, internoId:it.id, nome:it.nome, enviadoTs:ts("11:40"), por:"Natasha", conferido:false, etapaComprovantes:false, finalizado:false, demo:true,
          linhas:[{tipo:"pagamento", forma:"pix", valor:pix6, isento:false, partes:[{descricao:"", valor:pix6, comprovante:null, ok:false}]},
                  {tipo:"pagamento", forma:"credito", valor:cre6, isento:false, partes:[{descricao:"", valor:cre6, comprovante:null, ok:false}]}]});
      }
      if(it.id==="ID7"){   // Camille
        var r7 = devido(2100, null), pago7 = devido(2100, r7.valorDevido);
        Object.assign(it, {chegada:"12:02", inicio:"12:05", inicioTs:ts("12:05"), atendeu:"Edna", bipou:"Edna", escolhaIni:ts("12:08"), escolhaFim:ts("12:31"),
          condicionais:[{numero:"090146", valor:2400, pecas:35, vendidas:21}], vendasAnt:[2000, 2300],
          rascunho:Object.assign({}, FORM_ACERTO_VAZIO, {vendaBruta:2100, pagamentos:[pgto("pix", r7.valorDevido)],
            brindes:[{cat:"normal", codigo:"AN0451", valor:Math.floor(pago7.brindeNormal*0.6), origem:"nova"}, {cat:"bb", codigo:"BB0123", valor:Math.floor(pago7.brindeSelect*0.5), origem:"nova"}]})});
        lancFin.push({id:"LF"+it.id, internoId:it.id, nome:it.nome, enviadoTs:ts("12:20"), por:"Edna", conferido:true, etapaComprovantes:true, finalizado:true, demo:true,
          linhas:[{tipo:"pagamento", forma:"pix", valor:r7.valorDevido, isento:false, partes:[{descricao:"PIX - POINT", valor:r7.valorDevido, comprovante:{nome:"comprovante.png", url:png}, ok:true}]}]});
      }
    });
  }
  return {internos:internos, acertos:acertos, lancFin:lancFin};
}

// Termo do consignado já assinado em setembro (a revendedora voltou este mês): leu, confirmou e assinou todas as informações
function assinaturaDemo(nome){
  var svg = '<svg xmlns="http://www.w3.org/2000/svg" width="360" height="110" viewBox="0 0 360 110"><rect width="360" height="110" fill="white"/><text x="20" y="66" font-family="Brush Script MT, Segoe Script, cursive" font-size="32" font-style="italic" fill="#1B1409">' + nome + '</text><path d="M20 88 Q 130 70 340 86" stroke="#1B1409" stroke-width="2" fill="none"/></svg>';
  return "data:image/svg+xml;utf8," + encodeURIComponent(svg);
}
function termosDemo(s){
  var v = versaoVigente(s); if(!v) return {};
  var regras = textoRegras(v, "padrao").filter(function(r){ return !/deslocamento|pe[cç]as/i.test(r.t); }).map(function(r){ return r.t; });
  return {"Camille Vitória Peixoto":{termoConsignado:{ts:Date.parse("2026-09-02T10:12:00"), assinatura:assinaturaDemo("Camille V. Peixoto"), regras:regras, versaoId:v.id, por:"Natasha", origem:"interno"}}};
}

export { termosDemo, LISTAGEM_INTERNA, VERSAO_INTERNOS, internosDemo };
