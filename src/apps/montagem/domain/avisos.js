// Sorelly Admin — domain/avisos.js
// Avisos do sistema: o que dispara cada alerta e QUEM recebe (definido em Tecnologia → Avisos). O alerta aparece no canto da tela de cada
// pessoa da lista, com som, até ela clicar. Quem recebe é por pessoa/cargo, nunca fixo dentro de tela.
import { AGENDAMENTO, BIPADORAS, DIRETORIA, FINANCEIRO, KITNOVO, LISTAGENS_RESP, SUPERVISORA } from "@/apps/montagem/domain/equipe";

var TIPOS = [
  {k:"media_alta", t:"Média de vendas acima do limite", desc:"Na Atendimento Sorelly, quando a média das vendas da revendedora passa do limite do Configurador geral (limite do Marcus, hoje R$ 4.000). O alerta sai uma vez por atendimento.", padrao:[SUPERVISORA.id, 16, 17]}
];
var GRUPOS_PESSOAS = [
  {t:"Diretoria", ps:DIRETORIA},
  {t:"Supervisão da montagem", ps:[SUPERVISORA]},
  {t:"Bipadoras", ps:BIPADORAS},
  {t:"Financeiro e agendamento", ps:FINANCEIRO.concat(AGENDAMENTO)},
  {t:"Outros setores", ps:[KITNOVO, LISTAGENS_RESP]}
];
function destinosDe(s, tipo){
  var c = (s.avisosCfg||{})[tipo];
  if(c) return c;
  var t = TIPOS.find(function(x){ return x.k===tipo; });
  return t ? t.padrao.slice() : [];
}

export { TIPOS, GRUPOS_PESSOAS, destinosDe };
