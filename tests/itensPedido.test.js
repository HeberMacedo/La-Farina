import {
  descricaoSabores,
  pizzasDoPedido,
  subtotalPizzas,
  totalBebidas,
  validarPizza,
  valorPizza,
} from "../src/services/itensPedido";

const calabresa = { id: 1, nome: "Calabresa Artesanal" };
const quatroQueijos = { id: 2, nome: "Quatro Queijos" };
const frango = { id: 3, nome: "Frango com Catupiry" };
const familia = { id: 4, descricao: "Familia - 12 fatias", valor: 65 };
const media = { id: 2, descricao: "Media - 6 fatias", valor: 40 };
const bordaCatupiry = { id: 1, nome: "Borda de Catupiry", valor: 8 };

describe("Pedido com várias pizzas", () => {
  test("pedido novo devolve a lista de pizzas", () => {
    const pedido = {
      pizzas: [
        { tamanho: familia, sabores: [calabresa, quatroQueijos], borda: bordaCatupiry },
        { tamanho: media, sabores: [frango], borda: null },
      ],
    };

    expect(pizzasDoPedido(pedido)).toHaveLength(2);
  });

  test("pedido antigo (uma pizza no topo) vira lista com 1 pizza", () => {
    const pedido = {
      pizza: { id: 1, nome: "Pizza Meio-a-Meio" },
      tamanho: media,
      sabores: [calabresa],
      borda: bordaCatupiry,
    };

    const pizzas = pizzasDoPedido(pedido);

    expect(pizzas).toHaveLength(1);
    expect(pizzas[0].tamanho).toBe(media);
    expect(pizzas[0].sabores).toEqual([calabresa]);
  });

  test("pedido sem pizza devolve lista vazia", () => {
    expect(pizzasDoPedido({})).toEqual([]);
    expect(pizzasDoPedido(null)).toEqual([]);
  });

  test("valor da pizza soma tamanho e borda", () => {
    expect(valorPizza({ tamanho: familia, borda: bordaCatupiry })).toBe(73);
    expect(valorPizza({ tamanho: media, borda: null })).toBe(40);
  });

  test("subtotal soma todas as pizzas e bebidas separadamente", () => {
    const pizzas = [
      { tamanho: familia, borda: bordaCatupiry },
      { tamanho: media, borda: null },
    ];

    expect(subtotalPizzas(pizzas)).toBe(113);
    expect(totalBebidas([{ valor: 12 }, { valor: 5 }])).toBe(17);
  });

  test("descreve os sabores da pizza meio a meio", () => {
    expect(descricaoSabores({ sabores: [calabresa, quatroQueijos] })).toBe(
      "Calabresa Artesanal / Quatro Queijos"
    );
  });
});

describe("Validação de cada pizza", () => {
  test("aceita 1 ou 2 sabores com tamanho", () => {
    expect(validarPizza({ tamanho: media, sabores: [calabresa] })).toBe("");
    expect(validarPizza({ tamanho: media, sabores: [calabresa, frango] })).toBe("");
  });

  test("exige tamanho", () => {
    expect(validarPizza({ sabores: [calabresa] })).toBe("Escolha o tamanho da pizza.");
  });

  test("exige pelo menos 1 sabor", () => {
    expect(validarPizza({ tamanho: media, sabores: [] })).toBe(
      "Escolha pelo menos 1 sabor para a pizza."
    );
  });

  test("bloqueia mais de 2 sabores", () => {
    expect(
      validarPizza({ tamanho: media, sabores: [calabresa, quatroQueijos, frango] })
    ).toBe("Escolha no máximo 2 sabores por pizza.");
  });
});
