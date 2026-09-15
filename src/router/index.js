import {
  createRouter,
  createWebHashHistory,
} from "vue-router";

import MenuView from "@/views/MenuView.vue";

import ConfiguracaoPedidoView from "@/views/ConfiguracaoPedidoView.vue";

import {
  obterUsuarioAtual,
} from "@/services/auth";

const LoginView = () =>
  import(
    "@/views/LoginView.vue"
  );

const CadastroView = () =>
  import(
    "@/views/CadastroView.vue"
  );

const MeusPedidosView = () =>
  import(
    "@/views/MeusPedidosView.vue"
  );

const AdminPedidosView = () =>
  import(
    "@/views/AdminPedidosView.vue"
  );

const routes = [
  {
    path: "/",

    redirect: "/menu",
  },

  /*
  |--------------------------------------------------------------------------
  | CARDÁPIO
  |--------------------------------------------------------------------------
  */

  {
    path: "/menu",

    name: "menu",

    component: MenuView,
  },

  /*
  |--------------------------------------------------------------------------
  | LOGIN
  |--------------------------------------------------------------------------
  */

  {
    path: "/login",

    name: "login",

    component: LoginView,

    meta: {
      guestOnly: true,
    },
  },

  /*
  |--------------------------------------------------------------------------
  | CADASTRO
  |--------------------------------------------------------------------------
  */

  {
    path: "/cadastro",

    name: "cadastro",

    component: CadastroView,

    meta: {
      guestOnly: true,
    },
  },

  /*
  |--------------------------------------------------------------------------
  | FAZER PEDIDO
  |--------------------------------------------------------------------------
  |
  | O cliente entra nessa página,
  | escolhe uma pizza e depois
  | configura o pedido.
  |
  */

  {
    path: "/config-pedido",

    name: "config-pedido",

    component:
      ConfiguracaoPedidoView,

    meta: {
      requiresAuth: true,

      usuarioOnly: true,
    },
  },

  /*
  |--------------------------------------------------------------------------
  | MEUS PEDIDOS
  |--------------------------------------------------------------------------
  |
  | Somente pedidos pertencentes
  | ao usuário autenticado.
  |
  */

  {
    path: "/meus-pedidos",

    name: "meus-pedidos",

    component:
      MeusPedidosView,

    meta: {
      requiresAuth: true,

      usuarioOnly: true,
    },
  },

  /*
  |--------------------------------------------------------------------------
  | ADMINISTRAÇÃO
  |--------------------------------------------------------------------------
  */

  {
    path: "/admin/pedidos",

    name: "admin-pedidos",

    component:
      AdminPedidosView,

    meta: {
      requiresAuth: true,

      adminOnly: true,
    },
  },

  /*
  |--------------------------------------------------------------------------
  | ROTA DESCONHECIDA
  |--------------------------------------------------------------------------
  */

  {
    path:
      "/:pathMatch(.*)*",

    redirect: "/menu",
  },
];

const router =
  createRouter({
    history:
      createWebHashHistory(
        process.env.BASE_URL
      ),

    routes,
  });

/*
|--------------------------------------------------------------------------
| PROTEÇÃO DE ROTAS
|--------------------------------------------------------------------------
*/

router.beforeEach((to) => {
  const usuario =
    obterUsuarioAtual();

  const autenticado =
    Boolean(usuario);

  /*
  |--------------------------------------------------------------------------
  | Precisa estar logado
  |--------------------------------------------------------------------------
  */

  if (
    to.meta.requiresAuth &&
    !autenticado
  ) {
    return {
      name: "login",

      query: {
        redirect:
          to.fullPath,
      },
    };
  }

  /*
  |--------------------------------------------------------------------------
  | Somente administrador
  |--------------------------------------------------------------------------
  */

  if (
    to.meta.adminOnly &&
    usuario?.tipo !== "admin"
  ) {
    return {
      name: "menu",
    };
  }

  /*
  |--------------------------------------------------------------------------
  | Somente cliente
  |--------------------------------------------------------------------------
  */

  if (
    to.meta.usuarioOnly &&
    usuario?.tipo === "admin"
  ) {
    return {
      name:
        "admin-pedidos",
    };
  }

  /*
  |--------------------------------------------------------------------------
  | Usuário logado tentando abrir login/cadastro
  |--------------------------------------------------------------------------
  */

  if (
    to.meta.guestOnly &&
    autenticado
  ) {
    if (
      usuario.tipo ===
      "admin"
    ) {
      return {
        name:
          "admin-pedidos",
      };
    }

    return {
      name: "menu",
    };
  }

  return true;
});

export default router;