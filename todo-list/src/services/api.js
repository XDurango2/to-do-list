// src/services/api.js
// Servicio central para todas las llamadas al servidor.
// Maneja automáticamente:
//   - Cookies HTTP-Only (jwt_token) via withCredentials
//   - Token CSRF en cada request protegido
//   - Login / Logout / Verify

import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3003/api'
const API_KEY      = import.meta.env.VITE_API_KEY  ?? 'mi_api_key_secreta_12345'

// ── Instancia base ────────────────────────────────────────────
// withCredentials = true  →  el navegador envía/recibe cookies
// automáticamente en cada request (incluida jwt_token HTTP-Only)
const cliente = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
})

// ── Estado interno del módulo ─────────────────────────────────
// El csrfToken se guarda en memoria después del login.
// No se guarda en localStorage para evitar XSS.
let csrfToken = null

// ── Interceptor de request ────────────────────────────────────
// Inyecta el CSRF token en todos los requests automáticamente,
// sin necesidad de pasarlo manualmente en cada llamada.
cliente.interceptors.request.use((config) => {
  if (csrfToken) {
    config.headers['x-csrf-token'] = csrfToken
  }
  return config
})

// ── Auth ──────────────────────────────────────────────────────

/**
 * Login con email + API key.
 * El servidor responde con:
 *   - Cookie HTTP-Only: jwt_token  (el navegador la guarda sola)
 *   - Cookie normal:    csrf_token (también la guardamos en memoria)
 *   - Body JSON:        { csrfToken, usuario }
 */
export async function login(email) {
  const { data } = await cliente.post(
    '/auth/login',
    { email },
    {
      headers: {
        'x-api-key': API_KEY,
        'Content-Type': 'application/json',
      },
    }
  )

  // Guardar el CSRF token en memoria — el interceptor lo usará
  // automáticamente en todos los requests siguientes
  csrfToken = data.csrfToken

  // El login solo devuelve { id, email } básico.
  // Llamamos a /auth/verify para obtener los datos completos del usuario
  // (apiKey, roles, etc.) ahora que ya tenemos el JWT en la cookie.
  const { data: verifyData } = await cliente.get('/auth/verify')
  return verifyData.usuario  // { id, email, apiKey, ... }
}

/**
 * Verifica si el usuario tiene sesión activa.
 * Usa la cookie jwt_token (enviada automáticamente) + CSRF header.
 * Requiere haber hecho login antes, o que el navegador
 * tenga la cookie de una sesión previa.
 */
export async function verificarSesion() {
  // Si no tenemos csrfToken en memoria, intentar leerlo de la cookie
  // (útil al recargar la página si el servidor la mantiene)
  if (!csrfToken) {
    csrfToken = leerCookieCSRF()
  }

  const { data } = await cliente.get('/auth/verify')
  return data  // { autenticado, usuario }
}

/**
 * Cierra la sesión y limpia el token CSRF en memoria.
 */
export async function logout() {
  await cliente.post('/auth/logout')
  csrfToken = null
}

// ── Tareas ────────────────────────────────────────────────────
// Todos estos requests incluyen automáticamente:
//   - Cookie jwt_token (via withCredentials)
//   - Header x-csrf-token (via interceptor)

export async function obtenerTareas() {
  const { data } = await cliente.get('/tareas')
  return data
}

export async function crearTarea(titulo, texto, categoria) {
  const { data } = await cliente.post('/tareas', { titulo, texto, categoria })
  return data
}

export async function actualizarTarea(id, cambios) {
  const { data } = await cliente.put(`/tareas/${id}`, cambios)
  return data
}

export async function eliminarTarea(id) {
  const { data } = await cliente.delete(`/tareas/${id}`)
  return data
}

// ── Helper interno ────────────────────────────────────────────
/**
 * Lee la cookie csrf_token del navegador (no es HTTP-Only,
 * así que es accesible desde JS).
 * Útil para restaurar el CSRF token después de recargar la página.
 */
function leerCookieCSRF() {
  return (
    document.cookie
      .split('; ')
      .find((row) => row.startsWith('csrf_token='))
      ?.split('=')[1] ?? null
  )
}
