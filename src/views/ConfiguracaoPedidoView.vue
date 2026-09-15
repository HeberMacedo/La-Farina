<template>
  <div class="config-page">
    <!--
    ================================================================
    ETAPA 1 - ESCOLHER A PIZZA
    ================================================================
    -->

    <section
      v-if="!pizzaSelecionada"
      class="pizza-selection"
    >
      <div class="selection-header">
        <span class="eyebrow">
          NOVO PEDIDO
        </span>

        <h1>
          Qual pizza você quer?
        </h1>

        <p>
          Escolha uma opção para
          começar a montar seu pedido.
        </p>
      </div>

      <!-- CARREGANDO -->

      <div
        v-if="carregando"
        class="state-card"
      >
        <div
          class="spinner"
        ></div>

        <p>
          Carregando cardápio...
        </p>
      </div>

      <!-- ERRO -->

      <div
        v-else-if="erro"
        class="state-card error"
      >
        <strong>
          Não foi possível carregar
          as pizzas.
        </strong>

        <p>
          {{ erro }}
        </p>

        <button
          type="button"
          @click="carregarPizzas"
        >
          Tentar novamente
        </button>
      </div>

      <!-- PIZZAS -->

      <div
        v-else
        class="pizza-grid"
      >
        <article
          v-for="
            pizza in pizzas
          "
          :key="pizza.id"
          class="pizza-card"
          @click="
            selecionarPizza(
              pizza
            )
          "
        >
          <div
            class="image-wrapper"
          >
            <img
              :src="
                pizza.foto
              "
              :alt="
                pizza.nome
              "
              @error="
                imagemErro
              "
            />

            <span
              v-if="
                pizza.eh_novidade
              "
              class="new-badge"
            >
              NOVIDADE
            </span>
          </div>

          <div
            class="pizza-content"
          >
            <h2>
              {{ pizza.nome }}
            </h2>

            <p>
              {{
                pizza.descricao
              }}
            </p>

            <span
              class="price-info"
            >
              Preço de acordo
              com o tamanho
            </span>

            <button
              type="button"
              class="select-button"
              @click.stop="
                selecionarPizza(
                  pizza
                )
              "
            >
              Escolher esta pizza
            </button>
          </div>
        </article>
      </div>
    </section>

    <!--
    ================================================================
    ETAPA 2 - PERSONALIZAR O PEDIDO
    ================================================================
    -->

    <section
      v-else
      class="order-section"
    >
      <div
        class="order-navigation"
      >
        <button
          type="button"
          class="back-button"
          @click="
            trocarPizza
          "
        >
          ← Escolher outra pizza
        </button>

        <div
          class="step-indicator"
        >
          <span>
            2
          </span>

          <p>
            Personalizar pedido
          </p>
        </div>
      </div>

      <PedidoComponent
        :pizza="
          pizzaSelecionada
        "
      />
    </section>
  </div>
</template>

<script>
import PedidoComponent from "@/components/PedidoComponent.vue";

import {
  get,
} from "@/services/api";

export default {
  name:
    "ConfiguracaoPedidoView",

  components: {
    PedidoComponent,
  },

  data() {
    return {
      pizzaSelecionada:
        null,

      pizzas: [],

      carregando: true,

      erro: "",
    };
  },

  async mounted() {
    /*
    |--------------------------------------------------------------------------
    | Se veio pelo Cardápio
    |--------------------------------------------------------------------------
    |
    | MenuView envia a pizza pela query:
    |
    | /config-pedido?pizza=...
    |
    */

    this.carregarPizzaDaQuery();

    /*
    |--------------------------------------------------------------------------
    | Mesmo com pizza selecionada,
    | carregamos a lista para permitir
    | trocar de pizza.
    |--------------------------------------------------------------------------
    */

    await this.carregarPizzas();
  },

  methods: {
    carregarPizzaDaQuery() {
      const query =
        this.$route.query;

      if (!query.pizza) {
        return;
      }

      try {
        const pizzaDecodificada =
          JSON.parse(
            decodeURIComponent(
              query.pizza
            )
          );

        if (
          pizzaDecodificada &&
          pizzaDecodificada.id
        ) {
          this.pizzaSelecionada =
            pizzaDecodificada;
        }
      } catch (error) {
        console.error(
          "Erro ao recuperar pizza da URL:",
          error
        );

        this.pizzaSelecionada =
          null;
      }
    },

    async carregarPizzas() {
      this.carregando =
        true;

      this.erro = "";

      try {
        const menu =
          await get(
            "/menu"
          );

        this.pizzas =
          menu?.pizzas || [];
      } catch (error) {
        console.error(
          "Erro ao carregar pizzas:",
          error
        );

        this.erro =
          error?.message ||
          "Erro ao acessar o cardápio.";
      } finally {
        this.carregando =
          false;
      }
    },

    selecionarPizza(
      pizza
    ) {
      this.pizzaSelecionada =
        pizza;

      /*
      |--------------------------------------------------------------------------
      | Atualiza a URL sem precisar recarregar a página
      |--------------------------------------------------------------------------
      */

      const pizzaJson =
        encodeURIComponent(
          JSON.stringify(
            pizza
          )
        );

      this.$router.replace({
        path:
          "/config-pedido",

        query: {
          pizza:
            pizzaJson,
        },
      });

      /*
      |--------------------------------------------------------------------------
      | Leva o usuário para o topo
      |--------------------------------------------------------------------------
      */

      window.scrollTo({
        top: 0,

        behavior:
          "smooth",
      });
    },

    trocarPizza() {
      this.pizzaSelecionada =
        null;

      /*
      |--------------------------------------------------------------------------
      | Remove a pizza da URL
      |--------------------------------------------------------------------------
      */

      this.$router.replace({
        path:
          "/config-pedido",
      });

      window.scrollTo({
        top: 0,

        behavior:
          "smooth",
      });
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
.config-page {
  min-height:
    calc(100vh - 78px);

  background:
    #f7f4f2;

  padding:
    55px 20px 80px;

  text-align: left;
}

/*
|--------------------------------------------------------------------------
| CABEÇALHO
|--------------------------------------------------------------------------
*/

.pizza-selection {
  width:
    min(
      1180px,
      100%
    );

  margin: 0 auto;
}

.selection-header {
  max-width: 680px;

  margin:
    0 auto 40px;

  text-align: center;
}

.eyebrow {
  color: #df4c29;

  font-size: 11px;

  font-weight: 900;

  letter-spacing: 3px;
}

.selection-header h1 {
  margin:
    8px 0 10px;

  color: #271814;

  font-size: 42px;

  line-height: 1.1;
}

.selection-header p {
  margin: 0;

  color: #7d6d67;

  font-size: 15px;

  line-height: 1.6;
}

/*
|--------------------------------------------------------------------------
| GRID DE PIZZAS
|--------------------------------------------------------------------------
*/

.pizza-grid {
  display: grid;

  grid-template-columns:
    repeat(
      auto-fit,
      minmax(
        250px,
        1fr
      )
    );

  gap: 22px;
}

.pizza-card {
  min-height: 450px;

  display: flex;

  flex-direction:
    column;

  overflow: hidden;

  border:
    1px solid #e7ded9;

  border-radius: 19px;

  background: white;

  cursor: pointer;

  box-shadow:
    0 12px 35px
    rgba(
      59,
      29,
      18,
      0.06
    );

  transition:
    transform 0.25s ease,
    box-shadow 0.25s ease,
    border-color 0.25s ease;
}

.pizza-card:hover {
  transform:
    translateY(-6px);

  border-color:
    #e4b8a9;

  box-shadow:
    0 22px 50px
    rgba(
      59,
      29,
      18,
      0.12
    );
}

.image-wrapper {
  position: relative;

  height: 220px;

  overflow: hidden;

  background:
    #231713;
}

.image-wrapper img {
  width: 100%;
  height: 100%;

  display: block;

  object-fit: cover;

  transition:
    transform 0.4s ease;
}

.pizza-card:hover
.image-wrapper img {
  transform:
    scale(1.05);
}

.new-badge {
  position: absolute;

  top: 14px;
  left: 14px;

  padding:
    7px 11px;

  border-radius:
    999px;

  background:
    #dd4c29;

  color: white;

  font-size: 9px;

  font-weight: 900;

  letter-spacing:
    1px;

  box-shadow:
    0 5px 15px
    rgba(
      0,
      0,
      0,
      0.15
    );
}

/*
|--------------------------------------------------------------------------
| CONTEÚDO DA PIZZA
|--------------------------------------------------------------------------
*/

.pizza-content {
  flex: 1;

  padding: 21px;

  display: flex;

  flex-direction:
    column;
}

.pizza-content h2 {
  margin:
    0 0 9px;

  color: #291914;

  font-size: 22px;

  line-height: 1.2;
}

.pizza-content p {
  margin:
    0 0 15px;

  color: #776862;

  font-size: 13px;

  line-height: 1.6;
}

.price-info {
  width: fit-content;

  margin-bottom:
    18px;

  padding:
    6px 9px;

  border-radius:
    8px;

  background:
    #fff1ec;

  color: #ca4324;

  font-size: 10px;

  font-weight: 900;
}

.select-button {
  width: 100%;

  min-height: 46px;

  margin-top: auto;

  border: 0;

  border-radius:
    11px;

  background:
    linear-gradient(
      135deg,
      #ec5933,
      #c63b20
    );

  color: white;

  font-size: 13px;

  font-weight: 900;

  cursor: pointer;

  transition:
    0.2s ease;
}

.select-button:hover {
  transform:
    translateY(-2px);

  box-shadow:
    0 8px 20px
    rgba(
      200,
      57,
      31,
      0.22
    );
}

/*
|--------------------------------------------------------------------------
| ESTADOS
|--------------------------------------------------------------------------
*/

.state-card {
  max-width: 550px;

  margin:
    40px auto;

  padding:
    45px 30px;

  border:
    1px solid #e7ded9;

  border-radius:
    18px;

  background: white;

  text-align: center;
}

.state-card p {
  color: #7c6c66;
}

.state-card button {
  margin-top: 12px;

  padding:
    11px 17px;

  border: 0;

  border-radius:
    10px;

  background:
    #df4c29;

  color: white;

  font-weight: 800;

  cursor: pointer;
}

.state-card.error {
  color:
    #a43626;
}

.spinner {
  width: 35px;
  height: 35px;

  margin:
    0 auto 15px;

  border:
    4px solid
    #f0ddd6;

  border-top-color:
    #df4c29;

  border-radius:
    50%;

  animation:
    girar 0.8s
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
| ETAPA DE PERSONALIZAÇÃO
|--------------------------------------------------------------------------
*/

.order-section {
  width:
    min(
      1180px,
      100%
    );

  margin: auto;
}

.order-navigation {
  width:
    min(
      1050px,
      calc(100% - 32px)
    );

  margin:
    0 auto 20px;

  display: flex;

  align-items: center;

  justify-content:
    space-between;

  gap: 20px;
}

.back-button {
  min-height: 42px;

  padding:
    0 15px;

  border:
    1px solid
    #dfd1cb;

  border-radius:
    10px;

  background:
    white;

  color:
    #5d4941;

  font-size:
    12px;

  font-weight:
    800;

  cursor:
    pointer;
}

.back-button:hover {
  border-color:
    #df4c29;

  color:
    #df4c29;
}

.step-indicator {
  display: flex;

  align-items: center;

  gap: 9px;
}

.step-indicator span {
  width: 28px;
  height: 28px;

  display: grid;

  place-items:
    center;

  border-radius:
    50%;

  background:
    #df4c29;

  color: white;

  font-size:
    11px;

  font-weight:
    900;
}

.step-indicator p {
  margin: 0;

  color:
    #75645e;

  font-size:
    12px;

  font-weight:
    800;
}

/*
|--------------------------------------------------------------------------
| RESPONSIVO
|--------------------------------------------------------------------------
*/

@media (
  max-width: 650px
) {
  .config-page {
    padding:
      35px 12px
      60px;
  }

  .selection-header h1 {
    font-size:
      32px;
  }

  .pizza-grid {
    grid-template-columns:
      1fr;
  }

  .order-navigation {
    width: 100%;

    align-items:
      stretch;

    flex-direction:
      column;
  }

  .back-button {
    width: 100%;
  }
}
</style>