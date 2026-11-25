// Observabilidade da API do La Farina.
//
// Este módulo junta os três sinais clássicos de observabilidade:
//   - LOGS: uma linha JSON por evento. Com LOG_ARQUIVO definido, a linha também
//     vai para um arquivo que o Logstash lê e manda para o Elasticsearch/Kibana;
//   - MÉTRICAS: contadores e histogramas no formato texto do Prometheus (/metrics);
//   - TRACES: um trace id por requisição. Com o OpenTelemetry ligado (telemetria.js)
//     é o id do trace que vai para o Jaeger; sem ele, um id no mesmo formato
//     (W3C traceparent). Ele volta no header X-Request-Id e vai em todo log.
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

const { traceIdAtual } = require("./telemetria");

// Faixas (em segundos) do histograma de latência. O Prometheus usa essas faixas
// para calcular percentis, como o p95 ("95% das requisições levaram até X").
const LIMITES_LATENCIA_SEGUNDOS = [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5];

// Recursos que a API conhece. Qualquer outro caminho vira "outras" para não
// criar uma série nova no Prometheus a cada URL diferente (alta cardinalidade).
const RECURSOS_CONHECIDOS = new Set([
  "menu",
  "tamanhos",
  "opcionais",
  "status_pedido",
  "usuarios",
  "pedidos",
  "health",
  "metrics",
]);

// Rotas chamadas o tempo todo por ferramentas (Prometheus, health check do Docker).
// Elas entram nas métricas, mas só geram log quando dão erro.
const ROTAS_SEM_LOG = new Set(["/metrics", "/health"]);

const TRACEPARENT = /^[\da-f]{2}-([\da-f]{32})-[\da-f]{16}-[\da-f]{2}$/i;
const ID_SEGURO = /^[\w-]{1,64}$/;

// "/pedidos/15?x=1" -> "/pedidos/:id". O id vai para o log, nunca para a métrica.
function normalizarRota(caminho) {
  const [semQuery] = String(caminho || "/").split("?");
  const partes = semQuery.split("/").filter(Boolean);

  if (partes.length === 0) {
    return "/";
  }

  if (!RECURSOS_CONHECIDOS.has(partes[0]) || partes.length > 2) {
    return "outras";
  }

  return partes.length === 1 ? `/${partes[0]}` : `/${partes[0]}/:id`;
}

// "Nome do cliente é obrigatório." -> "nome_do_cliente_e_obrigatorio"
function paraCodigo(texto) {
  return String(texto || "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

// Reaproveita o trace id de quem chamou (traceparent ou X-Request-Id), para que
// a mesma operação possa ser seguida entre front-end e API. Sem isso, gera um.
function obterTraceId(req) {
  const traceparent = TRACEPARENT.exec(String(req.get("traceparent") || "").trim());

  if (traceparent) {
    return traceparent[1].toLowerCase();
  }

  const recebido = String(req.get("X-Request-Id") || "").trim();

  if (ID_SEGURO.test(recebido)) {
    return recebido;
  }

  return crypto.randomBytes(16).toString("hex");
}

function escaparRotulo(valor) {
  return String(valor).replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\n/g, "\\n");
}

function formatarRotulos(rotulos) {
  const pares = Object.entries(rotulos).map(([chave, valor]) => `${chave}="${escaparRotulo(valor)}"`);

  return pares.length ? `{${pares.join(",")}}` : "";
}

function criarContador() {
  const series = new Map();

  return {
    inc(rotulos = {}, valor = 1) {
      const chave = JSON.stringify(rotulos);
      const serie = series.get(chave) || { rotulos, valor: 0 };

      serie.valor += valor;
      series.set(chave, serie);
    },
    series: () => [...series.values()],
  };
}

function criarHistograma(limites) {
  const series = new Map();

  return {
    observar(rotulos, valor) {
      const chave = JSON.stringify(rotulos);
      const serie = series.get(chave) || {
        rotulos,
        faixas: limites.map(() => 0),
        soma: 0,
        contagem: 0,
      };

      limites.forEach((limite, indice) => {
        if (valor <= limite) {
          serie.faixas[indice] += 1;
        }
      });

      serie.soma += valor;
      serie.contagem += 1;
      series.set(chave, serie);
    },
    series: () => [...series.values()],
  };
}

// Prepara a escrita do log em arquivo (para o Logstash). Devolve null se não der.
function criarArquivoDeLog(arquivo) {
  if (!arquivo) {
    return null;
  }

  try {
    fs.mkdirSync(path.dirname(arquivo), { recursive: true });

    return (linha) => {
      try {
        fs.appendFileSync(arquivo, `${linha}\n`);
      } catch {
        // Disco cheio ou sem permissão: o log no console continua funcionando.
      }
    };
  } catch {
    return null;
  }
}

function criarObservabilidade({
  servico = "la-farina-api",
  logs = true,
  arquivoLog = process.env.LOG_ARQUIVO,
  coletarExtras,
} = {}) {
  const escreverNoArquivo = logs ? criarArquivoDeLog(arquivoLog) : null;
  const requisicoes = criarContador();
  const latencia = criarHistograma(LIMITES_LATENCIA_SEGUNDOS);
  const pedidosCriados = criarContador();
  const valorPedidos = criarContador();
  const rejeicoes = criarContador();

  // Contadores sem rótulo começam em 0 para aparecerem no /metrics desde o início.
  pedidosCriados.inc({}, 0);
  valorPedidos.inc({}, 0);

  function registrarLog(nivel, evento, dados = {}) {
    if (!logs) {
      return;
    }

    const linha = JSON.stringify({
      timestamp: new Date().toISOString(),
      nivel,
      servico,
      evento,
      ...dados,
    });

    if (nivel === "error") {
      console.error(linha);
    } else {
      console.log(linha);
    }

    if (escreverNoArquivo) {
      escreverNoArquivo(linha);
    }
  }

  function middleware(req, res, next) {
    const inicio = process.hrtime.bigint();
    // Com o OpenTelemetry ligado, usa o id do trace que vai para o Jaeger.
    const traceId = traceIdAtual() || obterTraceId(req);

    req.traceId = traceId;
    res.setHeader("X-Request-Id", traceId);
    res.setHeader("Access-Control-Expose-Headers", "X-Request-Id");

    res.on("finish", () => {
      const duracaoSegundos = Number(process.hrtime.bigint() - inicio) / 1e9;
      const metodo = req.method;
      const rota = normalizarRota(req.originalUrl);
      const status = res.statusCode;
      const erro = res.locals.motivoErro;

      requisicoes.inc({ method: metodo, route: rota, status: String(status) });
      latencia.observar({ method: metodo, route: rota }, duracaoSegundos);

      if (status === 400 && erro) {
        rejeicoes.inc({ route: rota, motivo: paraCodigo(erro) });
      }

      if (metodo === "POST" && rota === "/pedidos" && status === 201) {
        const total = Number(req.body?.total) || 0;
        const pizzas = Array.isArray(req.body?.pizzas) ? req.body.pizzas.length : 1;

        pedidosCriados.inc();
        valorPedidos.inc({}, total);
        registrarLog("info", "pedido_criado", { traceId, total, quantidadePizzas: pizzas });
      }

      if (ROTAS_SEM_LOG.has(rota) && status < 400) {
        return;
      }

      let nivel = "info";

      if (status >= 500) {
        nivel = "error";
      } else if (status >= 400) {
        nivel = "warn";
      }

      // A query string fica de fora do log: ela pode ter e-mail do cliente.
      registrarLog(nivel, "http_request", {
        traceId,
        metodo,
        rota,
        caminho: String(req.originalUrl || "").split("?")[0],
        status,
        duracaoMs: Math.round(duracaoSegundos * 10000) / 10,
        ...(erro ? { erro } : {}),
      });
    });

    next();
  }

  function textoMetricas() {
    const linhas = [];

    const escreverContador = (nome, ajuda, contador) => {
      linhas.push(`# HELP ${nome} ${ajuda}`, `# TYPE ${nome} counter`);
      contador.series().forEach((serie) => {
        linhas.push(`${nome}${formatarRotulos(serie.rotulos)} ${serie.valor}`);
      });
    };

    const escreverGauge = (nome, ajuda, series) => {
      linhas.push(`# HELP ${nome} ${ajuda}`, `# TYPE ${nome} gauge`);
      series.forEach((serie) => {
        linhas.push(`${nome}${formatarRotulos(serie.rotulos || {})} ${serie.valor}`);
      });
    };

    escreverContador(
      "lafarina_http_requests_total",
      "Total de requisições HTTP atendidas pela API, por método, rota e status.",
      requisicoes
    );

    const histograma = "lafarina_http_request_duration_seconds";

    linhas.push(
      `# HELP ${histograma} Tempo de resposta da API em segundos, por método e rota.`,
      `# TYPE ${histograma} histogram`
    );
    latencia.series().forEach((serie) => {
      LIMITES_LATENCIA_SEGUNDOS.forEach((limite, indice) => {
        linhas.push(
          `${histograma}_bucket${formatarRotulos({ ...serie.rotulos, le: String(limite) })} ${serie.faixas[indice]}`
        );
      });
      linhas.push(
        `${histograma}_bucket${formatarRotulos({ ...serie.rotulos, le: "+Inf" })} ${serie.contagem}`,
        `${histograma}_sum${formatarRotulos(serie.rotulos)} ${serie.soma}`,
        `${histograma}_count${formatarRotulos(serie.rotulos)} ${serie.contagem}`
      );
    });

    escreverContador(
      "lafarina_pedidos_criados_total",
      "Pedidos criados com sucesso desde que a API subiu.",
      pedidosCriados
    );
    escreverContador(
      "lafarina_pedidos_valor_reais_total",
      "Soma do valor (R$) dos pedidos criados desde que a API subiu.",
      valorPedidos
    );
    escreverContador(
      "lafarina_validacoes_rejeitadas_total",
      "Requisições recusadas pela validação (400), por rota e motivo.",
      rejeicoes
    );

    if (typeof coletarExtras === "function") {
      try {
        (coletarExtras() || []).forEach((metrica) => {
          escreverGauge(metrica.nome, metrica.ajuda, metrica.series);
        });
      } catch (error) {
        registrarLog("error", "coleta_metricas_falhou", { mensagem: error.message });
      }
    }

    escreverGauge("process_uptime_seconds", "Tempo em segundos desde que a API subiu.", [
      { valor: Math.round(process.uptime()) },
    ]);
    escreverGauge("process_resident_memory_bytes", "Memória RAM usada pelo processo da API.", [
      { valor: process.memoryUsage().rss },
    ]);

    return `${linhas.join("\n")}\n`;
  }

  return { middleware, registrarLog, textoMetricas };
}

module.exports = {
  criarObservabilidade,
  normalizarRota,
  obterTraceId,
  paraCodigo,
};
