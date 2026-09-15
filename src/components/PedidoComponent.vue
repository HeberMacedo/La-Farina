<template>
  <div class="pedido-page">
    <alerta-component-vue
      :tipo="alerta.tipo"
      :mensagem="alerta.mensagem"
    />

    <form id="pedido-form" @submit.prevent="criarPedido">
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

          <span class="pizza-info">
            Escolha o tamanho abaixo
          </span>
        </div>
      </div>

      <div class="form-card">
        <div class="form-header">
          <span>SEU PEDIDO</span>

          <h2>Personalize sua pizza</h2>

          <p>
            O preço da pizza é definido pelo tamanho escolhido.
          </p>
        </div>

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
              {{ tamanho.descricao }} -
              {{ formatarMoeda(tamanho.valor) }}
            </option>
          </select>
        </div>

        <div
          v-if="tamanhoSelecionado"
          class="size-price"
        >
          <div>
            <small>VALOR DA PIZZA</small>

            <strong>
              {{ tamanhoSelecionado.descricao }}
            </strong>
          </div>

          <span>
            {{
              formatarMoeda(
                tamanhoSelecionado.valor
              )
            }}
          </span>
        </div>

        <div class="inputs">
          <label>Sabores</label>

          <p class="campo-ajuda">
            Escolha até 2 sabores. Os sabores não alteram o preço.
          </p>

          <div class="opcoes-grid">
            <label
              v-for="sabor in listaSabores"
              :key="sabor.id"
              class="checkbox-container"
              :class="{
                selecionado: saborSelecionado(sabor),
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

        <div class="inputs">
          <label for="borda-pizza">
            Escolha a borda
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
              {{ borda.nome }} -
              + {{ formatarMoeda(borda.valor) }}
            </option>
          </select>
        </div>

        <div class="inputs">
          <label>Bebidas</label>

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
                  + {{ formatarMoeda(bebida.valor) }}
                </small>
              </div>
            </label>
          </div>
        </div>

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

        <div class="resumo">
          <h3>Resumo do pedido</h3>

          <div class="resumo-linha">
            <span>Pizza</span>

            <strong>
              {{ pizza?.nome || "--" }}
            </strong>
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
            <span>Valor da pizza</span>

            <strong>
              {{
                formatarMoeda(
                  tamanhoSelecionado.valor
                )
              }}
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
                  ? bordaSelecionada.nome
                  : "Sem borda"
              }}
            </strong>
          </div>

          <div
            v-if="bordaSelecionada"
            class="resumo-linha"
          >
            <span>Valor da borda</span>

            <strong>
              +
              {{
                formatarMoeda(
                  bordaSelecionada.valor
                )
              }}
            </strong>
          </div>

          <div
            v-for="bebida in listaBebidasSelecionadas"
            :key="`resumo-bebida-${bebida.id}`"
            class="resumo-linha"
          >
            <span>{{ bebida.nome }}</span>

            <strong>
              + {{ formatarMoeda(bebida.valor) }}
            </strong>
          </div>

          <div class="resumo-total">
            <span>Total do pedido</span>

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
              : `Confirmar Pedido - ${formatarMoeda(totalPedido)}`
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
          "Escolha o tamanho e personalize sua pizza.",
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
        this.tamanhoSelecionado?.valor || 0
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
          "Não foi possível carregar sabores, bordas e bebidas."
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
        this.listaSaboresSelecionados.length === 0
      ) {
        this.exibirAlerta(
          "erro",
          "Escolha pelo menos um sabor."
        );

        return false;
      }

      if (
        this.listaSaboresSelecionados.length > 2
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

        tamanho: {
          id: this.tamanhoSelecionado.id,

          descricao:
            this.tamanhoSelecionado.descricao,

          valor: Number(
            this.tamanhoSelecionado.valor
          ),
        },

        sabores: Array.from(
          this.listaSaboresSelecionados
        ),

        borda:
          this.bordaSelecionada || null,

        bebidas: Array.from(
          this.listaBebidasSelecionadas
        ),

        pizza: {
          ...this.pizza,
          valor: 0,
        },

        statusId: 5,

        total:
          Number(this.totalPedido),

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
          throw new Error();
        }

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
        }, 1000);
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
    0 18px 50px
    rgba(44, 22, 15, 0.18);
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
      transparent 25%,
      rgba(0, 0, 0, 0.82) 100%
    );
}

.pizza-overlay {
  position: absolute;

  left: 30px;
  right: 30px;
  bottom: 27px;

  z-index: 2;
}

#nome-pizza-content {
  margin: 0 0 5px;

  color: white;

  font-size: 38px;
  font-weight: 900;

  line-height: 1.1;
}

.pizza-info {
  color: #f5ded6;

  font-size: 14px;
}

.form-card {
  width: min(760px, 100%);

  margin: 0 auto;

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
  margin: 6px 0 7px;

  color: #281914;

  font-size: 28px;
}

.form-header p {
  margin: 0;

  color: #83736d;

  line-height: 1.5;
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

.size-price {
  margin: -10px 0 25px;

  padding: 16px 18px;

  display: flex;

  align-items: center;
  justify-content: space-between;

  gap: 15px;

  border: 1px solid #f1c9bc;

  border-radius: 13px;

  background: #fff5f1;
}

.size-price small {
  display: block;

  margin-bottom: 4px;

  color: #ae7665;

  font-size: 9px;
  font-weight: 900;

  letter-spacing: 1.3px;
}

.size-price strong {
  color: #463029;

  font-size: 13px;
}

.size-price > span {
  color: #d74724;

  font-size: 22px;
  font-weight: 900;
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

  padding: 20px;

  border-radius: 15px;

  background: #faf6f4;
}

.resumo h3 {
  margin: 0 0 15px;

  color: #33231d;

  font-size: 17px;
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

  font-size: 13px;
}

.resumo-linha strong {
  color: #44312a;

  font-size: 13px;

  text-align: right;
}

.resumo-total {
  margin-top: 12px;

  padding-top: 14px;

  display: flex;

  justify-content: space-between;

  align-items: center;

  gap: 20px;
}

.resumo-total span {
  color: #4a352e;

  font-size: 14px;
  font-weight: 900;
}

.resumo-total strong {
  color: #d94725;

  font-size: 25px;
}

.submit-btn {
  width: 100%;

  min-height: 56px;

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
  }

  #nome-pizza-content {
    font-size: 28px;
  }

  .form-card {
    padding: 22px 17px;
  }

  .opcoes-grid {
    grid-template-columns: 1fr;
  }

  .resumo-linha {
    align-items: flex-start;

    flex-direction: column;

    gap: 4px;
  }

  .resumo-linha strong {
    text-align: left;
  }
}
</style>