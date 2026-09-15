<template>
  <div class="auth-page">
    <div
      class="auth-decoration decoration-one"
    ></div>

    <div
      class="auth-decoration decoration-two"
    ></div>

    <section class="auth-card">
      <router-link
        to="/menu"
        class="brand"
      >
        <span class="brand-icon">
          L
        </span>

        <div>
          <strong>
            La Farina
          </strong>

          <small>
            Pizzaria Artesanal
          </small>
        </div>
      </router-link>

      <div class="auth-heading">
        <span class="eyebrow">
          BEM-VINDO
        </span>

        <h1>
          Entre na sua conta
        </h1>

        <p>
          Faça login para montar
          seus pedidos e acompanhar
          o andamento.
        </p>
      </div>

      <form
        @submit.prevent="entrar"
        class="auth-form"
      >
        <div class="form-group">
          <label for="email">
            E-mail
          </label>

          <input
            id="email"
            v-model.trim="email"
            type="email"
            placeholder="seuemail@exemplo.com"
            autocomplete="email"
            required
          />
        </div>

        <div class="form-group">
          <label for="senha">
            Senha
          </label>

          <div
            class="password-wrapper"
          >
            <input
              id="senha"
              v-model="senha"
              :type="
                mostrarSenha
                  ? 'text'
                  : 'password'
              "
              placeholder="Digite sua senha"
              autocomplete="current-password"
              required
            />

            <button
              type="button"
              class="password-button"
              @click="
                mostrarSenha =
                  !mostrarSenha
              "
            >
              {{
                mostrarSenha
                  ? "Ocultar"
                  : "Mostrar"
              }}
            </button>
          </div>
        </div>

        <div
          v-if="erro"
          class="alert alert-error"
        >
          {{ erro }}
        </div>

        <button
          type="submit"
          class="primary-button"
          :disabled="carregando"
        >
          <span v-if="carregando">
            Entrando...
          </span>

          <span v-else>
            Entrar
          </span>
        </button>
      </form>

      <div class="divider">
        <span></span>

        <p>ou</p>

        <span></span>
      </div>

      <p class="register-text">
        Ainda não possui uma conta?

        <router-link
          to="/cadastro"
        >
          Criar minha conta
        </router-link>
      </p>

      <router-link
        to="/menu"
        class="back-link"
      >
        ← Voltar para o cardápio
      </router-link>
    </section>
  </div>
</template>

<script>
import {
  login,
} from "@/services/auth";

export default {
  name: "LoginView",

  data() {
    return {
      email: "",
      senha: "",
      mostrarSenha: false,
      carregando: false,
      erro: "",
    };
  },

  methods: {
    async entrar() {
      this.erro = "";

      if (
        !this.email ||
        !this.senha
      ) {
        this.erro =
          "Informe o e-mail e a senha.";

        return;
      }

      try {
        this.carregando = true;

        const usuario =
          await login(
            this.email,
            this.senha
          );

        const redirect =
          this.$route.query.redirect;

        if (redirect) {
          await this.$router.push(
            redirect
          );

          return;
        }

        if (
          usuario.tipo ===
          "admin"
        ) {
          await this.$router.push(
            "/admin/pedidos"
          );

          return;
        }

        await this.$router.push(
          "/menu"
        );
      } catch (error) {
        this.erro =
          error.message ||
          "Não foi possível realizar o login.";
      } finally {
        this.carregando = false;
      }
    },
  },
};
</script>

<style scoped>
.auth-page {
  min-height: 100vh;

  padding: 40px 20px;

  display: flex;

  justify-content: center;

  align-items: center;

  position: relative;

  overflow: hidden;

  background:
    radial-gradient(
      circle at top left,
      #3a110c 0%,
      transparent 40%
    ),
    radial-gradient(
      circle at bottom right,
      #431108 0%,
      transparent 35%
    ),
    #140b09;
}

.auth-decoration {
  position: absolute;

  border-radius: 50%;

  filter: blur(2px);

  opacity: 0.3;
}

.decoration-one {
  width: 320px;
  height: 320px;

  top: -160px;
  right: -80px;

  background: #ef4c23;
}

.decoration-two {
  width: 260px;
  height: 260px;

  bottom: -130px;
  left: -80px;

  background: #bd2c16;
}

.auth-card {
  width: 100%;

  max-width: 470px;

  padding: 42px;

  position: relative;

  z-index: 2;

  border:
    1px solid
    rgba(255, 255, 255, 0.08);

  border-radius: 26px;

  background:
    rgba(28, 18, 15, 0.94);

  box-shadow:
    0 30px 80px
    rgba(0, 0, 0, 0.45);

  backdrop-filter: blur(20px);

  text-align: left;
}

.brand {
  display: inline-flex;

  align-items: center;

  gap: 12px;

  color: white;

  margin-bottom: 38px;
}

.brand-icon {
  width: 46px;
  height: 46px;

  display: grid;

  place-items: center;

  border-radius: 14px;

  background:
    linear-gradient(
      135deg,
      #fb6237,
      #bf2d18
    );

  font-size: 24px;

  font-weight: 900;
}

.brand strong,
.brand small {
  display: block;
}

.brand strong {
  font-size: 18px;
}

.brand small {
  margin-top: 2px;

  font-size: 10px;

  letter-spacing: 1.4px;

  text-transform: uppercase;

  color: #bfaeaa;
}

.auth-heading {
  margin-bottom: 30px;
}

.eyebrow {
  color: #ff7650;

  font-size: 12px;

  font-weight: 800;

  letter-spacing: 2px;
}

.auth-heading h1 {
  margin: 8px 0 10px;

  color: white;

  font-size: 34px;

  line-height: 1.1;
}

.auth-heading p {
  margin: 0;

  color: #b9aaa6;

  line-height: 1.6;
}

.auth-form {
  display: flex;

  flex-direction: column;

  gap: 20px;
}

.form-group label {
  display: block;

  margin-bottom: 8px;

  color: #f6edea;

  font-weight: 700;

  font-size: 13px;
}

.form-group input {
  width: 100%;

  height: 54px;

  padding: 0 16px;

  border:
    1px solid #483731;

  border-radius: 13px;

  outline: none;

  background: #211512;

  color: white;

  font-size: 15px;

  transition: 0.2s ease;
}

.form-group input:focus {
  border-color: #f45d36;

  box-shadow:
    0 0 0 3px
    rgba(244, 93, 54, 0.12);
}

.password-wrapper {
  position: relative;
}

.password-wrapper input {
  padding-right: 85px;
}

.password-button {
  position: absolute;

  top: 50%;
  right: 12px;

  transform:
    translateY(-50%);

  padding: 5px;

  border: 0;

  background: transparent;

  color: #ff7955;

  font-size: 12px;

  font-weight: 700;
}

.primary-button {
  min-height: 55px;

  border: 0;

  border-radius: 14px;

  background:
    linear-gradient(
      135deg,
      #f56239,
      #c83219
    );

  color: white;

  font-size: 15px;

  font-weight: 800;

  box-shadow:
    0 12px 25px
    rgba(198, 48, 23, 0.25);

  transition: 0.2s ease;
}

.primary-button:hover:not(
  :disabled
) {
  transform:
    translateY(-2px);
}

.primary-button:disabled {
  opacity: 0.6;

  cursor: wait;
}

.alert {
  padding: 13px 15px;

  border-radius: 11px;

  font-size: 13px;

  line-height: 1.5;
}

.alert-error {
  color: #ffc8bb;

  border:
    1px solid
    rgba(255, 81, 43, 0.25);

  background:
    rgba(180, 43, 18, 0.15);
}

.divider {
  margin: 28px 0;

  display: flex;

  gap: 12px;

  align-items: center;
}

.divider span {
  height: 1px;

  flex: 1;

  background: #3b2a26;
}

.divider p {
  margin: 0;

  color: #796761;

  font-size: 12px;
}

.register-text {
  text-align: center;

  color: #ad9e99;

  font-size: 14px;
}

.register-text a {
  color: #ff7650;

  font-weight: 800;
}

.back-link {
  margin-top: 28px;

  display: block;

  text-align: center;

  color: #8c7b76;

  font-size: 13px;
}

@media (max-width: 520px) {
  .auth-page {
    padding: 20px 14px;
  }

  .auth-card {
    padding: 30px 22px;

    border-radius: 20px;
  }

  .auth-heading h1 {
    font-size: 29px;
  }
}
</style>