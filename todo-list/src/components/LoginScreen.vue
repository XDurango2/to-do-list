<template>
  <div class="login-bg">
    <v-container class="d-flex align-center justify-center" style="min-height: 100vh;">
      <v-card class="login-card pa-8 pa-md-10">

        <!-- Branding -->
        <div class="brand-mark mb-1">✓</div>
        <div class="login-title">Mis Tareas</div>
        <div class="login-sub">Organiza tu día con calma</div>

        <!-- Botón Google -->
        <div class="google-wrap mt-8 mb-2">
          <div ref="googleBtnRef" />
        </div>

        <!-- Divisor -->
        <div class="or-row my-5">
          <v-divider class="divider-or" />
          <span class="or-label">o</span>
          <v-divider class="divider-or" />
        </div>

        <!-- Formulario login / registro -->
        <div class="email-form">
          <!-- Campo nombre (solo en registro) -->
          <v-text-field
            v-if="modo === 'registro'"
            v-model="nombre"
            label="Nombre"
            type="text"
            density="compact"
            variant="outlined"
            hide-details
            class="mb-3"
            autocomplete="name"
          />

          <v-text-field
            v-model="email"
            label="Correo electrónico"
            type="email"
            density="compact"
            variant="outlined"
            hide-details
            class="mb-3"
            autocomplete="email"
          />
          <v-text-field
            v-model="password"
            :label="modo === 'registro' ? 'Contraseña (mín. 6 caracteres)' : 'Contraseña'"
            :type="showPass ? 'text' : 'password'"
            density="compact"
            variant="outlined"
            hide-details
            class="mb-4"
            :autocomplete="modo === 'registro' ? 'new-password' : 'current-password'"
            :append-inner-icon="showPass ? 'mdi-eye-off-outline' : 'mdi-eye-outline'"
            @click:append-inner="showPass = !showPass"
            @keyup.enter="submit"
          />

          <v-btn
            block
            class="email-submit-btn"
            :loading="cargando"
            @click="submit"
          >
            {{ modo === 'login' ? 'Iniciar sesión' : 'Crear cuenta' }}
          </v-btn>

          <!-- Toggle login ↔ registro -->
          <div class="toggle-modo mt-4">
            <span v-if="modo === 'login'">
              ¿No tienes cuenta?
              <button class="toggle-link" @click="cambiarModo('registro')">Crear cuenta</button>
            </span>
            <span v-else>
              ¿Ya tienes cuenta?
              <button class="toggle-link" @click="cambiarModo('login')">Iniciar sesión</button>
            </span>
          </div>
        </div>

        <!-- Acceso Admin (enlace discreto al fondo) -->
        <div class="admin-section mt-6">
          <div v-if="showAdmin" class="admin-form">
            <v-divider class="mb-4" style="border-color: var(--sand) !important;" />
            <p class="admin-label mb-3">Acceso administrador</p>
            <v-text-field
              v-model="adminEmail"
              label="Correo administrador"
              type="email"
              density="compact"
              variant="outlined"
              hide-details
              class="mb-3"
            />
            <v-text-field
              v-model="adminPass"
              label="Contraseña"
              :type="showAdminPass ? 'text' : 'password'"
              density="compact"
              variant="outlined"
              hide-details
              class="mb-4"
              :append-inner-icon="showAdminPass ? 'mdi-eye-off-outline' : 'mdi-eye-outline'"
              @click:append-inner="showAdminPass = !showAdminPass"
            />
            <v-btn
              block
              class="admin-submit-btn mb-2"
              :loading="cargandoAdmin"
              @click="hacerLoginAdmin"
            >
              Entrar como Admin
            </v-btn>
            <v-btn
              block
              variant="text"
              size="small"
              class="cancel-btn"
              @click="showAdmin = false; adminEmail = ''; adminPass = ''"
            >
              Cancelar
            </v-btn>
          </div>

          <button
            v-else
            class="admin-link"
            @click="showAdmin = true"
          >
            <v-icon size="13" class="mr-1">mdi-shield-account-outline</v-icon>
            Acceso Admin
          </button>
        </div>

      </v-card>
    </v-container>

    <v-snackbar
      v-model="error.visible"
      color="error"
      :timeout="4000"
      location="top"
    >
      {{ error.mensaje }}
    </v-snackbar>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { googleLogin, loginConEmail, registrarse, loginAdmin } from '../services/api.js'

const emit   = defineEmits(['login-ok'])
const router = useRouter()

const googleBtnRef = ref(null)
const modo         = ref('login')  // 'login' | 'registro'
const nombre       = ref('')
const email        = ref('')
const password     = ref('')
const showPass     = ref(false)
const cargando     = ref(false)

const showAdmin     = ref(false)
const adminEmail    = ref('')
const adminPass     = ref('')
const showAdminPass = ref(false)
const cargandoAdmin = ref(false)

const error = ref({ visible: false, mensaje: '' })

function mostrarError(msg) {
  error.value.mensaje = msg
  error.value.visible = true
}

function cambiarModo(nuevoModo) {
  modo.value     = nuevoModo
  nombre.value   = ''
  email.value    = ''
  password.value = ''
  showPass.value = false
  error.value.visible = false
}

onMounted(() => {
  let intentos = 0
  const intervalo = setInterval(() => {
    intentos++
    if (intentos > 100) { clearInterval(intervalo); return }
    if (window.google?.accounts?.id && googleBtnRef.value) {
      clearInterval(intervalo)
      googleLogin(
        (usuario) => emit('login-ok', { usuario }),
        googleBtnRef.value
      )
    }
  }, 100)
})

async function submit() {
  if (!email.value || !password.value) return
  if (modo.value === 'registro' && !nombre.value) return
  cargando.value = true
  error.value.visible = false
  try {
    const usuario = modo.value === 'login'
      ? await loginConEmail(email.value, password.value)
      : await registrarse(nombre.value, email.value, password.value)
    emit('login-ok', { usuario })
  } catch (e) {
    mostrarError(e.response?.data?.error ?? e.message ?? 'Algo salió mal, intenta de nuevo')
  } finally {
    cargando.value = false
  }
}

async function hacerLoginAdmin() {
  if (!adminEmail.value || !adminPass.value) return
  cargandoAdmin.value = true
  error.value.visible = false
  try {
    const usuario = await loginAdmin(adminEmail.value, adminPass.value)
    emit('login-ok', { usuario })
    router.push('/admin')
  } catch (e) {
    mostrarError(e.response?.data?.error ?? e.message ?? 'Credenciales incorrectas')
  } finally {
    cargandoAdmin.value = false
  }
}
</script>

<style scoped>
.login-bg {
  min-height: 100vh;
  background-color: var(--cream);
  background-image:
    radial-gradient(circle at 75% 15%, rgba(192,83,58,0.10) 0%, transparent 50%),
    radial-gradient(circle at 20% 85%, rgba(122,140,116,0.12) 0%, transparent 50%);
}

.login-card {
  width: 100%;
  max-width: 400px;
  background: #FFFDF9 !important;
  border: 1px solid var(--sand) !important;
  border-radius: 24px !important;
  box-shadow: 0 8px 48px rgba(26,23,20,0.10) !important;
  text-align: center;
}

.brand-mark {
  font-size: 2.4rem;
  color: var(--rust);
  line-height: 1;
}
.login-title {
  font-family: 'Gill Sans', sans-serif;
  font-size: 2.2rem;
  font-weight: 700;
  color: var(--ink);
  letter-spacing: -0.5px;
  line-height: 1.1;
}
.login-sub {
  font-family: 'DM Sans', sans-serif;
  font-size: 0.85rem;
  color: #a09890;
  margin-top: 6px;
}

.google-wrap {
  display: flex;
  justify-content: center;
}

.or-row {
  display: flex;
  align-items: center;
  gap: 12px;
}
.divider-or {
  border-color: var(--sand) !important;
  flex: 1;
}
.or-label {
  font-family: 'DM Sans', sans-serif;
  font-size: 0.78rem;
  color: #b0a49a;
  flex-shrink: 0;
}

.email-form {
  text-align: left;
  color: #6b5e54;
}
.email-form :deep(.v-field__outline) {
  color: var(--sand) !important;
}
.email-form :deep(.v-label) {
  font-family: 'DM Sans', sans-serif;
  color: #6b5e54 !important;
  font-size: 0.82rem;
}

.email-submit-btn {
  background: var(--rust) !important;
  color: #fff !important;
  font-family: 'DM Sans', sans-serif !important;
  font-size: 0.88rem !important;
  font-weight: 500 !important;
  border-radius: 12px !important;
  text-transform: none !important;
  letter-spacing: 0 !important;
}

.toggle-modo {
  text-align: center;
  font-family: 'DM Sans', sans-serif;
  font-size: 0.80rem;
  color: #a09890;
}
.toggle-link {
  background: none;
  border: none;
  cursor: pointer;
  color: var(--rust);
  font-family: inherit;
  font-size: inherit;
  font-weight: 500;
  padding: 0;
  text-decoration: underline;
  text-underline-offset: 2px;
}
.toggle-link:hover {
  color: #a0442e;
}

.admin-section {
  text-align: center;
}
.admin-link {
  background: none;
  border: none;
  cursor: pointer;
  font-family: 'DM Sans', sans-serif;
  font-size: 0.75rem;
  color: #b0a49a;
  display: inline-flex;
  align-items: center;
  padding: 4px 8px;
  border-radius: 8px;
  transition: color 0.15s;
}
.admin-link:hover {
  color: #6b5e54;
}

.admin-label {
  font-family: 'DM Sans', sans-serif;
  font-size: 0.78rem;
  color: #a09890;
  text-align: left;
  margin: 0;
}
.admin-form {
  text-align: left;
  color: #6b5e54;
}
.admin-form :deep(.v-field__outline) {
  color: #6b5e54 !important;
}
.admin-form :deep(.v-label) {
  font-family: 'DM Sans', sans-serif;
  color: #6b5e54 !important;
  font-size: 0.82rem;
}

.admin-submit-btn {
  background: var(--ink) !important;
  color: var(--cream) !important;
  font-family: 'DM Sans', sans-serif !important;
  font-size: 0.82rem !important;
  font-weight: 500 !important;
  border-radius: 12px !important;
  text-transform: none !important;
  letter-spacing: 0 !important;
}
.cancel-btn {
  font-family: 'DM Sans', sans-serif !important;
  color: #a09890 !important;
  font-size: 0.78rem !important;
  text-transform: none !important;
}
</style>
