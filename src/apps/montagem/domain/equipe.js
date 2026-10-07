// Sorelly Admin · montagem e bipagem — domain/equipe.js
// Extraído de sorelly_admin_montagem_bipagem.html sem alterar o corpo das funções.
import { e } from "@/shared/react";

var MONTADORAS = [
  // Montagem de kits (todas também fazem produção e troca de plástico); funcao = tarefa extra de cada uma
  {id:1, nome:"Pamela",  mes:{n:140, e:22, soma:98*4.7, aval:98, div:3, tempoMedioMin:24}},
  {id:2, nome:"Ivanete", mes:{n:130, e:18, soma:90*4.3, aval:90, div:7, tempoMedioMin:27}},
  {id:3, nome:"Paula Melissa", mes:{n:136, e:19, soma:94*4.6, aval:94, div:2, tempoMedioMin:23}},
  {id:4, nome:"Let\u00edcia", mes:{n:124, e:15, soma:85*3.8, aval:85, div:11, tempoMedioMin:31}},
  {id:5, nome:"Jenifer", mes:{n:118, e:13, soma:80*4.1, aval:80, div:4, tempoMedioMin:26}},
  {id:6, nome:"Eduarda Helena", mes:{n:112, e:15, soma:77*4.4, aval:77, div:5, tempoMedioMin:25}},
  {id:7, nome:"Maria Vitória", funcao:"Verificação das maletas", mes:{n:86,  e:10, soma:60*3.4, aval:60, div:9, tempoMedioMin:34}},
  {id:8, nome:"Jordana", funcao:"Ajuda no cadastro de peças", mes:{n:80,  e:8,  soma:55*2.8, aval:55, div:14, tempoMedioMin:38}},
  {id:19, nome:"Larissa", mes:{n:108, e:14, soma:74*4.2, aval:74, div:6, tempoMedioMin:28}},
  {id:20, nome:"Rakieli", mes:{n:101, e:12, soma:70*4.0, aval:70, div:8, tempoMedioMin:29}},
  {id:21, nome:"Taynara", funcao:"Conferência de estoque", mes:{n:92, e:11, soma:64*4.3, aval:64, div:5, tempoMedioMin:32}}
];
var BIPADORAS = [{id:9, nome:"Natasha", completo:"Natasha Ribeiro", mes:{n:180, e:32, faltas:1}}, {id:10, nome:"Edna", completo:"Edna Pereira", funcao:"Treinamento e atacado", mes:{n:171, e:27, faltas:3}},
  {id:12, nome:"Natalia", completo:"Natalia Araujo", mes:{n:150, e:26, faltas:0}}, {id:13, nome:"Nataly", completo:"Nataly Fernanda", mes:{n:142, e:22, faltas:5}},
  {id:14, nome:"Sthefany", completo:"Sthefany Marques", mes:{n:131, e:20, faltas:2}}, {id:15, nome:"Kawany", completo:"Kawany Coutinho", mes:{n:128, e:21, faltas:4}},
  {id:22, nome:"Renata", mes:{n:96, e:15, faltas:2}}];
var LISTAGENS_RESP = {id:23, nome:"Majorry"};
var SUPERVISORA = {id:11, nome:"Deysiane"};
var DIRETORIA = [{id:16, nome:"Marcus"}, {id:17, nome:"Nickolas"}, {id:28, nome:"Lucas"}];
var KITNOVO = {id:18, nome:"Michele"};
// Agendamento confere o dinheiro e a promissória do acerto; financeiro dá o OK de cada pagamento (Ana Maria faz os dois)
var AGENDAMENTO = [{id:24, nome:"Ana Maria"}, {id:25, nome:"Mariana"}, {id:26, nome:"Tamara"}];
var FINANCEIRO = [{id:27, nome:"Nayale"}];
var ACAO_AGENDAMENTO = [24,25,26], ACAO_FINANCEIRO = [24,27];
var EQUIPE = MONTADORAS.concat(BIPADORAS,[SUPERVISORA],DIRETORIA,[KITNOVO],[LISTAGENS_RESP],AGENDAMENTO,FINANCEIRO);
function nomeDe(id){ var p = EQUIPE.find(function(x){return x.id===id;}); return p ? p.nome : "\u2014"; }
function papelDe(id){
  if(id===SUPERVISORA.id || DIRETORIA.some(function(x){return x.id===id;})) return "supervisao";
  if(id===KITNOVO.id) return "kitnovo";
  if(id===LISTAGENS_RESP.id) return "listagens";
  if(id===24) return "agendfin";
  if(ACAO_AGENDAMENTO.indexOf(id)>=0) return "agendamento";
  if(ACAO_FINANCEIRO.indexOf(id)>=0) return "financeiro";
  if(BIPADORAS.some(function(b){return b.id===id;})) return "bipadora";
  if(MONTADORAS.some(function(m){return m.id===id;})) return "montadora";
  return "supervisao";
}

// Supervisão e diretoria podem tudo; agendamento e financeiro só as ações do seu setor
function podeAgendar(id){ return ACAO_AGENDAMENTO.indexOf(id)>=0 || papelDe(id)==="supervisao"; }
// O agendamento (Mariana, Tamara) não vê valores totais nem as contas: só quantidades. Quem tem o financeiro, a supervisão e a diretoria veem tudo.
// Quem define a conta e confere os pagamentos do atendimento interno (Visão geral): Marcus, Nickolas, Lucas e Ana Maria
var CONFERE_PAGAMENTOS = [16,17,28,24];
function podeConferirPag(id){ return CONFERE_PAGAMENTOS.indexOf(id)>=0; }
// Configuração das comissões (botão em Comissões): só Marcus, Ana Maria e Nayale
var CONFIG_COMISSAO = [16,24,27];
function podeConfigComissao(id){ return CONFIG_COMISSAO.indexOf(id)>=0; }
function veTotais(id){ return papelDe(id)!=="agendamento"; }
function podeFinanceiro(id){ return ACAO_FINANCEIRO.indexOf(id)>=0 || papelDe(id)==="supervisao"; }

export { podeConfigComissao, podeConferirPag, AGENDAMENTO, FINANCEIRO, veTotais, podeAgendar, podeFinanceiro, MONTADORAS, BIPADORAS, LISTAGENS_RESP, SUPERVISORA, DIRETORIA, KITNOVO, EQUIPE, nomeDe, papelDe };
