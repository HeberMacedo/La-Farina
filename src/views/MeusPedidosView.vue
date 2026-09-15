<template>
  <div class="page">
    <div class="container">
      <!-- CABEÇALHO -->
      <div class="header">
        <div>
          <span class="eyebrow">
            MINHA CONTA
          </span>

          <h1>
            Meus pedidos
          </h1>

          <p>
            Acompanhe todos os pedidos que você realizou na La Farina.
          </p>
        </div>

        <router-link
          to="/menu"
          class="new-order"
        >
          Fazer novo pedido
        </router-link>
      </div>

      <!-- CARREGANDO -->
      <div
        v-if="carregando"
        class="state-card"
      >
        <div class="spinner"></div>

        <p>
          Carregando seus pedidos...
        </p>
      </div>

      <!-- ERRO -->
      <div
        v-else-if="erro"
        class="state-card error"
      >
        <div class="state-icon">
          !
        </div>

        <h2>
          Não foi possível carregar seus pedidos
        </h2>

        <p>
          {{ erro }}
        </p>

        <button
          type="button"
          @click="carregar"
        >
          Tentar novamente
        </button>
      </div>

      <!-- SEM PEDIDOS -->
      <div
        v-else-if="pedidos.length === 0"
        class="empty"
      >
        <div class="empty-icon">
          🍕
        </div>

        <h2>
          Você ainda não fez nenhum pedido
        </h2>

        <p>
          Escolha sua pizza favorita e faça seu primeiro pedido na La Farina.
        </p>

        <router-link to="/menu">
          Ver cardápio
        </router-link>
      </div>

      <!-- LISTA DE PEDIDOS -->
      <div
        v-else
        class="orders"
      >
        <article
          v-for="pedido in pedidosOrdenados"
          :key="pedido.id"
          class="order-card"
        >
          <!-- TOPO DO PEDIDO -->
          <div class="order-top">
            <div class="order-number">
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

          <!-- CONTEÚDO -->
          <div class="order-content">
            <!-- PIZZA -->
            <div
              v-if="pedido.pizza"
              class="pizza"
            >
              <img
                v-if="pedido.pizza.foto"
                :src="pedido.pizza.foto"
                :alt="pedido.pizza.nome"
                @error="imagemErro"
              />

              <div class="pizza-info">
                <small>
                  PIZZA
                </small>

                <h3>
                  {{ pedido.pizza.nome }}
                </h3>

                <p v-if="pedido.tamanho">
                  {{ pedido.tamanho.descricao }}
                </p>
              </div>
            </div>

            <!-- DETALHES -->
            <div class="details">
              <!-- TAMANHO -->
              <div
                v-if="pedido.tamanho"
                class="detail"
              >
                <div>
                  <strong>
                    Tamanho
                  </strong>

                  <span>
                    {{ pedido.tamanho.descricao }}
                  </span>
                </div>

                <span
                  v-if="pedido.tamanho.valor"
                  class="detail-value"
                >
                  {{ formatarMoeda(pedido.tamanho.valor) }}
                </span>
              </div>

              <!-- SABORES -->
              <div
                v-if="
                  pedido.sabores &&
                  pedido.sabores.length
                "
                class="detail"
              >
                <div>
                  <strong>
                    Sabores
                  </strong>

                  <span>
                    {{
                      pedido.sabores
                        .map((sabor) => sabor.nome)
                        .join(", ")
                    }}
                  </span>
                </div>
              </div>

              <!-- BORDA -->
              <div class="detail">
                <div>
                  <strong>
                    Borda
                  </strong>

                  <span>
                    {{
                      pedido.borda
                        ? pedido.borda.nome
                        : "Sem borda recheada"
                    }}
                  </span>
                </div>

                <span
                  v-if="pedido.borda?.valor"
                  class="detail-value"
                >
                  + {{ formatarMoeda(pedido.borda.valor) }}
                </span>
              </div>

              <!-- BEBIDAS -->
              <div
                v-if="
                  pedido.bebidas &&
                  pedido.bebidas.length
                "
                class="detail"
              >
                <div>
                  <strong>
                    Bebidas
                  </strong>

                  <span>
                    {{
                      pedido.bebidas
                        .map((bebida) => bebida.nome)
                        .join(", ")
                    }}
                  </span>
                </div>

                <span class="detail-value">
                  + {{ formatarMoeda(totalBebidas(pedido)) }}
                </span>
              </div>

              <!-- SEM BEBIDAS -->
              <div
                v-else
                class="detail"
              >
                <div>
                  <strong>
                    Bebidas
                  </strong>

                  <span>
                    Nenhuma bebida
                  </span>
                </div>
              </div>

              <!-- OBSERVAÇÃO -->
              <div
                v-if="pedido.observacao"
                class="detail observation"
              >
                <div>
                  <strong>
                    Observação
                  </strong>

                  <span>
                    {{ pedido.observacao }}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- STATUS -->
          <div class="status-area">
            <div class="status-title">
              <span>
                Status do pedido
              </span>

              <strong>
                {{ descricaoStatus(pedido.statusId) }}
              </strong>
            </div>

            <div class="status-track">
              <div
                class="status-progress"
                :style="{
                  width: progressoStatus(pedido.statusId)
                }"
              ></div>
            </div>

            <div class="status-labels">
              <span>
                Recebido
              </span>

              <span>
                Preparo
              </span>

              <span>
                Entrega
              </span>

              <span>
                Finalizado
              </span>
            </div>
          </div>

          <!-- RODAPÉ -->
          <div class="order-footer">
            <div class="order-date">
              <small>
                REALIZADO EM
              </small>

              <strong>
                {{ formatarData(pedido.dataPedido) }}
              </strong>
            </div>

            <div class="total">
              <small>
                TOTAL DO PEDIDO
              </small>

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
      return [...this.pedidos].sort((a, b) => {
        if (a.dataPedido && b.dataPedido) {
          return (
            new Date(b.dataPedido).getTime() -
            new Date(a.dataPedido).getTime()
          );
        }

        return Number(b.id) - Number(a.id);
      });
    },
  },

  async mounted() {
    this.usuario =
      obterUsuarioAtual();

    if (!this.usuario) {
      await this.$router.push(
        "/login"
      );

      return;
    }

    await this.carregar();
  },

  methods: {
    async carregar() {
      this.erro = "";

      this.carregando = true;

      try {
        if (!this.usuario) {
          this.usuario =
            obterUsuarioAtual();
        }

        if (!this.usuario) {
          await this.$router.push(
            "/login"
          );

          return;
        }

        const [
          pedidos,
          status,
        ] = await Promise.all([
          listarPedidosDoUsuario(
            this.usuario.id
          ),

          listarStatusPedido(),
        ]);

        this.pedidos =
          pedidos || [];

        this.status =
          status || [];
      } catch (error) {
        console.error(
          "Erro ao carregar pedidos:",
          error
        );

        this.erro =
          error?.message ||
          "Não foi possível carregar seus pedidos.";
      } finally {
        this.carregando = false;
      }
    },

    descricaoStatus(statusId) {
      const encontrado =
        this.status.find(
          (item) =>
            Number(item.id) ===
            Number(statusId)
        );

      return encontrado
        ? encontrado.descricao
        : "Status desconhecido";
    },

    statusClass(statusId) {
      const id =
        Number(statusId);

      if (id === 1) {
        return "accepted";
      }

      if (id === 2) {
        return "preparing";
      }

      if (id === 3) {
        return "delivery";
      }

      if (
        id === 4 ||
        id === 6
      ) {
        return "finished";
      }

      if (id === 7) {
        return "cancelled";
      }

      return "pending";
    },

    progressoStatus(statusId) {
      const id =
        Number(statusId);

      if (id === 5) {
        return "10%";
      }

      if (id === 1) {
        return "25%";
      }

      if (id === 2) {
        return "50%";
      }

      if (id === 3) {
        return "75%";
      }

      if (
        id === 4 ||
        id === 6
      ) {
        return "100%";
      }

      if (id === 7) {
        return "0%";
      }

      return "0%";
    },

    formatarMoeda(valor) {
      return Number(
        valor || 0
      ).toLocaleString(
        "pt-BR",
        {
          style: "currency",

          currency: "BRL",
        }
      );
    },

    totalBebidas(pedido) {
      if (
        !pedido.bebidas ||
        !pedido.bebidas.length
      ) {
        return 0;
      }

      return pedido.bebidas.reduce(
        (soma, bebida) =>
          soma +
          Number(
            bebida.valor || 0
          ),
        0
      );
    },

    totalPedido(pedido) {
      /*
      |--------------------------------------------------------------------------
      | Pedidos novos
      |--------------------------------------------------------------------------
      |
      | O PedidoComponent já salva o total pronto.
      |
      */

      if (
        pedido.total !== undefined &&
        pedido.total !== null
      ) {
        return Number(
          pedido.total
        );
      }

      /*
      |--------------------------------------------------------------------------
      | Compatibilidade com pedidos antigos
      |--------------------------------------------------------------------------
      */

      let total =
        Number(
          pedido.tamanho?.valor ||
          pedido.pizza?.valor ||
          0
        );

      total +=
        Number(
          pedido.borda?.valor ||
          0
        );

      total +=
        this.totalBebidas(
          pedido
        );

      return total;
    },

    formatarData(data) {
      if (!data) {
        return "Data não informada";
      }

      const valor =
        new Date(data);

      if (
        Number.isNaN(
          valor.getTime()
        )
      ) {
        return data;
      }

      return valor.toLocaleString(
        "pt-BR",
        {
          day: "2-digit",

          month: "2-digit",

          year: "numeric",

          hour: "2-digit",

          minute: "2-digit",
        }
      );
    },

    imagemErro(event) {
      event.target.onerror =
        null;

      event.target.src =
        `${process.env.BASE_URL}img/logo_tpizza.svg`;
    },
  },
};
</script>

<style scoped>
.page {
  min-height:
    calc(100vh - 78px);

  padding:
    55px 20px 80px;

  background:
    #f7f4f2;

  text-align: left;
}

.container {
  width:
    min(
      1050px,
      100%
    );

  margin: auto;
}

/*
|--------------------------------------------------------------------------
| HEADER
|--------------------------------------------------------------------------
*/

.header {
  margin-bottom:
    35px;

  display: flex;

  justify-content:
    space-between;

  align-items:
    flex-end;

  gap: 25px;
}

.eyebrow {
  color: #db4826;

  font-size: 11px;

  font-weight: 900;

  letter-spacing:
    2px;
}

.header h1 {
  margin:
    7px 0 8px;

  color: #241612;

  font-size: 38px;
}

.header p {
  margin: 0;

  color: #786a65;

  line-height: 1.5;
}

.new-order,
.empty a {
  min-height: 47px;

  padding:
    0 20px;

  display:
    inline-flex;

  align-items:
    center;

  justify-content:
    center;

  border-radius:
    12px;

  background:
    linear-gradient(
      135deg,
      #ee5831,
      #c83a1f
    );

  color: white;

  font-size: 14px;

  font-weight: 900;

  text-decoration: none;

  box-shadow:
    0 8px 20px
    rgba(
      199,
      58,
      31,
      0.18
    );
}

/*
|--------------------------------------------------------------------------
| PEDIDOS
|--------------------------------------------------------------------------
*/

.orders {
  display: grid;

  gap: 22px;
}

.order-card {
  overflow: hidden;

  border:
    1px solid #e7ded9;

  border-radius:
    20px;

  background: white;

  box-shadow:
    0 12px 35px
    rgba(
      55,
      27,
      17,
      0.06
    );
}

.order-top {
  padding:
    22px 25px;

  display: flex;

  align-items:
    center;

  justify-content:
    space-between;

  gap: 20px;

  border-bottom:
    1px solid #eee6e2;
}

.order-number small,
.order-footer small {
  display: block;

  color: #9b8c86;

  font-size: 10px;

  letter-spacing:
    1.4px;

  font-weight: 900;
}

.order-number h2 {
  margin:
    3px 0 0;

  color: #291914;

  font-size: 23px;
}

/*
|--------------------------------------------------------------------------
| STATUS BADGE
|--------------------------------------------------------------------------
*/

.status {
  padding:
    8px 13px;

  border-radius:
    999px;

  font-size: 11px;

  font-weight: 900;
}

.pending {
  background:
    #fff1c9;

  color:
    #956600;
}

.accepted {
  background:
    #dff8e8;

  color:
    #24783f;
}

.preparing {
  background:
    #ffe4cf;

  color:
    #a64e16;
}

.delivery {
  background:
    #e2ecff;

  color:
    #315faa;
}

.finished {
  background:
    #e2f5eb;

  color:
    #216944;
}

.cancelled {
  background:
    #ffe0dd;

  color:
    #a2382d;
}

/*
|--------------------------------------------------------------------------
| CONTEÚDO
|--------------------------------------------------------------------------
*/

.order-content {
  padding: 25px;
}

.pizza {
  margin-bottom:
    24px;

  display: flex;

  align-items:
    center;

  gap: 17px;
}

.pizza img {
  width: 95px;

  height: 95px;

  object-fit:
    cover;

  border-radius:
    15px;

  background:
    #eee7e3;
}

.pizza-info small {
  display: block;

  margin-bottom:
    4px;

  color: #a08e87;

  font-size: 9px;

  font-weight: 900;

  letter-spacing:
    1.4px;
}

.pizza h3 {
  margin:
    0 0 5px;

  color: #241612;

  font-size: 21px;
}

.pizza p {
  margin: 0;

  color: #887872;

  font-size: 13px;
}

.details {
  border-top:
    1px solid #f0e9e6;
}

.detail {
  min-height: 58px;

  padding:
    12px 0;

  display: flex;

  align-items:
    center;

  justify-content:
    space-between;

  gap: 25px;

  border-bottom:
    1px solid #f0e9e6;
}

.detail > div {
  min-width: 0;

  display: flex;

  flex-direction:
    column;

  gap: 4px;
}

.detail strong {
  color: #46342e;

  font-size: 12px;
}

.detail span {
  color: #81716b;

  font-size: 13px;

  line-height: 1.4;
}

.detail-value {
  flex-shrink: 0;

  color: #d84826 !important;

  font-weight: 900;
}

.observation {
  background:
    #fffaf8;

  margin-top:
    12px;

  padding:
    14px;

  border: 0;

  border-radius:
    11px;
}

/*
|--------------------------------------------------------------------------
| STATUS PROGRESS
|--------------------------------------------------------------------------
*/

.status-area {
  padding:
    20px 25px;

  border-top:
    1px solid #eee7e3;

  background:
    #fcfaf9;
}

.status-title {
  margin-bottom:
    12px;

  display: flex;

  align-items:
    center;

  justify-content:
    space-between;

  gap: 20px;
}

.status-title span {
  color: #8b7a74;

  font-size: 11px;
}

.status-title strong {
  color: #43302a;

  font-size: 12px;
}

.status-track {
  width: 100%;

  height: 6px;

  overflow: hidden;

  border-radius:
    100px;

  background:
    #eadfd9;
}

.status-progress {
  height: 100%;

  border-radius:
    100px;

  background:
    linear-gradient(
      90deg,
      #ee5b34,
      #cb3b20
    );

  transition:
    width 0.4s ease;
}

.status-labels {
  margin-top:
    8px;

  display: flex;

  justify-content:
    space-between;

  gap: 10px;
}

.status-labels span {
  color: #a3928b;

  font-size: 9px;
}

/*
|--------------------------------------------------------------------------
| FOOTER
|--------------------------------------------------------------------------
*/

.order-footer {
  padding:
    19px 25px;

  display: flex;

  align-items:
    center;

  justify-content:
    space-between;

  gap: 25px;

  border-top:
    1px solid #eee7e3;

  background:
    #f8f4f2;
}

.order-footer strong {
  display: block;

  margin-top: 4px;

  color: #33211b;

  font-size: 13px;
}

.total {
  text-align: right;
}

.total strong {
  color: #d64322;

  font-size: 22px;

  font-weight: 900;
}

/*
|--------------------------------------------------------------------------
| VAZIO / CARREGAMENTO
|--------------------------------------------------------------------------
*/

.state-card,
.empty {
  padding:
    55px 30px;

  border:
    1px solid #e8dfda;

  border-radius:
    20px;

  background: white;

  text-align: center;

  box-shadow:
    0 10px 35px
    rgba(
      55,
      27,
      17,
      0.05
    );
}

.state-card p,
.empty p {
  color: #887872;

  line-height: 1.6;
}

.state-card h2,
.empty h2 {
  margin:
    12px 0 7px;

  color: #2c1b16;
}

.state-card button {
  margin-top:
    12px;

  padding:
    10px 15px;

  border: 0;

  border-radius:
    9px;

  background:
    #de4a28;

  color: white;

  font-weight: 800;

  cursor: pointer;
}

.state-icon {
  width: 45px;

  height: 45px;

  margin: auto;

  display: grid;

  place-items:
    center;

  border-radius:
    50%;

  background:
    #ffe3de;

  color:
    #ac3928;

  font-size: 22px;

  font-weight: 900;
}

.empty-icon {
  font-size: 50px;
}

.empty a {
  margin-top:
    10px;
}

.error {
  color: #b33c29;
}

.spinner {
  width: 38px;

  height: 38px;

  margin:
    0 auto 15px;

  border:
    4px solid #f0e1dc;

  border-top-color:
    #dc4a28;

  border-radius:
    50%;

  animation:
    girar 0.75s
    linear infinite;
}

@keyframes girar {
  to {
    transform:
      rotate(360deg);
  }
}

/*
|--------------------------------------------------------------------------
| MOBILE
|--------------------------------------------------------------------------
*/

@media (
  max-width: 650px
) {
  .page {
    padding:
      35px 12px
      60px;
  }

  .header {
    align-items:
      stretch;

    flex-direction:
      column;
  }

  .header h1 {
    font-size:
      31px;
  }

  .new-order {
    width: 100%;
  }

  .order-top {
    align-items:
      flex-start;
  }

  .pizza {
    align-items:
      flex-start;
  }

  .pizza img {
    width: 78px;

    height: 78px;
  }

  .detail {
    align-items:
      flex-start;

    flex-direction:
      column;

    gap: 7px;
  }

  .status-labels {
    font-size: 8px;
  }

  .order-footer {
    align-items:
      flex-start;

    flex-direction:
      column;
  }

  .total {
    text-align: left;
  }
}
</style>