import { createRouter, createWebHashHistory } from "vue-router";

import MenuView from "@/views/MenuView.vue";
import PedidosView from "@/views/PedidosView.vue";
import ConfiguracaoPedidoView from "@/views/ConfiguracaoPedidoView.vue";

import {
  obterUsuarioAtual,
} from "@/services/auth";

const LoginView = () => import("@/views/LoginView.vue");

const CadastroView = () =>
  import("@/views/CadastroView.vue");

const MeusPedidosView = () =>
  import("@/views/MeusPedidosView.vue");

const AdminPedidosView = () =>
  import("@/views/AdminPedidosView.vue");

const routes = [
  {
    path: "/",
    redirect: "/menu",
  },

  {
    path: "/menu",
    name: "menu",
    component: MenuView,
  },

  {
    path: "/login",
    name: "login",
    component: LoginView,
    meta: {
      guestOnly: true,
    },
  },

  {
    path: "/cadastro",
    name: "cadastro",
    component: CadastroView,
    meta: {
      guestOnly: true,
    },
  },

  {
    path: "/config-pedido",
    name: "config-pedido",
    component: ConfiguracaoPedidoView,
    meta: {
      requiresAuth: true,
      usuarioOnly: true,
    },
  },

  {
    path: "/pedidos",
    name: "pedidos",
    component: PedidosView,
    meta: {
      requiresAuth: true,
    },
  },

  {
    path: "/meus-pedidos",
    name: "meus-pedidos",
    component: MeusPedidosView,
    meta: {
      requiresAuth: true,
      usuarioOnly: true,
    },
  },

  {
    path: "/admin/pedidos",
    name: "admin-pedidos",
    component: AdminPedidosView,
    meta: {
      requiresAuth: true,
      adminOnly: true,
    },
  },

  {
    path: "/:pathMatch(.*)*",
    redirect: "/menu",
  },
];

const router = createRouter({
  history: createWebHashHistory(process.env.BASE_URL),
  routes,
});

router.beforeEach((to) => {
  const usuario = obterUsuarioAtual();

  const autenticado = Boolean(usuario);

  if (to.meta.requiresAuth && !autenticado) {
    return {
      name: "login",
      query: {
        redirect: to.fullPath,
      },
    };
  }

  if (to.meta.adminOnly && usuario?.tipo !== "admin") {
    return {
      name: "menu",
    };
  }

  if (
    to.meta.usuarioOnly &&
    usuario?.tipo === "admin"
  ) {
    return {
      name: "admin-pedidos",
    };
  }

  if (to.meta.guestOnly && autenticado) {
    if (usuario.tipo === "admin") {
      return {
        name: "admin-pedidos",
      };
    }

    return {
      name: "menu",
    };
  }

  return true;
});

export default router;