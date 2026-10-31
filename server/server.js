const fs = require("fs");
const path = require("path");
const jsonServer = require("json-server");

function readDb(dbPath) {
  return JSON.parse(fs.readFileSync(dbPath, "utf8"));
}

function sendJsonError(res, statusCode, message) {
  return res.status(statusCode).json({ erro: message });
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || "").trim());
}

function createApp(options = {}) {
  const dbPath = options.dbPath || path.join(__dirname, "..", "db", "db.json");
  const router = jsonServer.router(dbPath);
  const app = jsonServer.create();

  app.use((req, res, next) => {
    if (process.env.NODE_ENV === "test" && req.get("X-Simulate-Error") === "true") {
      return res.status(500).json({ erro: "Erro interno do servidor" });
    }

    next();
  });

  app.use(jsonServer.defaults());
  app.use(jsonServer.bodyParser);

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
    const { nome, tamanho } = req.body || {};

    if (!String(nome || "").trim()) {
      return sendJsonError(res, 400, "Nome do cliente é obrigatório.");
    }

    if (!tamanho || !String(tamanho.id ?? "").trim()) {
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
      "tamanho",
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

  return app;
}

if (require.main === module) {
  const host = process.env.HOST || "0.0.0.0";
  const port = Number(process.env.PORT || 3000);
  const app = createApp();

  app.listen(port, host, () => {
    console.log(`JSON Server customizado em http://${host}:${port}`);
  });
}

module.exports = { createApp };
