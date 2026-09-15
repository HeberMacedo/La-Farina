<template>
  <div class="auth-page">
    <section class="auth-card">
      <router-link to="/menu" class="brand">
        <span class="brand-icon">T</span>

        <div>
          <strong>T-Pizza</strong>
          <small>Pizza Artesanal</small>
        </div>
      </router-link>

      <div class="auth-heading">
        <span class="eyebrow">CRIAR CONTA</span>

        <h1>Cadastre-se</h1>

        <p>
          Crie sua conta para fazer pedidos e acompanhar cada etapa.
        </p>
      </div>

      <form @submit.prevent="criarConta" class="auth-form">
        <div class="form-group">
          <label>Nome completo</label>

          <input
            v-model.trim="nome"
            type="text"
            placeholder="Seu nome"
            autocomplete="name"
            required
          />
        </div>

        <div class="form-group">
          <label>E-mail</label>

          <input
            v-model.trim="email"
            type="email"
            placeholder="seuemail@exemplo.com"
            autocomplete="email"
            required
          />
        </div>

        <div class="form-group">
          <label>Senha</label>

          <input
            v-model="senha"
            type="password"
            placeholder="Mínimo de 6 caracteres"
            autocomplete="new-password"
            required
          />
        </div>

        <div class="form-group">
          <label>Confirmar senha</label>

          <input
            v-model="confirmarSenha"
            type="password"
            placeholder="Digite a senha novamente"
            autocomplete="new-password"
            required
          />
        </div>

        <div v-if="erro" class="alert alert-error">
          {{ erro }}
        </div>

        <button
          type="submit"
          class="primary-button"
          :disabled="carregando"
        >
          {{ carregando ? "Criando conta..." : "Criar minha conta" }}
        </button>
      </form>

      <p class="login-text">
        Já possui uma conta?

        <router-link to="/login">
          Fazer login
        </router-link>
      </p>

      <router-link to="/menu" class="back-link">
        ← Voltar para o cardápio
      </router-link>
    </section>
  </div>
</template>

<script>
import { cadastrar } from "@/services/auth";

export default {
  name: "CadastroView",

  data() {
    return {
      nome: "",
      email: "",
      senha: "",
      confirmarSenha: "",
      carregando: false,
      erro: "",
    };
  },

  methods: {
    async criarConta() {
      this.erro = "";

      if (this.nome.length < 3) {
        this.erro = "Informe seu nome completo.";
        return;
      }

      if (this.senha.length < 6) {
        this.erro = "A senha deve possuir pelo menos 6 caracteres.";
        return;
      }

      if (this.senha !== this.confirmarSenha) {
        this.erro = "As senhas digitadas não são iguais.";
        return;
      }

      try {
        this.carregando = true;

        await cadastrar({
          nome: this.nome,
          email: this.email,
          senha: this.senha,
        });

        await this.$router.push("/menu");
      } catch (error) {
        this.erro =
          error.message || "Não foi possível realizar o cadastro.";
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
  background:
    radial-gradient(circle at top right, #431309 0%, transparent 35%),
    radial-gradient(circle at bottom left, #32100a 0%, transparent 40%),
    #140b09;
}

.auth-card {
  width: 100%;
  max-width: 500px;
  padding: 42px;
  border-radius: 26px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(28, 18, 15, 0.96);
  box-shadow: 0 30px 80px rgba(0, 0, 0, 0.45);
  text-align: left;
}

.brand {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 35px;
  color: white;
}

.brand-icon {
  width: 46px;
  height: 46px;
  display: grid;
  place-items: center;
  border-radius: 14px;
  background: linear-gradient(135deg, #fb6237, #bf2d18);
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
  color: #ad9e99;
  font-size: 10px;
  margin-top: 2px;
  letter-spacing: 1.5px;
  text-transform: uppercase;
}

.auth-heading {
  margin-bottom: 28px;
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
}

.auth-heading p {
  margin: 0;
  color: #b9aaa6;
  line-height: 1.6;
}

.auth-form {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  color: #f6edea;
  font-size: 13px;
  font-weight: 700;
}

.form-group input {
  width: 100%;
  height: 54px;
  padding: 0 16px;
  border: 1px solid #483731;
  border-radius: 13px;
  outline: none;
  background: #211512;
  color: white;
  font-size: 15px;
}

.form-group input:focus {
  border-color: #f45d36;
  box-shadow: 0 0 0 3px rgba(244, 93, 54, 0.12);
}

.primary-button {
  min-height: 55px;
  border: 0;
  border-radius: 14px;
  background: linear-gradient(135deg, #f56239, #c83219);
  color: white;
  font-weight: 800;
  font-size: 15px;
}

.primary-button:disabled {
  opacity: 0.6;
}

.alert {
  padding: 13px 15px;
  border-radius: 11px;
  font-size: 13px;
}

.alert-error {
  color: #ffc8bb;
  background: rgba(180, 43, 18, 0.15);
  border: 1px solid rgba(255, 81, 43, 0.25);
}

.login-text {
  margin-top: 27px;
  text-align: center;
  color: #ad9e99;
  font-size: 14px;
}

.login-text a {
  color: #ff7650;
  font-weight: 800;
}

.back-link {
  margin-top: 25px;
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
  }
}
</style>