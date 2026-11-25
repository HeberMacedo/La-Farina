const fs = require("fs");
const os = require("os");
const path = require("path");
const request = require("supertest");
const { InMemorySpanExporter } = require("@opentelemetry/sdk-trace");

const telemetria = require("../server/telemetria");
const { criarObservabilidade } = require("../server/observabilidade");

process.env.NODE_ENV = "test";

const PEDIDO_VALIDO = {
  usuarioId: 2,
  nome: "Marina",
  pizzas: [
    {
      pizza: { id: 1, nome: "Pizza Meio-a-Meio" },
      tamanho: { id: 2, descricao: "Media - 6 fatias", valor: 40 },
      sabores: [{ id: 1, nome: "Calabresa Artesanal" }],
      valor: 40,
    },
  ],
  statusId: 5,
  taxaEntrega: 8,
  total: 48,
};

function copiarBanco() {
  const pasta = fs.mkdtempSync(path.join(os.tmpdir(), "lafarina-otel-"));
  const destino = path.join(pasta, "db.json");

  fs.copyFileSync(path.join(__dirname, "..", "db", "db.json"), destino);

  return destino;
}

const nomesDosSpans = (exportador) => exportador.getFinishedSpans().map((span) => span.name);

describe("Telemetria desligada (sem OTEL_EXPORTER_OTLP_ENDPOINT)", () => {
  test("OTEL-01: não liga sem endpoint e as funções não fazem nada", () => {
    expect(telemetria.iniciarTelemetria({ endpoint: "" })).toBe(false);
    expect(telemetria.telemetriaAtiva()).toBe(false);
    expect(telemetria.traceIdAtual()).toBeNull();
    expect(() => telemetria.anotar({ a: 1 })).not.toThrow();
    expect(() => telemetria.registrarEvento("teste")).not.toThrow();
    expect(telemetria.executarComSpan("teste", {}, () => 42)).toBe(42);
  });

  test("OTEL-07: nome do span usa a rota sem ids nem query string", () => {
    expect(telemetria.rotaDoSpan("/pedidos/15?usuarioId=2")).toBe("/pedidos/:id");
    expect(telemetria.rotaDoSpan("/pedidos")).toBe("/pedidos");
    expect(telemetria.rotaDoSpan("/usuarios/7/pedidos/3")).toBe("/usuarios/:id/pedidos/:id");
    expect(telemetria.rotaDoSpan(undefined)).toBe("/");
  });
});

describe("Telemetria ligada (OpenTelemetry com exportador em memória)", () => {
  const exportador = new InMemorySpanExporter();

  beforeAll(() => {
    expect(telemetria.iniciarTelemetria({ exportador, instrumentar: false })).toBe(true);
  });

  beforeEach(() => exportador.reset());

  test("OTEL-02: iniciar de novo não cria outro provedor", () => {
    expect(telemetria.iniciarTelemetria({ exportador: new InMemorySpanExporter() })).toBe(true);
    expect(telemetria.telemetriaAtiva()).toBe(true);
  });

  test("OTEL-03: executarComSpan cria um span com atributos e expõe o trace id", () => {
    let traceIdDentro;

    const resultado = telemetria.executarComSpan("calcular_frete", { "lafarina.subtotal": 80 }, () => {
      traceIdDentro = telemetria.traceIdAtual();
      telemetria.anotar({ "lafarina.frete": 8 });
      telemetria.registrarEvento("frete_cobrado", { valor: 8 });

      return "ok";
    });

    const [span] = exportador.getFinishedSpans();

    expect(resultado).toBe("ok");
    expect(span.name).toBe("calcular_frete");
    expect(traceIdDentro).toBe(span.spanContext().traceId);
    expect(traceIdDentro).toMatch(/^[\da-f]{32}$/);
    expect(span.attributes).toMatchObject({ "lafarina.subtotal": 80, "lafarina.frete": 8 });
    expect(span.events.map((evento) => evento.name)).toEqual(["frete_cobrado"]);
  });

  test("OTEL-04: erro dentro do span é registrado e relançado", () => {
    expect(() =>
      telemetria.executarComSpan("etapa_com_falha", {}, () => {
        throw new Error("banco fora do ar");
      })
    ).toThrow("banco fora do ar");

    const [span] = exportador.getFinishedSpans();

    expect(span.status.code).toBe(2); // SpanStatusCode.ERROR
    expect(span.events[0].name).toBe("exception");
  });

  test("OTEL-05: pedido válido gera os spans de validar e gravar, no mesmo trace do X-Request-Id", async () => {
    const { createApp } = require("../server/server");
    const app = createApp({ dbPath: copiarBanco() });

    const resposta = await telemetria.executarComSpan("teste_http", {}, () =>
      request(app).post("/pedidos").send(PEDIDO_VALIDO)
    );

    expect(resposta.status).toBe(201);
    expect(nomesDosSpans(exportador)).toEqual(
      expect.arrayContaining(["validar_pedido", "gravar_pedido_no_banco"])
    );

    const validar = exportador.getFinishedSpans().find((span) => span.name === "validar_pedido");

    expect(resposta.headers["x-request-id"]).toBe(validar.spanContext().traceId);
  });

  test("OTEL-06: pedido recusado marca o motivo como evento no trace", async () => {
    const { createApp } = require("../server/server");
    const app = createApp({ dbPath: copiarBanco() });

    // Span aberto durante toda a requisição, como o span HTTP do servidor em produção.
    const tracer = require("@opentelemetry/api").trace.getTracer("teste");
    const resposta = await tracer.startActiveSpan("teste_http", async (span) => {
      const r = await request(app).post("/pedidos").send({ ...PEDIDO_VALIDO, nome: "" });

      span.end();

      return r;
    });

    expect(resposta.status).toBe(400);

    const raiz = exportador.getFinishedSpans().find((span) => span.name === "teste_http");
    const eventos = raiz.events.filter((evento) => evento.name === "requisicao_recusada");

    expect(nomesDosSpans(exportador)).not.toContain("gravar_pedido_no_banco");
    expect(eventos).toHaveLength(1);
    expect(eventos[0].attributes.motivo).toBe("Nome do cliente é obrigatório.");
  });
});

describe("Log em arquivo (entrada do Logstash / ELK)", () => {
  afterEach(() => jest.restoreAllMocks());

  test("OBS-ARQ-01: com arquivo definido, cada log vira uma linha JSON no arquivo", () => {
    jest.spyOn(console, "log").mockImplementation(() => {});
    const arquivo = path.join(fs.mkdtempSync(path.join(os.tmpdir(), "lafarina-log-")), "logs", "api.log");
    const obs = criarObservabilidade({ logs: true, arquivoLog: arquivo });

    obs.registrarLog("info", "pedido_criado", { traceId: "abc", total: 48 });
    obs.registrarLog("warn", "http_request", { status: 400 });

    const linhas = fs.readFileSync(arquivo, "utf8").trim().split("\n").map((linha) => JSON.parse(linha));

    expect(linhas).toHaveLength(2);
    expect(linhas[0]).toMatchObject({ nivel: "info", evento: "pedido_criado", traceId: "abc", total: 48 });
    expect(linhas[1]).toMatchObject({ nivel: "warn", status: 400 });
  });

  test("OBS-ARQ-02: arquivo impossível de criar não derruba a API", () => {
    jest.spyOn(console, "log").mockImplementation(() => {});
    const pasta = fs.mkdtempSync(path.join(os.tmpdir(), "lafarina-log-"));
    const arquivoComum = path.join(pasta, "sou-um-arquivo");

    fs.writeFileSync(arquivoComum, "");

    const obs = criarObservabilidade({ logs: true, arquivoLog: path.join(arquivoComum, "api.log") });

    expect(() => obs.registrarLog("info", "teste")).not.toThrow();
  });

  test("OBS-ARQ-03: com logs desligados, nada é escrito no arquivo", () => {
    const arquivo = path.join(fs.mkdtempSync(path.join(os.tmpdir(), "lafarina-log-")), "api.log");
    const obs = criarObservabilidade({ logs: false, arquivoLog: arquivo });

    obs.registrarLog("info", "teste");

    expect(fs.existsSync(arquivo)).toBe(false);
  });
});
