const API_URL = (
  process.env.VUE_APP_API_URL || "http://localhost:3000"
).replace(/\/$/, "");

async function request(endpoint, options = {}) {
  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  const texto = await response.text();

  let data = null;

  if (texto) {
    try {
      data = JSON.parse(texto);
    } catch (error) {
      data = texto;
    }
  }

  if (!response.ok) {
    throw new Error(
      data?.message ||
        data?.error ||
        `Erro ao acessar a API. Código: ${response.status}`
    );
  }

  return data;
}

export function get(endpoint) {
  return request(endpoint);
}

export function post(endpoint, body) {
  return request(endpoint, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function put(endpoint, body) {
  return request(endpoint, {
    method: "PUT",
    body: JSON.stringify(body),
  });
}

export function patch(endpoint, body) {
  return request(endpoint, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

export function remove(endpoint) {
  return request(endpoint, {
    method: "DELETE",
  });
}

export { API_URL };