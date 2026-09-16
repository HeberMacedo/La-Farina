<template>
  <div class="pedido-page">
    <alerta-component-vue
      :tipo="alerta.tipo"
      :mensagem="alerta.mensagem"
    />

    <form
      id="pedido-form"
      @submit.prevent="enviarPedido"
    >
      <!-- PIZZA ESCOLHIDA -->
      <div class="pizza-preview">
        <img
          id="foto-content"
          :src="fotoAtual"
          :alt="pizza?.nome || 'Pizza La Farina'"
          @error="tratarErroImagem"
        />

        <div class="pizza-overlay">
          <span>
            SUA ESCOLHA
          </span>

          <h1>
            {{
              pizza?.nome ||
              "Pizza selecionada"
            }}
          </h1>

          <p>
            {{
              pizza?.descricao ||
              ""
            }}
          </p>
        </div>
      </div>

      <div class="form-card">
        <div class="form-header">
          <span>
            SEU PEDIDO
          </span>

          <h2>
            Complete seu pedido
          </h2>

          <p>
            Escolha o tamanho, a borda,
            as bebidas e adicione uma
            observação se desejar.
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

        <!-- PIZZA -->
        <div class="pizza-selected">
          <div>
            <small>
              PIZZA ESCOLHIDA
            </small>

            <strong>
              {{ pizza?.nome }}
            </strong>
          </div>

          <router-link
            to="/menu"
            class="change-pizza"
          >
            Trocar pizza
          </router-link>
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
              {{
                formatarMoeda(
                  tamanho.valor
                )
              }}
            </option>
          </select>
        </div>

        <div
          v-if="tamanhoSelecionado"
          class="preco-tamanho"
        >
          <div>
            <small>
              TAMANHO SELECIONADO
            </small>

            <strong>
              {{
                tamanhoSelecionado
                  .descricao
              }}
            </strong>
          </div>

          <span>
            {{
              formatarMoeda(
                tamanhoSelecionado
                  .valor
              )
            }}
          </span>
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
              +
              {{
                formatarMoeda(
                  borda.valor
                )
              }}
            </option>
          </select>
        </div>

        <!-- BEBIDAS -->
        <div class="inputs">
          <label>
            Bebidas
          </label>

          <p class="ajuda">
            Selecione uma ou mais bebidas,
            se desejar.
          </p>

          <div class="opcoes-grid">
            <label
              v-for="bebida in listaBebidas"
              :key="bebida.id"
              class="opcao"
              :class="{
                selecionado:
                  bebidaSelecionada(
                    bebida
                  )
              }"
            >
              <input
                v-model="
                  listaBebidasSelecionadas
                "
                type="checkbox"
                :value="bebida"
              />

              <div>
                <strong>
                  {{ bebida.nome }}
                </strong>

                <small>
                  +
                  {{
                    formatarMoeda(
                      bebida.valor
                    )
                  }}
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
            placeholder="Ex.: sem cebola, bem assada, cortar em mais pedaços..."
          ></textarea>
        </div>

        <!-- RESUMO -->
        <div class="resumo">
          <h3>
            Resumo do pedido
          </h3>

          <div class="resumo-linha">
            <span>
              Pizza
            </span>

            <strong>
              {{
                pizza?.nome ||
                "--"
              }}
            </strong>
          </div>

          <div class="resumo-linha">
            <span>
              Tamanho
            </span>

            <strong>
              {{
                tamanhoSelecionado
                  ? tamanhoSelecionado
                      .descricao
                  : "Não selecionado"
              }}
            </strong>
          </div>

          <div
            v-if="
              tamanhoSelecionado
            "
            class="resumo-linha"
          >
            <span>
              Valor da pizza
            </span>

            <strong>
              {{
                formatarMoeda(
                  tamanhoSelecionado
                    .valor
                )
              }}
            </strong>
          </div>

          <div class="resumo-linha">
            <span>
              Borda
            </span>

            <strong>
              {{
                bordaSelecionada
                  ? bordaSelecionada
                      .nome
                  : "Sem borda"
              }}
            </strong>
          </div>

          <div
            v-if="bordaSelecionada"
            class="resumo-linha"
          >
            <span>
              Valor da borda
            </span>

            <strong>
              +
              {{
                formatarMoeda(
                  bordaSelecionada
                    .valor
                )
              }}
            </strong>
          </div>

          <div
            v-for="
              bebida in
              listaBebidasSelecionadas
            "
            :key="
              `bebida-${bebida.id}`
            "
            class="resumo-linha"
          >
            <span>
              {{ bebida.nome }}
            </span>

            <strong>
              +
              {{
                formatarMoeda(
                  bebida.valor
                )
              }}
            </strong>
          </div>

          <div class="resumo-total">
            <span>
              Total
            </span>

            <strong>
              {{
                formatarMoeda(
                  totalPedido
                )
              }}
            </strong>
          </div>
        </div>

        <!-- ERRO -->
        <div
          v-if="erroPedido"
          class="erro-pedido"
        >
          {{ erroPedido }}
        </div>

        <!-- CONFIRMAR -->
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
            {{
              formatarMoeda(
                totalPedido
              )
            }}
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

      listaBordas: [],

      listaBebidas: [],

      usuario: null,

      nomeCliente: "",

      tamanhoSelecionado: "",

      bordaSelecionada: "",

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
          "Confira sua pizza e complete os detalhes do pedido.",
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

      if (
        !this.tentouFallback
      ) {
        return this.imagemFallback;
      }

      return `${process.env.BASE_URL}img/logo_tpizza.svg`;
    },

    totalPedido() {
      let total = 0;

      total += Number(
        this.tamanhoSelecionado
          ?.valor || 0
      );

      total += Number(
        this.bordaSelecionada
          ?.valor || 0
      );

      total +=
        this.listaBebidasSelecionadas
          .reduce(
            (
              soma,
              bebida
            ) =>
              soma +
              Number(
                bebida.valor ||
                  0
              ),
            0
          );

      return total;
    },
  },

  watch: {
    pizza: {
      immediate: true,

      handler() {
        this.imagemComErro =
          false;

        this.tentouFallback =
          false;
      },
    },
  },

  async mounted() {
    this.usuario =
      obterUsuarioAtual();

    if (!this.usuario) {
      await this.$router.push({
        name: "login",

        query: {
          redirect:
            this.$route.fullPath,
        },
      });

      return;
    }

    /*
    |--------------------------------------------------------------------------
    | Não existe pedido sem pizza
    |--------------------------------------------------------------------------
    */

    if (!this.pizza?.id) {
      await this.$router.replace(
        "/menu"
      );

      return;
    }

    this.nomeCliente =
      this.usuario.nome || "";

    await this.carregarDados();
  },

  methods: {
    exibirAlerta(
      tipo,
      mensagem
    ) {
      this.alerta = {
        tipo,
        mensagem,
      };
    },

    tratarErroImagem(
      event
    ) {
      if (
        !this.imagemComErro
      ) {
        this.imagemComErro =
          true;

        event.target.src =
          this.imagemFallback;

        return;
      }

      if (
        !this.tentouFallback
      ) {
        this.tentouFallback =
          true;

        event.target.src =
          `${process.env.BASE_URL}img/logo_tpizza.svg`;

        return;
      }

      event.target.onerror =
        null;
    },

    async carregarDados() {
      try {
        const [
          tamanhos,
          opcionais,
        ] =
          await Promise.all([
            get("/tamanhos"),

            get("/opcionais"),
          ]);

        this.listaTamanhos =
          tamanhos || [];

        this.listaBordas =
          opcionais?.bordas ||
          [];

        this.listaBebidas =
          opcionais?.bebidas ||
          [];
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

    bebidaSelecionada(
      bebida
    ) {
      return (
        this.listaBebidasSelecionadas
          .some(
            (item) =>
              Number(
                item.id
              ) ===
              Number(
                bebida.id
              )
          )
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
          "Escolha uma pizza no cardápio.";

        return false;
      }

      if (
        !this.nomeCliente.trim()
      ) {
        this.erroPedido =
          "Informe o nome do cliente.";

        return false;
      }

      if (
        !this.tamanhoSelecionado
      ) {
        this.erroPedido =
          "Escolha o tamanho da pizza.";

        return false;
      }

      if (
        this.totalPedido <= 0
      ) {
        this.erroPedido =
          "O valor do pedido está inválido.";

        return false;
      }

      return true;
    },

    async enviarPedido() {
      this.erroPedido = "";

      if (
        !this.validarPedido()
      ) {
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
        usuarioId:
          this.usuario.id,

        nome:
          this.nomeCliente.trim(),

        /*
        |--------------------------------------------------------------------------
        | Pizza/sabor escolhido no cardápio
        |--------------------------------------------------------------------------
        */

        pizza: {
          ...this.pizza,

          valor: 0,
        },

        /*
        |--------------------------------------------------------------------------
        | Não existe mais seleção duplicada de sabores
        |--------------------------------------------------------------------------
        */

        sabores: [],

        tamanho: {
          id:
            this.tamanhoSelecionado
              .id,

          descricao:
            this.tamanhoSelecionado
              .descricao,

          valor:
            Number(
              this.tamanhoSelecionado
                .valor
            ),
        },

        borda:
          this.bordaSelecionada
            ? {
                ...this
                  .bordaSelecionada,

                valor:
                  Number(
                    this
                      .bordaSelecionada
                      .valor || 0
                  ),
              }
            : null,

        bebidas:
          this.listaBebidasSelecionadas
            .map(
              (bebida) => ({
                ...bebida,

                valor:
                  Number(
                    bebida.valor ||
                      0
                  ),
              })
            ),

        statusId: 5,

        total:
          Number(
            this.totalPedido
          ),

        observacao:
          this.observacao.trim(),

        dataPedido:
          agora,

        atualizadoEm:
          agora,
      };

      try {
        const pedidoCriado =
          await criarPedido(
            pedido
          );

        console.log(
          "Pedido criado:",
          pedidoCriado
        );

        this.exibirAlerta(
          "sucesso",
          "Pedido realizado com sucesso!"
        );

        /*
        |--------------------------------------------------------------------------
        | Depois de confirmar → MEUS PEDIDOS
        |--------------------------------------------------------------------------
        */

        setTimeout(() => {
          this.$router.push(
            "/meus-pedidos"
          );
        }, 700);
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
        this.enviando =
          false;
      }
    },

    formatarMoeda(valor) {
      return Number(
        valor || 0
      ).toLocaleString(
        "pt-BR",
        {
          style:
            "currency",

          currency:
            "BRL",
        }
      );
    },
  },
};
</script>

<style scoped>
.pedido-page {
  width:
    min(
      1050px,
      calc(100% - 32px)
    );

  margin:
    40px auto 70px;

  text-align: left;
}

#pedido-form {
  width: 100%;
}

/*
|--------------------------------------------------------------------------
| PIZZA
|--------------------------------------------------------------------------
*/

.pizza-preview {
  position: relative;

  height: 320px;

  overflow: hidden;

  margin-bottom:
    25px;

  border-radius:
    20px;

  background:
    #211511;

  box-shadow:
    0 18px 50px
    rgba(
      44,
      22,
      15,
      0.18
    );
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
      transparent 20%,
      rgba(
        0,
        0,
        0,
        0.88
      )
    );
}

.pizza-overlay {
  position: absolute;

  z-index: 2;

  left: 30px;
  right: 30px;
  bottom: 27px;
}

.pizza-overlay span {
  display: block;

  margin-bottom:
    6px;

  color: #ffb59e;

  font-size: 10px;

  font-weight: 900;

  letter-spacing:
    2px;
}

.pizza-overlay h1 {
  margin:
    0 0 7px;

  color: white;

  font-size: 38px;
}

.pizza-overlay p {
  max-width: 650px;

  margin: 0;

  color: #f0dcd5;

  font-size: 13px;

  line-height: 1.5;
}

/*
|--------------------------------------------------------------------------
| CARD
|--------------------------------------------------------------------------
*/

.form-card {
  width:
    min(
      760px,
      100%
    );

  margin: auto;

  padding: 32px;

  border:
    1px solid #eadfd9;

  border-radius:
    20px;

  background: white;

  box-shadow:
    0 12px 40px
    rgba(
      45,
      26,
      20,
      0.07
    );
}

.form-header {
  margin-bottom:
    30px;
}

.form-header > span {
  color: #dc4b29;

  font-size: 11px;

  font-weight: 900;

  letter-spacing:
    2px;
}

.form-header h2 {
  margin:
    6px 0 7px;

  color: #281914;

  font-size: 28px;
}

.form-header p {
  margin: 0;

  color: #83736d;

  line-height: 1.5;
}

/*
|--------------------------------------------------------------------------
| PIZZA SELECIONADA
|--------------------------------------------------------------------------
*/

.pizza-selected {
  margin-bottom:
    25px;

  padding:
    16px 18px;

  display: flex;

  align-items: center;

  justify-content:
    space-between;

  gap: 20px;

  border:
    1px solid #e9d8d1;

  border-radius:
    13px;

  background:
    #fff8f5;
}

.pizza-selected small {
  display: block;

  margin-bottom:
    4px;

  color: #aa7665;

  font-size: 9px;

  font-weight: 900;

  letter-spacing:
    1.3px;
}

.pizza-selected strong {
  color: #402d26;

  font-size: 15px;
}

.change-pizza {
  flex-shrink: 0;

  color: #d94725;

  font-size: 11px;

  font-weight: 900;

  text-decoration: none;
}

/*
|--------------------------------------------------------------------------
| CAMPOS
|--------------------------------------------------------------------------
*/

.inputs {
  display: flex;

  flex-direction:
    column;

  margin-bottom:
    25px;
}

.inputs > label {
  margin-bottom:
    9px;

  color: #3f2e28;

  font-size: 13px;

  font-weight: 900;
}

input,
select,
textarea {
  width: 100%;

  border:
    1px solid #ded2cd;

  border-radius:
    11px;

  outline: none;

  background: white;

  color: #392721;

  font-size: 14px;

  box-sizing:
    border-box;
}

input,
select {
  min-height:
    48px;

  padding:
    0 13px;
}

textarea {
  min-height:
    105px;

  padding: 13px;

  resize: vertical;
}

input:focus,
select:focus,
textarea:focus {
  border-color:
    #df4b29;

  box-shadow:
    0 0 0 3px
    rgba(
      223,
      75,
      41,
      0.1
    );
}

/*
|--------------------------------------------------------------------------
| TAMANHO
|--------------------------------------------------------------------------
*/

.preco-tamanho {
  margin:
    -10px 0 25px;

  padding:
    16px 18px;

  display: flex;

  justify-content:
    space-between;

  align-items:
    center;

  gap: 20px;

  border:
    1px solid #f1c9bc;

  border-radius:
    13px;

  background:
    #fff5f1;
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

/*
|--------------------------------------------------------------------------
| BEBIDAS
|--------------------------------------------------------------------------
*/

.ajuda {
  margin:
    -3px 0 12px;

  color: #8c7b75;

  font-size: 12px;
}

.opcoes-grid {
  display: grid;

  grid-template-columns:
    repeat(
      auto-fit,
      minmax(
        220px,
        1fr
      )
    );

  gap: 10px;
}

.opcao {
  min-height: 65px;

  display: flex;

  align-items:
    center;

  gap: 10px;

  padding: 12px;

  border:
    1px solid #e9dfdb;

  border-radius:
    12px;

  background:
    #fbf9f8;

  cursor: pointer;
}

.opcao.selecionado {
  border-color:
    #e35331;

  background:
    #fff3ef;
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
  margin-bottom:
    3px;

  color: #3c2a24;
}

.opcao small {
  color: #8a7872;

  font-size: 11px;
}

/*
|--------------------------------------------------------------------------
| RESUMO
|--------------------------------------------------------------------------
*/

.resumo {
  margin:
    10px 0 22px;

  padding: 20px;

  border-radius:
    15px;

  background:
    #faf6f4;
}

.resumo h3 {
  margin:
    0 0 15px;

  color: #33231d;
}

.resumo-linha {
  padding:
    8px 0;

  display: flex;

  justify-content:
    space-between;

  gap: 20px;

  border-bottom:
    1px solid #eee3df;
}

.resumo-linha span {
  color: #887670;
}

.resumo-linha strong {
  color: #44312a;

  text-align: right;
}

.resumo-total {
  margin-top:
    12px;

  padding-top:
    14px;

  display: flex;

  justify-content:
    space-between;

  align-items:
    center;
}

.resumo-total span {
  font-weight: 900;
}

.resumo-total strong {
  color: #d94725;

  font-size: 25px;
}

/*
|--------------------------------------------------------------------------
| ERRO
|--------------------------------------------------------------------------
*/

.erro-pedido {
  margin-bottom:
    14px;

  padding: 13px;

  border:
    1px solid #f2b8ae;

  border-radius:
    10px;

  background:
    #fff0ed;

  color: #aa3926;

  font-size: 13px;

  font-weight: 700;
}

/*
|--------------------------------------------------------------------------
| BOTÃO
|--------------------------------------------------------------------------
*/

.submit-btn {
  width: 100%;

  min-height: 56px;

  border: none;

  border-radius:
    13px;

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

  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease;
}

.submit-btn:hover:not(
  :disabled
) {
  transform:
    translateY(-2px);

  box-shadow:
    0 10px 25px
    rgba(
      199,
      51,
      27,
      0.23
    );
}

.submit-btn:disabled {
  opacity: 0.6;

  cursor: wait;
}

/*
|--------------------------------------------------------------------------
| MOBILE
|--------------------------------------------------------------------------
*/

@media (
  max-width: 650px
) {
  .pedido-page {
    width:
      calc(
        100% - 22px
      );
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
    padding:
      22px 17px;
  }

  .pizza-selected {
    align-items:
      flex-start;

    flex-direction:
      column;
  }

  .opcoes-grid {
    grid-template-columns:
      1fr;
  }

  .resumo-linha {
    align-items:
      flex-start;

    flex-direction:
      column;

    gap: 4px;
  }

  .resumo-linha strong {
    text-align: left;
  }
}
</style>