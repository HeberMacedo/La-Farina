<template>
  <div class="pedido-page">
    <alerta-component-vue
      :tipo="alerta.tipo"
      :mensagem="alerta.mensagem"
    />

    <form id="pedido-form" @submit.prevent="criarPedido">
      <!-- FOTO DA PIZZA -->
      <div class="pizza-preview">
        <img
          id="foto-content"
          :src="fotoAtual"
          :alt="pizza?.nome || 'Pizza T-Pizza'"
          @error="tratarErroImagem"
        />

        <div class="pizza-overlay">
          <p id="nome-pizza-content">
            {{
              pizza && pizza.nome
                ? pizza.nome
                : "Monte seu pedido"
            }}
          </p>

          <p
            v-if="pizza && pizza.valor"
            class="pizza-preco"
          >
            {{ formatarMoeda(pizza.valor) }}
          </p>
        </div>
      </div>

      <div class="form-card">
        <div class="form-header">
          <span>SEU PEDIDO</span>

          <h2>Personalize sua pizza</h2>

          <p>
            Escolha o tamanho, sabores, borda e bebida.
          </p>
        </div>

        <!-- CLIENTE -->
        <div class="inputs">
          <label for="nome-cliente">
            Nome do Cliente
          </label>

          <input
            id="nome-cliente"
            v-model="nomeCliente"
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
            name="tamanho-pizza"
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
            </option>
          </select>
        </div>

        <!-- SABORES -->
        <div class="inputs">
          <label>
            Sabores
          </label>

          <p class="campo-ajuda">
            Escolha até 2 sabores.
          </p>

          <div class="opcoes-grid">
            <label
              v-for="sabor in listaSabores"
              :key="sabor.id"
              class="checkbox-container"
              :class="{
                selecionado:
                  saborSelecionado(sabor),
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
            Escolha a borda
          </label>

          <select
            id="borda-pizza"
            v-model="bordaSelecionada"
            name="borda-pizza"
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
              {{ formatarMoeda(borda.valor) }}
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
              class="checkbox-container"
              :class="{
                selecionado:
                  bebidaSelecionada(bebida),
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
                  {{ formatarMoeda(bebida.valor) }}
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
            placeholder="Ex.: sem cebola, cortar em mais pedaços..."
            maxlength="300"
          ></textarea>
        </div>

        <!-- RESUMO -->
        <div class="resumo">
          <div>
            <span>Pizza</span>

            <strong>
              {{
                pizza?.nome ||
                "Não selecionada"
              }}
            </strong>
          </div>

          <div>
            <span>Borda</span>

            <strong>
              {{
                bordaSelecionada
                  ? bordaSelecionada.nome
                  : "Sem borda"
              }}
            </strong>
          </div>

          <div>
            <span>Bebidas</span>

            <strong>
              {{
                listaBebidasSelecionadas.length
              }}
            </strong>
          </div>

          <div class="resumo-total">
            <span>Total</span>

            <strong>
              {{ formatarMoeda(totalPedido) }}
            </strong>
          </div>
        </div>

        <button
          type="submit"
          class="submit-btn"
          :disabled="enviando"
        >
          {{
            enviando
              ? "Enviando pedido..."
              : "Confirmar Pedido"
          }}
        </button>
      </div>
    </form>
  </div>
</template>

<script>
import AlertaComponentVue from "@/components/AlertaComponent.vue";
import { obterUsuarioAtual } from "@/services/auth";

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

      imagemComErro: false,
      tentouFallbackRemoto: false,

      fallbackRemoto:
        "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=1200&q=85",

      alerta: {
        tipo: "info",
        mensagem:
          "Revise os dados do pedido antes de confirmar.",
      },
    };
  },

  computed: {
    fotoAtual() {
      if (
        !this.imagemComErro &&
        this.pizza &&
        this.pizza.foto
      ) {
        return this.pizza.foto;
      }

      if (!this.tentouFallbackRemoto) {
        return this.fallbackRemoto;
      }

      return `${process.env.BASE_URL}img/logo_tpizza.svg`;
    },

    totalPedido() {
      let total = Number(
        this.pizza?.valor || 0
      );

      total += Number(
        this.bordaSelecionada?.valor || 0
      );

      total +=
        this.listaBebidasSelecionadas.reduce(
          (soma, bebida) => {
            return (
              soma +
              Number(bebida.valor || 0)
            );
          },
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
        this.tentouFallbackRemoto = false;
      },
    },
  },

  async mounted() {
    this.usuario = obterUsuarioAtual();

    if (this.usuario) {
      this.nomeCliente =
        this.usuario.nome || "";
    }

    await Promise.all([
      this.getTamanhos(),
      this.getOpcionais(),
    ]);
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
          this.fallbackRemoto;

        return;
      }

      if (!this.tentouFallbackRemoto) {
        this.tentouFallbackRemoto = true;

        event.target.src =
          `${process.env.BASE_URL}img/logo_tpizza.svg`;

        return;
      }

      event.target.onerror = null;
    },

    async getTamanhos() {
      try {
        const response = await fetch(
          `${this.$apiUrl}/tamanhos`
        );

        if (!response.ok) {
          throw new Error();
        }

        this.listaTamanhos =
          await response.json();
      } catch (error) {
        this.exibirAlerta(
          "erro",
          "Não foi possível carregar os tamanhos."
        );
      }
    },

    async getOpcionais() {
      try {
        const response = await fetch(
          `${this.$apiUrl}/opcionais`
        );

        if (!response.ok) {
          throw new Error();
        }

        const dados =
          await response.json();

        this.listaSabores =
          dados.sabores || [];

        this.listaBordas =
          dados.bordas || [];

        this.listaBebidas =
          dados.bebidas || [];
      } catch (error) {
        this.exibirAlerta(
          "erro",
          "Não foi possível carregar os opcionais."
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
      if (!this.pizza || !this.pizza.id) {
        this.exibirAlerta(
          "erro",
          "Selecione uma pizza no cardápio antes de confirmar o pedido."
        );

        return false;
      }

      if (!this.usuario) {
        this.exibirAlerta(
          "erro",
          "Você precisa estar logado para fazer um pedido."
        );

        return false;
      }

      if (!this.nomeCliente.trim()) {
        this.exibirAlerta(
          "erro",
          "Informe o nome do cliente."
        );

        return false;
      }

      if (!this.tamanhoSelecionado) {
        this.exibirAlerta(
          "erro",
          "Escolha o tamanho da pizza."
        );

        return false;
      }

      if (
        this.listaSaboresSelecionados
          .length === 0
      ) {
        this.exibirAlerta(
          "erro",
          "Escolha pelo menos um sabor."
        );

        return false;
      }

      if (
        this.listaSaboresSelecionados
          .length > 2
      ) {
        this.exibirAlerta(
          "aviso",
          "A pizza permite no máximo 2 sabores."
        );

        return false;
      }

      return true;
    },

    async criarPedido() {
      if (!this.validarPedido()) {
        return;
      }

      this.enviando = true;

      const agora =
        new Date().toISOString();

      const dadosPedido = {
        usuarioId: this.usuario.id,

        nome:
          this.nomeCliente.trim(),

        tamanho:
          this.tamanhoSelecionado,

        sabores: Array.from(
          this.listaSaboresSelecionados
        ),

        borda:
          this.bordaSelecionada || null,

        bebidas: Array.from(
          this.listaBebidasSelecionadas
        ),

        pizza: this.pizza,

        statusId: 5,

        total: this.totalPedido,

        observacao:
          this.observacao.trim(),

        dataPedido: agora,

        atualizadoEm: agora,
      };

      try {
        const response = await fetch(
          `${this.$apiUrl}/pedidos`,
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify(
              dadosPedido
            ),
          }
        );

        if (!response.ok) {
          throw new Error(
            "Erro ao cadastrar pedido."
          );
        }

        this.exibirAlerta(
          "sucesso",
          "Pedido realizado com sucesso!"
        );

        setTimeout(() => {
          this.$router.push(
            "/meus-pedidos"
          );
        }, 900);
      } catch (error) {
        this.exibirAlerta(
          "erro",
          "Não foi possível cadastrar o pedido. Tente novamente."
        );
      } finally {
        this.enviando = false;
      }
    },

    formatarMoeda(valor) {
      return Number(
        valor || 0
      ).toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL",
      });
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
  width: 100%;
  height: 320px;
  margin: 0 auto 25px;

  overflow: hidden;

  border-radius: 20px;

  background: #211511;

  box-shadow:
    0 18px 50px rgba(44, 22, 15, 0.18);
}

#foto-content {
  display: block;

  width: 100%;
  height: 100%;

  object-fit: cover;

  background: #211511;
}

.pizza-preview::after {
  content: "";

  position: absolute;
  inset: 0;

  pointer-events: none;

  background:
    linear-gradient(
      180deg,
      transparent 30%,
      rgba(0, 0, 0, 0.78) 100%
    );
}

.pizza-overlay {
  position: absolute;

  left: 30px;
  right: 30px;
  bottom: 27px;

  z-index: 2;

  display: flex;
  align-items: flex-end;
  justify-content: space-between;

  gap: 20px;
}

#nome-pizza-content {
  margin: 0;

  color: white;

  font-size: 38px;
  font-weight: 900;

  line-height: 1.1;
}

.pizza-preco {
  margin: 0;

  white-space: nowrap;

  color: #fff4eb;

  font-size: 23px;
  font-weight: 900;
}

.form-card {
  width: min(760px, 100%);

  margin: 0 auto;

  padding: 32px;

  border: 1px solid #eadfd9;
  border-radius: 20px;

  background: white;

  box-shadow:
    0 12px 40px rgba(45, 26, 20, 0.07);
}

.form-header {
  margin-bottom: 30px;
}

.form-header span {
  color: #dc4b29;

  font-size: 11px;
  font-weight: 900;

  letter-spacing: 2px;
}

.form-header h2 {
  margin: 6px 0 7px;

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

  box-sizing: border-box;

  border: 1px solid #ded2cd;
  border-radius: 11px;

  outline: none;

  background: white;

  color: #392721;

  font-size: 14px;

  transition: 0.2s;
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

.campo-ajuda {
  margin: -3px 0 12px;

  color: #8c7b75;

  font-size: 12px;
}

.opcoes-grid {
  display: grid;

  grid-template-columns:
    repeat(
      auto-fit,
      minmax(220px, 1fr)
    );

  gap: 10px;
}

.checkbox-container {
  min-height: 65px;

  display: flex;
  align-items: center;

  gap: 10px;

  padding: 12px;

  border: 1px solid #e9dfdb;
  border-radius: 12px;

  background: #fbf9f8;

  cursor: pointer;

  transition: 0.2s;
}

.checkbox-container:hover {
  border-color: #efb5a5;
}

.checkbox-container.selecionado {
  border-color: #e35331;

  background: #fff3ef;
}

.checkbox-container input {
  width: 17px;
  height: 17px;

  min-height: auto;

  flex-shrink: 0;
}

.checkbox-container div {
  min-width: 0;
}

.checkbox-container strong {
  display: block;

  margin-bottom: 3px;

  color: #3c2a24;

  font-size: 13px;
}

.checkbox-container small {
  display: block;

  color: #8a7872;

  font-size: 11px;

  line-height: 1.35;
}

.resumo {
  margin-top: 10px;
  margin-bottom: 22px;

  display: grid;

  grid-template-columns:
    repeat(2, 1fr);

  gap: 10px;

  padding: 18px;

  border-radius: 14px;

  background: #faf6f4;
}

.resumo > div {
  padding: 4px;
}

.resumo span {
  display: block;

  margin-bottom: 4px;

  color: #9a8982;

  font-size: 10px;
  font-weight: 800;

  text-transform: uppercase;
  letter-spacing: 1px;
}

.resumo strong {
  color: #43312a;

  font-size: 13px;
}

.resumo-total strong {
  color: #d94725;

  font-size: 20px;
}

.submit-btn {
  width: 100%;

  min-height: 55px;

  border: 0;
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

  box-shadow:
    0 10px 25px
      rgba(199, 51, 27, 0.2);

  transition: 0.2s;
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

    margin-top: 20px;
  }

  .pizza-preview {
    height: 240px;

    border-radius: 15px;
  }

  .pizza-overlay {
    left: 18px;
    right: 18px;
    bottom: 18px;

    align-items: flex-start;
    flex-direction: column;

    gap: 5px;
  }

  #nome-pizza-content {
    font-size: 28px;
  }

  .pizza-preco {
    font-size: 18px;
  }

  .form-card {
    padding: 22px 17px;
  }

  .resumo {
    grid-template-columns: 1fr;
  }

  .opcoes-grid {
    grid-template-columns: 1fr;
  }
}
</style>