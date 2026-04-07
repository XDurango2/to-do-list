<template>
  <!-- =========================================================
    TodoHeader
    Props:
      - usuario (Object|null) – usuario autenticado o null
    Emits:
      - login-ok  ({ usuario }) – sesión iniciada
      - logout-ok              – sesión cerrada
    Muestra el título, la fecha y el botón de sesión.
  ========================================================= -->
  <v-row align="center" class="mb-6">
    <v-col>
      <div class="header-title">Mis Tareas</div>

      <!-- Email del usuario autenticado -->
      <div v-if="usuario" class="user-email mt-1">
        <v-icon size="13" style="color: var(--sage); margin-right: 4px;">mdi-account-circle-outline</v-icon>
        {{ usuario.email }}
      </div>
    </v-col>

    <v-col cols="auto" class="d-flex flex-column align-end" style="gap: 8px;">
      <!-- Fecha -->
      <v-chip class="date-chip" size="small">
        <v-icon start size="14">mdi-calendar-outline</v-icon>
        {{ todayLabel }}
      </v-chip>

      <!-- Botón Login / Logout -->
      <v-btn
        v-if="!usuario"
        variant="outlined"
        size="x-small"
        class="auth-btn login-btn"
        :loading="cargando"
        @click="hacerLogin"
      >
        <v-icon start size="14">mdi-login</v-icon>
        Iniciar Sesión
      </v-btn>

      <v-btn
        v-else
        variant="outlined"
        size="x-small"
        class="auth-btn logout-btn"
        :loading="cargando"
        @click="hacerLogout"
      >
        <v-icon start size="14">mdi-logout</v-icon>
        Cerrar Sesión
      </v-btn>
    </v-col>
  </v-row>

  <!-- Snackbar de error -->
  <v-snackbar
    v-model="error.visible"
    color="error"
    :timeout="4000"
    location="top"
  >
    {{ error.mensaje }}
  </v-snackbar>
</template>

<script setup>
import { ref, computed } from 'vue'
import { login, logout } from '../services/api.js'

// ── Props / Emits ─────────────────────────────────────────────
const props = defineProps({
  usuario: { type: Object, default: null },
})

const emit = defineEmits(['login-ok', 'logout-ok'])

// ── Estado local ──────────────────────────────────────────────
const cargando = ref(false)
const error    = ref({ visible: false, mensaje: '' })

// ── Computed ──────────────────────────────────────────────────
const todayLabel = computed(() =>
  new Date().toLocaleDateString('es-MX', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  })
)

// ── Acciones ──────────────────────────────────────────────────
async function hacerLogin() {
  cargando.value = true
  error.value.visible = false
  try {
    // login() ya llama a /auth/verify internamente y devuelve
    // el objeto usuario completo: { id, email, apiKey, ... }
    const usuario = await login('usuario.test@ejemplo.com')
    emit('login-ok', { usuario })
  } catch (e) {
    mostrarError(e)
  } finally {
    cargando.value = false
  }
}

async function hacerLogout() {
  cargando.value = true
  try {
    await logout()
    emit('logout-ok')
  } catch (e) {
    mostrarError(e)
  } finally {
    cargando.value = false
  }
}

function mostrarError(e) {
  error.value.mensaje =
    e.response?.data?.error ?? e.message ?? 'Error de conexión'
  error.value.visible = true
}
</script>

<style scoped>
.header-title {
  font-family: 'Gill Sans', sans-serif;
  font-size: 2.6rem;
  font-weight: 700;
  color: var(--ink);
  letter-spacing: -0.5px;
  line-height: 1.1;
}
.header-subtitle {
  font-family: 'Segoe UI', sans-serif;
  font-size: 0.85rem;
  color: #8a7e72;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  font-weight: 400;
}
.user-email {
  font-size: 0.75rem;
  color: var(--sage);
  font-family: 'DM Sans', sans-serif;
}
.date-chip {
  background: var(--ink) !important;
  color: var(--cream) !important;
  font-family: 'DM Sans', sans-serif;
  font-size: 0.75rem;
  letter-spacing: 0.06em;
  font-weight: 500;
}
.auth-btn {
  font-family: 'DM Sans', sans-serif !important;
  font-size: 0.72rem !important;
  font-weight: 500 !important;
  letter-spacing: 0.04em !important;
  border-radius: 10px !important;
}
.login-btn {
  border-color: var(--rust) !important;
  color: var(--rust) !important;
}
.logout-btn {
  border-color: var(--sand) !important;
  color: #8a7e72 !important;
}
</style>
