// Sorelly Admin · montagem e bipagem — domain/consignado.js
// Regras de comissão, brinde e remarcação do consignado (revendedoras) e cálculo do acerto.
// Cada kit "carimba" a versão de regras vigente no momento em que é criado (ver reducer ADD_KIT);
// o acerto daquele kit sempre usa a versão carimbada, mesmo que as regras já tenham mudado.

// Tabela oficial (atualização de regras enviada pela Sorelly): faixa de venda líquida → comissão e brindes.
var FAIXAS_OFICIAIS = [
  {min:300,  pct:15, bn:0,   bb:0},
  {min:500,  pct:25, bn:48,  bb:68},
  {min:700,  pct:30, bn:88,  bb:96},
  {min:1000, pct:35, bn:118, bb:122},
  {min:1600, pct:40, bn:196, bb:144},
  {min:2500, pct:40, bn:312, bb:188},
  {min:5000, pct:45, bn:368, bb:232},
  {min:7000, pct:45, bn:442, bb:282}
];

// Remarcação (48h+ de aviso e sem aviso/em cima da hora): desconto percentual sobre a comissão (pontos percentuais)
// e desconto percentual sobre o valor do brinde (normal e select, sempre na mesma proporção). "Vez" reinicia a cada kit novo.
var REMARCACAO = {
  comAviso:  [{comissaoPct:0, brindePct:15}, {comissaoPct:2, brindePct:20}, {comissaoPct:4, brindePct:30}],
  semAviso:  [{comissaoPct:2, brindePct:15}, {comissaoPct:4, brindePct:25}, {comissaoPct:6, brindePct:35}],
  // a partir da 4ª vez: progressão automática até o teto informado, +passo por vez
  progressao: {comAviso:{inicio:6, passo:3, teto:15}, semAviso:{inicio:8, passo:3, teto:15}, brindeInicio:{comAviso:40, semAviso:45}, brindePasso:10, brindeTeto:70}
};

// Contas usadas pra registrar como a revendedora pagou o acerto — vira coluna no Consolidado (uma por conta).
// Confirmado com a Sorelly: essa é a lista oficial (baseada no sistema de referência).
var CONTAS_PAGAMENTO = {
  pix: [
    {id:"pix_sicredi_atacadista", label:"Sorelly Atacadista 34"},
    {id:"pix_sicredi_comercio", label:"Sorelly Comércio 46"},
    {id:"pix_sicredi_serenity", label:"Serenity 59"},
    {id:"pix_sicredi_axis", label:"Axis Joias 67"},
    {id:"pix_safra_sorelly", label:"Sorelly 34"},
    {id:"pix_safra_serenity", label:"Serenity 59"},
    {id:"pix_stone_comercio", label:"Sorelly Comércio 46"}
  ],
  debito: [
    {id:"deb_sorelly_atacadista", label:"Sorelly Atacadista 34"},
    {id:"deb_sorelly_comercio", label:"Sorelly Comércio 46"}
  ],
  credito: [
    {id:"cred_sorelly_atacadista", label:"Sorelly Atacadista 34"},
    {id:"cred_serenity_cartao", label:"Serenity Cartão 59"}
  ],
  link: [
    {id:"link_sorelly_atacadista", label:"Sorelly Atacadista 34"},
    {id:"link_sorelly_comercio", label:"Sorelly Comércio 46"}
  ],
  dinheiro: [
    {id:"dinheiro_caixa_geral", label:"Caixa Geral"}
  ]
};
var FORMA_LABEL = {pix:"PIX", debito:"Débito", credito:"Crédito", link:"Link", dinheiro:"Dinheiro"};

function contasLista(){
  var out = [];
  Object.keys(CONTAS_PAGAMENTO).forEach(function(forma){
    CONTAS_PAGAMENTO[forma].forEach(function(c){ out.push({forma:forma, id:c.id, label:FORMA_LABEL[forma]+" · "+c.label}); });
  });
  return out;
}
function totalPago(pagamentos){ return (pagamentos||[]).reduce(function(t,p){return t+(p.valor||0);}, 0); }

var REGRAS_GERAIS_OFICIAIS = {
  minRenovar:300,          // mínimo em vendas para renovar o kit e começar a comissionar
  taxaDeslocamento:35,     // vendas abaixo do mínimo: taxa de deslocamento
  taxaTagExtraviada:5,     // por tag riscada ou extraviada
  pecaSemEtiquetaVendida:true // peça sem etiqueta é considerada vendida
};

function novaVersaoRegras(campos, anteriorId){
  return Object.assign({
    id:"rv"+Date.now(),
    vigenciaDesde:new Date().toISOString().slice(0,10),
    anteriorId:anteriorId||null,
    faixas:JSON.parse(JSON.stringify(FAIXAS_OFICIAIS)),
    remarcacao:JSON.parse(JSON.stringify(REMARCACAO)),
    gerais:JSON.parse(JSON.stringify(REGRAS_GERAIS_OFICIAIS))
  }, campos||{});
}

function versaoVigente(s){
  var rc = s.regrasConsignado; if(!rc) return null;
  return (rc.versoes||[]).find(function(v){return v.id===rc.atualId;}) || null;
}

function versaoDoKit(s, kit){
  var rc = s.regrasConsignado; if(!rc) return versaoVigente(s);
  return (rc.versoes||[]).find(function(v){return v.id===kit.regrasVersaoId;}) || versaoVigente(s);
}

function faixaPor(vendaLiquida, versao){
  if(!versao || !vendaLiquida || vendaLiquida < versao.gerais.minRenovar) return null;
  return versao.faixas.slice().sort(function(a,b){return b.min-a.min;}).find(function(f){return vendaLiquida>=f.min;}) || null;
}

// vez: 1ª, 2ª, 3ª... remarcação deste kit. comAviso: avisou com 48h+ de antecedência.
function descontoRemarcacao(vez, comAviso, versao){
  if(!vez || vez<1) return {comissaoPct:0, brindePct:0};
  var r = versao.remarcacao, lista = comAviso ? r.comAviso : r.semAviso;
  if(vez <= lista.length) return lista[vez-1];
  var prog = r.progressao, chave = comAviso ? "comAviso" : "semAviso", p = prog[chave];
  var extra = vez - lista.length; // 1 na 4ª vez, 2 na 5ª...
  var comissaoPct = Math.min(p.teto, p.inicio + (extra-1)*p.passo);
  var brindePct = Math.min(prog.brindeTeto, prog.brindeInicio[chave] + (extra-1)*prog.brindePasso);
  return {comissaoPct:comissaoPct, brindePct:brindePct};
}

// Calcula o acerto de um kit de revenda normal (não vale para reposição/expositor, que têm comissão fixa/manual).
// entrada: {vendaBruta, devolvida, garantia, vez, comAviso, pagouIntegral}
function calcularAcerto(entrada, versao){
  var vendaLiquida = Math.max(0, (entrada.vendaBruta||0) - (entrada.devolvida||0) - (entrada.garantia||0));
  var faixa = faixaPor(vendaLiquida, versao);
  if(!faixa){
    return {vendaLiquida:vendaLiquida, faixa:null, comissaoPct:0, comissao:0, brindeNormal:0, brindeSelect:0,
      valorAcerto:vendaLiquida, taxaDeslocamento: vendaLiquida>0 ? versao.gerais.taxaDeslocamento : 0, semFaixa:true};
  }
  var desc = descontoRemarcacao(entrada.vez||0, entrada.comAviso!==false, versao);
  var comissaoPct = Math.max(0, faixa.pct - desc.comissaoPct);
  var comissao = Math.round(vendaLiquida * comissaoPct / 100 * 100)/100;
  var fatorBrinde = entrada.pagouIntegral===false ? 0 : Math.max(0, 1 - desc.brindePct/100);
  var brindeNormal = Math.round(faixa.bn * fatorBrinde * 100)/100;
  var brindeSelect = Math.round(faixa.bb * fatorBrinde * 100)/100;
  return {vendaLiquida:vendaLiquida, faixa:faixa, comissaoPct:comissaoPct, comissao:comissao,
    brindeNormal:brindeNormal, brindeSelect:brindeSelect, valorAcerto:Math.round((vendaLiquida-comissao)*100)/100,
    descontoRemarcacao:desc, pagouIntegral:entrada.pagouIntegral!==false, taxaDeslocamento:0, semFaixa:false};
}

// Diff simples entre duas versões, para o folder virtual marcar "atualizado em" por item.
function diffVersoes(atual, anterior){
  if(!anterior) return {faixas:atual.faixas.map(function(){return true;}), gerais:{}};
  var faixas = atual.faixas.map(function(f){
    var ant = anterior.faixas.find(function(a){return a.min===f.min;});
    return !ant || ant.pct!==f.pct || ant.bn!==f.bn || ant.bb!==f.bb;
  });
  var gerais = {};
  Object.keys(atual.gerais).forEach(function(k){ gerais[k] = anterior.gerais[k]!==atual.gerais[k]; });
  return {faixas:faixas, gerais:gerais};
}

export { FAIXAS_OFICIAIS, REMARCACAO, REGRAS_GERAIS_OFICIAIS, CONTAS_PAGAMENTO, FORMA_LABEL, novaVersaoRegras, versaoVigente, versaoDoKit,
  faixaPor, descontoRemarcacao, calcularAcerto, diffVersoes, contasLista, totalPago };
