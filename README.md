# 🍕 La Farina

A **La Farina** é um sistema de gerenciamento e monitoramento de pedidos em tempo real. Desenvolvido em **Vue 3**, o ecossistema conecta uma interface de usuário altamente responsiva a uma API em nuvem, oferecendo um fluxo de navegação fluido, validações estritas de dados e uma identidade visual premium.

---

##  Demonstração Ativa

*   **📱 Aplicação Web (Produção):** [https://hebermacedo.github.io/La-Farina/#/menu](https://hebermacedo.github.io/La-Farina/#/menu)
*   **⚙️ Banco de Dados & API REST:** [https://api-tpizza-artesanal.onrender.com](https://api-tpizza-artesanal.onrender.com)

>  **Nota sobre o carregamento inicial (Cold Start):** Como a API está hospedada na camada gratuita do *Render Cloud*, o servidor entra em modo de repouso após 15 minutos de inatividade. Ao abrir a aplicação pela primeira vez, as opções de pizza podem levar entre **30 e 50 segundos** para carregar enquanto o banco de dados "acorda". Caso as pizzas não apareçam de imediato, basta aguardar alguns instantes e atualizar a página (`F5`). Os acessos seguintes serão instantâneos!

---

## Design

A identidade do projeto foi construída para traduzir a identidade visual da gastronomia italiana:

*   **Terracota Profundo (`#5c1d24`):** Presente em títulos e preços, remetendo à tradição dos molhos artesanais.
*   **Verde Oliva (`#556b2f`):** Utilizado em botões de ação principal, evocando ingredientes frescos e o azeite clássico.
*   **Dourado Queimado (`#b8860b`):** Aplicado em detalhes sutis de bordas e divisores para acrescentar sofisticação.
*   **Off-White Antigo (`#faf9f6`):** Fundo suave que evita a fadiga visual e simula os menus de papel texturizado das tratorias europeias.

---
## Funcionalidades Principais

*   **Seleção Dinâmica do Menu:** Catálogo reativo que renderiza as pizzas da cozinha diretamente da API com animações fluidas de foco (*hover*).
*   **Customização Avançada:** Formulário inteligente adaptado para o modelo de negócios de pizzarias, permitindo a escolha de tamanhos específicos, bordas recheadas e acompanhamentos.
*   **Barra de Navegação Customizada:** Utilização de máscaras geométricas CSS (`clip-path`) para garantir o encaixe e renderização perfeita da logo circular do restaurante.
*   **Validação em Camadas (Client-side):** Bloqueio de requisições incompletas, garantindo que nenhum pedido seja enviado ao forno sem campos cruciais (como nome e tamanho).
*   **Painel de Monitoramento (Live Update):** Sincronização dinâmica com o banco de dados que atualiza as linhas de produção, altera status e remove itens da tela instantaneamente através de manipulação reativa do DOM (sem recarregamento artificial da página).

---

## Componente de Feedback Semântico

A aplicação conta com um sistema modular de notificações integradas no componente `AlertaComponent.vue`. Ele altera dinamicamente sua estrutura visual, ícones e cores com base no contexto de resposta do sistema:

*   🟢 **Sucesso (Verde):** Exibido em cadastros concluídos, seguido de um redirecionamento automático de UX para a área de acompanhamento;
*   🔴 **Erro (Vermelho):** Bloqueios de envio por campos obrigatórios vazios;
*   🟠 **Aviso (Laranja):** Notificação reativa imediata assim que um item é removido do sistema por meio do botão de lixeira.

---

## Tecnologias e Arquitetura

*   **Framework Principal:** [Vue.js 3](https://vuejs.org/) (Arquitetura baseada em Componentes e Sistema de Rotas Dinâmicas)
*   **Estilização:** CSS3 Avançado (Escopo Isolado / Scoped CSS, Flexbox, Máscaras e Transições)
*   **Hospedagem Front-end:** [GitHub Pages](https://pages.github.com/) (HTTPS e deploy automatizado via GitHub Actions)
*   **Persistência de Dados:** [Render Cloud](https://render.com/) (Hospedagem remota da API RESTful simulada via JSON Server)

---

## Rodando com Docker

Com o Docker instalado, suba o front-end e a API local (JSON Server) com um único comando:

```bash
docker compose up -d --build
```

*   **Aplicação:** [http://localhost:8080](http://localhost:8080)
*   **API:** [http://localhost:3000](http://localhost:3000)

Os dados gravados (pedidos, cadastros) ficam no volume `db-data` e sobrevivem a reinícios. Para parar e zerar o banco de volta ao `db/db.json` original:

```bash
docker compose down -v
```

Para gerar apenas a imagem do front-end apontando para a API em produção (Render):

```bash
docker build -t la-farina .
docker run -p 8080:80 la-farina
```

---

## Organização Estrutural do Código

```markdown
├── public/
│   ├── img/               # Recursos visuais (Banner, Logo Circular e Ícones)
│   └── index.html         # Template HTML principal injetado pelo Webpack
├── src/
│   ├── components/        # Componentes reutilizáveis (NavBar, Banner, Alerta, Pedido)
│   ├── views/             # Telas principais mapeadas pelas rotas da aplicação
│   ├── router/            # Configurações de navegação SPA (Single Page Application)
│   ├── App.vue            # Componente raiz da aplicação
│   └── main.js            # Inicialização e montagem do ecossistema Vue
├── vue.config.js          # Configurações globais de compilação do Vue CLI
└── package.json           # Dependências e scripts de automação do projeto
```

## Cenários para teste

| Item | Descrição |
|---|---|
| **Caso de Uso** | UC1 - Realizar pedido de pizza |
| **Finalidade** | Permitir que o cliente escolha um item do cardápio, personalize o pedido e envie a solicitação para o sistema de produção. |
| **Atores** | Cliente, Sistema |
| **Pré-condições** | O cliente acessou a tela de menu e a API da pizzaria está disponível. |
| **Fluxo Principal** | 1- **Sistema** carrega o menu com as opções de pizzas disponíveis. <br> 2- **Cliente** seleciona a pizza, tamanho, borda e acompanhamentos desejados. <br> 3- **Cliente** preenche os dados obrigatórios, como nome e informações do pedido. <br> 4- **Sistema** valida os campos e confirma que os dados estão completos. <br> 5- **Cliente** envia o pedido. <br> 6- **Sistema** registra a solicitação e a exibe no painel de monitoramento. |
| **Fluxos Alternativos** | FA1 - Campos obrigatórios vazios [Passo 4 do Fluxo Principal]. <br> 1- **Sistema** exibe mensagem de alerta destacando os campos faltantes. <br> 2- **Sistema** mantém a tela aberta para correção. <br> FA2 - API indisponível [Passo 5 do Fluxo Principal]. <br> 1- **Sistema** exibe mensagem de erro técnico. <br> 2- **Sistema** informa que o pedido não foi enviado no momento. <br> FA3 - Item indisponível [Passo 2 do Fluxo Principal]. <br> 1- **Sistema** informa que a opção selecionada não está disponível no momento. <br> 2- **Cliente** deve escolher outra opção. |
| **Pós-condições** | Pedido registrado com sucesso no sistema e disponível para acompanhamento. |
| **Regras de negócio** | O nome do cliente é obrigatório. O tamanho da pizza deve ser informado. O sistema não deve permitir envio com campos críticos vazios. A escolha de borda e acompanhamento é opcional, mas deve seguir a regra de customização do cardápio. |
| **Dados Manipulados** | Nome do cliente, sabor da pizza, tamanho, borda recheada, acompanhamento, observações adicionais, status do pedido e valor total. |

| Item | Descrição |
|---|---|
| **Caso de Uso** | UC2 - Acompanhar pedidos em tempo real |
| **Finalidade** | Permitir que o administrador visualize, monitore e atualize o status dos pedidos em tempo real. |
| **Atores** | Administrador, Sistema |
| **Pré-condições** | Há pelo menos um pedido registrado no sistema e o usuário tem acesso ao painel administrativo. |
| **Fluxo Principal** | 1- **Sistema** exibe a lista de pedidos ativos em tempo real. <br> 2- **Administrador** visualiza informações como cliente, pizza, tamanho e status atual. <br> 3- **Administrador** atualiza o status do pedido conforme o andamento da produção. <br> 4- **Sistema** recalcula e re-renderiza a interface automaticamente sem recarregar a página. |
| **Fluxos Alternativos** | FA1 - Pedido removido [Passo 2 do Fluxo Principal]. <br> 1- **Sistema** retira automaticamente o pedido da lista visual. <br> 2- **Administrador** continua a acompanhar os demais itens. <br> FA2 - Falha de sincronização [Passo 4 do Fluxo Principal]. <br> 1- **Sistema** exibe mensagem de aviso de atualização. <br> 2- **Administrador** tenta novamente ou aguarda a reconexão. <br> FA3 - Pedido já concluído [Passo 3 do Fluxo Principal]. <br> 1- **Sistema** bloqueia alteração de status para itens finalizados. |
| **Pós-condições** | Painel de monitoramento atualizado com as modificações mais recentes. |
| **Regras de negócio** | O sistema deve listar os pedidos ativos em ordem de chegada ou prioridade. Alterações no status devem refletir imediatamente na interface. Não é permitido alterar itens que já foram finalizados sem autorização. |
| **Dados Manipulados** | Código do pedido, nome do cliente, item solicitado, status atual, horário do pedido e valor associado. |

| Item | Descrição |
|---|---|
| **Caso de Uso** | UC3 - Cancelar ou remover pedido |
| **Finalidade** | Permitir ao usuário ou administrador remover um pedido que não deve mais continuar na fila de produção. |
| **Atores** | Cliente, Administrador, Sistema |
| **Pré-condições** | O pedido foi registrado previamente e está visível na interface. |
| **Fluxo Principal** | 1- **Usuário** identifica o pedido na lista de acompanhamento. <br> 2- **Usuário** clica no botão de remoção/ação de exclusão. <br> 3- **Sistema** valida se o pedido pode ser removido. <br> 4- **Sistema** exclui o pedido da lista e exibe notificação de aviso. |
| **Fluxos Alternativos** | FA1 - Pedido já em fase final [Passo 3 do Fluxo Principal]. <br> 1- **Sistema** bloqueia a remoção e informa que o pedido não pode ser cancelado. <br> 2- **Usuário** confirma a situação e retorna à tela. <br> FA2 - Confirmação negada [Passo 2 do Fluxo Principal]. <br> 1- **Usuário** cancela a operação. <br> 2- **Sistema** mantém o pedido na fila. <br> FA3 - Falha técnica na exclusão [Passo 4 do Fluxo Principal]. <br> 1- **Sistema** exibe mensagem de erro. <br> 2- **Sistema** mantém o registro e solicita nova tentativa. |
| **Pós-condições** | Pedido removido da fila de produção e da interface do painel. |
| **Regras de negócio** | A remoção deve ser exibida como ação de alerta. O sistema deve garantir que apenas pedidos válidos sejam removidos. A exclusão deve refletir imediatamente na tela de acompanhamento. |
| **Dados Manipulados** | Identificador do pedido, status atual, cliente associado e motivo da remoção quando informado. |

## Autoria e Contribuição
Desenvolvido por Maria Clara Bertin Vieira Ferreira, Marco Antonio de Melo Peixoto, Heber Americo Macedo, Thaynara Lima Soares Sousa.
