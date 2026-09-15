<template>
  <div class="page">
    <div class="container">
      <div class="header">
        <div>
          <span class="eyebrow">MINHA CONTA</span>
          <h1>Meus pedidos</h1>

          <p>
            Acompanhe os pedidos realizados na T-Pizza.
          </p>
        </div>

        <router-link
          to="/menu"
          class="new-order"
        >
          Fazer novo pedido
        </router-link>
      </div>

      <div
        v-if="carregando"
        class="state-card"
      >
        Carregando seus pedidos...
      </div>

      <div
        v-else-if="erro"
        class="state-card error"
      >
        {{ erro }}

        <button @click="carregar">
          Tentar novamente
        </button>
      </div>

      <div
        v-else-if="pedidos.length === 0"
        class="empty"
      >
        <div class="empty-icon">
          🍕
        </div>

        <h2>Você ainda não fez nenhum pedido</h2>

        <p>
          Escolha sua pizza favorita no cardápio.
        </p>

        <router-link to="/menu">
          Ver cardápio
        </router-link>
      </div>

      <div
        v-else
        class="orders"
      >
        <article
          v-for="pedido in pedidosOrdenados"
          :key="pedido.id"
          class="order-card"
        >
          <div class="order-top">
            <div>
              <small>
                PEDIDO
              </small>

              <h2>
                #{{ pedido.id }}
              </h2>
            </div>

            <span
              class="status"
              :class="statusClass(pedido.statusId)"
            >
              {{ descricaoStatus(pedido.statusId) }}
            </span>
          </div>

          <div class="order-content">
            <div
              v-if="pedido.pizza"
              class="pizza"
            >
              <img
                v-if="pedido.pizza.foto"
                :src="pedido.pizza.foto"
                :alt="pedido.pizza.nome"
              />

              <div>
                <h3>
                  {{ pedido.pizza.nome }}
                </h3>

                <p v-if="pedido.tamanho">
                  {{ pedido.tamanho.descricao }}
                </p>
              </div>
            </div>

            <div
              v-if="
                pedido.sabores &&
                pedido.sabores.length
              "
              class="detail"
            >
              <strong>Sabores</strong>

              <span>
                {{
                  pedido.sabores
                    .map((sabor) => sabor.nome)
                    .join(", ")
                }}
              </span>
            </div>

            <div
              v-if="pedido.borda"
              class="detail"
            >
              <strong>Borda</strong>
              <span>{{ pedido.borda.nome }}</span>
            </div>

            <div
              v-if="
                pedido.bebidas &&
                pedido.bebidas.length
              "
              class="detail"
            >
              <strong>Bebidas</strong>

              <span>
                {{
                  pedido.bebidas
                    .map((bebida) => bebida.nome)
                    .join(", ")
                }}
              </span>
            </div>

            <div
              v-if="pedido.observacao"
              class="detail"
            >
              <strong>Observação</strong>
              <span>{{ pedido.observacao }}</span>
            </div>
          </div>

          <div class="order-footer">
            <div>
              <small>Realizado em</small>

              <strong>
                {{ formatarData(pedido.dataPedido) }}
              </strong>
            </div>

            <div class="total">
              <small>Total</small>

              <strong>
                {{ formatarMoeda(totalPedido(pedido)) }}
              </strong>
            </div>
          </div>
        </article>
      </div>
    </div>
  </div>
</template>

<script>
import {
  listarPedidosDoUsuario,
  listarStatusPedido,
} from "@/services/pedidos";

import {
  obterUsuarioAtual,
} from "@/services/auth";

export default {
  name: "MeusPedidosView",

  data() {
    return {
      usuario: null,
      pedidos: [],
      status: [],
      carregando: true,
      erro: "",
    };
  },

  computed: {
    pedidosOrdenados() {
      return [...this.pedidos].sort(
        (a, b) => Number(b.id) - Number(a.id)
      );
    },
  },

  async mounted() {
    this.usuario = obterUsuarioAtual();

    await this.carregar();
  },

  methods: {
    async carregar() {
      this.erro = "";
      this.carregando = true;

      try {
        if (!this.usuario) {
          await this.$router.push("/login");
          return;
        }

        const [pedidos, status] =
          await Promise.all([
            listarPedidosDoUsuario(
              this.usuario.id
            ),
            listarStatusPedido(),
          ]);

        this.pedidos = pedidos || [];
        this.status = status || [];
      } catch (error) {
        this.erro =
          error.message ||
          "Não foi possível carregar seus pedidos.";
      } finally {
        this.carregando = false;
      }
    },

    descricaoStatus(statusId) {
      const encontrado = this.status.find(
        (item) =>
          Number(item.id) === Number(statusId)
      );

      return encontrado
        ? encontrado.descricao
        : "Status desconhecido";
    },

    statusClass(statusId) {
      const id = Number(statusId);

      if (id === 1) return "accepted";
      if (id === 2) return "preparing";
      if (id === 3) return "delivery";
      if (id === 4 || id === 6)
        return "finished";
      if (id === 7) return "cancelled";

      return "pending";
    },

    formatarMoeda(valor) {
      return Number(valor || 0).toLocaleString(
        "pt-BR",
        {
          style: "currency",
          currency: "BRL",
        }
      );
    },

    totalPedido(pedido) {
      if (
        pedido.total !== undefined &&
        pedido.total !== null
      ) {
        return Number(pedido.total);
      }

      let total = Number(
        pedido.pizza?.valor || 0
      );

      total += Number(
        pedido.borda?.valor || 0
      );

      if (pedido.bebidas) {
        total += pedido.bebidas.reduce(
          (soma, item) =>
            soma + Number(item.valor || 0),
          0
        );
      }

      return total;
    },

    formatarData(data) {
      if (!data) {
        return "Data não informada";
      }

      const valor = new Date(data);

      if (Number.isNaN(valor.getTime())) {
        return data;
      }

      return valor.toLocaleString("pt-BR");
    },
  },
};
</script>

<style scoped>
.page {
  min-height: calc(100vh - 78px);
  padding: 55px 20px 80px;
  background: #f7f4f2;
  text-align: left;
}

.container {
  width: min(1100px, 100%);
  margin: auto;
}

.header {
  margin-bottom: 35px;
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 25px;
}

.eyebrow {
  color: #db4826;
  font-size: 11px;
  font-weight: 900;
  letter-spacing: 2px;
}

.header h1 {
  margin: 7px 0 8px;
  font-size: 38px;
  color: #241612;
}

.header p {
  margin: 0;
  color: #786a65;
}

.new-order,
.empty a {
  display: inline-flex;
  min-height: 47px;
  padding: 0 20px;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  background: #e84b29;
  color: white;
  font-weight: 800;
  font-size: 14px;
}

.orders {
  display: grid;
  gap: 20px;
}

.order-card {
  overflow: hidden;
  border: 1px solid #e7ded9;
  border-radius: 20px;
  background: white;
  box-shadow: 0 12px 35px rgba(55, 27, 17, 0.06);
}

.order-top {
  padding: 22px 25px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid #eee6e2;
}

.order-top small,
.order-footer small {
  display: block;
  color: #9b8c86;
  font-size: 10px;
  letter-spacing: 1.4px;
  font-weight: 800;
}

.order-top h2 {
  margin: 3px 0 0;
  color: #291914;
}

.status {
  padding: 8px 12px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 900;
}

.pending {
  background: #fff1c9;
  color: #956600;
}

.accepted {
  background: #dff8e8;
  color: #24783f;
}

.preparing {
  background: #ffe4cf;
  color: #a64e16;
}

.delivery {
  background: #e2ecff;
  color: #315faa;
}

.finished {
  background: #e2f5eb;
  color: #216944;
}

.cancelled {
  background: #ffe0dd;
  color: #a2382d;
}

.order-content {
  padding: 25px;
}

.pizza {
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  gap: 17px;
}

.pizza img {
  width: 88px;
  height: 88px;
  object-fit: cover;
  border-radius: 14px;
}

.pizza h3 {
  margin: 0 0 5px;
  color: #241612;
}

.pizza p {
  margin: 0;
  color: #887872;
}

.detail {
  padding: 10px 0;
  display: grid;
  grid-template-columns: 130px 1fr;
  gap: 20px;
  border-top: 1px solid #f1ebe8;
  font-size: 14px;
}

.detail strong {
  color: #46342e;
}

.detail span {
  color: #81716b;
}

.order-footer {
  padding: 18px 25px;
  display: flex;
  justify-content: space-between;
  gap: 20px;
  background: #faf7f5;
}

.order-footer strong {
  display: block;
  margin-top: 4px;
  color: #33211b;
}

.total {
  text-align: right;
}

.total strong {
  color: #d64322;
  font-size: 20px;
}

.state-card,
.empty {
  padding: 50px 30px;
  border: 1px solid #e8dfda;
  border-radius: 20px;
  background: white;
  text-align: center;
}

.state-card button {
  margin-left: 10px;
  padding: 8px 12px;
}

.error {
  color: #b33c29;
}

.empty-icon {
  font-size: 50px;
}

.empty h2 {
  margin-bottom: 8px;
  color: #2c1b16;
}

.empty p {
  margin-bottom: 24px;
  color: #887872;
}

@media (max-width: 650px) {
  .header {
    align-items: stretch;
    flex-direction: column;
  }

  .header h1 {
    font-size: 31px;
  }

  .new-order {
    width: 100%;
  }

  .detail {
    grid-template-columns: 1fr;
    gap: 4px;
  }

  .order-footer {
    flex-direction: column;
  }

  .total {
    text-align: left;
  }
}
</style>