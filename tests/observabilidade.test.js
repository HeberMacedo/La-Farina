const fs = require("fs");
const os = require("os");
const path = require("path");
const request = require("supertest");

const { createApp } = require("../server/server");
const { normalizarRota, paraCodigo } = require("../server/observabilidade");

process.env.NODE_ENV = "test";

const PEDIDO_VALIDO = {
  usuarioId: 2,
  nome: "Marina",
  pizzas: [
    {
      pizza: { id: 1, nome: "Pizza Meio-a-Meio" },
      tamanho: { id: 2, descricao: "Media - 6 fatias", valor: 40 },
      sabores: [{ id: 1, nome: "Calabresa Artesanal" }],
      borda: { id: 1, nome: "Borda de Catupiry", valor: 8 },
      valor: 48,
    },
  ],
  bebidas: [{ id: 1, nome: "Refrigerante Cola 2L", valor: 12 }],
  statusId: 5,
  taxaEntrega: 8,
  total: 68,
};

function criarBancoTemporario() {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "lafarina-obs-"));
  const tempDbPath = path.join(tempDir, "db.json");
  const db = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "db", "db.json"), "utf8"));

  db.pedidos = [
    { id: 1, nome: "Marina", statusId: 2, total: 40 },
    { id: 2, nome: "Heber", statusId: 2, total: 50 },
    { id: 3, nome: "Ana", statusId: 4, total: 30 },
  ];
  fs.writeFileSync(tempDbPath, JSON.stringify(db, null, 2));

  return { tempDir, tempDbPath };
}

describe("Observabilidade da API", () => {
  let tempDir;
  let tempDbPath;
  let app;

  beforeEach(() => {
    ({ tempDir, tempDbPath } = criarBancoTemporario());
    app = createApp({ dbPath: tempDbPath });
  });

  afterEach(() => {
    jest.restoreAllMocks();
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  describe("Health check", () => {
    test("GET /health responde 200 quando a API consegue ler o banco", async () => {
      const res = await request(app).get("/health");

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({ status: "ok", servico: "la-farina-api" });
      expect(typeof res.body.uptimeSegundos).toBe("number");
    });

    test("GET /health responde 503 quando o banco some", async () => {
      fs.rmSync(tempDbPath);

      const res = await request(app).get("/health");

      expect(res.status).toBe(503);
      expect(res.body).toEqual({ status: "erro", erro: "Banco de dados indisponível." });
    });
  });

  describe("Trace id (rastreamento)", () => {
    test("toda resposta traz um X-Request-Id no formato de trace do OpenTelemetry", async () => {
      const res = await request(app).get("/menu");

      expect(res.headers["x-request-id"]).toMatch(/^[\da-f]{32}$/);
    });

    test("reaproveita o X-Request-Id enviado pelo cliente", async () => {
      const res = await request(app).get("/menu").set("X-Request-Id", "pedido-demo-123");

      expect(res.headers["x-request-id"]).toBe("pedido-demo-123");
    });

    test("reaproveita o trace id de um header traceparent (W3C)", async () => {
      const traceId = "4bf92f3577b34da6a3ce929d0e0e4736";
      const res = await request(app)
        .get("/menu")
        .set("traceparent", `00-${traceId}-00f067aa0ba902b7-01`);

      expect(res.headers["x-request-id"]).toBe(traceId);
    });
  });

  describe("Métricas no formato do Prometheus", () => {
    test("GET /metrics responde texto com as métricas da API", async () => {
      const res = await request(app).get("/metrics");

      expect(res.status).toBe(200);
      expect(res.headers["content-type"]).toMatch(/text\/plain/);
      expect(res.text).toContain("# TYPE lafarina_http_requests_total counter");
      expect(res.text).toContain("# TYPE lafarina_http_request_duration_seconds histogram");
      expect(res.text).toContain("lafarina_pedidos_criados_total 0");
    });

    test("conta requisições por método, rota e status", async () => {
      await request(app).get("/menu");
      await request(app).get("/menu");

      const res = await request(app).get("/metrics");

      expect(res.text).toContain('lafarina_http_requests_total{method="GET",route="/menu",status="200"} 2');
      expect(res.text).toContain('lafarina_http_request_duration_seconds_count{method="GET",route="/menu"} 2');
    });

    test("agrupa rotas com id para não criar uma série por pedido", async () => {
      await request(app).get("/pedidos/1");
      await request(app).get("/pedidos/2");

      const res = await request(app).get("/metrics");

      expect(res.text).toContain('lafarina_http_requests_total{method="GET",route="/pedidos/:id",status="200"} 2');
      expect(res.text).not.toContain('route="/pedidos/1"');
    });

    test("conta pedidos criados e soma o valor vendido", async () => {
      await request(app).post("/pedidos").send(PEDIDO_VALIDO);
      await request(app).post("/pedidos").send({ ...PEDIDO_VALIDO, total: 40 });

      const res = await request(app).get("/metrics");

      expect(res.text).toContain("lafarina_pedidos_criados_total 2");
      expect(res.text).toContain("lafarina_pedidos_valor_reais_total 108");
    });

    test("conta validações rejeitadas pelo motivo", async () => {
      await request(app).post("/pedidos").send({ pizzas: PEDIDO_VALIDO.pizzas });

      const res = await request(app).get("/metrics");

      expect(res.text).toContain(
        'lafarina_validacoes_rejeitadas_total{route="/pedidos",motivo="nome_do_cliente_e_obrigatorio"} 1'
      );
      expect(res.text).toContain("lafarina_pedidos_criados_total 0");
    });

    test("conta erros 500 para alimentar o alerta de taxa de erro", async () => {
      await request(app).get("/menu").set("X-Simulate-Error", "true");

      const res = await request(app).get("/metrics");

      expect(res.text).toContain('lafarina_http_requests_total{method="GET",route="/menu",status="500"} 1');
    });

    test("mostra quantos pedidos há em cada status", async () => {
      const res = await request(app).get("/metrics");

      expect(res.text).toContain('lafarina_pedidos_por_status{status="Em preparo"} 2');
      expect(res.text).toContain('lafarina_pedidos_por_status{status="Entregue"} 1');
      expect(res.text).toContain('lafarina_pedidos_por_status{status="Pedido recebido"} 0');
    });
  });

  describe("Logs estruturados", () => {
    function capturarLogs() {
      const linhas = [];
      const guardar = (linha) => linhas.push(JSON.parse(linha));

      jest.spyOn(console, "log").mockImplementation(guardar);
      jest.spyOn(console, "error").mockImplementation(guardar);

      return linhas;
    }

    test("cada requisição gera uma linha JSON com trace id, rota, status e duração", async () => {
      const linhas = capturarLogs();
      const appComLogs = createApp({ dbPath: tempDbPath, logs: true });

      const res = await request(appComLogs).get("/pedidos/1");
      const log = linhas.find((linha) => linha.evento === "http_request");

      expect(log).toMatchObject({
        nivel: "info",
        servico: "la-farina-api",
        traceId: res.headers["x-request-id"],
        metodo: "GET",
        rota: "/pedidos/:id",
        caminho: "/pedidos/1",
        status: 200,
      });
      expect(typeof log.duracaoMs).toBe("number");
      expect(typeof log.timestamp).toBe("string");
    });

    test("erro de validação vira log de aviso com o motivo", async () => {
      const linhas = capturarLogs();
      const appComLogs = createApp({ dbPath: tempDbPath, logs: true });

      await request(appComLogs).post("/pedidos").send({ nome: "Marina", pizzas: [] });

      expect(linhas).toContainEqual(
        expect.objectContaining({
          nivel: "warn",
          evento: "http_request",
          status: 400,
          erro: "Adicione ao menos uma pizza ao pedido.",
        })
      );
    });

    test("pedido criado gera um evento de negócio no log", async () => {
      const linhas = capturarLogs();
      const appComLogs = createApp({ dbPath: tempDbPath, logs: true });

      await request(appComLogs).post("/pedidos").send(PEDIDO_VALIDO);

      expect(linhas).toContainEqual(
        expect.objectContaining({ evento: "pedido_criado", total: 68, quantidadePizzas: 1 })
      );
    });

    test("o log não guarda a query string (pode conter e-mail do cliente)", async () => {
      const linhas = capturarLogs();
      const appComLogs = createApp({ dbPath: tempDbPath, logs: true });

      await request(appComLogs).get("/usuarios?email=marina%40teste.com");

      expect(JSON.stringify(linhas)).not.toContain("marina");
    });

    test("/metrics e /health não poluem o log quando estão ok", async () => {
      const linhas = capturarLogs();
      const appComLogs = createApp({ dbPath: tempDbPath, logs: true });

      await request(appComLogs).get("/metrics");
      await request(appComLogs).get("/health");

      expect(linhas).toHaveLength(0);
    });
  });

  describe("Tratamento de erros", () => {
    test("JSON malformado responde 400 sem expor stack trace", async () => {
      const res = await request(app)
        .post("/pedidos")
        .set("Content-Type", "application/json")
        .send('{"nome": "Marina", ');

      expect(res.status).toBe(400);
      expect(res.body).toEqual({ erro: "JSON inválido na requisição." });
    });

    test("falha simulada fica desligada fora do ambiente de teste", async () => {
      process.env.NODE_ENV = "production";

      try {
        const res = await request(app).get("/menu").set("X-Simulate-Error", "true");

        expect(res.status).toBe(200);
      } finally {
        process.env.NODE_ENV = "test";
      }
    });
  });
});

describe("Funções de apoio da observabilidade", () => {
  test("normalizarRota troca ids por :id e ignora a query string", () => {
    expect(normalizarRota("/pedidos/15?x=1")).toBe("/pedidos/:id");
    expect(normalizarRota("/pedidos?usuarioId=2")).toBe("/pedidos");
    expect(normalizarRota("/")).toBe("/");
  });

  test("normalizarRota junta caminhos desconhecidos em 'outras'", () => {
    expect(normalizarRota("/wp-admin/login.php")).toBe("outras");
    expect(normalizarRota("/pedidos/1/itens")).toBe("outras");
  });

  test("paraCodigo transforma a mensagem de erro em um código sem acento", () => {
    expect(paraCodigo("Nome do cliente é obrigatório.")).toBe("nome_do_cliente_e_obrigatorio");
  });
});
