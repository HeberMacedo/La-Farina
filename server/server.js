const fs = require("fs");
const path = require("path");
const jsonServer = require("json-server");

const { criarObservabilidade } = require("./observabilidade");

function readDb(dbPath) {
  return JSON.parse(fs.readFileSync(dbPath, "utf8"));
}

function sendJsonError(res, statusCode, message) {
  // Guarda o motivo para o log e para a métrica de validações rejeitadas.
  res.locals.motivoErro = message;
  return res.status(statusCode).json({ erro: message });
}

// Quantos pedidos existem em cada status (vira o gauge lafarina_pedidos_por_status).
function contarPedidosPorStatus(dbPath) {
  const db = readDb(dbPath);
  const contagem = new Map((db.status_pedido || []).map((status) => [Number(status.id), 0]));
  const nomes = new Map((db.status_pedido || []).map((status) => [Number(status.id), status.descricao]));

  (db.pedidos || []).forEach((pedido) => {
    const id = Number(pedido.statusId);
    contagem.set(id, (contagem.get(id) || 0) + 1);
  });

  return [...contagem.entries()].map(([id, quantidade]) => ({
    rotulos: { status: nomes.get(id) || `status_${id}` },
    valor: quantidade,
  }));
}

function simulacaoDeErroLigada() {
  return process.env.NODE_ENV === "test" || process.env.SIMULAR_ERROS === "true";
}

const MAX_SABORES_POR_PIZZA = 2;

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || "").trim());
}

function createApp(options = {}) {
  const dbPath = options.dbPath || path.join(__dirname, "..", "db", "db.json");
  const router = jsonServer.router(dbPath);
  const app = jsonServer.create();
  const obs = criarObservabilidade({
    logs: options.logs ?? process.env.NODE_ENV !== "test",
    coletarExtras: () => [
      {
        nome: "lafarina_pedidos_por_status",
        ajuda: "Quantidade de pedidos em cada status agora.",
        series: contarPedidosPorStatus(dbPath),
      },
    ],
  });

  // Primeiro middleware: mede tempo, gera o trace id e escreve o log de cada requisição.
  app.use(obs.middleware);

  // Falha simulada para testes e demonstrações (nunca ligada por padrão em produção).
  app.use((req, res, next) => {
    if (simulacaoDeErroLigada() && req.get("X-Simulate-Error") === "true") {
      res.locals.motivoErro = "Erro interno simulado";
      return res.status(500).json({ erro: "Erro interno do servidor" });
    }

    next();
  });

  app.use(jsonServer.defaults({ logger: false }));
  app.use(jsonServer.bodyParser);

  // Health check: diz se a API está de pé e consegue ler o banco.
  app.get("/health", (req, res) => {
    try {
      readDb(dbPath);

      return res.json({
        status: "ok",
        servico: "la-farina-api",
        uptimeSegundos: Math.round(process.uptime()),
        verificadoEm: new Date().toISOString(),
      });
    } catch (error) {
      obs.registrarLog("error", "health_check_falhou", { traceId: req.traceId, mensagem: error.message });
      res.locals.motivoErro = "Banco de dados indisponível.";

      return res.status(503).json({ status: "erro", erro: "Banco de dados indisponível." });
    }
  });

  // Métricas no formato texto do Prometheus.
  app.get("/metrics", (req, res) => {
    res.type("text/plain; version=0.0.4; charset=utf-8").send(obs.textoMetricas());
  });

  app.post("/usuarios", (req, res, next) => {
    const { nome, email, senha } = req.body || {};

    if (!String(nome || "").trim()) {
      return sendJsonError(res, 400, "Nome é obrigatório.");
    }

    if (!String(email || "").trim() || !String(senha || "").trim()) {
      return sendJsonError(res, 400, "E-mail e senha são obrigatórios.");
    }

    if (!isValidEmail(email)) {
      return sendJsonError(res, 400, "E-mail inválido.");
    }

    next();
  });

  app.post("/pedidos", (req, res, next) => {
    const { nome, tamanho, pizzas } = req.body || {};

    if (!String(nome || "").trim()) {
      return sendJsonError(res, 400, "Nome do cliente é obrigatório.");
    }

    const temTamanho = (item) => Boolean(item?.tamanho) && String(item.tamanho.id ?? "").trim() !== "";

    // Pedido com várias pizzas: cada uma precisa de tamanho e no máximo 2 sabores.
    if (pizzas !== undefined) {
      if (!Array.isArray(pizzas) || pizzas.length === 0) {
        return sendJsonError(res, 400, "Adicione ao menos uma pizza ao pedido.");
      }

      if (!pizzas.every(temTamanho)) {
        return sendJsonError(res, 400, "Tamanho da pizza é obrigatório.");
      }

      if (pizzas.some((item) => Array.isArray(item.sabores) && item.sabores.length > MAX_SABORES_POR_PIZZA)) {
        return sendJsonError(res, 400, `Cada pizza pode ter no máximo ${MAX_SABORES_POR_PIZZA} sabores.`);
      }

      return next();
    }

    // Formato antigo: uma pizza só, com o tamanho no topo do pedido.
    if (!temTamanho({ tamanho })) {
      return sendJsonError(res, 400, "Tamanho da pizza é obrigatório.");
    }

    next();
  });

  app.patch("/pedidos/:id", (req, res, next) => {
    if (!req.body || typeof req.body !== "object" || !Object.keys(req.body).length) {
      return sendJsonError(res, 400, "Dados inválidos para atualização.");
    }

    const validKeys = [
      "statusId",
      "atualizadoEm",
      "observacao",
      "total",
      "taxaEntrega",
      "nome",
      "pizza",
      "pizzas",
      "tamanho",
      "sabores",
      "borda",
      "bebidas",
      "usuarioId",
      "dataPedido",
    ];

    const invalidKeys = Object.keys(req.body).filter((key) => !validKeys.includes(key));

    if (invalidKeys.length > 0) {
      return sendJsonError(res, 400, "Dados inválidos para atualização.");
    }

    if (
      Object.prototype.hasOwnProperty.call(req.body, "statusId") &&
      (req.body.statusId === undefined || req.body.statusId === null || Number.isNaN(Number(req.body.statusId)))
    ) {
      return sendJsonError(res, 400, "Dados inválidos para atualização.");
    }

    next();
  });

  app.get("/pedidos/:id", (req, res, next) => {
    const pedidoId = Number(req.params.id);
    const db = readDb(dbPath);
    const pedido = (db.pedidos || []).find((item) => Number(item.id) === pedidoId);

    if (!pedido) {
      return sendJsonError(res, 404, "Pedido não encontrado.");
    }

    next();
  });

  app.use(router);

  // Erros não tratados: registra no log com o trace id e responde sem stack trace.
  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, next) => {
    const status = Number(err.status || err.statusCode) || 500;

    if (status < 500) {
      const mensagem = err.type === "entity.parse.failed" ? "JSON inválido na requisição." : "Requisição inválida.";

      return sendJsonError(res, status, mensagem);
    }

    obs.registrarLog("error", "erro_nao_tratado", {
      traceId: req.traceId,
      caminho: String(req.originalUrl || "").split("?")[0],
      mensagem: err.message,
      stack: err.stack,
    });

    if (res.headersSent) {
      return next(err);
    }

    return sendJsonError(res, 500, "Erro interno do servidor");
  });

  return app;
}

if (require.main === module) {
  const host = process.env.HOST || "0.0.0.0";
  const port = Number(process.env.PORT || 3000);
  const app = createApp();

  app.listen(port, host, () => {
    console.log(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        nivel: "info",
        servico: "la-farina-api",
        evento: "api_iniciada",
        endereco: `http://${host}:${port}`,
      })
    );
  });
}

module.exports = { createApp };
