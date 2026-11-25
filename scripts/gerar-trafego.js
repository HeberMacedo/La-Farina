// Gera tráfego na API para a demonstração de observabilidade.
//
// Uso:
//   npm run demo:trafego                       -> 60 s de tráfego normal
//   npm run demo:trafego -- --segundos=120     -> tempo diferente
//   npm run demo:trafego -- --erros            -> inclui falhas 500 simuladas
//                                                (a API precisa de SIMULAR_ERROS=true)
//
// Variável API_URL muda o endereço (padrão http://localhost:3000).
const API_URL = (process.env.API_URL || "http://localhost:3000").replace(/\/$/, "");

const argumentos = process.argv.slice(2);
const segundos = Number((argumentos.find((arg) => arg.startsWith("--segundos=")) || "").split("=")[1]) || 60;
const comErros = argumentos.includes("--erros");

const TAMANHOS = [
  { id: 1, descricao: "Pequena - 4 fatias", valor: 30 },
  { id: 2, descricao: "Media - 6 fatias", valor: 40 },
  { id: 3, descricao: "Grande - 8 fatias", valor: 50 },
  { id: 4, descricao: "Familia - 12 fatias", valor: 65 },
];

const sortear = (lista) => lista[Math.floor(Math.random() * lista.length)];
const esperar = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function pedidoValido() {
  const tamanho = sortear(TAMANHOS);
  const subtotal = tamanho.valor;
  const taxaEntrega = subtotal > 80 ? 0 : 8;

  return {
    nome: "Cliente Demo",
    pizzas: [{ pizza: { id: 1, nome: "Pizza Meio-a-Meio" }, tamanho, sabores: [{ id: 1 }], borda: null, valor: subtotal }],
    bebidas: [],
    statusId: 5,
    taxaEntrega,
    total: subtotal + taxaEntrega,
    dataPedido: new Date().toISOString(),
    atualizadoEm: new Date().toISOString(),
  };
}

// Cada ação tem um peso: quanto maior, mais vezes ela acontece.
const ACOES = [
  { peso: 30, nome: "GET /menu", executar: () => chamar("GET", "/menu") },
  { peso: 15, nome: "GET /tamanhos", executar: () => chamar("GET", "/tamanhos") },
  { peso: 15, nome: "GET /opcionais", executar: () => chamar("GET", "/opcionais") },
  { peso: 15, nome: "GET /pedidos", executar: () => chamar("GET", "/pedidos") },
  { peso: 5, nome: "GET /pedidos/999 (404)", executar: () => chamar("GET", "/pedidos/999") },
  { peso: 8, nome: "POST /pedidos", executar: () => chamar("POST", "/pedidos", pedidoValido()) },
  { peso: 4, nome: "POST /pedidos sem nome (400)", executar: () => chamar("POST", "/pedidos", { pizzas: [] }) },
  {
    peso: 3,
    nome: "POST /pedidos com 3 sabores (400)",
    executar: () =>
      chamar("POST", "/pedidos", {
        nome: "Cliente Demo",
        pizzas: [{ tamanho: TAMANHOS[1], sabores: [{ id: 1 }, { id: 2 }, { id: 3 }] }],
      }),
  },
  ...(comErros
    ? [{ peso: 10, nome: "GET /menu com falha (500)", executar: () => chamar("GET", "/menu", undefined, { "X-Simulate-Error": "true" }) }]
    : []),
];

const pesoTotal = ACOES.reduce((soma, acao) => soma + acao.peso, 0);

function sortearAcao() {
  let sorteio = Math.random() * pesoTotal;

  return ACOES.find((acao) => (sorteio -= acao.peso) < 0) || ACOES[0];
}

async function chamar(metodo, rota, corpo, headers = {}) {
  const resposta = await fetch(`${API_URL}${rota}`, {
    method: metodo,
    headers: { "Content-Type": "application/json", ...headers },
    body: corpo ? JSON.stringify(corpo) : undefined,
  });

  await resposta.text();

  return resposta.status;
}

async function main() {
  console.log(`Gerando tráfego em ${API_URL} por ${segundos}s${comErros ? " (com falhas 500)" : ""}...`);

  const fim = Date.now() + segundos * 1000;
  const porStatus = {};
  let falhasDeRede = 0;

  while (Date.now() < fim) {
    const acao = sortearAcao();

    try {
      const status = await acao.executar();
      porStatus[status] = (porStatus[status] || 0) + 1;
    } catch (error) {
      falhasDeRede += 1;
    }

    await esperar(100 + Math.random() * 200);
  }

  console.log("Respostas por status HTTP:", porStatus);

  if (falhasDeRede) {
    console.log(`Falhas de rede (API fora do ar?): ${falhasDeRede}`);
  }
}

main();
