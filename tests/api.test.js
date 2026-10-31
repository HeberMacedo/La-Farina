const fs = require("fs");
const os = require("os");
const path = require("path");
const request = require("supertest");

const { createApp } = require("../server/server");

process.env.NODE_ENV = "test";

function buildTempDb() {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "lafarina-api-"));
  const sourceDb = path.join(__dirname, "..", "db", "db.json");
  const tempDbPath = path.join(tempDir, "db.json");

  fs.copyFileSync(sourceDb, tempDbPath);

  return { tempDir, tempDbPath };
}

describe("API La Farina", () => {
  let tempDir;
  let tempDbPath;
  let app;

  beforeEach(() => {
    const tmp = buildTempDb();
    tempDir = tmp.tempDir;
    tempDbPath = tmp.tempDbPath;

    const db = JSON.parse(fs.readFileSync(tempDbPath, "utf8"));
    db.pedidos = [
      {
        id: 1,
        usuarioId: 2,
        nome: "Marina",
        pizza: { id: 1, nome: "Pizza Meio-a-Meio" },
        tamanho: { id: 2, descricao: "Media - 6 fatias", valor: 40 },
        borda: { id: 1, nome: "Borda de Catupiry", valor: 8 },
        bebidas: [{ id: 1, nome: "Refrigerante Cola 2L", valor: 12 }],
        statusId: 5,
        taxaEntrega: 8,
        total: 60,
        observacao: "Sem cebola",
        dataPedido: "2026-10-31T12:00:00.000Z",
        atualizadoEm: "2026-10-31T12:00:00.000Z",
      },
    ];

    fs.writeFileSync(tempDbPath, JSON.stringify(db, null, 2));
    app = createApp({ dbPath: tempDbPath });
  });

  afterEach(() => {
    if (tempDir) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  test("GET /menu retorna 200 com cardápio", async () => {
    const res = await request(app).get("/menu");

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("pizzas");
    expect(Array.isArray(res.body.pizzas)).toBe(true);
    expect(res.body.pizzas[0]).toHaveProperty("nome");
  });

  test("GET /tamanhos retorna 200", async () => {
    const res = await request(app).get("/tamanhos");

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body[0]).toHaveProperty("descricao");
  });

  test("GET /opcionais retorna 200", async () => {
    const res = await request(app).get("/opcionais");

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("bordas");
    expect(res.body).toHaveProperty("bebidas");
    expect(res.body).toHaveProperty("sabores");
  });

  test("GET /status_pedido retorna 200", async () => {
    const res = await request(app).get("/status_pedido");

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body[0]).toHaveProperty("descricao");
  });

  test("GET /usuarios?email=... retorna 200", async () => {
    const res = await request(app).get("/usuarios?email=marina%40teste.com");

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body[0]).toHaveProperty("email", "marina@teste.com");
  });

  test("POST /usuarios cria usuário com 201", async () => {
    const payload = {
      nome: "Ana",
      email: "ana@teste.com",
      senha: "123456",
      tipo: "usuario",
      criadoEm: "2026-10-31T12:00:00.000Z",
    };

    const res = await request(app).post("/usuarios").send(payload);

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({
      nome: "Ana",
      email: "ana@teste.com",
      tipo: "usuario",
    });
    expect(res.body).toHaveProperty("id");
  });

  test("GET /pedidos retorna 200", async () => {
    const res = await request(app).get("/pedidos");

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  test("GET /pedidos?usuarioId=... retorna 200", async () => {
    const res = await request(app).get("/pedidos?usuarioId=2");

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  test("GET /pedidos/:id retorna 200 para pedido existente", async () => {
    const res = await request(app).get("/pedidos/1");

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("id", 1);
    expect(res.body).toHaveProperty("nome");
  });

  test("POST /pedidos cria pedido com 201", async () => {
    const payload = {
      usuarioId: 2,
      nome: "Marina",
      pizza: { id: 1, nome: "Pizza Meio-a-Meio" },
      tamanho: { id: 2, descricao: "Media - 6 fatias", valor: 40 },
      borda: { id: 1, nome: "Borda de Catupiry", valor: 8 },
      bebidas: [{ id: 1, nome: "Refrigerante Cola 2L", valor: 12 }],
      statusId: 5,
      taxaEntrega: 8,
      total: 60,
      observacao: "Sem cebola",
      dataPedido: "2026-10-31T12:00:00.000Z",
      atualizadoEm: "2026-10-31T12:00:00.000Z",
    };

    const res = await request(app).post("/pedidos").send(payload);

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({
      nome: "Marina",
      statusId: 5,
      total: 60,
    });
    expect(res.body).toHaveProperty("id");
  });

  test("PATCH /pedidos/:id atualiza status com 200", async () => {
    const payload = {
      statusId: 2,
      atualizadoEm: "2026-10-31T12:05:00.000Z",
    };

    const res = await request(app).patch("/pedidos/1").send(payload);

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      id: 1,
      statusId: 2,
    });
  });

  test("DELETE /pedidos/:id remove pedido com 200", async () => {
    const res = await request(app).delete("/pedidos/1");

    expect(res.status).toBe(200);
    expect([{}, { id: 1 }]).toContainEqual(res.body);
  });

  test("POST /pedidos sem nome retorna 400", async () => {
    const res = await request(app).post("/pedidos").send({
      pizza: { id: 1 },
      tamanho: { id: 2 },
      statusId: 5,
    });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ erro: "Nome do cliente é obrigatório." });
  });

  test("POST /pedidos sem tamanho retorna 400", async () => {
    const res = await request(app).post("/pedidos").send({
      nome: "Marina",
      pizza: { id: 1 },
      statusId: 5,
    });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ erro: "Tamanho da pizza é obrigatório." });
  });

  test("POST /usuarios sem email/senha retorna 400", async () => {
    const res = await request(app).post("/usuarios").send({ nome: "Ana" });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ erro: "E-mail e senha são obrigatórios." });
  });

  test("POST /usuarios com email inválido retorna 400", async () => {
    const res = await request(app).post("/usuarios").send({
      nome: "Ana",
      email: "ana",
      senha: "123456",
    });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ erro: "E-mail inválido." });
  });

  test("PATCH /pedidos/:id com body inválido retorna 400", async () => {
    const res = await request(app).patch("/pedidos/1").send({});

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ erro: "Dados inválidos para atualização." });
  });

  test("GET /pedidos/:id inexistente retorna 404", async () => {
    const res = await request(app).get("/pedidos/99999");

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ erro: "Pedido não encontrado." });
  });

  test("500 é retornado quando header X-Simulate-Error=true em ambiente de teste", async () => {
    const res = await request(app).get("/menu").set("X-Simulate-Error", "true");

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ erro: "Erro interno do servidor" });
  });
});
