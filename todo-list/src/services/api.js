// src/services/api.js
// Servicio central para todas las llamadas al servidor.
// Maneja automáticamente:
//   - Cookies HTTP-Only (jwt_token) via withCredentials
//   - Token CSRF en cada request protegido
//   - Login / Logout / Verify

import axios from 'axios'

const API_BASE_URL = 'http://localhost:3003/api'
const API_KEY      = 'mi_api_key_secreta_12345'

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
let googleInicializado = false

export function googleLogin(onSuccess, btnElement) {
  if (!window.google?.accounts?.id) {
    console.error('SDK de Google no cargado')
    return
  }

  if (!googleInicializado) {
    google.accounts.id.initialize({
      client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
      callback: async (response) => {
          console.log('✅ Google respondió:', response)
        try {
          const { data } = await cliente.post('/auth/login', {
            credential: response.credential
          },
          {
            headers: {
              'x-api-key': API_KEY
            }
          })
              console.log('✅ Backend respondió:', data)
          csrfToken = data.csrfToken

          const { data: verifyData } = await cliente.get('/auth/verify')
              console.log('✅ Verify respondió:', verifyData)
          onSuccess(verifyData.usuario)
        } catch (err) {
              console.error('❌ Error:', err.response?.data ?? err.message)
          console.error('Error en login:', err)
        }
      }
    })
    googleInicializado = true
  }

  // Renderiza el botón oficial — funciona en Firefox, Safari, Chrome
  if (btnElement) {
    google.accounts.id.renderButton(btnElement, {
      type: 'standard',
      shape: 'rounded',
      theme: 'outline',
      text: 'signin_with',
      size: 'large',
      locale: 'es'
    })
  }
}
/**
 * Verifica si el usuario tiene sesión activa.
 * Usa la cookie jwt_token (enviada automáticamente) + CSRF header.
 * Requiere haber hecho login antes, o que el navegador
 * tenga la cookie de una sesión previa.
 */
export async function verificarSesion() {
  if (!csrfToken) {
    csrfToken = leerCookieCSRF()
  }

  const { data } = await cliente.get('/auth/verify', {
    withCredentials: true
  })

  return data
}

/**
 * Cierra la sesión y limpia el token CSRF en memoria.
 */
export async function logout() {
  await cliente.post('/auth/logout', {}, {
    withCredentials: true
  })

  csrfToken = null

  if (window.google?.accounts?.id) {
    google.accounts.id.disableAutoSelect()
  }
}

// ── Tareas ────────────────────────────────────────────────────
// Todos estos requests incluyen automáticamente:
//   - Cookie jwt_token (via withCredentials)
//   - Header x-csrf-token (via interceptor)

export async function obtenerTareas() {
  const { data } = await cliente.get('/tareas')
  return data
}

export async function crearTarea(titulo, texto, categorias) {
  const { data } = await cliente.post('/tareas', { titulo, texto, categorias })
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
