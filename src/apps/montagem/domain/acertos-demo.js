// Sorelly Admin — domain/acertos-demo.js
// Atendimentos de demonstração do mês (pedido do Marcus): 13 revendedoras de 3 representantes, cada uma com a VENDA abaixo, mais 2 kits novos e 1 reposição.
// A conta é a mesma do sistema (calcularAcerto com as regras vigentes): comissão da revendedora, taxa, valor do acerto e brindes saem da tabela.
// Os pagamentos são variados de propósito (Pix, link, crédito, débito, dinheiro, Pix representante, vários na mesma revendedora) e alguns acertos ficam
// com saldo em aberto para aparecer na Inadimplência. Parte = fração do que ela deve; o último pagamento fecha o resto, menos o "falta".
import { calcularAcerto, pecasProximoMes, versaoVigente } from "@/apps/montagem/domain/consignado";

var CONTA = {pix:"PIX - POINT", pix_representante:"PIX REPRESENTANTE", link:"LINK - SICREDI - SORELLY - 46", credito:"CRÉDITO - CIELO - P", debito:"DÉBITO - CIELO - P", dinheiro:"DINHEIRO"};
// [representante, revendedora, venda, [[forma, parte, parcelas?]...], fração que fica em aberto, tipo do kit]
var ACERTOS_DEMO = [
  ["Dayanne","Amanda Ribeiro",1152, [["credito",1,3]], 0, "acerto_kit"],
  ["Dayanne","Daniela Moreira",2541, [["pix",.6],["dinheiro",.4]], 0, "acerto_kit"],
  ["Dayanne","Patrícia Nunes",3265, [["link",1]], 0, "acerto_kit"],
  ["Dayanne","Luciana Prado",1254, [["dinheiro",1]], 0, "saiu"],
  ["Lysie","Fernanda Azevedo",215, [["pix",1]], 0, "acerto_kit"],
  ["Lysie","Gabriela Mendes",654, [["debito",.55],["pix",.45]], .12, "acerto_kit"],
  ["Lysie","Helena Barros",896, [["pix",1]], .25, "saiu"],
  ["Jessica","Larissa Almeida",2658, [["credito",.5,6],["dinheiro",.2],["pix",.3]], 0, "acerto_kit"],
  ["Jessica","Mariana Costa",3587, [["link",.5],["credito",.5,2]], .08, "acerto_kit"],
  ["Jessica","Natália Freitas",2154, [["pix",1]], 0, "saiu"],
  // Pix mandado direto para a representante: o financeiro escolhe de qual representante é (Comissões) e já conta como pago
  ["Dayanne","Aline Souza",1800, [["pix_representante",1]], 0, "acerto_kit"],
  ["Lysie","Bruna Teixeira",1350, [["pix_representante",1]], 0, "acerto_kit"],
  ["Jessica","Carla Vidal",2200, [["pix_representante",1]], 0, "saiu"]];
// Mais 10 acertos para o Consolidado ficar com cara de uso real: cada pagamento diz a CONTA (4º item), espalhada entre CNPJ 34/46/59/67, H&O, sem faturamento e família
var ACERTOS_DEMO_2 = [
  ["Priscila","Camila Duarte",1850, [["pix",.5,1,"PIX SAFRA 34"],["credito",.5,3,"CRÉDITO - SAFRA - SORELLY - 34"]], 0, "acerto_kit"],
  ["Rosana","Fabiana Moura",3400, [["pix",.4,1,"PIX - ITAÚ - 59"],["link",.3,1,"LINK - SICREDI - SERENITY - 59"],["debito",.3,1,"DÉBITO - ITAÚ - SERENITY"]], 0, "acerto_kit"],
  ["Rosana","Gisele Ramos",1480, [["credito",1,2,"CRÉDITO - BRADESCO CIELO - SERENITY - 59"]], 0, "saiu"],
  ["Marcus Hess","Heloísa Prado",2200, [["pix",1,1,"PIX - SICREDI - AXIS"]], 0, "acerto_kit"],
  ["Marcus Hess","Ingrid Tavares",760, [["pix",.5,1,"PIX - LUCAS - PF"],["dinheiro",.5]], 0, "acerto_kit"],
  ["Priscila","Jaqueline Neves",2750, [["pix",.35,1,"PIX - ITAÚ PJ - MARCO"],["pix",.35,1,"PIX - BANHO"],["credito",.3,2,"CRÉDITO - CIELO - P"]], 0, "acerto_kit"],
  ["Rosana","Karina Lopes",1100, [["pix",.6,1,"PIX - TUCANO"],["pix",.4,1,"PIX - CAIXA ECONÔMICA - ANAMARIA"]], .1, "acerto_kit"],
  ["Marcus Hess","Letícia Barros",4300, [["link",.4,1,"LINK - SICREDI - SORELLY - 46"],["credito",.3,4,"CRÉDITO - SAFRA - 46"],["pix",.3,1,"PIX PRESTADORES DE SERVIÇOS"]], 0, "acerto_kit"],
  ["Lysie","Mirela Santos",580, [["dinheiro",1]], 0, "saiu"],
  ["Jessica","Nádia Pires",280, [["pix",1,1,"PIX H&O"]], 0, "acerto_kit"]];
// Representantes de teste do Marcus: Thalita, Viviane, Vanessa, Fabila, Dayanne, Anne, Veridiana, Mayara, Ana Claudia e Lysie (Dayanne e Lysie já têm acertos acima).
// As outras 8 ganham 4 acertos cada, com vendas, contas de pagamento (CNPJs, família, sem faturamento), dinheiro, taxa não paga, remarcação com multa/isenta.
var REPS_TESTE = ["Thalita","Viviane","Vanessa","Fabila","Anne","Veridiana","Mayara","Ana Claudia"];
var REVS_TESTE = ["Alana Couto","Bárbara Siqueira","Cíntia Machado","Dalila Vieira","Elisa Fontes","Fernanda Gil","Graziela Mota","Hellen Cardoso","Iracema Dias","Juliana Ribas","Kátia Rocha","Larissa Pontes","Mônica Teles","Nicole Ávila","Olívia Braga","Paloma Reis",
  "Quitéria Lemos","Rafaela Antunes","Sabrina Portela","Tatiane Moraes","Úrsula Nunes","Valéria Cunha","Wanda Prates","Ximena Lara","Yara Bastos","Zuleica Mendes","Amanda Seixas","Bruna Valle","Carolina Pinho","Débora Quintas","Eloá Marques","Flávia Sá"];
var VENDAS_TESTE = [280, 640, 1250, 1900, 2600, 3300, 450, 5200, 820, 1500, 3900, 210, 700, 2300, 1100, 4600, 360, 2900, 980, 1700, 480, 3600, 1350, 2100, 260, 5600, 760, 1450, 3100, 540, 2450, 880];
var PADROES_PAG = [
  [["pix",1,1,"PIX - POINT"]],
  [["pix",.6,1,"PIX SAFRA 34"],["credito",.4,2,"CRÉDITO - SAFRA - SORELLY - 34"]],
  [["link",1,1,"LINK - SICREDI - SERENITY - 59"]],
  [["pix",.5,1,"PIX - CAIXA - 46"],["dinheiro",.5]],
  [["credito",1,3,"CRÉDITO - CIELO - P"]],
  [["pix",.4,1,"PIX - ITAÚ - 59"],["debito",.6,1,"DÉBITO - SICREDI - SERENITY - 59"]],
  [["pix",1,1,"PIX - LUCAS - PF"]],
  [["pix",.7,1,"PIX - BANHO"],["pix",.3,1,"PIX - TUCANO"]],
  [["link",.5,1,"LINK - SICREDI - SORELLY - 46"],["credito",.5,2,"CRÉDITO - SAFRA - 46"]],
  [["dinheiro",1]],
  [["pix",1,1,"PIX - SICREDI - AXIS"]],
  [["pix_representante",1]]];
var ACERTOS_DEMO_3 = []; REPS_TESTE.forEach(function(rep, ri){ for(var k=0;k<4;k++){ var n = ri*4+k;
  var venda = VENDAS_TESTE[n % VENDAS_TESTE.length], aberto = (n%7===3 || (venda<500 && n%3===0)) ? .12 : 0, extra = {};
  if(n%6===2) extra = {vez:1, rem:[{isenta:false, motivo:""}]};
  if(n%11===5) extra = {vez:0, rem:[{isenta:true, motivo:"Falecimento na família"}]};
  ACERTOS_DEMO_3.push([rep, REVS_TESTE[n % REVS_TESTE.length], venda, PADROES_PAG[(n*5+ri) % PADROES_PAG.length], aberto, n%4===1 ? "saiu" : "acerto_kit", extra]); } });
var KITS_NOVOS_DEMO = [["Dayanne","Débora Martins","kit_novo"], ["Lysie","Elaine Rocha","kit_novo_exp"]];
var REPOSICOES_DEMO = [["Jessica","Fabiana Leal",20]];
var VERSAO_DEMO = 7;   // sobe quando a lista acima muda: o estado salvo troca os atendimentos de demonstração antigos pelos novos

function acertosDemo(s){
  var v = versaoVigente(s); if(!v) return [];
  var hoje = new Date(), dia = hoje.getDate(), r2 = function(n){ return Math.round(n*100)/100; };
  var dataDe = function(i){ var d = new Date(hoje.getFullYear(), hoje.getMonth(), 1 + (i % Math.max(1, dia)));       // espalha pelos dias do mês até hoje
    return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0"); };
  var horaDe = function(i){ return String(9 + i % 6).padStart(2,"0")+":"+String((i*7) % 60).padStart(2,"0"); };
  var acertos = ACERTOS_DEMO.concat(ACERTOS_DEMO_2, ACERTOS_DEMO_3).map(function(x, i){
    var ex = x[6] || {}, venda = x[2], res = calcularAcerto({vendaBruta:venda, devolvida:0, garantia:0, vez:ex.vez||0, valorPago:null, atrasoDias:0}, v), iso = dataDe(i);
    var aPagar = r2(res.valorDevido*(1-x[4])), resto = aPagar;
    var pagamentos = x[3].map(function(p, j){
      var ultimo = j===x[3].length-1, valor = ultimo ? r2(resto) : r2(aPagar*p[1]); resto = r2(resto-valor);
      return {forma:p[0], descricao:p[3] || CONTA[p[0]], parcelas:p[2]||1, data:iso, valor:valor, anexo:null}; });
    // 3 primeiros dias da Dayanne: o agendamento (Ana Maria) já conferiu o recebimento e a promissória; falta só a conciliação do financeiro em Comissões
    var temDin = x[3].some(function(p){ return p[0]==="dinheiro"; });
    var conferido = x[0]==="Dayanne" && i<3 ? {ok:true, em:iso+"T17:30:00", inicioTs:iso+"T17:18:00", fimTs:iso+"T17:30:00", quem:"Ana Maria", por:24, entrega:iso, semCond:false, prom:{ok:true, em:iso+"T17:30:00"},
      din:temDin ? {ok:true, contado:null, ts:iso+"T17:25:00", por:24} : undefined, rep:temDin ? {din:{ok:true, ts:iso+"T17:25:00"}, cond:{ok:true, ts:iso+"T17:26:00"}} : {cond:{ok:true, ts:iso+"T17:26:00"}}} : null;
    // peças e brindes (vêm do app): total de peças, vendidas, trocas, brindes lançados com código e valor, peças do próximo mês e retornadas
    var totalPc = Math.max(4, Math.round(venda/24)), vendidas = Math.round(totalPc*.6), trocas = i%5===0 ? 1 : 0, lancados = [];
    if(res.brindeNormal>0){ var bn = res.brindeNormal, p1 = bn>=150 ? Math.round(bn*.6) : bn; lancados.push({cat:"normal", codigo:"N"+(1000+i*7), valor:p1, origem:"nova"}); if(bn>=150) lancados.push({cat:"normal", codigo:"N"+(1001+i*7), valor:bn-p1, origem:"nova"}); }
    if(res.brindeSelect>0) lancados.push({cat:"bb", codigo:"BB"+String(1000+i), valor:res.brindeSelect, origem:"nova"});
    var liberadas = pecasProximoMes(res.vendaLiquida, res.valorDevido, r2(res.valorDevido*x[4]), v.pecasProx).liberadas, proxCod = [];
    for(var q=0;q<Math.min(liberadas, 4);q++) proxCod.push("P"+(2000+i*3+q));
    var pecas = {pecasCond:totalPc, pecasVendidas:vendidas, pecasTrocas:trocas, pecasBrinde:lancados.length, pecasADevolver:Math.max(0, totalPc-vendidas-lancados.length-trocas),
      brindesLancados:lancados, pecasProxCodigos:proxCod, pecasProxLiberadas:liberadas};
    return Object.assign({id:"ACD"+(i+1), rev:x[1], rep:x[0], tipo:"acerto", tipoKit:x[5], data:iso, hora:horaDe(i), regrasVersaoId:v.id,
      modalidade:"padrao", atrasoDias:0, vendaBruta:venda, garantia:0, reagendamentos:(ex.rem||[]).length, remarcacoes:(ex.rem||[]).slice(), recebimento:conferido, condicionaisSelecionadas:[], excedenteBrinde:0,
      pagamentos:pagamentos, assinatura:null, regrasLidas:true, kitNovoOk:false, demo:true}, pecas, res);
  });
  var n = ACERTOS_DEMO.length+ACERTOS_DEMO_2.length+ACERTOS_DEMO_3.length;
  var novos = KITS_NOVOS_DEMO.map(function(x, i){
    return {id:"KND"+(i+1), tipo:"kit_novo_entrega", tipoKit:x[2], rep:x[0], rev:x[1], data:dataDe(n+i), hora:horaDe(n+i), condicionais:[], pecasTotal:40, pecasFaltaram:0, obsDivergencia:"",
      regrasLidas:[], assinatura:"assinatura-demo", recebimento:null, demo:true}; });
  var repos = REPOSICOES_DEMO.map(function(x, i){
    return {id:"RPD"+(i+1), tipo:"reposicao", tipoKit:"reposicao", rep:x[0], rev:x[1], data:dataDe(n+2+i), hora:horaDe(n+2+i), comissao:x[2], valorAcerto:0, vendaLiquida:0, recebimento:null, demo:true}; });
  return acertos.concat(novos, repos);
}

export { ACERTOS_DEMO, REPS_TESTE, VERSAO_DEMO, acertosDemo };
