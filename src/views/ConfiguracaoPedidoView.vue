<template>
  <div v-if="pizzaSelecionada">
    <h1>Configuração do Pedido</h1>

    <pedido-component-vue
      :pizza="pizzaSelecionada"
    />
  </div>
</template>

<script>
import PedidoComponentVue from "@/components/PedidoComponent.vue";

export default {
  name: "ConfiguracaoPedidoView",

  components: {
    PedidoComponentVue,
  },

  data() {
    return {
      pizzaSelecionada: null,
    };
  },

  mounted() {
    const query = this.$route.query;

    if (!query.pizza) {
      this.$router.replace("/menu");
      return;
    }

    try {
      const pizzaDecodificada = JSON.parse(
        decodeURIComponent(query.pizza)
      );

      if (!pizzaDecodificada?.id) {
        this.$router.replace("/menu");
        return;
      }

      this.pizzaSelecionada =
        pizzaDecodificada;
    } catch (error) {
      console.error(
        "Erro ao carregar pizza selecionada:",
        error
      );

      this.$router.replace("/menu");
    }
  },
};
</script>

<style scoped>
h1 {
  margin: 35px 20px 15px;

  color: #2b1b16;

  text-align: center;

  font-size: 32px;
}
</style>