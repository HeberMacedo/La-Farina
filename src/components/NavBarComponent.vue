<template>
  <header class="navbar">
    <div class="navbar-container">
      <router-link
        to="/menu"
        class="logo"
      >
        <span class="logo-symbol">
          L
        </span>

        <div class="logo-text">
          <strong>
            La Farina
          </strong>

          <small>
            Pizzaria Artesanal
          </small>
        </div>
      </router-link>

      <nav class="desktop-nav">
        <router-link to="/menu">
          Cardápio
        </router-link>

        <template
          v-if="usuario && !admin"
        >
          <router-link
            to="/config-pedido"
          >
            Fazer pedido
          </router-link>

          <router-link
            to="/meus-pedidos"
          >
            Meus pedidos
          </router-link>
        </template>

        <template v-if="admin">
          <router-link
            to="/admin/pedidos"
          >
            Administração
          </router-link>
        </template>
      </nav>

      <div class="navbar-actions">
        <template v-if="!usuario">
          <router-link
            to="/login"
            class="login-link"
          >
            Entrar
          </router-link>

          <router-link
            to="/cadastro"
            class="register-button"
          >
            Criar conta
          </router-link>
        </template>

        <template v-else>
          <div class="user-info">
            <small>
              {{
                admin
                  ? "Administrador"
                  : "Olá"
              }}
            </small>

            <strong>
              {{ primeiroNome }}
            </strong>
          </div>

          <button
            class="logout-button"
            @click="sair"
          >
            Sair
          </button>
        </template>
      </div>
    </div>
  </header>
</template>

<script>
import {
  obterUsuarioAtual,
  logout,
} from "@/services/auth";

export default {
  name: "NavBarComponent",

  data() {
    return {
      usuario:
        obterUsuarioAtual(),
    };
  },

  computed: {
    admin() {
      return (
        this.usuario?.tipo ===
        "admin"
      );
    },

    primeiroNome() {
      if (!this.usuario?.nome) {
        return "";
      }

      return this.usuario.nome.split(
        " "
      )[0];
    },
  },

  watch: {
    $route() {
      this.atualizarUsuario();
    },
  },

  mounted() {
    window.addEventListener(
      "tpizza-auth-changed",
      this.atualizarUsuario
    );
  },

  beforeUnmount() {
    window.removeEventListener(
      "tpizza-auth-changed",
      this.atualizarUsuario
    );
  },

  methods: {
    atualizarUsuario() {
      this.usuario =
        obterUsuarioAtual();
    },

    async sair() {
      logout();

      this.usuario = null;

      await this.$router.push(
        "/login"
      );
    },
  },
};
</script>

<style scoped>
.navbar {
  width: 100%;

  position: relative;

  z-index: 100;

  background: #17100d;

  border-bottom:
    1px solid
    rgba(255, 255, 255, 0.06);
}

.navbar-container {
  width:
    min(
      1180px,
      calc(100% - 40px)
    );

  min-height: 78px;

  margin: 0 auto;

  display: flex;

  align-items: center;

  justify-content: space-between;

  gap: 25px;
}

.logo {
  display: flex;

  align-items: center;

  gap: 10px;

  color: white;
}

.logo-symbol {
  width: 40px;
  height: 40px;

  display: grid;

  place-items: center;

  border-radius: 12px;

  background:
    linear-gradient(
      135deg,
      #f5643b,
      #bd2d18
    );

  color: white;

  font-size: 21px;

  font-weight: 900;
}

.logo-text {
  text-align: left;
}

.logo-text strong {
  display: block;

  font-size: 17px;
}

.logo-text small {
  display: block;

  margin-top: 1px;

  color: #bba9a4;

  font-size: 8px;

  text-transform: uppercase;

  letter-spacing: 1.5px;
}

.desktop-nav {
  flex: 1;

  display: flex;

  justify-content: center;

  gap: 30px;

  padding: 0;
}

.desktop-nav a {
  color: #cfc2be;

  font-size: 14px;

  font-weight: 600;

  transition: 0.2s;
}

.desktop-nav a:hover {
  color: white;
}

.desktop-nav
  a.router-link-active {
  color: #ff7049;
}

.navbar-actions {
  display: flex;

  align-items: center;

  gap: 13px;
}

.login-link {
  color: white;

  font-size: 14px;

  font-weight: 700;
}

.register-button {
  padding: 11px 17px;

  border-radius: 11px;

  background: #e84b29;

  color: white;

  font-size: 13px;

  font-weight: 800;
}

.user-info {
  text-align: right;
}

.user-info small {
  display: block;

  color: #978680;

  font-size: 10px;
}

.user-info strong {
  display: block;

  color: white;

  font-size: 13px;
}

.logout-button {
  padding: 9px 12px;

  border:
    1px solid #453630;

  border-radius: 9px;

  background: transparent;

  color: #d4c7c3;

  font-size: 12px;

  font-weight: 700;
}

.logout-button:hover {
  background: #2c1d19;
}

@media (max-width: 800px) {
  .navbar-container {
    width: calc(100% - 24px);

    min-height: 68px;
  }

  .desktop-nav {
    display: none;
  }

  .logo-text {
    display: none;
  }

  .user-info {
    display: none;
  }

  .register-button {
    padding: 10px 12px;
  }
}
</style>