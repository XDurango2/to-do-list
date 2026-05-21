<template>
  <!-- =========================================================
    App.vue  —  Componente raíz
    Orquesta el estado global y conecta todos los componentes.
    Árbol de componentes:
      App
      ├── TodoHeader
      ├── ProgressCard
      ├── TaskInput
      └── TaskList
              └── TaskItem (x N)
  ========================================================= -->
  <v-app>
    <!-- Pantalla de login cuando no hay sesión -->
    <LoginScreen
      v-if="!usuario"
      @login-ok="onLoginOk"
    />

    <!-- App principal cuando el usuario está autenticado -->
    <div v-else class="page-bg pa-4 pa-md-8">
      <v-container max-width="620">

        <TodoHeader
          :usuario="usuario"
          @logout-ok="onLogoutOk"
        />

        <ProgressCard
          :done="doneCount"
          :total="tasks.length"
        />

        <TaskInput
          :categories="CATEGORIES"
          @add-task="addTask"
        />

        <TaskList
          :tasks="tasks"
          :categories="CATEGORIES"
          @toggle="toggleTask"
          @remove="removeTask"
          @clear-done="clearDone"
        />

      </v-container>
    </div>
  </v-app>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { CATEGORIES } from './categories.js'
import {
  verificarSesion,
  obtenerTareas,   // ✅ AÑADIDO
  crearTarea,      // ✅ AÑADIDO
  actualizarTarea, // ✅ AÑADIDO
  eliminarTarea,   // ✅ AÑADIDO
} from '../services/api.js'

import LoginScreen  from '../components/LoginScreen.vue'
import TodoHeader   from '../components/TodoHeader.vue'
import ProgressCard from '../components/ProgressCard.vue'
import TaskInput    from '../components/TaskInput.vue'
import TaskList     from '../components/TaskList.vue'

// ── Estado global ─────────────────────────────────────────────
const usuario = ref(null)  // null = no autenticado
const tasks   = ref([])    // ✅ Vacío — se llena desde el servidor

// ── Computed ──────────────────────────────────────────────────
const doneCount = computed(() => tasks.value.filter(t => t.done).length)

// ── Helpers ───────────────────────────────────────────────────
// Normaliza la respuesta del servidor al formato que usan los componentes.
// El servidor devuelve { _id, texto, completada, categoria },
// los componentes esperan { id, text, done, category }.
function normalizarTarea(t) {
  return {
    id:         t._id ?? t.id,
    title:      t.titulo ? t.titulo.split('\n')[0] : (t.title ?? 'Sin título'),
    text:       t.texto ?? t.text,
    done:       t.completada ?? t.done ?? false,
    // Normaliza tanto si el servidor devuelve string como array
    categorias: Array.isArray(t.categorias ?? t.categories)
                  ? (t.categorias ?? t.categories)
                  : [t.categoria ?? t.category ?? ''],
  }
}

async function cargarTareas() {
  try {
    const data = await obtenerTareas()
    tasks.value = data.map(normalizarTarea)
  } catch {
    tasks.value = []
  }
}

// ── Ciclo de vida ─────────────────────────────────────────────
// Al montar la app, intentar restaurar sesión si hay cookie activa.
// Si la sesión es válida, también cargar las tareas del usuario.
onMounted(async () => {
  try {
    const { autenticado, usuario: u } = await verificarSesion()
    if (autenticado) {
      usuario.value = u
      await cargarTareas() // ✅ Cargar tareas reales del servidor
    }
  } catch {
    // Sin sesión activa, el usuario deberá hacer login
  }
})

// ── Auth callbacks ────────────────────────────────────────────
async function onLoginOk({ usuario: u }) {
  usuario.value = u
  await cargarTareas() // ✅ Cargar tareas después del login
}

function onLogoutOk() {
  usuario.value = null
  tasks.value = []     // ✅ Limpiar tareas al cerrar sesión
}

// ── Acciones — conectadas a la API ────────────────────────────

async function addTask({ title, text, categorias }) {
  try {
    const nueva = await crearTarea(title, text, categorias) // ✅ Llama a la API
    tasks.value.unshift(normalizarTarea(nueva))
  } catch (e) {
    console.error('Error al crear tarea:', e)
  }
}

async function toggleTask(id) {
  const task = tasks.value.find(t => t.id === id)
  if (!task) return
  try {
    // ✅ Llama a la API con el campo que espera el servidor
    await actualizarTarea(id, { completada: !task.done })
    task.done = !task.done
  } catch (e) {
    console.error('Error al actualizar tarea:', e)
  }
}

async function removeTask(id) {
  try {
    await eliminarTarea(id)                              // ✅ Llama a la API
    tasks.value = tasks.value.filter(t => t.id !== id)
  } catch (e) {
    console.error('Error al eliminar tarea:', e)
  }
}

async function clearDone() {
  // ✅ Elimina cada tarea completada en el servidor una por una
  const completadas = tasks.value.filter(t => t.done)
  try {
    await Promise.all(completadas.map(t => eliminarTarea(t.id)))
    tasks.value = tasks.value.filter(t => !t.done)
  } catch (e) {
    console.error('Error al limpiar tareas completadas:', e)
  }
}
</script>

<style>
/* ── Variables globales ─────────────────────────────────────── */
:root {
  --cream: #F7F3EE;
  --ink:   #1A1714;
  --rust:  #C0533A;
  --sand:  #D6C9B4;
  --sage:  #7A8C74;
  --gold:  #C49A3C;
}

* { box-sizing: border-box; }

body {
  background-color: var(--cream);
  font-family: 'DM Sans', sans-serif;
  min-height: 100vh;
}

/* ── Layout de fondo ────────────────────────────────────────── */
.page-bg {
  min-height: 100vh;
  background-color: var(--cream);
  background-image:
    radial-gradient(circle at 80% 10%, rgba(192,83,58,0.08) 0%, transparent 50%),
    radial-gradient(circle at 10% 90%, rgba(122,140,116,0.10) 0%, transparent 50%);
}

/* ── Card base compartida ───────────────────────────────────── */
.main-card {
  background: #FFFDF9 !important;
  border: 1px solid var(--sand) !important;
  border-radius: 20px !important;
  box-shadow: 0 4px 32px rgba(26,23,20,0.07) !important;
}

/* ── Scrollbar ──────────────────────────────────────────────── */
::-webkit-scrollbar       { width: 4px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: var(--sand); border-radius: 4px; }
</style>