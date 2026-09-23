# 🍕 La Farina

A **La Farina** é um sistema de gerenciamento e monitoramento de pedidos em tempo real. Desenvolvido em **Vue 3**, o ecossistema conecta uma interface de usuário altamente responsiva a uma API em nuvem, oferecendo um fluxo de navegação fluido, validações estritas de dados e uma identidade visual premium.

---

##  Demonstração Ativa

*   **📱 Aplicação Web (Produção):** [https://hebermacedo.github.io/tpizza-artesanal/#/menu](https://hebermacedo.github.io/tpizza-artesanal/#/menu)
*   **⚙️ Banco de Dados & API REST:** 

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

A aplicação conta com um sistema modular de notificações integradas no componente `MensagemComponent.vue`. Ele altera dinamicamente sua estrutura visual, ícones e cores com base no contexto de resposta do sistema:

*   🟢 **Sucesso (Verde):** Exibido em cadastros concluídos, seguido de um redirecionamento automático de UX para a área de acompanhamento;
*   🔴 **Erro (Vermelho):** Bloqueios de envio por campos obrigatórios vazios;
*   🟠 **Aviso (Laranja):** Notificação reativa imediata assim que um item é removido do sistema por meio do botão de lixeira.

---

## Tecnologias e Arquitetura

*   **Framework Principal:** [Vue.js 3](https://vuejs.org/) (Arquitetura baseada em Componentes e Sistema de Rotas Dinâmicas)
*   **Estilização:** CSS3 Avançado (Escopo Isolado / Scoped CSS, Flexbox, Máscaras e Transições)
*   **Hospedagem Front-end:** [Vercel](https://vercel.com/) (Ambiente seguro integrado com HTTPS e deploy automatizado)
*   **Persistência de Dados:** [Render Cloud](https://render.com/) (Hospedagem remota da API RESTful simulada via JSON Server)

---

## Execução com Docker

O ambiente Docker mantém o front-end e a API JSON Server em contêineres
separados. O Nginx encaminha as requisições de `/api` para a API pela rede
interna do Docker, e o arquivo `db/db.json` é montado no contêiner para que os
dados persistam entre reinicializações.

```bash
docker compose up --build -d
```

A aplicação estará disponível em `http://localhost:8080`.

Para acompanhar os logs ou encerrar o ambiente:

```bash
docker compose logs -f
docker compose down
```

---

## Organização Estrutural do Código

```markdown
├── public/
│   ├── img/               # Recursos visuais (Banner, Logo Circular e Ícones)
│   └── index.html         # Template HTML principal injetado pelo Webpack
├── src/
│   ├── components/        # Componentes reutilizáveis (NavBar, Banner, Mensagem)
│   ├── views/             # Telas principais mapeadas pelas rotas da aplicação
│   ├── router/            # Configurações de navegação SPA (Single Page Application)
│   ├── App.vue            # Componente raiz da aplicação
│   └── main.js            # Inicialização e montagem do ecossistema Vue
├── vue.config.js          # Configurações globais de compilação do Vue CLI
└── package.json           # Dependências e scripts de automação do projeto
```
## Autoria e Contribuição
Desenvolvido por Maria Clara Bertin Vieira Ferreira, Marco Antonio de Melo Peixoto, Heber Americo Macedo, Thaynara Lima Soares Sousa.
