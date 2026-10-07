# Sorelly Admin

Painel interno da Sorelly Joias (semijoias em consignação). Responda sempre em português do Brasil.
Usuário: Marcus (dono, não programador): explique em linguagem simples e sem jargão.

## Stack e comandos
Vite 6 + React 18 + React Router 6 + Tailwind 4. Alias `@` = `src/`. Sem testes automatizados.
- `npm run dev` (http://localhost:5173, config em `.claude/launch.json`, porta automática), `npm run build`, `npm run preview`.
- Verificar mudança: abrir no navegador embutido, exercitar o fluxo, checar o console. Mostrar o sistema rodando, nunca mostrar código.
- Depois de testar, limpar o localStorage (`sorelly_montagem_v9`) e não deixar acertos de teste em revendedoras de demonstração. Não abrir este projeto e os HTMLs antigos no mesmo navegador (mesma chave).

## Como o código é escrito
- Telas usam `React.createElement` (`import { e } from "@/shared/react"`), não JSX. Siga o estilo do arquivo.
- Dois apps independentes, cada um com `ui/`, `state/`, `domain/` próprios: `src/apps/montagem/` (principal) e `src/apps/kits-novos/`. Não unifique os `ui/`.
- Rotas: `src/router/rotas.js`. Menu: `apps/montagem/navigation/{abas,setores}.js` + `router/slugs.js`. Passo a passo no README.md.
- Estado: reducer + `localStorage`; `state.aba` é a tela ativa e a URL acompanha. Mudou o formato do estado? Suba a versão salva.
- Números e regras ficam em `apps/montagem/domain/` e no Configurador; nunca valor fixo dentro de tela. O que muda no admin muda no app.

## Regras detalhadas (carregadas só quando você trabalha na pasta)
- `src/apps/montagem/domain/CLAUDE.md`: faturamento, acerto, brindes, taxas, Kit 100% Prata, peças do próximo mês.
- `src/apps/montagem/pages/CLAUDE.md`: menu de Kits, listagens, calculadora, análise de vendas, condicionais, peças por kit.
- `src/apps/kits-novos/CLAUDE.md`: fluxo da Michele, indicações, recusas.

## Economia de tokens
- NÃO leia arquivos grandes inteiros: Grep e depois Read com `offset`/`limit`. Maiores: `mobile/representante.js` (104 KB), `reducer.js` (37 KB), `AtendimentoInternoCalculadora.js` (36 KB), `PrevisaoFaturamento.js` (25 KB), `revendedoras-diario.js` (21 KB), `consignado.js` (20 KB).
- NUNCA abra `referencia/` (HTMLs originais de 1,2 MB), `public/dados/*.json`, `dist/` nem `node_modules/`.
- Prefira Edit em trechos pequenos. Não reescreva arquivos.

## Pessoas e setores
**Acesso é por setor/perfil, não por pessoa.** Cada setor enxerga só o que é dele. No código use perfil/setor; o nome é só quem ocupa o cargo hoje e pode mudar (ex.: condicionais era Gabi, agora Marjory).
- **Diretoria:** Marcus (dono), Nickolas, Lucas. Veem tudo. Definem preço de peças.
- **Montagem e bipagem de kits:** responsável do setor Deysiane (supervisão). Montadoras (8) e bipadoras (6, ex.: Natasha).
- **Condicionais:** responsável hoje Marjory (antes Gabi).
- **Kits novos e Indicação:** Michele (supervisor Nickolas).
- **Cadastro de peças:** Rayssa (supervisora) e Graziella.
- **Faturamento diário:** Amanda lança.
- **Desenvolvimento:** Leonardo e devs (levam o sistema para produção; aqui só se definem regras e telas).
- **Dinheiro** (valor do kit, vendas, comissões): só a supervisão da montagem e a diretoria. Montadora e bipadora nunca veem valor; bipadora nunca vê o valor esperado. Kits novos vê só a tela de Kit novo, com o valor do kit.

## Setores do menu (`navigation/setores.js`)
Legenda: **pronto** = tela existe · **a trazer** = existe no admin antigo, falta integrar · **em breve** = só placeholder.
- **Visão geral**: pronto. **Chamados**: em breve.
- **Financeiro**: Previsão de faturamento e Contas a pagar = pronto. A trazer: histórico de contas, saldos bancários, saldo das contas (PIX), fiscal, financeiro familiar, cobrança. Em breve: link de pagamento, maquininhas, leilão.
- **Cadastro de revendedoras**: Kits novos (5 telas) e Avaliação das representantes = pronto. A trazer: ficha única, revendedoras diárias, aprovação, origem e campanhas, métricas, indicações, avaliações.
- **Kits**: pronto (Listagens, Calculadora de acertos, Painel, Condicionais, Calculadora de kits, Análise de vendas, Consolidado, Regras, Equipe, Registros, Relatórios, App da representante, Regras e Configurações das representantes). A trazer: Metas. Em breve: Produção.
- **Materiais e estoque**: Estoque Sorelly a trazer; cadastro de peças, materiais e compras em breve.
- **Encomendas, Garantia, RH, Segurança e limpeza, Marketing, Equipes**: em breve.
- **Tecnologia**: Configurador geral = pronto (um só para todos os configuradores).
- **Apps de celular simulados** (ícones no topo): representante, revendedora, montagem, bipagem, condicionais. **Métricas**: usa Relatórios.

## Cadastro de peças (só levantamento, nada criado)
Hoje a peça chega por foto e texto no WhatsApp (modelo, custo, quantidade, fornecedor, preço, markup). Objetivo: fazer dentro do Admin. Rayssa/Graziella lançam, a diretoria define o preço, cadastro POR MODELO. Fase 1 simples: lançar e gerar relatório. Não criar nada antes de alinhar com o Marcus. Ainda a confirmar: o que é peça "de luxo" e como se calcula o markup.

## Como o Marcus quer trabalhar
- Perguntas curtas, poucas por vez (3), por escrito no chat; nada de blocos de múltipla escolha.
- "Anote, não faça ainda" = só anotar e perguntar. "Me dá um norte" = não criar nada, perguntar primeiro.
- Antes de agir, confirmar qual tela é; ele se irrita quando misturo abas ou faço sem entender.
- Um assunto por conversa, pedidos agrupados, poucos testes visuais. Respostas rápidas e diretas.
- Não adicionar nada que ele não pediu. Menos texto explicativo na tela, mais ícones e leitura limpa.
- Visual: letras brancas (não cinza), tema dourado. Apps: cores sólidas, sem degradê. Admin: degradê dourado leve. Dinheiro como `R$ 7.000,00`; campo de dinheiro digitado "subindo" os dígitos.

## Git
Branch `master`, 2 commits e várias alterações não commitadas. Só commitar quando o Marcus pedir.
