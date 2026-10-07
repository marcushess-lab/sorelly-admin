// Sorelly Admin — domain/mensagem-fechamento.js
// Ao fechar o atendimento: gera as duas mensagens prontas — uma para a revendedora e outra para o grupo da empresa.
// Recebe o que a Calculadora de acertos derivou (derivarAcerto) e o formulário do acerto.
import { reais } from "@/apps/montagem/domain/consignado";

var dataBR = function(iso){ return iso ? iso.split("-").reverse().join("/") : ""; };

function mensagemFechamento(p){
  var dv = p.dv, pa = dv.previaAcerto, f = p.form, prata = dv.ehPrata;
  var pecasBr = function(origem){ return (f.brindes||[]).filter(function(b){ return (b.origem||"nova")===origem; }); };
  var linhaBrinde = function(b){ return "• "+b.codigo+" — "+reais(b.valor)+(b.cat==="bb" ? " (Select)" : ""); };
  var pags = (f.pagamentos||[]).map(function(x,i){ return "• Pag. "+(i+1)+": "+reais(x.valor)+" — "+x.descricao+(x.forma==="credito" && x.parcelas>1 ? " "+x.parcelas+"x" : "")+" ("+dataBR(x.data)+")"+(x.anexo ? " 📎" : ""); });
  var ficam = (p.condFicam||[]).map(function(c){ return "Condicional "+c.numero+" ("+c.pecas+" peças)"; }).concat((p.expFicam||[]).map(function(x){ return x.qtd+" "+x.nome.toLowerCase(); }));
  var kitNovo = !f.pagamentos.length ? "—" : dv.kitNovoLiberado ? "liberado" : "não liberado";
  var prox = dv.pecasProx;
  var quitado = dv.restanteTotal<=0.009;

  var cliente = [
    "Olá, "+p.nome.split(" ")[0]+"! Segue o resumo do seu acerto"+(prata ? " (Kit 100% Prata)" : "")+" ✨",
    "",
    "Vendas: "+reais(f.vendaBruta),
    "Comissão: "+pa.comissaoPct+"%",
    pa.taxaDeslocamento>0 ? "Taxa de deslocamento: "+reais(pa.taxaDeslocamento) : null,
    "Valor do acerto: "+reais(pa.valorAcerto),
    dv.excedenteBrinde>0 ? "Excedente de brinde: "+reais(dv.excedenteBrinde) : null,
    "",
    pags.length ? "Pagamentos:" : "Nenhum pagamento lançado.",
  ].concat(pags).concat([
    quitado ? "✅ Acerto quitado." : "⚠️ Valor restante: "+reais(dv.restanteTotal)+(f.recusouNegociar ? " — sem brinde; nota promissória executada em 48h úteis." : ""),
    "",
    dv.brindeLiberado && (f.brindes||[]).length ? "Brindes:" : (dv.brindeBloqueio ? "Brinde: "+dv.brindeBloqueio.curto.toLowerCase() : null),
  ]).concat(dv.brindeLiberado ? (f.brindes||[]).map(function(b){ return linhaBrinde(b)+" — maleta "+((b.origem||"nova")==="antiga" ? "antiga" : "nova"); }) : []).concat([
    "",
    "Kit novo: "+kitNovo,
    prox && prox.liberadas>0 ? "Peças liberadas para o próximo mês: "+prox.liberadas+((f.pecasProxCodigos||[]).length ? " (escolhidas: "+f.pecasProxCodigos.join(", ")+")" : "") : null,
    ficam.length ? "Continuam com você: "+ficam.join("; ") : null,
    "",
    "Obrigada pela parceria! 💛 Sorelly Joias"
  ]).filter(function(x){ return x!==null && x!==undefined; }).join("\n");

  var grupo = [
    "*ACERTO FECHADO* — "+p.nome+(prata ? " · KIT 100% PRATA" : ""),
    "Atendimento: "+(p.origem==="interno" ? "interno (Sorelly)" : "rep. "+(p.rep||"—"))+" · "+dataBR(p.data),
    "Vendas "+reais(f.vendaBruta)+" · comissão "+pa.comissaoPct+"% · acerto "+reais(pa.valorAcerto)+(pa.taxaDeslocamento>0 ? " (+ taxa "+reais(pa.taxaDeslocamento)+")" : ""),
    "Pago "+reais(dv.totalPagoAtual)+" · "+(quitado ? "QUITADO" : "restante "+reais(dv.restanteTotal)+(f.recusouNegociar ? " (não quis negociar — NP 48h úteis)" : dv.acordoExistente ? " (acordo salvo)" : "")),
    pags.length ? pags.join("\n") : null,
    "Condicionais conferidas: "+(f.condicionaisSelecionadas||[]).join(", ")+" ("+dv.pecasCondSelecionadas+" peças)",
    "Peças: vendidas "+(f.pecasVendidas||0)+" · brindes "+(f.pecasBrinde||0)+" · trocas "+(f.pecasTrocas||0)+" · a devolver "+(dv.pecasADevolver===null ? "—" : dv.pecasADevolver),
    (f.brindes||[]).length ? "Brindes lançados:\n"+["antiga","nova"].map(function(o){ var l = pecasBr(o); return l.length ? "  Maleta "+(o==="antiga" ? "ANTIGA (devolvendo)" : "NOVA (recebendo)")+":\n"+l.map(function(b){ return "  "+linhaBrinde(b); }).join("\n") : null; }).filter(Boolean).join("\n") : "Brindes: nenhum",
    "Kit novo: "+kitNovo+(f.kitNovoOk ? " (confirmado)" : ""),
    prox ? "Próximo mês: "+prox.liberadas+" peças liberadas"+((f.pecasProxCodigos||[]).length ? " — "+f.pecasProxCodigos.join(", ") : "") : null,
    ficam.length ? "Em aberto com a revendedora: "+ficam.join("; ") : null,
    p.remarcacoes ? "Remarcações: "+p.remarcacoes : null
  ].filter(function(x){ return x!==null && x!==undefined; }).join("\n");

  return {cliente:cliente, grupo:grupo};
}

export { mensagemFechamento };
