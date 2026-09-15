import {
  get,
  post,
  patch,
  remove,
} from "./api";

export async function listarPedidos() {
  return get("/pedidos");
}

export async function listarPedidosDoUsuario(usuarioId) {
  return get(
    `/pedidos?usuarioId=${encodeURIComponent(usuarioId)}`
  );
}

export async function buscarPedido(id) {
  return get(`/pedidos/${id}`);
}

export async function criarPedido(pedido) {
  return post("/pedidos", {
    ...pedido,
    statusId: pedido.statusId || 5,
    dataPedido:
      pedido.dataPedido || new Date().toISOString(),
    atualizadoEm: new Date().toISOString(),
  });
}

export async function atualizarPedido(id, dados) {
  return patch(`/pedidos/${id}`, {
    ...dados,
    atualizadoEm: new Date().toISOString(),
  });
}

export async function aceitarPedido(id) {
  return atualizarPedido(id, {
    statusId: 1,
  });
}

export async function excluirPedido(id) {
  return remove(`/pedidos/${id}`);
}

export async function listarStatusPedido() {
  return get("/status_pedido");
}