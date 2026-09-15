import { get, post } from "./api";

const STORAGE_KEY = "tpizza_usuario";

function dispararEventoAuth() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("tpizza-auth-changed"));
  }
}

function usuarioSemSenha(usuario) {
  if (!usuario) {
    return null;
  }

  const { senha, ...dadosSeguros } = usuario;

  return dadosSeguros;
}

export function obterUsuarioAtual() {
  try {
    const usuarioSalvo = localStorage.getItem(STORAGE_KEY);

    if (!usuarioSalvo) {
      return null;
    }

    return JSON.parse(usuarioSalvo);
  } catch (error) {
    localStorage.removeItem(STORAGE_KEY);
    return null;
  }
}

export function estaAutenticado() {
  return Boolean(obterUsuarioAtual());
}

export function ehAdmin() {
  return obterUsuarioAtual()?.tipo === "admin";
}

export function salvarUsuario(usuario) {
  const dadosSeguros = usuarioSemSenha(usuario);

  localStorage.setItem(STORAGE_KEY, JSON.stringify(dadosSeguros));

  dispararEventoAuth();

  return dadosSeguros;
}

export function logout() {
  localStorage.removeItem(STORAGE_KEY);

  dispararEventoAuth();
}

export async function login(email, senha) {
  const emailNormalizado = email.trim().toLowerCase();

  const usuarios = await get(
    `/usuarios?email=${encodeURIComponent(emailNormalizado)}`
  );

  if (!usuarios || usuarios.length === 0) {
    throw new Error("E-mail ou senha incorretos.");
  }

  const usuario = usuarios.find(
    (item) =>
      item.email?.toLowerCase() === emailNormalizado &&
      item.senha === senha
  );

  if (!usuario) {
    throw new Error("E-mail ou senha incorretos.");
  }

  return salvarUsuario(usuario);
}

export async function cadastrar({
  nome,
  email,
  senha,
}) {
  const nomeNormalizado = nome.trim();
  const emailNormalizado = email.trim().toLowerCase();

  const existentes = await get(
    `/usuarios?email=${encodeURIComponent(emailNormalizado)}`
  );

  if (existentes && existentes.length > 0) {
    throw new Error("Já existe uma conta cadastrada com este e-mail.");
  }

  const usuario = await post("/usuarios", {
    nome: nomeNormalizado,
    email: emailNormalizado,
    senha,
    tipo: "usuario",
    criadoEm: new Date().toISOString(),
  });

  return salvarUsuario(usuario);
}