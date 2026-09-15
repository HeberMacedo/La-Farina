<template>
  <div class="admin-page">
    <div class="container">
      <div class="admin-header">
        <div>
          <span class="eyebrow">
            ADMINISTRAÇÃO
          </span>

          <h1>Gerenciar pedidos</h1>

          <p>
            Aceite, atualize ou exclua os pedidos
            realizados pelos clientes.
          </p>
        </div>

        <button
          class="refresh"
          @click="carregar"
          :disabled="carregando"
        >
          Atualizar
        </button>
      </div>

      <div class="metrics">
        <div class="metric">
          <span>Total</span>
          <strong>{{ pedidos.length }}</strong>
        </div>

        <div class="metric">
          <span>Pendentes</span>
          <strong>{{ totalPendentes }}</strong>
        </div>

        <div class="metric">
          <span>Em preparo</span>
          <strong>{{ totalPreparo }}</strong>
        </div>

        <div class="metric">
          <span>Finalizados</span>
          <strong>{{ totalFinalizados }}</strong>
        </div>
      </div>

      <div
        v-if="mensagem"
        class="message success"
      >
        {{ mensagem }}
      </div>

      <div
        v-if="erro"
        class="message error"
      >
        {{ erro }}
      </div>

      <div
        v-if="carregando"
        class="loading"
      >
        Carregando pedidos...
      </div>

      <div
        v-else-if="pedidos.length === 0"
        class="loading"
      >
        Nenhum pedido foi encontrado.
      </div>

      <div
        v-else
        class="orders"
      >
        <article
          v-for="pedido in pedidosOrdenados"
          :key="pedido.id"
          class="order"
        >
          <div class="order-header">
            <div>
              <small>
                PEDIDO #{{ pedido.id }}
              </small>

              <h2>
                {{ pedido.nome || "Cliente" }}
              </h2>

              <p>
                {{ formatarData(pedido.dataPedido) }}
              </p>
            </div>

            <span
              class="badge"
              :class="statusClass(pedido.statusId)"
            >
              {{ descricaoStatus(pedido.statusId) }}
            </span>
          </div>

          <div class="content">
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

            <div class="info-grid">
              <div>
                <small>Sabores</small>

                <strong>
                  {{
                    pedido.sabores?.length
                      ? pedido.sabores
                          .map((s) => s.nome)
                          .join(", ")
                      : "Não informado"
                  }}
                </strong>
              </div>

              <div>
                <small>Borda</small>

                <strong>
                  {{
                    pedido.borda?.nome ||
                    "Sem borda"
                  }}
                </strong>
              </div>

              <div>
                <small>Bebidas</small>

                <strong>
                  {{
                    pedido.bebidas?.length
                      ? pedido.bebidas
                          .map((b) => b.nome)
                          .join(", ")
                      : "Nenhuma"
                  }}
                </strong>
              </div>

              <div>
                <small>Total</small>

                <strong class="price">
                  {{
                    formatarMoeda(
                      totalPedido(pedido)
                    )
                  }}
                </strong>
              </div>
            </div>

            <div class="edit-area">
              <div class="form-field">
                <label>Status do pedido</label>

                <select
                  v-model.number="
                    edicoes[pedido.id].statusId
                  "
                >
                  <option
                    v-for="item in status"
                    :key="item.id"
                    :value="Number(item.id)"
                  >
                    {{ item.descricao }}
                  </option>
                </select>
              </div>

              <div class="form-field observation">
                <label>Observação</label>

                <input
                  v-model="
                    edicoes[pedido.id].observacao
                  "
                  type="text"
                  placeholder="Observações do pedido..."
                />
              </div>
            </div>
          </div>

          <div class="actions">
            <button
              v-if="Number(pedido.statusId) === 5"
              class="accept"
              @click="aceitar(pedido)"
              :disabled="processandoId === pedido.id"
            >
              Aceitar pedido
            </button>

            <button
              class="save"
              @click="salvar(pedido)"
              :disabled="processandoId === pedido.id"
            >
              Salvar alterações
            </button>

            <button
              class="delete"
              @click="apagar(pedido)"
              :disabled="processandoId === pedido.id"
            >
              Excluir
            </button>
          </div>
        </article>
      </div>
    </div>
  </div>
</template>

<script>
import {
  listarPedidos,
  listarStatusPedido,
  aceitarPedido,
  atualizarPedido,
  excluirPedido,
} from "@/services/pedidos";

export default {
  name: "AdminPedidosView",

  data() {
    return {
      pedidos: [],
      status: [],
      edicoes: {},
      carregando: true,
      processandoId: null,
      erro: "",
      mensagem: "",
    };
  },

  computed: {
    pedidosOrdenados() {
      return [...this.pedidos].sort(
        (a, b) =>
          Number(b.id) - Number(a.id)
      );
    },

    totalPendentes() {
      return this.pedidos.filter(
        (pedido) =>
          Number(pedido.statusId) === 5
      ).length;
    },

    totalPreparo() {
      return this.pedidos.filter(
        (pedido) =>
          Number(pedido.statusId) === 2
      ).length;
    },

    totalFinalizados() {
      return this.pedidos.filter((pedido) =>
        [4, 6].includes(
          Number(pedido.statusId)
        )
      ).length;
    },
  },

  async mounted() {
    await this.carregar();
  },

  methods: {
    async carregar() {
      this.carregando = true;
      this.erro = "";

      try {
        const [pedidos, status] =
          await Promise.all([
            listarPedidos(),
            listarStatusPedido(),
          ]);

        this.pedidos = pedidos || [];
        this.status = status || [];

        this.criarEdicoes();
      } catch (error) {
        this.erro =
          error.message ||
          "Não foi possível carregar os pedidos.";
      } finally {
        this.carregando = false;
      }
    },

    criarEdicoes() {
      const edicoes = {};

      this.pedidos.forEach((pedido) => {
        edicoes[pedido.id] = {
          statusId: Number(pedido.statusId),
          observacao:
            pedido.observacao || "",
        };
      });

      this.edicoes = edicoes;
    },

    async aceitar(pedido) {
      this.processandoId = pedido.id;

      this.erro = "";
      this.mensagem = "";

      try {
        await aceitarPedido(pedido.id);

        this.mensagem =
          `Pedido #${pedido.id} aceito com sucesso.`;

        await this.carregar();
      } catch (error) {
        this.erro =
          error.message ||
          "Não foi possível aceitar o pedido.";
      } finally {
        this.processandoId = null;
      }
    },

    async salvar(pedido) {
      this.processandoId = pedido.id;

      this.erro = "";
      this.mensagem = "";

      try {
        const edicao =
          this.edicoes[pedido.id];

        await atualizarPedido(
          pedido.id,
          {
            statusId:
              Number(edicao.statusId),

            observacao:
              edicao.observacao,
          }
        );

        this.mensagem =
          `Pedido #${pedido.id} atualizado.`;

        await this.carregar();
      } catch (error) {
        this.erro =
          error.message ||
          "Não foi possível atualizar o pedido.";
      } finally {
        this.processandoId = null;
      }
    },

    async apagar(pedido) {
      const confirmado =
        window.confirm(
          `Deseja realmente excluir o pedido #${pedido.id}?`
        );

      if (!confirmado) {
        return;
      }

      this.processandoId = pedido.id;

      this.erro = "";
      this.mensagem = "";

      try {
        await excluirPedido(pedido.id);

        this.mensagem =
          `Pedido #${pedido.id} excluído.`;

        await this.carregar();
      } catch (error) {
        this.erro =
          error.message ||
          "Não foi possível excluir o pedido.";
      } finally {
        this.processandoId = null;
      }
    },

    descricaoStatus(id) {
      const item = this.status.find(
        (status) =>
          Number(status.id) === Number(id)
      );

      return item
        ? item.descricao
        : "Status desconhecido";
    },

    statusClass(id) {
      const status = Number(id);

      if (status === 1) return "accepted";
      if (status === 2) return "preparing";
      if (status === 3) return "delivery";

      if ([4, 6].includes(status)) {
        return "finished";
      }

      if (status === 7) {
        return "cancelled";
      }

      return "pending";
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
          (soma, bebida) =>
            soma +
            Number(bebida.valor || 0),
          0
        );
      }

      return total;
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
.admin-page {
  min-height: calc(100vh - 78px);
  padding: 50px 20px 80px;
  background: #f5f3f2;
  text-align: left;
}

.container {
  width: min(1180px, 100%);
  margin: auto;
}

.admin-header {
  margin-bottom: 30px;
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 30px;
}

.eyebrow {
  color: #dc4926;
  font-size: 11px;
  font-weight: 900;
  letter-spacing: 2px;
}

.admin-header h1 {
  margin: 7px 0 8px;
  color: #251713;
  font-size: 38px;
}

.admin-header p {
  margin: 0;
  color: #766863;
}

.refresh {
  min-height: 45px;
  padding: 0 18px;
  border: 1px solid #ded3ce;
  border-radius: 11px;
  background: white;
  color: #44312a;
  font-weight: 800;
}

.metrics {
  margin-bottom: 25px;
  display: grid;
  grid-template-columns:
    repeat(4, 1fr);
  gap: 14px;
}

.metric {
  padding: 20px;
  border: 1px solid #e7deda;
  border-radius: 15px;
  background: white;
}

.metric span {
  display: block;
  color: #8e7d77;
  font-size: 12px;
  font-weight: 700;
}

.metric strong {
  display: block;
  margin-top: 5px;
  color: #291a15;
  font-size: 27px;
}

.message,
.loading {
  margin-bottom: 20px;
  padding: 15px 18px;
  border-radius: 12px;
}

.message.success {
  color: #266d3c;
  background: #e1f6e8;
}

.message.error {
  color: #a03429;
  background: #ffe5e2;
}

.loading {
  border: 1px solid #e3dad6;
  background: white;
  color: #746660;
  text-align: center;
}

.orders {
  display: grid;
  gap: 20px;
}

.order {
  overflow: hidden;
  border: 1px solid #e6ddd9;
  border-radius: 18px;
  background: white;
  box-shadow: 0 10px 35px rgba(45, 26, 20, 0.05);
}

.order-header {
  padding: 20px 24px;
  display: flex;
  justify-content: space-between;
  gap: 20px;
  align-items: center;
  border-bottom: 1px solid #eee7e3;
}

.order-header small {
  color: #a08e87;
  font-size: 10px;
  font-weight: 900;
  letter-spacing: 1.5px;
}

.order-header h2 {
  margin: 5px 0 3px;
  color: #2d1c17;
  font-size: 21px;
}

.order-header p {
  margin: 0;
  color: #94847e;
  font-size: 12px;
}

.badge {
  padding: 8px 12px;
  border-radius: 50px;
  font-size: 11px;
  font-weight: 900;
}

.pending {
  color: #8e6300;
  background: #fff0c4;
}

.accepted {
  color: #20703b;
  background: #ddf7e6;
}

.preparing {
  color: #a25319;
  background: #ffe5d0;
}

.delivery {
  color: #355e9d;
  background: #e4edff;
}

.finished {
  color: #216c44;
  background: #def5e7;
}

.cancelled {
  color: #9f382e;
  background: #ffe0dc;
}

.content {
  padding: 24px;
}

.pizza {
  margin-bottom: 22px;
  display: flex;
  align-items: center;
  gap: 15px;
}

.pizza img {
  width: 85px;
  height: 85px;
  object-fit: cover;
  border-radius: 13px;
}

.pizza h3 {
  margin: 0 0 5px;
  color: #291a15;
}

.pizza p {
  margin: 0;
  color: #887973;
}

.info-grid {
  display: grid;
  grid-template-columns:
    repeat(4, 1fr);
  gap: 15px;
}

.info-grid > div {
  min-width: 0;
  padding: 14px;
  border-radius: 12px;
  background: #faf7f5;
}

.info-grid small {
  display: block;
  margin-bottom: 6px;
  color: #988781;
  font-size: 10px;
  font-weight: 800;
  text-transform: uppercase;
}

.info-grid strong {
  display: block;
  color: #45332c;
  font-size: 13px;
  line-height: 1.4;
}

.info-grid .price {
  color: #db4826;
  font-size: 18px;
}

.edit-area {
  margin-top: 22px;
  padding-top: 22px;
  display: grid;
  grid-template-columns: 240px 1fr;
  gap: 15px;
  border-top: 1px solid #eee8e5;
}

.form-field label {
  display: block;
  margin-bottom: 7px;
  color: #4e3b34;
  font-size: 12px;
  font-weight: 800;
}

.form-field select,
.form-field input {
  width: 100%;
  height: 45px;
  padding: 0 12px;
  outline: none;
  border: 1px solid #dbd0cb;
  border-radius: 10px;
  background: white;
  color: #392822;
}

.form-field select:focus,
.form-field input:focus {
  border-color: #df4c29;
}

.actions {
  padding: 17px 24px;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  border-top: 1px solid #eee7e3;
  background: #faf8f7;
}

.actions button {
  min-height: 42px;
  padding: 0 16px;
  border-radius: 10px;
  font-size: 12px;
  font-weight: 900;
}

.accept {
  border: 0;
  background: #2f8b50;
  color: white;
}

.save {
  border: 0;
  background: #dc4a28;
  color: white;
}

.delete {
  border: 1px solid #edc9c3;
  background: white;
  color: #b63c2c;
}

.actions button:disabled {
  opacity: 0.5;
}

@media (max-width: 850px) {
  .metrics {
    grid-template-columns:
      repeat(2, 1fr);
  }

  .info-grid {
    grid-template-columns:
      repeat(2, 1fr);
  }

  .edit-area {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 600px) {
  .admin-header {
    align-items: stretch;
    flex-direction: column;
  }

  .admin-header h1 {
    font-size: 31px;
  }

  .metrics,
  .info-grid {
    grid-template-columns: 1fr;
  }

  .order-header {
    align-items: flex-start;
    flex-direction: column;
  }

  .actions {
    flex-direction: column;
  }

  .actions button {
    width: 100%;
  }
}
</style>