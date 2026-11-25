import { get, post } from "../src/services/api";
import { cadastrar, ehAdmin, login, logout, obterUsuarioAtual } from "../src/services/auth";
import {
  aceitarPedido,
  atualizarPedido,
  criarPedido,
  excluirPedido,
  listarPedidosDoUsuario,
} from "../src/services/pedidos";

// Simula as respostas da API sem precisar de rede.
function respostaDaApi(status, corpo) {
  return {
    ok: status >= 200 && status < 300,
    status,
    text: async () => (corpo === undefined ? "" : JSON.stringify(corpo)),
  };
}

function criarLocalStorageFalso() {
  const dados = new Map();

  return {
    getItem: (chave) => (dados.has(chave) ? dados.get(chave) : null),
    setItem: (chave, valor) => dados.set(chave, String(valor)),
    removeItem: (chave) => dados.delete(chave),
  };
}

const marina = {
  id: 2,
  nome: "Marina Souza",
  email: "marina@teste.com",
  senha: "123456",
  tipo: "usuario",
};

const fetchOriginal = global.fetch;

beforeEach(() => {
  global.fetch = jest.fn();
  global.localStorage = criarLocalStorageFalso();
});

afterAll(() => {
  global.fetch = fetchOriginal;
  delete global.localStorage;
});

describe("Cliente HTTP do front-end (src/services/api.js)", () => {
  test("devolve o JSON da resposta quando a API responde 200", async () => {
    global.fetch.mockResolvedValue(respostaDaApi(200, [{ id: 1, descricao: "Media" }]));

    await expect(get("/tamanhos")).resolves.toEqual([{ id: 1, descricao: "Media" }]);
    expect(global.fetch).toHaveBeenCalledWith(
      "http://localhost:3000/tamanhos",
      expect.objectContaining({ headers: { "Content-Type": "application/json" } })
    );
  });

  test("envia o corpo em JSON no POST", async () => {
    global.fetch.mockResolvedValue(respostaDaApi(201, { id: 9 }));

    await post("/pedidos", { nome: "Marina" });

    expect(global.fetch.mock.calls[0][1]).toMatchObject({
      method: "POST",
      body: JSON.stringify({ nome: "Marina" }),
    });
  });

  test("mostra a mensagem de erro que a API mandou (ex.: validação 400)", async () => {
    global.fetch.mockResolvedValue(respostaDaApi(400, { erro: "Nome do cliente é obrigatório." }));

    await expect(post("/pedidos", {})).rejects.toThrow("Nome do cliente é obrigatório.");
  });

  test("erro sem corpo vira uma mensagem com o código HTTP", async () => {
    global.fetch.mockResolvedValue(respostaDaApi(503));

    await expect(get("/menu")).rejects.toThrow("Erro ao acessar a API. Código: 503");
  });

  test("API fora do ar faz a chamada falhar em vez de travar a tela", async () => {
    global.fetch.mockRejectedValue(new TypeError("Failed to fetch"));

    await expect(get("/menu")).rejects.toThrow("Failed to fetch");
  });
});

describe("Login e cadastro (src/services/auth.js)", () => {
  test("login com e-mail e senha certos guarda o usuário sem a senha", async () => {
    global.fetch.mockResolvedValue(respostaDaApi(200, [marina]));

    const usuario = await login("  Marina@Teste.com ", "123456");

    expect(usuario).not.toHaveProperty("senha");
    expect(obterUsuarioAtual()).toMatchObject({ id: 2, email: "marina@teste.com" });
    expect(global.fetch.mock.calls[0][0]).toContain("email=marina%40teste.com");
  });

  test("login com senha errada é recusado", async () => {
    global.fetch.mockResolvedValue(respostaDaApi(200, [marina]));

    await expect(login("marina@teste.com", "errada")).rejects.toThrow("E-mail ou senha incorretos.");
    expect(obterUsuarioAtual()).toBeNull();
  });

  test("login com e-mail inexistente dá a mesma mensagem (não revela quem tem conta)", async () => {
    global.fetch.mockResolvedValue(respostaDaApi(200, []));

    await expect(login("ninguem@teste.com", "123456")).rejects.toThrow("E-mail ou senha incorretos.");
  });

  test("cadastro com e-mail já usado é bloqueado antes de criar a conta", async () => {
    global.fetch.mockResolvedValue(respostaDaApi(200, [marina]));

    await expect(
      cadastrar({ nome: "Marina", email: "marina@teste.com", senha: "123456" })
    ).rejects.toThrow("Já existe uma conta cadastrada com este e-mail.");
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  test("cadastro novo cria a conta como cliente e já deixa logado", async () => {
    global.fetch
      .mockResolvedValueOnce(respostaDaApi(200, []))
      .mockResolvedValueOnce(respostaDaApi(201, { id: 7, nome: "Ana", email: "ana@teste.com", senha: "123456", tipo: "usuario" }));

    await cadastrar({ nome: " Ana ", email: " ANA@teste.com ", senha: "123456" });

    const corpoEnviado = JSON.parse(global.fetch.mock.calls[1][1].body);

    expect(corpoEnviado).toMatchObject({ nome: "Ana", email: "ana@teste.com", tipo: "usuario" });
    expect(obterUsuarioAtual()).toMatchObject({ id: 7, tipo: "usuario" });
    expect(obterUsuarioAtual()).not.toHaveProperty("senha");
  });

  test("ehAdmin só é verdadeiro para o perfil administrador e logout limpa a sessão", async () => {
    global.fetch.mockResolvedValue(
      respostaDaApi(200, [{ id: 1, email: "admin@tpizza.com", senha: "admin123", tipo: "admin" }])
    );

    await login("admin@tpizza.com", "admin123");
    expect(ehAdmin()).toBe(true);

    logout();
    expect(obterUsuarioAtual()).toBeNull();
    expect(ehAdmin()).toBe(false);
  });
});

describe("Pedidos no front-end (src/services/pedidos.js)", () => {
  test("pedido novo entra como 'Pedido pendente' (status 5) com data de criação", async () => {
    global.fetch.mockResolvedValue(respostaDaApi(201, { id: 10 }));

    await criarPedido({ nome: "Marina", total: 48 });

    const corpo = JSON.parse(global.fetch.mock.calls[0][1].body);

    expect(corpo).toMatchObject({ nome: "Marina", total: 48, statusId: 5 });
    expect(Date.parse(corpo.dataPedido)).not.toBeNaN();
    expect(Date.parse(corpo.atualizadoEm)).not.toBeNaN();
  });

  test("lista só os pedidos do cliente logado", async () => {
    global.fetch.mockResolvedValue(respostaDaApi(200, []));

    await listarPedidosDoUsuario(2);

    expect(global.fetch.mock.calls[0][0]).toBe("http://localhost:3000/pedidos?usuarioId=2");
  });

  test("admin aceita o pedido: status vai para 'Pedido recebido' (1)", async () => {
    global.fetch.mockResolvedValue(respostaDaApi(200, { id: 10, statusId: 1 }));

    await aceitarPedido(10);

    const [url, opcoes] = global.fetch.mock.calls[0];

    expect(url).toBe("http://localhost:3000/pedidos/10");
    expect(opcoes.method).toBe("PATCH");
    expect(JSON.parse(opcoes.body)).toMatchObject({ statusId: 1 });
  });

  test("toda atualização de status registra a hora da mudança", async () => {
    global.fetch.mockResolvedValue(respostaDaApi(200, { id: 10, statusId: 3 }));

    await atualizarPedido(10, { statusId: 3 });

    expect(Date.parse(JSON.parse(global.fetch.mock.calls[0][1].body).atualizadoEm)).not.toBeNaN();
  });

  test("remover pedido chama DELETE na rota do pedido", async () => {
    global.fetch.mockResolvedValue(respostaDaApi(200, {}));

    await excluirPedido(10);

    expect(global.fetch).toHaveBeenCalledWith(
      "http://localhost:3000/pedidos/10",
      expect.objectContaining({ method: "DELETE" })
    );
  });
});
