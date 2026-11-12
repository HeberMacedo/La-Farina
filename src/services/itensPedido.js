// Regras compartilhadas para pedidos com várias pizzas.
// Cada pizza do pedido tem: pizza (item do cardápio), tamanho, sabores (1 ou 2) e borda.

export const MAX_SABORES_POR_PIZZA = 2;

// Devolve a lista de pizzas do pedido. Pedidos antigos (uma pizza só, com
// pizza/tamanho/sabores/borda no topo do objeto) viram uma lista de 1 item.
export function pizzasDoPedido(pedido) {
  if (Array.isArray(pedido?.pizzas) && pedido.pizzas.length > 0) {
    return pedido.pizzas;
  }

  if (pedido?.pizza || pedido?.tamanho) {
    return [
      {
        pizza: pedido.pizza || null,
        tamanho: pedido.tamanho || null,
        sabores: pedido.sabores || [],
        borda: pedido.borda || null,
      },
    ];
  }

  return [];
}

export function valorPizza(item) {
  return (
    Number(item?.tamanho?.valor || item?.pizza?.valor || 0) +
    Number(item?.borda?.valor || 0)
  );
}

export function subtotalPizzas(pizzas) {
  return (pizzas || []).reduce((soma, item) => soma + valorPizza(item), 0);
}

export function totalBebidas(bebidas) {
  return (bebidas || []).reduce(
    (soma, bebida) => soma + Number(bebida?.valor || 0),
    0
  );
}

export function descricaoSabores(item) {
  const nomes = (item?.sabores || []).map((sabor) => sabor.nome).filter(Boolean);

  if (nomes.length === 0) {
    return item?.pizza?.nome || "Sabor não informado";
  }

  return nomes.join(" / ");
}

// Retorna a mensagem de erro da pizza ou "" quando ela está válida.
export function validarPizza(item) {
  if (!item?.tamanho) {
    return "Escolha o tamanho da pizza.";
  }

  const quantidadeSabores = (item.sabores || []).length;

  if (quantidadeSabores === 0) {
    return "Escolha pelo menos 1 sabor para a pizza.";
  }

  if (quantidadeSabores > MAX_SABORES_POR_PIZZA) {
    return `Escolha no máximo ${MAX_SABORES_POR_PIZZA} sabores por pizza.`;
  }

  return "";
}
