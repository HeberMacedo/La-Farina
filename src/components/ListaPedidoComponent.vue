<template>
  <div class="pedidos-page">
    <alerta-component-vue :tipo="alerta.tipo" :mensagem="alerta.mensagem" />

    <div id="pedidos-tabela">
      <div id="pedidos-tabela-cabecalho">
        <div>#ID</div>
        <div>Cliente</div>
        <div>Pizza</div>
        <div>Tamanho</div>
        <div>Sabores e itens</div>
        <div>Status</div>
        <div>Acoes</div>
      </div>

      <div
        class="pedidos-tabela-linha"
        v-for="pedido in listaPedidosRealizados"
        :key="pedido.id"
      >
        <div class="pedido-id">{{ pedido.id }}</div>
        <div class="pedido-cliente">{{ pedido.nome }}</div>
        <div>{{ pedido.pizza?.nome || "-" }}</div>
        <div>{{ pedido.tamanho?.descricao || "-" }}</div>
        <div class="pedido-itens">
          <p class="grupo-titulo">Sabores</p>
          <div class="etiquetas">
            <span v-for="(sabor, index) in pedido.sabores" :key="index">
              {{ sabor.nome }}
            </span>
          </div>

          <div v-if="pedido.borda">
            <p class="grupo-titulo">Borda</p>
            <div class="etiquetas">
              <span>{{ pedido.borda.nome }}</span>
            </div>
          </div>

          <div v-if="pedido.bebidas?.length">
            <p class="grupo-titulo">Bebidas</p>
            <div class="etiquetas">
              <span v-for="(bebida, index) in pedido.bebidas" :key="index">
                {{ bebida.nome }}
              </span>
            </div>
          </div>
        </div>
        <div>
          <select
            @change="atualizarStatusPedido($event, pedido.id)"
            name="status"
            class="status"
          >
            <option value="">Selecione</option>
            <option
              v-for="status in listaStatusPedido"
              :key="status.id"
              :value="status.id"
              :selected="status.id == pedido.statusId"
            >
              {{ status.descricao }}
            </option>
          </select>
        </div>
        <div>
          <button class="botao-excluir" @click="deletarPedido(pedido.id)">
            X
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import AlertaComponentVue from "@/components/AlertaComponent.vue";

export default {
  name: "ListaPedidoComponent",
  components: {
    AlertaComponentVue,
  },
  data() {
    return {
      listaPedidosRealizados: [],
      listaStatusPedido: [],
      alerta: {
        tipo: "info",
        mensagem: "Acompanhe os pedidos cadastrados e atualize o status da producao.",
      },
    };
  },
  methods: {
    exibirAlerta(tipo, mensagem) {
      this.alerta = { tipo, mensagem };
    },
    async consultarPedidos() {
      const response = await fetch(`${this.$apiUrl}/pedidos`);
      this.listaPedidosRealizados = await response.json();
    },
    async consultarStatusPedido() {
      const response = await fetch(`${this.$apiUrl}/status_pedido`);
      this.listaStatusPedido = await response.json();
    },
    async atualizarStatusPedido(event, idPedido) {
      const idPedidoAtualizado = event.target.value;

      if (!idPedidoAtualizado) {
        this.exibirAlerta("aviso", "Selecione um status valido para atualizar o pedido.");
        return;
      }

      const atualizacaoJson = JSON.stringify({ statusId: Number(idPedidoAtualizado) });
      const response = await fetch(`${this.$apiUrl}/pedidos/${idPedido}`, {
        method: "PATCH",
        headers: { "Content-type": "application/json" },
        body: atualizacaoJson,
      });

      if (response.ok) {
        this.exibirAlerta("sucesso", "Status do pedido atualizado com sucesso.");
        await this.consultarPedidos();
      } else {
        this.exibirAlerta("erro", "Nao foi possivel atualizar o status do pedido.");
      }
    },
    async deletarPedido(idPedido) {
      const response = await fetch(`${this.$apiUrl}/pedidos/${idPedido}`, {
        method: "DELETE",
      });

      if (response.ok) {
        this.listaPedidosRealizados = this.listaPedidosRealizados.filter(
          (pedido) => pedido.id !== idPedido
        );
        this.exibirAlerta("sucesso", "Pedido excluido com sucesso.");
      } else {
        this.exibirAlerta("erro", "Nao foi possivel excluir o pedido.");
      }
    },
  },
  mounted() {
    this.consultarPedidos();
    this.consultarStatusPedido();
  },
};
</script>

<style scoped>
.pedidos-page {
  width: min(1180px, calc(100% - 32px));
  margin: 0 auto 56px;
}

#pedidos-tabela {
  width: 100%;
  margin: 28px auto 0;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  overflow: hidden;
  background: white;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.08);
}

#pedidos-tabela-cabecalho,
.pedidos-tabela-linha {
  display: grid;
  grid-template-columns: 60px 1fr 1.5fr 1.2fr 2fr 170px 80px;
  gap: 16px;
  align-items: start;
}

#pedidos-tabela-cabecalho {
  font-weight: bold;
  padding: 14px 18px;
  color: #7f1d1d;
  background: #fff7ed;
  border-bottom: 1px solid #fed7aa;
  text-align: left;
}

.pedidos-tabela-linha {
  padding: 18px;
  border-bottom: 1px solid #e5e7eb;
  text-align: left;
}

.pedidos-tabela-linha:last-child {
  border-bottom: none;
}

.pedido-id,
.pedido-cliente {
  font-weight: bold;
}

.grupo-titulo {
  margin: 0 0 8px;
  font-weight: bold;
  color: #222;
}

.etiquetas {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 12px;
}

.etiquetas span {
  display: inline-flex;
  padding: 5px 8px;
  border-radius: 8px;
  color: #7f1d1d;
  background: #ffedd5;
  font-size: 13px;
  font-weight: bold;
}

.status {
  width: 100%;
  min-height: 42px;
  border: 1px solid #bbb;
  border-radius: 8px;
  padding: 8px;
  background: white;
}

.botao-excluir {
  width: 36px;
  height: 36px;
  border: none;
  border-radius: 8px;
  background: #dc2626;
  color: white;
  font-weight: bold;
  cursor: pointer;
}

.botao-excluir:hover {
  background: #7f1d1d;
}

@media (max-width: 900px) {
  #pedidos-tabela-cabecalho {
    display: none;
  }

  .pedidos-tabela-linha {
    grid-template-columns: 1fr;
    gap: 10px;
  }
}
</style>
