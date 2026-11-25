// Rastreamento (traces) da API com OpenTelemetry.
//
// Cada requisição vira um "trace": uma linha do tempo com o tempo de cada etapa
// dentro da API (receber a requisição, validar, gravar no banco, responder).
// Os traces vão por OTLP para o Jaeger, onde dá para abrir um pedido e ver
// onde o tempo foi gasto. O mesmo trace id aparece no header X-Request-Id e em
// todo log, então dá para sair de um log no Kibana e cair no trace no Jaeger.
//
// Liga só quando OTEL_EXPORTER_OTLP_ENDPOINT está definido (ex.: http://jaeger:4318).
// Sem essa variável (testes, Render) nada do OpenTelemetry é carregado e as
// funções abaixo não fazem nada.
const NOME_TRACER = "la-farina-api";

// Rotas chamadas o tempo todo por ferramentas: não viram trace, só poluiriam o Jaeger.
const ROTAS_IGNORADAS = ["/metrics", "/health"];

let api = null;
let provedor = null;

// "/pedidos/15?x=1" -> "/pedidos/:id", para o nome do span ficar "GET /pedidos/:id".
function rotaDoSpan(url) {
  const caminho = String(url || "/").split("?")[0];

  return caminho.replace(/\/\d+(?=\/|$)/g, "/:id");
}

function telemetriaAtiva() {
  return provedor !== null;
}

function iniciarTelemetria(opcoes = {}) {
  if (provedor) {
    return true;
  }

  const endpoint = opcoes.endpoint ?? process.env.OTEL_EXPORTER_OTLP_ENDPOINT;
  const servico = opcoes.servico || process.env.OTEL_SERVICE_NAME || "la-farina-api";

  if (!endpoint && !opcoes.exportador) {
    return false;
  }

  try {
    api = require("@opentelemetry/api");
    const { TracerProvider, BatchSpanProcessor, SimpleSpanProcessor } = require("@opentelemetry/sdk-trace");
    const { AsyncLocalStorageContextManager } = require("@opentelemetry/context-async-hooks");
    const { W3CTraceContextPropagator } = require("@opentelemetry/core");
    const { resourceFromAttributes } = require("@opentelemetry/resources");

    // Em teste o exportador vem de fora (em memória) e o envio é imediato.
    const processador = opcoes.exportador
      ? new SimpleSpanProcessor({ exporter: opcoes.exportador })
      : new BatchSpanProcessor({
          scheduledDelayMillis: 2000,
          exporter: new (require("@opentelemetry/exporter-trace-otlp-http").OTLPTraceExporter)({
            url: `${String(endpoint).replace(/\/$/, "")}/v1/traces`,
          }),
        });

    provedor = new TracerProvider({
      resource: resourceFromAttributes({
        "service.name": servico,
        "deployment.environment.name": process.env.NODE_ENV || "desenvolvimento",
      }),
      spanProcessors: [processador],
    });

    api.context.setGlobalContextManager(new AsyncLocalStorageContextManager().enable());
    api.propagation.setGlobalPropagator(new W3CTraceContextPropagator());
    api.trace.setGlobalTracerProvider(provedor);

    // Instrumentação automática: cria os spans do HTTP e do Express sozinha.
    // Precisa ser registrada antes de o json-server (Express) ser carregado.
    if (opcoes.instrumentar !== false) {
      const { registerInstrumentations } = require("@opentelemetry/instrumentation");
      const { HttpInstrumentation } = require("@opentelemetry/instrumentation-http");
      const { ExpressInstrumentation, ExpressLayerType } = require("@opentelemetry/instrumentation-express");

      registerInstrumentations({
        tracerProvider: provedor,
        instrumentations: [
          new HttpInstrumentation({
            ignoreIncomingRequestHook: (req) => ROTAS_IGNORADAS.includes(String(req.url || "").split("?")[0]),
            ignoreOutgoingRequestHook: () => true,
            requestHook: (span, req) => {
              if (req.method) {
                span.updateName(`${req.method} ${rotaDoSpan(req.url)}`);
              }
            },
          }),
          // Sem um span para cada middleware do json-server (cors, compressão...):
          // o trace mostra só rota, validação e gravação.
          new ExpressInstrumentation({ ignoreLayersType: [ExpressLayerType.MIDDLEWARE] }),
        ],
      });
    }

    // Garante que os últimos traces sejam enviados quando o container para.
    if (!opcoes.exportador) {
      process.once("SIGTERM", () => {
        provedor.shutdown().finally(() => process.exit(0));
      });
    }

    return true;
  } catch (erro) {
    provedor = null;
    api = null;
    console.error(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        nivel: "error",
        servico,
        evento: "telemetria_nao_iniciada",
        mensagem: erro.message,
      })
    );

    return false;
  }
}

function spanAtual() {
  return api ? api.trace.getActiveSpan() : undefined;
}

// Trace id do OpenTelemetry da requisição atual (ou null se a telemetria está desligada).
function traceIdAtual() {
  const span = spanAtual();
  const traceId = span?.spanContext().traceId;

  return traceId && traceId !== "00000000000000000000000000000000" ? traceId : null;
}

// Acrescenta atributos ao span atual (ex.: valor do pedido, motivo da recusa).
function anotar(atributos = {}) {
  const span = spanAtual();

  if (span) {
    span.setAttributes(atributos);
  }
}

// Marca um acontecimento no span atual (aparece como "log" do span no Jaeger).
function registrarEvento(nome, atributos = {}) {
  const span = spanAtual();

  if (span) {
    span.addEvent(nome, atributos);
  }
}

// Executa fn dentro de um span próprio (ex.: "validar_pedido").
function executarComSpan(nome, atributos, fn) {
  if (!api) {
    return fn();
  }

  return api.trace.getTracer(NOME_TRACER).startActiveSpan(nome, { attributes: atributos }, (span) => {
    try {
      return fn();
    } catch (erro) {
      span.recordException(erro);
      span.setStatus({ code: api.SpanStatusCode.ERROR, message: erro.message });
      throw erro;
    } finally {
      span.end();
    }
  });
}

module.exports = {
  rotaDoSpan,
  iniciarTelemetria,
  telemetriaAtiva,
  traceIdAtual,
  anotar,
  registrarEvento,
  executarComSpan,
};
