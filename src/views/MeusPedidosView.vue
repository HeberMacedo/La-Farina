<template>
  <div class="pedido-page">
    <alerta-component-vue
      :tipo="alerta.tipo"
      :mensagem="alerta.mensagem"
    />

    <form id="pedido-form" @submit.prevent="enviarPedido">
      <div class="pizza-preview">
        <img
          id="foto-content"
          :src="fotoAtual"
          :alt="pizza?.nome || 'Pizza La Farina'"
          @error="tratarErroImagem"
        />

        <div class="pizza-overlay">
          <h1>
            {{ pizza?.nome || "Monte seu pedido" }}
          </h1>

          <p>
            Escolha o tamanho e personalize sua pizza
          </p>
        </div>
      </div>

      <div class="form-card">
        <div class="form-header">
          <span>SEU PEDIDO</span>

          <h2>Personalize sua pizza</h2>

          <p>
            O preço principal é definido pelo tamanho escolhido.
          </p>
        </div>

        <!-- CLIENTE -->
        <div class="inputs">
          <label for="nome-cliente">
            Nome do cliente
          </label>

          <input
            id="nome-cliente"
            v-model.trim="nomeCliente"
            type="text"
            placeholder="Digite o nome do cliente"
          />
        </div>

        <!-- TAMANHO -->
        <div class="inputs">
          <label for="tamanho-pizza">
            Tamanho da pizza
          </label>

          <select
            id="tamanho-pizza"
            v-model="tamanhoSelecionado"
          >
            <option value="">
              Selecione o tamanho
            </option>

            <option
              v-for="tamanho in listaTamanhos"
              :key="tamanho.id"
              :value="tamanho"
            >
              {{ tamanho.descricao }}
              -
              {{ formatarMoeda(tamanho.valor) }}
            </option>
          </select>
        </div>

        <div
          v-if="tamanhoSelecionado"
          class="preco-tamanho"
        >
          <div>
            <small>TAMANHO SELECIONADO</small>

            <strong>
              {{ tamanhoSelecionado.descricao }}
            </strong>
          </div>

          <span>
            {{ formatarMoeda(tamanhoSelecionado.valor) }}
          </span>
        </div>

        <!-- SABORES -->
        <div class="inputs">
          <label>
            Sabores
          </label>

          <p class="ajuda">
            Escolha de 1 até 2 sabores.
          </p>

          <div class="opcoes-grid">
            <label
              v-for="sabor in listaSabores"
              :key="sabor.id"
              class="opcao"
              :class="{
                selecionado: saborSelecionado(sabor)
              }"
            >
              <input
                v-model="listaSaboresSelecionados"
                type="checkbox"
                :value="sabor"
                :disabled="
                  !saborSelecionado(sabor) &&
                  listaSaboresSelecionados.length >= 2
                "
              />

              <div>
                <strong>
                  {{ sabor.nome }}
                </strong>

                <small>
                  {{ sabor.descricao }}
                </small>
              </div>
            </label>
          </div>
        </div>

        <!-- BORDA -->
        <div class="inputs">
          <label for="borda-pizza">
            Borda
          </label>

          <select
            id="borda-pizza"
            v-model="bordaSelecionada"
          >
            <option value="">
              Sem borda recheada
            </option>

            <option
              v-for="borda in listaBordas"
              :key="borda.id"
              :value="borda"
            >
              {{ borda.nome }}
              -
              + {{ formatarMoeda(borda.valor) }}
            </option>
          </select>
        </div>

        <!-- BEBIDAS -->
        <div class="inputs">
          <label>
            Bebidas
          </label>

          <div class="opcoes-grid">
            <label
              v-for="bebida in listaBebidas"
              :key="bebida.id"
              class="opcao"
              :class="{
                selecionado: bebidaSelecionada(bebida)
              }"
            >
              <input
                v-model="listaBebidasSelecionadas"
                type="checkbox"
                :value="bebida"
              />

              <div>
                <strong>
                  {{ bebida.nome }}
                </strong>

                <small>
                  + {{ formatarMoeda(bebida.valor) }}
                </small>
              </div>
            </label>
          </div>
        </div>

        <!-- OBSERVAÇÃO -->
        <div class="inputs">
          <label for="observacao">
            Observação
          </label>

          <textarea
            id="observacao"
            v-model="observacao"
            maxlength="300"
            placeholder="Ex.: sem cebola, cortar em mais pedaços..."
          ></textarea>
        </div>

        <!-- RESUMO -->
        <div class="resumo">
          <h3>Resumo do pedido</h3>

          <div class="resumo-linha">
            <span>Pizza</span>
            <strong>{{ pizza?.nome || "--" }}</strong>
          </div>

          <div class="resumo-linha">
            <span>Tamanho</span>

            <strong>
              {{
                tamanhoSelecionado
                  ? tamanhoSelecionado.descricao
                  : "Não selecionado"
              }}
            </strong>
          </div>

          <div
            v-if="tamanhoSelecionado"
            class="resumo-linha"
          >
            <span>Valor</span>

            <strong>
              {{ formatarMoeda(tamanhoSelecionado.valor) }}
            </strong>
          </div>

          <div class="resumo-linha">
            <span>Sabores</span>

            <strong>
              {{
                listaSaboresSelecionados.length
                  ? listaSaboresSelecionados
                      .map((item) => item.nome)
                      .join(", ")
                  : "Nenhum"
              }}
            </strong>
          </div>

          <div class="resumo-linha">
            <span>Borda</span>

            <strong>
              {{
                bordaSelecionada
                  ? `${bordaSelecionada.nome} (+ ${formatarMoeda(
                      bordaSelecionada.valor
                    )})`
                  : "Sem borda"
              }}
            </strong>
          </div>

          <div
            v-for="bebida in listaBebidasSelecionadas"
            :key="`bebida-${bebida.id}`"
            class="resumo-linha"
          >
            <span>{{ bebida.nome }}</span>

            <strong>
              + {{ formatarMoeda(bebida.valor) }}
            </strong>
          </div>

          <div class="resumo-total">
            <span>Total</span>

            <strong>
              {{ formatarMoeda(totalPedido) }}
            </strong>
          </div>
        </div>

        <!-- ERRO PRÓXIMO DO BOTÃO -->
        <div
          v-if="erroPedido"
          class="erro-pedido"
        >
          {{ erroPedido }}
        </div>

        <button
          type="submit"
          class="submit-btn"
          :disabled="enviando"
        >
          <template v-if="enviando">
            Enviando pedido...
          </template>

          <template v-else>
            Confirmar Pedido -
            {{ formatarMoeda(totalPedido) }}
          </template>
        </button>
      </div>
    </form>
  </div>
</template>

<script>
import AlertaComponentVue from "@/components/AlertaComponent.vue";

import {
  obterUsuarioAtual,
} from "@/services/auth";

import {
  criarPedido,
} from "@/services/pedidos";

import {
  get,
} from "@/services/api";

export default {
  name: "PedidoComponent",

  components: {
    AlertaComponentVue,
  },

  props: {
    pizza: {
      type: Object,
      default: null,
    },
  },

  data() {
    return {
      listaTamanhos: [],
      listaSabores: [],
      listaBordas: [],
      listaBebidas: [],

      usuario: null,

      nomeCliente: "",
      tamanhoSelecionado: "",
      bordaSelecionada: "",

      listaSaboresSelecionados: [],
      listaBebidasSelecionadas: [],

      observacao: "",

      enviando: false,

      erroPedido: "",

      imagemComErro: false,
      tentouFallback: false,

      imagemFallback:
        "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=1200&q=85",

      alerta: {
        tipo: "info",
        mensagem:
          "Escolha o tamanho e personalize sua pizza.",
      },
    };
  },

  computed: {
    fotoAtual() {
      if (
        !this.imagemComErro &&
        this.pizza?.foto
      ) {
        return this.pizza.foto;
      }

      if (!this.tentouFallback) {
        return this.imagemFallback;
      }

      return `${process.env.BASE_URL}img/logo_tpizza.svg`;
    },

    totalPedido() {
      let total = 0;

      total += Number(
        this.tamanhoSelecionado?.valor || 0
      );

      total += Number(
        this.bordaSelecionada?.valor || 0
      );

      total += this.listaBebidasSelecionadas.reduce(
        (soma, bebida) =>
          soma + Number(bebida.valor || 0),
        0
      );

      return total;
    },
  },

  watch: {
    pizza: {
      immediate: true,

      handler() {
        this.imagemComErro = false;
        this.tentouFallback = false;
      },
    },
  },

  async mounted() {
    this.usuario = obterUsuarioAtual();

    if (!this.usuario) {
      await this.$router.push({
        name: "login",
        query: {
          redirect: this.$route.fullPath,
        },
      });

      return;
    }

    this.nomeCliente =
      this.usuario.nome || "";

    await this.carregarDados();
  },

  methods: {
    exibirAlerta(tipo, mensagem) {
      this.alerta = {
        tipo,
        mensagem,
      };
    },

    tratarErroImagem(event) {
      if (!this.imagemComErro) {
        this.imagemComErro = true;

        event.target.src =
          this.imagemFallback;

        return;
      }

      if (!this.tentouFallback) {
        this.tentouFallback = true;

        event.target.src =
          `${process.env.BASE_URL}img/logo_tpizza.svg`;

        return;
      }

      event.target.onerror = null;
    },

    async carregarDados() {
      try {
        const [tamanhos, opcionais] =
          await Promise.all([
            get("/tamanhos"),
            get("/opcionais"),
          ]);

        this.listaTamanhos =
          tamanhos || [];

        this.listaSabores =
          opcionais?.sabores || [];

        this.listaBordas =
          opcionais?.bordas || [];

        this.listaBebidas =
          opcionais?.bebidas || [];
      } catch (error) {
        console.error(
          "Erro ao carregar dados do pedido:",
          error
        );

        this.erroPedido =
          "Não foi possível carregar os dados do pedido.";

        this.exibirAlerta(
          "erro",
          this.erroPedido
        );
      }
    },

    saborSelecionado(sabor) {
      return this.listaSaboresSelecionados.some(
        (item) =>
          Number(item.id) ===
          Number(sabor.id)
      );
    },

    bebidaSelecionada(bebida) {
      return this.listaBebidasSelecionadas.some(
        (item) =>
          Number(item.id) ===
          Number(bebida.id)
      );
    },

    validarPedido() {
      this.erroPedido = "";

      if (!this.usuario) {
        this.erroPedido =
          "Você precisa estar logado para fazer o pedido.";

        return false;
      }

      if (!this.pizza?.id) {
        this.erroPedido =
          "Selecione uma pizza no cardápio.";

        return false;
      }

      if (!this.nomeCliente.trim()) {
        this.erroPedido =
          "Informe o nome do cliente.";

        return false;
      }

      if (!this.tamanhoSelecionado) {
        this.erroPedido =
          "Escolha o tamanho da pizza.";

        return false;
      }

      if (
        this.listaSaboresSelecionados.length === 0
      ) {
        this.erroPedido =
          "Escolha pelo menos um sabor.";

        return false;
      }

      if (
        this.listaSaboresSelecionados.length > 2
      ) {
        this.erroPedido =
          "Escolha no máximo dois sabores.";

        return false;
      }

      if (this.totalPedido <= 0) {
        this.erroPedido =
          "O valor do pedido está inválido. Escolha novamente o tamanho.";

        return false;
      }

      return true;
    },

    async enviarPedido() {
      this.erroPedido = "";

      if (!this.validarPedido()) {
        this.exibirAlerta(
          "erro",
          this.erroPedido
        );

        return;
      }

      this.enviando = true;

      const agora =
        new Date().toISOString();

      const pedido = {
        usuarioId: this.usuario.id,

        nome:
          this.nomeCliente.trim(),

        tamanho: {
          id:
            this.tamanhoSelecionado.id,

          descricao:
            this.tamanhoSelecionado.descricao,

          valor: Number(
            this.tamanhoSelecionado.valor
          ),
        },

        sabores:
          this.listaSaboresSelecionados.map(
            (sabor) => ({
              ...sabor,
            })
          ),

        borda:
          this.bordaSelecionada
            ? {
                ...this.bordaSelecionada,
                valor: Number(
                  this.bordaSelecionada.valor || 0
                ),
              }
            : null,

        bebidas:
          this.listaBebidasSelecionadas.map(
            (bebida) => ({
              ...bebida,
              valor: Number(
                bebida.valor || 0
              ),
            })
          ),

        pizza: {
          ...this.pizza,
          valor: 0,
        },

        statusId: 5,

        total: Number(
          this.totalPedido
        ),

        observacao:
          this.observacao.trim(),

        dataPedido: agora,

        atualizadoEm: agora,
      };

      try {
        const pedidoCriado =
          await criarPedido(pedido);

        console.log(
          "Pedido criado:",
          pedidoCriado
        );

        this.exibirAlerta(
          "sucesso",
          `Pedido realizado com sucesso! Total: ${this.formatarMoeda(
            this.totalPedido
          )}`
        );

        setTimeout(() => {
          this.$router.push(
            "/meus-pedidos"
          );
        }, 800);
      } catch (error) {
        console.error(
          "Erro ao criar pedido:",
          error
        );

        this.erroPedido =
          error?.message ||
          "Não foi possível realizar o pedido.";

        this.exibirAlerta(
          "erro",
          this.erroPedido
        );
      } finally {
        this.enviando = false;
      }
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
  },
};
</script>

<style scoped>
.pedido-page {
  width: min(1050px, calc(100% - 32px));
  margin: 40px auto 70px;
  text-align: left;
}

#pedido-form {
  width: 100%;
}

.pizza-preview {
  position: relative;
  height: 320px;
  overflow: hidden;
  margin-bottom: 25px;
  border-radius: 20px;
  background: #211511;
  box-shadow:
    0 18px 50px
    rgba(44, 22, 15, 0.18);
}

#foto-content {
  width: 100%;
  height: 100%;
  display: block;
  object-fit: cover;
}

.pizza-preview::after {
  content: "";
  position: absolute;
  inset: 0;
  background:
    linear-gradient(
      transparent 25%,
      rgba(0, 0, 0, 0.85)
    );
}

.pizza-overlay {
  position: absolute;
  z-index: 2;
  left: 30px;
  right: 30px;
  bottom: 27px;
}

.pizza-overlay h1 {
  margin: 0 0 5px;
  color: white;
  font-size: 38px;
}

.pizza-overlay p {
  margin: 0;
  color: #f0dcd5;
}

.form-card {
  width: min(760px, 100%);
  margin: auto;
  padding: 32px;
  border: 1px solid #eadfd9;
  border-radius: 20px;
  background: white;
  box-shadow:
    0 12px 40px
    rgba(45, 26, 20, 0.07);
}

.form-header {
  margin-bottom: 30px;
}

.form-header > span {
  color: #dc4b29;
  font-size: 11px;
  font-weight: 900;
  letter-spacing: 2px;
}

.form-header h2 {
  margin: 6px 0;
  color: #281914;
  font-size: 28px;
}

.form-header p {
  margin: 0;
  color: #83736d;
}

.inputs {
  display: flex;
  flex-direction: column;
  margin-bottom: 25px;
}

.inputs > label {
  margin-bottom: 9px;
  color: #3f2e28;
  font-size: 13px;
  font-weight: 900;
}

input,
select,
textarea {
  width: 100%;
  border: 1px solid #ded2cd;
  border-radius: 11px;
  outline: none;
  background: white;
  color: #392721;
  font-size: 14px;
}

input,
select {
  min-height: 48px;
  padding: 0 13px;
}

textarea {
  min-height: 105px;
  padding: 13px;
  resize: vertical;
}

input:focus,
select:focus,
textarea:focus {
  border-color: #df4b29;
  box-shadow:
    0 0 0 3px
    rgba(223, 75, 41, 0.1);
}

.preco-tamanho {
  margin: -10px 0 25px;
  padding: 16px 18px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border: 1px solid #f1c9bc;
  border-radius: 13px;
  background: #fff5f1;
}

.preco-tamanho small {
  display: block;
  color: #ae7665;
  font-size: 9px;
  font-weight: 900;
}

.preco-tamanho strong {
  color: #463029;
}

.preco-tamanho > span {
  color: #d74724;
  font-size: 22px;
  font-weight: 900;
}

.ajuda {
  margin: -3px 0 12px;
  color: #8c7b75;
  font-size: 12px;
}

.opcoes-grid {
  display: grid;
  grid-template-columns:
    repeat(auto-fit, minmax(220px, 1fr));
  gap: 10px;
}

.opcao {
  min-height: 65px;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px;
  border: 1px solid #e9dfdb;
  border-radius: 12px;
  background: #fbf9f8;
  cursor: pointer;
}

.opcao.selecionado {
  border-color: #e35331;
  background: #fff3ef;
}

.opcao input {
  width: 17px;
  height: 17px;
  min-height: auto;
}

.opcao strong,
.opcao small {
  display: block;
}

.opcao strong {
  margin-bottom: 3px;
  color: #3c2a24;
}

.opcao small {
  color: #8a7872;
  font-size: 11px;
}

.resumo {
  margin: 10px 0 22px;
  padding: 20px;
  border-radius: 15px;
  background: #faf6f4;
}

.resumo h3 {
  margin: 0 0 15px;
}

.resumo-linha {
  padding: 8px 0;
  display: flex;
  justify-content: space-between;
  gap: 20px;
  border-bottom: 1px solid #eee3df;
}

.resumo-linha span {
  color: #887670;
}

.resumo-linha strong {
  text-align: right;
  color: #44312a;
}

.resumo-total {
  margin-top: 12px;
  padding-top: 14px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.resumo-total span {
  font-weight: 900;
}

.resumo-total strong {
  color: #d94725;
  font-size: 25px;
}

.erro-pedido {
  margin-bottom: 14px;
  padding: 13px;
  border: 1px solid #f2b8ae;
  border-radius: 10px;
  background: #fff0ed;
  color: #aa3926;
  font-size: 13px;
  font-weight: 700;
}

.submit-btn {
  width: 100%;
  min-height: 56px;
  border: none;
  border-radius: 13px;
  background:
    linear-gradient(
      135deg,
      #f15b34,
      #c8351b
    );
  color: white;
  font-size: 15px;
  font-weight: 900;
  cursor: pointer;
}

.submit-btn:hover:not(:disabled) {
  transform: translateY(-2px);
}

.submit-btn:disabled {
  opacity: 0.6;
  cursor: wait;
}

@media (max-width: 650px) {
  .pedido-page {
    width: calc(100% - 22px);
  }

  .pizza-preview {
    height: 240px;
  }

  .pizza-overlay {
    left: 18px;
    right: 18px;
    bottom: 18px;
  }

  .pizza-overlay h1 {
    font-size: 27px;
  }

  .form-card {
    padding: 22px 17px;
  }

  .opcoes-grid {
    grid-template-columns: 1fr;
  }
}
</style>