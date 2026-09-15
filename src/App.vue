<template>
  <div id="app">
    <NavBarComponent v-if="mostrarNavbar" />

    <BannerComponent v-if="mostrarBanner" />

    <main class="app-content">
      <router-view />
    </main>
  </div>
</template>

<script>
import NavBarComponent from "./components/NavBarComponent.vue";
import BannerComponent from "./components/BannerComponent.vue";

export default {
  name: "App",

  components: {
    NavBarComponent,
    BannerComponent,
  },

  computed: {
    mostrarNavbar() {
      const rotasSemNavbar = [
        "login",
        "cadastro",
      ];

      return !rotasSemNavbar.includes(
        this.$route.name
      );
    },

    mostrarBanner() {
      return this.$route.name === "menu";
    },
  },
};
</script>

<style>
* {
  box-sizing: border-box;
}

html,
body {
  width: 100%;
  min-height: 100%;
  margin: 0;
  padding: 0;
}

body {
  background: #ffffff;
}

#app {
  min-height: 100vh;

  font-family:
    Avenir,
    Helvetica,
    Arial,
    sans-serif;

  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;

  color: #222;

  overflow-x: hidden;
}

.app-content {
  width: 100%;
}

button,
input,
textarea,
select {
  font-family: inherit;
}

button {
  cursor: pointer;
}

a {
  text-decoration: none;
}
</style>