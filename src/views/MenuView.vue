<template>
  <div class="menu-page">
    <div class="menu-header">
      <span>TPIZZA ARTESANAL</span>

      <h1>Nosso Cardápio</h1>

      <p>
        Escolha sua pizza favorita e depois selecione o tamanho.
      </p>
    </div>

    <div id="lista-cardapio">
      <article
        id="card-content"
        v-for="pizza in listaMenuPizzas"
        :key="pizza.id"
      >
        <div class="foto-container">
          <img
            class="foto-pizza"
            :src="pizza.foto"
            :alt="pizza.nome"
            @error="imagemErro"
          />

          <span
            v-if="pizza.eh_novidade"
            class="novidade"
          >
            NOVIDADE
          </span>
        </div>

        <div class="card-coluna">
          <h2 id="nome-content">
            {{ pizza.nome }}
          </h2>

          <p class="preco-info">
            Preço conforme o tamanho
          </p>

          <p id="descricao-content">
            {{ pizza.descricao }}
          </p>

          <button
            @click="selecionarPizza(pizza)"
          >
            Montar meu pedido
          </button>
        </div>
      </article>
    </div>
  </div>
</template>

<script>
export default {
  name: "MenuView",

  data() {
    return {
      listaMenuPizzas: [],
    };
  },

  methods: {
    async consultarMenu() {
      try {
        const response = await fetch(
          `${this.$apiUrl}/menu`
        );

        if (!response.ok) {
          throw new Error();
        }

        const dados =
          await response.json();

        this.listaMenuPizzas =
          dados.pizzas || [];
      } catch (error) {
        console.error(
          "Erro ao carregar cardápio:",
          error
        );
      }
    },

    selecionarPizza(pizzaSelecionada) {
      const param =
        JSON.stringify(
          pizzaSelecionada
        );

      const pizzaJson =
        encodeURIComponent(param);

      this.$router.push({
        path: "/config-pedido",

        query: {
          pizza: pizzaJson,
        },
      });
    },

    imagemErro(event) {
      event.target.onerror = null;

      event.target.src =
        `${process.env.BASE_URL}img/logo_tpizza.svg`;
    },
  },

  mounted() {
    this.consultarMenu();
  },
};
</script>

<style scoped>
.menu-page {
  width: min(
    1180px,
    calc(100% - 32px)
  );

  margin: 0 auto 60px;

  text-align: left;
}

.menu-header {
  padding: 45px 0 15px;

  text-align: center;
}

.menu-header > span {
  color: #d84a28;

  font-size: 11px;

  font-weight: 900;

  letter-spacing: 2px;
}

.menu-header h1 {
  margin: 7px 0 8px;

  color: #2b1b16;

  font-size: 38px;
}

.menu-header p {
  margin: 0;

  color: #806f69;
}

#lista-cardapio {
  display: grid;

  grid-template-columns:
    repeat(
      auto-fit,
      minmax(250px, 1fr)
    );

  gap: 24px;

  margin: 28px auto 0;
}

#card-content {
  min-height: 455px;

  display: flex;

  flex-direction: column;

  overflow: hidden;

  border: 1px solid #e5dcd8;

  border-radius: 17px;

  background: white;

  box-shadow:
    0 10px 32px
    rgba(60, 31, 21, 0.08);

  transition: 0.25s ease;
}

#card-content:hover {
  transform: translateY(-5px);

  box-shadow:
    0 18px 42px
    rgba(60, 31, 21, 0.13);
}

.foto-container {
  position: relative;

  height: 210px;

  overflow: hidden;

  background: #231713;
}

.foto-pizza {
  width: 100%;
  height: 100%;

  display: block;

  object-fit: cover;

  transition: 0.4s ease;
}

#card-content:hover .foto-pizza {
  transform: scale(1.04);
}

.novidade {
  position: absolute;

  top: 13px;
  left: 13px;

  padding: 7px 10px;

  border-radius: 20px;

  background: #df4c29;

  color: white;

  font-size: 9px;
  font-weight: 900;

  letter-spacing: 1px;
}

.card-coluna {
  flex: 1;

  display: flex;

  flex-direction: column;

  padding: 20px;
}

#nome-content {
  margin: 0 0 8px;

  color: #2c1b16;

  font-size: 23px;

  line-height: 1.2;
}

.preco-info {
  display: inline-flex;

  width: fit-content;

  margin: 0 0 13px;

  padding: 6px 9px;

  border-radius: 8px;

  background: #fff0eb;

  color: #c94223;

  font-size: 11px;
  font-weight: 800;
}

#descricao-content {
  margin: 0 0 20px;

  color: #756661;

  font-size: 14px;

  line-height: 1.6;
}

.card-coluna button {
  width: 100%;

  min-height: 46px;

  margin-top: auto;

  border: none;

  border-radius: 11px;

  background:
    linear-gradient(
      135deg,
      #e95731,
      #c53b20
    );

  color: white;

  cursor: pointer;

  font-size: 13px;

  font-weight: 900;

  transition: 0.2s ease;
}

.card-coluna button:hover {
  transform: translateY(-2px);

  box-shadow:
    0 8px 18px
    rgba(199, 61, 32, 0.23);
}

@media (max-width: 600px) {
  .menu-page {
    width: calc(100% - 22px);
  }

  .menu-header h1 {
    font-size: 31px;
  }

  #lista-cardapio {
    grid-template-columns: 1fr;
  }
}
</style>