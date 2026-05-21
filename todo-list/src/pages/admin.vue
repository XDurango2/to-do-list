<template>
  <div class="admin-bg">

    <!-- ── Sidebar ───────────────────────────────────────────── -->
    <aside class="admin-sidebar">
      <div class="sidebar-brand">
        <span class="brand-icon">⚙</span>
        <span class="brand-name">Admin</span>
      </div>

      <nav class="sidebar-nav">
        <div
          class="nav-item"
          :class="{ 'nav-item--active': activeView === 'usuarios' }"
          @click="activeView = 'usuarios'"
        >
          <v-icon size="18">mdi-account-group-outline</v-icon>
          Usuarios
        </div>
        <div
          class="nav-item"
          :class="{ 'nav-item--active': activeView === 'busqueda' }"
          @click="irABusqueda"
        >
          <v-icon size="18">mdi-tag-search-outline</v-icon>
          Buscar
        </div>
      </nav>

      <div class="sidebar-footer">
        <div class="sidebar-email" :title="usuario?.email">{{ usuario?.email }}</div>
        <v-btn
          variant="outlined"
          size="x-small"
          class="logout-btn mt-2"
          :loading="cerrando"
          @click="hacerLogout"
        >
          <v-icon start size="13">mdi-logout</v-icon>
          Salir
        </v-btn>
      </div>
    </aside>

    <!-- ── Contenido principal ──────────────────────────────── -->
    <main class="admin-main">

      <!-- Encabezado -->
      <div class="admin-header mb-6">
        <div>
          <div class="admin-title">Panel de Control</div>
          <div class="admin-sub">Gestión de usuarios y tareas</div>
        </div>
        <v-chip class="date-chip" size="small">
          <v-icon start size="13">mdi-calendar-outline</v-icon>
          {{ todayLabel }}
        </v-chip>
      </div>

      <!-- Stats -->
      <div class="stats-grid mb-6">
        <div class="stat-card">
          <div class="stat-icon" style="background: rgba(192,83,58,0.10);">
            <v-icon color="#C0533A" size="22">mdi-account-multiple-outline</v-icon>
          </div>
          <div class="stat-value">{{ usuarios.length }}</div>
          <div class="stat-label">Usuarios</div>
        </div>
        <div class="stat-card">
          <div class="stat-icon" style="background: rgba(196,154,60,0.10);">
            <v-icon color="#C49A3C" size="22">mdi-format-list-checks</v-icon>
          </div>
          <div class="stat-value">{{ totalTareas }}</div>
          <div class="stat-label">Tareas totales</div>
        </div>
        <div class="stat-card">
          <div class="stat-icon" style="background: rgba(122,140,116,0.10);">
            <v-icon color="#7A8C74" size="22">mdi-check-circle-outline</v-icon>
          </div>
          <div class="stat-value">{{ totalCompletadas }}</div>
          <div class="stat-label">Completadas</div>
        </div>
        <div class="stat-card">
          <div class="stat-icon" style="background: rgba(122,144,181,0.10);">
            <v-icon color="#7A90B5" size="22">mdi-clock-outline</v-icon>
          </div>
          <div class="stat-value">{{ totalPendientes }}</div>
          <div class="stat-label">Pendientes</div>
        </div>
      </div>

      <!-- ══ Vista: Usuarios ══════════════════════════════════ -->
      <div v-if="activeView === 'usuarios'" class="panel-grid">

        <!-- Lista de usuarios -->
        <v-card class="main-card pa-0">
          <div class="panel-header px-5 pt-4 pb-3">
            <div class="panel-title">Usuarios</div>
            <div class="d-flex align-center gap-2">
              <v-text-field
                v-model="busqueda"
                placeholder="Buscar por email..."
                density="compact"
                variant="outlined"
                hide-details
                class="search-field"
                prepend-inner-icon="mdi-magnify"
                clearable
              />
              <v-btn
                icon
                size="small"
                variant="tonal"
                class="new-user-btn"
                title="Nuevo usuario"
                @click="abrirCrearUsuario"
              >
                <v-icon size="18">mdi-account-plus-outline</v-icon>
              </v-btn>
            </div>
          </div>
          <v-divider style="border-color: var(--sand);" />

          <!-- Loading -->
          <div v-if="cargando" class="panel-empty">
            <v-progress-circular indeterminate color="#C0533A" size="32" />
          </div>

          <!-- Error -->
          <div v-else-if="errorMsg" class="panel-empty">
            <v-icon size="36" color="#D6C9B4">mdi-alert-circle-outline</v-icon>
            <div class="empty-text mt-2">{{ errorMsg }}</div>
          </div>

          <!-- Sin resultados -->
          <div v-else-if="usuariosFiltrados.length === 0" class="panel-empty">
            <v-icon size="36" color="#D6C9B4">mdi-account-search-outline</v-icon>
            <div class="empty-text mt-2">Sin resultados</div>
          </div>

          <!-- Filas de usuarios -->
          <div v-else class="users-list">
            <div
              v-for="u in usuariosFiltrados"
              :key="u.id"
              class="user-row"
              :class="{ 'user-row--selected': selectedUser?.id === u.id }"
              @click="seleccionarUsuario(u)"
            >
              <v-avatar size="34" class="user-avatar" :style="`background: ${avatarColor(u.email)}`">
                {{ u.email[0].toUpperCase() }}
              </v-avatar>

              <div class="user-info">
                <div class="user-email">{{ u.email }}</div>
                <div class="user-meta">
                  {{ u.tareaCount ?? '?' }} tareas
                  <span v-if="u.fechaRegistro"> · {{ formatDate(u.fechaRegistro) }}</span>
                </div>
              </div>

              <v-btn
                icon
                size="x-small"
                variant="text"
                class="delete-btn"
                @click.stop="abrirConfirmacion(u)"
              >
                <v-icon size="17">mdi-delete-outline</v-icon>
              </v-btn>
            </div>
          </div>
        </v-card>

        <!-- Tareas del usuario seleccionado -->
        <v-card class="main-card pa-0">
          <div class="panel-header px-5 pt-4 pb-3">
            <div class="panel-title">
              {{ selectedUser ? 'Tareas de ' + selectedUser.email : 'Tareas' }}
            </div>
          </div>
          <v-divider style="border-color: var(--sand);" />

          <!-- Sin usuario seleccionado -->
          <div v-if="!selectedUser" class="panel-empty">
            <v-icon size="36" color="#D6C9B4">mdi-cursor-pointer</v-icon>
            <div class="empty-text mt-2">Selecciona un usuario</div>
          </div>

          <!-- Loading tareas -->
          <div v-else-if="cargandoTareas" class="panel-empty">
            <v-progress-circular indeterminate color="#C0533A" size="32" />
          </div>

          <!-- Sin tareas -->
          <div v-else-if="tareasDelUsuario.length === 0" class="panel-empty">
            <v-icon size="36" color="#D6C9B4">mdi-format-list-bulleted</v-icon>
            <div class="empty-text mt-2">Sin tareas registradas</div>
          </div>

          <!-- Lista de tareas -->
          <div v-else class="tasks-list">
            <!-- Filtro de estado -->
            <div class="tasks-filter px-5 py-2">
              <v-chip
                v-for="f in taskFilters"
                :key="f.value"
                size="x-small"
                class="filter-chip mr-1"
                :class="{ 'filter-chip--active': taskFilter === f.value }"
                variant="tonal"
                @click="taskFilter = f.value"
              >
                {{ f.label }}
              </v-chip>
            </div>

            <!-- Filtro de categoría — multi-select -->
            <div class="cat-filter-row px-5 pb-2">
              <button
                class="cat-filter-btn"
                :class="{ 'cat-filter-btn--all-active': catFilterTags.length === 0 }"
                @click="catFilterTags = []"
              >
                Todas <span class="cat-count">{{ tareasDelUsuario.length }}</span>
              </button>
              <button
                v-for="cat in CATEGORIES"
                :key="cat.value"
                class="cat-filter-btn"
                :class="{ 'cat-filter-btn--active': catFilterTags.includes(cat.value) }"
                :style="catFilterTags.includes(cat.value)
                  ? `background:${cat.color}; border-color:${cat.color}; color:#fff`
                  : `--cat-color:${cat.color}`"
                @click="toggleTagTareas(cat.value)"
              >
                <span class="cat-dot" :style="`background: ${catFilterTags.includes(cat.value) ? '#fff' : cat.color}`" />
                {{ cat.label }}
                <span class="cat-count">{{ catCount(cat.value) }}</span>
              </button>
            </div>
            <v-divider style="border-color: var(--sand);" />

            <div
              v-for="t in tareasFiltradas"
              :key="t.id"
              class="task-row"
              :class="{ 'task-row--done': t.done }"
            >
              <v-icon
                size="17"
                :color="t.done ? '#7A8C74' : '#D6C9B4'"
              >
                {{ t.done ? 'mdi-check-circle' : 'mdi-circle-outline' }}
              </v-icon>

              <div class="task-content">
                <div class="task-title">{{ t.title }}</div>
                <div v-if="t.text" class="task-text">{{ t.text }}</div>
                <div class="task-cats">
                  <span
                    v-for="cat in (t.categorias ?? [])"
                    :key="cat"
                    class="task-cat-badge"
                    :style="`border-color:${getCatColor(cat)}; color:${getCatColor(cat)}`"
                  >
                    <span class="cat-dot" :style="`background:${getCatColor(cat)}`" />
                    {{ getCatLabel(cat) }}
                  </span>
                  <span v-if="!(t.categorias?.length)" class="task-cat-none">sin categoría</span>
                </div>
              </div>
            </div>
          </div>
        </v-card>

      </div>

      <!-- ══ Vista: Búsqueda por etiquetas ════════════════════ -->
      <div v-else-if="activeView === 'busqueda'">

        <!-- Loading pre-carga -->
        <div v-if="cargandoBusqueda" class="busqueda-loading">
          <v-progress-circular indeterminate color="#C0533A" size="40" />
          <div class="busqueda-loading-text mt-3">Cargando tareas de todos los usuarios…</div>
        </div>

        <v-card v-else class="main-card pa-0">
          <v-tabs v-model="busquedaTab" class="tab-custom px-3 pt-2" density="compact">
            <v-tab value="usuarios-por-etiqueta">
              <v-icon start size="14">mdi-account-multiple-outline</v-icon>
              Usuarios por etiqueta
            </v-tab>
            <v-tab value="tareas-por-etiqueta">
              <v-icon start size="14">mdi-format-list-checks</v-icon>
              Tareas por etiqueta
            </v-tab>
            <v-tab value="etiquetas-por-usuario">
              <v-icon start size="14">mdi-tag-multiple-outline</v-icon>
              Etiquetas por usuario
            </v-tab>
          </v-tabs>
          <v-divider style="border-color: var(--sand);" />

          <v-tabs-window v-model="busquedaTab">

            <!-- Tab 1: Usuarios asociados a una o varias etiquetas -->
            <v-tabs-window-item value="usuarios-por-etiqueta">
              <div class="busqueda-panel">
                <div class="busqueda-label">Selecciona una o más etiquetas:</div>
                <div class="cat-chips-row mb-4">
                  <v-chip
                    v-for="cat in CATEGORIES"
                    :key="cat.value"
                    class="busqueda-chip"
                    :class="{ 'busqueda-chip--active': busquedaTagsA.includes(cat.value) }"
                    :style="busquedaTagsA.includes(cat.value)
                      ? `background:${cat.color}; border-color:${cat.color}; color:#fff`
                      : ''"
                    size="small"
                    variant="outlined"
                    @click="toggleTag(busquedaTagsA, cat.value)"
                  >
                    <span class="cat-dot mr-1" :style="`background:${busquedaTagsA.includes(cat.value) ? '#fff' : cat.color}`" />
                    {{ cat.label }}
                  </v-chip>
                </div>

                <div v-if="!busquedaTagsA.length" class="busqueda-hint">
                  <v-icon size="32" color="#D6C9B4">mdi-tag-outline</v-icon>
                  <div class="empty-text mt-2">Selecciona al menos una etiqueta</div>
                </div>
                <div v-else-if="resultadoUsuariosPorEtiqueta.length === 0" class="busqueda-hint">
                  <v-icon size="32" color="#D6C9B4">mdi-account-off-outline</v-icon>
                  <div class="empty-text mt-2">Ningún usuario tiene tareas con esas etiquetas</div>
                </div>
                <div v-else>
                  <div class="busqueda-results-label">
                    {{ resultadoUsuariosPorEtiqueta.length }} usuario(s) encontrado(s)
                  </div>
                  <div class="busqueda-users-list">
                    <div
                      v-for="u in resultadoUsuariosPorEtiqueta"
                      :key="u.id"
                      class="busqueda-user-row"
                    >
                      <v-avatar size="30" class="user-avatar" :style="`background:${avatarColor(u.email)}`">
                        {{ u.email[0].toUpperCase() }}
                      </v-avatar>
                      <div class="user-info">
                        <div class="user-email">{{ u.email }}</div>
                        <div class="user-meta">
                          {{ contarTareasConTags(u.id, busquedaTagsA) }} tarea(s) con esas etiquetas
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </v-tabs-window-item>

            <!-- Tab 2: Tareas asociadas a una o varias etiquetas -->
            <v-tabs-window-item value="tareas-por-etiqueta">
              <div class="busqueda-panel">
                <div class="busqueda-label">Selecciona una o más etiquetas:</div>
                <div class="cat-chips-row mb-4">
                  <v-chip
                    v-for="cat in CATEGORIES"
                    :key="cat.value"
                    class="busqueda-chip"
                    :class="{ 'busqueda-chip--active': busquedaTagsB.includes(cat.value) }"
                    :style="busquedaTagsB.includes(cat.value)
                      ? `background:${cat.color}; border-color:${cat.color}; color:#fff`
                      : ''"
                    size="small"
                    variant="outlined"
                    @click="toggleTag(busquedaTagsB, cat.value)"
                  >
                    <span class="cat-dot mr-1" :style="`background:${busquedaTagsB.includes(cat.value) ? '#fff' : cat.color}`" />
                    {{ cat.label }}
                  </v-chip>
                </div>

                <div v-if="!busquedaTagsB.length" class="busqueda-hint">
                  <v-icon size="32" color="#D6C9B4">mdi-tag-outline</v-icon>
                  <div class="empty-text mt-2">Selecciona al menos una etiqueta</div>
                </div>
                <div v-else-if="resultadoTareasPorEtiqueta.length === 0" class="busqueda-hint">
                  <v-icon size="32" color="#D6C9B4">mdi-format-list-bulleted-square</v-icon>
                  <div class="empty-text mt-2">No hay tareas con esas etiquetas</div>
                </div>
                <div v-else class="busqueda-tareas-list">
                  <div class="busqueda-results-label">
                    {{ resultadoTareasPorEtiqueta.length }} tarea(s) encontrada(s)
                  </div>
                  <div
                    v-for="item in resultadoTareasPorEtiqueta"
                    :key="item.tarea.id"
                    class="busqueda-task-row"
                    :class="{ 'busqueda-task-row--done': item.tarea.done }"
                  >
                    <v-icon size="15" :color="item.tarea.done ? '#7A8C74' : '#D6C9B4'">
                      {{ item.tarea.done ? 'mdi-check-circle' : 'mdi-circle-outline' }}
                    </v-icon>
                    <div class="task-content">
                      <div class="task-title">{{ item.tarea.title }}</div>
                      <div class="busqueda-task-user">
                        <v-icon size="11" class="mr-1">mdi-account-outline</v-icon>
                        {{ item.usuario.email }}
                      </div>
                      <div class="task-cats mt-1">
                        <span
                          v-for="cat in (item.tarea.categorias ?? [])"
                          :key="cat"
                          class="task-cat-badge"
                          :style="`border-color:${getCatColor(cat)}; color:${getCatColor(cat)}`"
                        >
                          <span class="cat-dot" :style="`background:${getCatColor(cat)}`" />
                          {{ getCatLabel(cat) }}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </v-tabs-window-item>

            <!-- Tab 3: Etiquetas asociadas a uno o varios usuarios -->
            <v-tabs-window-item value="etiquetas-por-usuario">
              <div class="busqueda-panel">
                <div class="busqueda-label">Selecciona uno o más usuarios:</div>
                <div class="busqueda-users-chips mb-4">
                  <v-chip
                    v-for="u in usuarios"
                    :key="u.id"
                    class="busqueda-chip mb-1"
                    :class="{ 'busqueda-chip--active': busquedaUsuariosC.some(x => x.id === u.id) }"
                    size="small"
                    variant="outlined"
                    @click="toggleUsuario(u)"
                  >
                    <v-avatar
                      size="16"
                      class="mr-1"
                      :style="`background:${avatarColor(u.email)};color:#fff;font-size:0.55rem;font-weight:600`"
                    >
                      {{ u.email[0].toUpperCase() }}
                    </v-avatar>
                    {{ u.email }}
                  </v-chip>
                </div>

                <div v-if="!busquedaUsuariosC.length" class="busqueda-hint">
                  <v-icon size="32" color="#D6C9B4">mdi-account-outline</v-icon>
                  <div class="empty-text mt-2">Selecciona al menos un usuario</div>
                </div>
                <div v-else-if="resultadoEtiquetasPorUsuario.length === 0" class="busqueda-hint">
                  <v-icon size="32" color="#D6C9B4">mdi-tag-off-outline</v-icon>
                  <div class="empty-text mt-2">Los usuarios seleccionados no tienen tareas con etiquetas</div>
                </div>
                <div v-else>
                  <div class="busqueda-results-label">
                    {{ resultadoEtiquetasPorUsuario.length }} etiqueta(s) en uso
                  </div>
                  <div class="busqueda-etiquetas-grid">
                    <div
                      v-for="item in resultadoEtiquetasPorUsuario"
                      :key="item.cat.value"
                      class="busqueda-etiqueta-card"
                    >
                      <div
                        class="bet-header"
                        :style="`background:${item.cat.color}18; border-color:${item.cat.color}`"
                      >
                        <span class="cat-dot" :style="`background:${item.cat.color}`" />
                        <span class="bet-label">{{ item.cat.label }}</span>
                        <span class="bet-count">{{ item.tareaCount }} tarea(s)</span>
                      </div>
                      <div class="bet-users">
                        <span v-for="u in item.usuarios" :key="u.id" class="bet-user">
                          <v-icon size="10" class="mr-1">mdi-account-outline</v-icon>
                          {{ u.email }}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </v-tabs-window-item>

          </v-tabs-window>
        </v-card>
      </div>

    </main>

    <!-- ── Diálogo de confirmación de borrado ────────────────── -->
    <v-dialog v-model="confirmDialog.visible" max-width="380" persistent>
      <v-card class="main-card pa-6">
        <div class="confirm-title mb-2">¿Eliminar usuario?</div>
        <div class="confirm-sub mb-6">
          Se eliminará permanentemente la cuenta de
          <strong>{{ confirmDialog.usuario?.email }}</strong> y todas sus tareas.
        </div>
        <div class="d-flex gap-3 justify-end">
          <v-btn
            variant="outlined"
            class="confirm-cancel"
            @click="confirmDialog.visible = false"
          >
            Cancelar
          </v-btn>
          <v-btn
            class="confirm-delete"
            :loading="eliminando"
            @click="confirmarEliminar"
          >
            <v-icon start size="15">mdi-delete-outline</v-icon>
            Eliminar
          </v-btn>
        </div>
      </v-card>
    </v-dialog>

    <!-- ── Dialog: crear usuario ───────────────────────────────── -->
    <v-dialog v-model="crearDialog.visible" max-width="400" persistent>
      <v-card class="main-card pa-6">
        <div class="confirm-title mb-1">Nuevo usuario</div>
        <div class="confirm-sub mb-5">El usuario podrá iniciar sesión con su contraseña.</div>

        <v-text-field
          v-model="crearDialog.nombre"
          label="Nombre"
          density="compact"
          variant="outlined"
          hide-details
          class="mb-3 crear-field"
          autocomplete="off"
        />
        <v-text-field
          v-model="crearDialog.email"
          label="Correo electrónico"
          type="email"
          density="compact"
          variant="outlined"
          hide-details
          class="mb-3 crear-field"
          autocomplete="off"
        />
        <v-text-field
          v-model="crearDialog.password"
          label="Contraseña"
          :type="crearDialog.showPass ? 'text' : 'password'"
          density="compact"
          variant="outlined"
          hide-details
          class="mb-5 crear-field"
          :append-inner-icon="crearDialog.showPass ? 'mdi-eye-off-outline' : 'mdi-eye-outline'"
          @click:append-inner="crearDialog.showPass = !crearDialog.showPass"
        />

        <div v-if="crearDialog.error" class="crear-error mb-4">{{ crearDialog.error }}</div>

        <div class="d-flex gap-3 justify-end">
          <v-btn variant="outlined" class="confirm-cancel" @click="cerrarCrearUsuario">
            Cancelar
          </v-btn>
          <v-btn class="confirm-create" :loading="crearDialog.cargando" @click="confirmarCrearUsuario">
            <v-icon start size="15">mdi-account-plus-outline</v-icon>
            Crear
          </v-btn>
        </div>
      </v-card>
    </v-dialog>

    <!-- Snackbar -->
    <v-snackbar v-model="snack.visible" :color="snack.color" :timeout="3500" location="top">
      {{ snack.mensaje }}
    </v-snackbar>

  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import {
  verificarSesion,
  logout,
  obtenerUsuarios,
  crearUsuario,
  obtenerTareasDeUsuario,
  eliminarUsuario,
} from '../services/api.js'
import { CATEGORIES, getCatColor, getCatLabel } from './categories.js'

const router = useRouter()

// ── Estado ────────────────────────────────────────────────────
const activeView       = ref('usuarios')
const usuario          = ref(null)
const usuarios         = ref([])
const selectedUser     = ref(null)
const tareasDelUsuario = ref([])
const busqueda         = ref('')
const taskFilter       = ref('all')
const catFilterTags    = ref([])        // multi-select (array)
const cargando         = ref(false)
const cargandoTareas   = ref(false)
const cerrando         = ref(false)
const eliminando       = ref(false)
const errorMsg         = ref('')
const confirmDialog    = ref({ visible: false, usuario: null })
const crearDialog      = ref({
  visible: false, nombre: '', email: '', password: '',
  showPass: false, cargando: false, error: '',
})
const snack = ref({ visible: false, mensaje: '', color: 'success' })

// ── Estado de búsqueda ────────────────────────────────────────
const busquedaTab        = ref('usuarios-por-etiqueta')
const cargandoBusqueda   = ref(false)
const todasTareas        = ref({})   // { [userId]: Task[] }
const busquedaTagsA      = ref([])   // tab 1: usuarios por etiqueta
const busquedaTagsB      = ref([])   // tab 2: tareas por etiqueta
const busquedaUsuariosC  = ref([])   // tab 3: etiquetas por usuario

const taskFilters = [
  { value: 'all',     label: 'Todas' },
  { value: 'pending', label: 'Pendientes' },
  { value: 'done',    label: 'Hechas' },
]

// ── Computed ──────────────────────────────────────────────────
const totalTareas      = computed(() => usuarios.value.reduce((s, u) => s + (u.tareaCount ?? 0), 0))
const totalCompletadas = computed(() => usuarios.value.reduce((s, u) => s + (u.completadasCount ?? 0), 0))
const totalPendientes  = computed(() => totalTareas.value - totalCompletadas.value)

const usuariosFiltrados = computed(() => {
  const q = busqueda.value.trim().toLowerCase()
  return q
    ? usuarios.value.filter(u => u.email.toLowerCase().includes(q))
    : usuarios.value
})

const tareasFiltradas = computed(() => {
  let lista = tareasDelUsuario.value
  if (taskFilter.value === 'pending') lista = lista.filter(t => !t.done)
  if (taskFilter.value === 'done')    lista = lista.filter(t => t.done)
  if (catFilterTags.value.length)
    lista = lista.filter(t => catFilterTags.value.some(tag => t.categorias?.includes(tag)))
  return lista
})

const todayLabel = computed(() =>
  new Date().toLocaleDateString('es-MX', { weekday: 'short', day: 'numeric', month: 'short' })
)

// ── Computed: resultados de búsqueda ──────────────────────────

// Tab 1: usuarios que tienen tareas con ALGUNA de las etiquetas seleccionadas
const resultadoUsuariosPorEtiqueta = computed(() => {
  if (!busquedaTagsA.value.length) return []
  return usuarios.value.filter(u => {
    const tareas = todasTareas.value[u.id] ?? []
    return tareas.some(t => busquedaTagsA.value.some(tag => t.categorias?.includes(tag)))
  })
})

// Tab 2: tareas (de cualquier usuario) con ALGUNA de las etiquetas seleccionadas
const resultadoTareasPorEtiqueta = computed(() => {
  if (!busquedaTagsB.value.length) return []
  const result = []
  Object.entries(todasTareas.value).forEach(([userId, tareas]) => {
    const u = usuarios.value.find(x => x.id === userId)
    if (!u) return
    tareas
      .filter(t => busquedaTagsB.value.some(tag => t.categorias?.includes(tag)))
      .forEach(tarea => result.push({ usuario: u, tarea }))
  })
  return result
})

// Tab 3: etiquetas usadas por los usuarios seleccionados
const resultadoEtiquetasPorUsuario = computed(() => {
  if (!busquedaUsuariosC.value.length) return []
  const catMap = {}
  CATEGORIES.forEach(c => { catMap[c.value] = { cat: c, tareaCount: 0, usuarios: [] } })

  busquedaUsuariosC.value.forEach(u => {
    const tareas = todasTareas.value[u.id] ?? []
    const usedCats = new Set()
    tareas.forEach(t => {
      ;(t.categorias ?? []).forEach(tag => {
        if (catMap[tag]) {
          catMap[tag].tareaCount++
          usedCats.add(tag)
        }
      })
    })
    usedCats.forEach(tag => {
      if (!catMap[tag].usuarios.find(x => x.id === u.id))
        catMap[tag].usuarios.push(u)
    })
  })

  return Object.values(catMap).filter(item => item.tareaCount > 0)
})

// ── Helpers ───────────────────────────────────────────────────
const AVATAR_COLORS = ['#C0533A', '#C49A3C', '#7A8C74', '#7A90B5', '#8B7355']
function avatarColor(email) {
  return AVATAR_COLORS[email.charCodeAt(0) % AVATAR_COLORS.length]
}
function catCount(catValue) {
  return tareasDelUsuario.value.filter(t => t.categorias?.includes(catValue)).length
}
function formatDate(iso) {
  return new Date(iso).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })
}
function mostrarSnack(mensaje, color = 'success') {
  snack.value = { visible: true, mensaje, color }
}
function toggleTagTareas(val) {
  const idx = catFilterTags.value.indexOf(val)
  if (idx === -1) catFilterTags.value.push(val)
  else catFilterTags.value.splice(idx, 1)
}
function toggleTag(arr, val) {
  const idx = arr.indexOf(val)
  if (idx === -1) arr.push(val)
  else arr.splice(idx, 1)
}
function toggleUsuario(u) {
  const idx = busquedaUsuariosC.value.findIndex(x => x.id === u.id)
  if (idx === -1) busquedaUsuariosC.value.push(u)
  else busquedaUsuariosC.value.splice(idx, 1)
}
function contarTareasConTags(userId, tags) {
  return (todasTareas.value[userId] ?? [])
    .filter(t => tags.some(tag => t.categorias?.includes(tag))).length
}

// ── Ciclo de vida ─────────────────────────────────────────────
onMounted(async () => {
  try {
    const { autenticado, usuario: u } = await verificarSesion()
    if (!autenticado) { router.push('/'); return }
    usuario.value = u
    await cargarUsuarios()
  } catch {
    router.push('/')
  }
})

// ── Acciones ──────────────────────────────────────────────────
async function cargarUsuarios() {
  cargando.value = true
  errorMsg.value = ''
  try {
    const data = await obtenerUsuarios()
    usuarios.value = data
  } catch (e) {
    errorMsg.value = e.response?.data?.error ?? 'No se pudo conectar con el servidor'
  } finally {
    cargando.value = false
  }
}

async function precargarTodasLasTareas() {
  if (Object.keys(todasTareas.value).length > 0) return
  cargandoBusqueda.value = true
  try {
    await Promise.all(
      usuarios.value.map(async u => {
        const data = await obtenerTareasDeUsuario(u.id)
        todasTareas.value[u.id] = data.map(t => ({
          id:         t._id ?? t.id,
          title:      t.titulo ?? t.title ?? 'Sin título',
          text:       t.texto ?? t.text ?? '',
          done:       t.completada ?? t.done ?? false,
          categorias: Array.isArray(t.categorias) ? t.categorias : [t.categoria ?? ''].filter(Boolean),
        }))
      })
    )
  } finally {
    cargandoBusqueda.value = false
  }
}

async function irABusqueda() {
  activeView.value = 'busqueda'
  await precargarTodasLasTareas()
}

async function seleccionarUsuario(u) {
  selectedUser.value = u
  tareasDelUsuario.value = []
  taskFilter.value    = 'all'
  catFilterTags.value = []
  cargandoTareas.value = true
  try {
    const data = await obtenerTareasDeUsuario(u.id)
    tareasDelUsuario.value = data.map(t => ({
      id:         t._id ?? t.id,
      title:      t.titulo ?? t.title ?? 'Sin título',
      text:       t.texto ?? t.text ?? '',
      done:       t.completada ?? t.done ?? false,
      categorias: Array.isArray(t.categorias) ? t.categorias : [t.categoria ?? ''].filter(Boolean),
    }))
  } catch {
    tareasDelUsuario.value = []
  } finally {
    cargandoTareas.value = false
  }
}

function abrirCrearUsuario() {
  Object.assign(crearDialog.value, {
    visible: true, nombre: '', email: '', password: '',
    showPass: false, cargando: false, error: ''
  })
}
function cerrarCrearUsuario() {
  crearDialog.value.visible = false
}
async function confirmarCrearUsuario() {
  crearDialog.value.error = ''
  const { nombre, email, password } = crearDialog.value
  if (!nombre.trim() || !email.trim() || !password) {
    crearDialog.value.error = 'Todos los campos son obligatorios'
    return
  }
  crearDialog.value.cargando = true
  try {
    const nuevo = await crearUsuario(nombre, email, password)
    usuarios.value.push(nuevo)
    cerrarCrearUsuario()
    mostrarSnack(`Usuario ${nuevo.email} creado`)
  } catch (e) {
    crearDialog.value.error = e.response?.data?.error ?? 'Error al crear el usuario'
  } finally {
    crearDialog.value.cargando = false
  }
}

function abrirConfirmacion(u) {
  confirmDialog.value = { visible: true, usuario: u }
}

async function confirmarEliminar() {
  const u = confirmDialog.value.usuario
  eliminando.value = true
  try {
    await eliminarUsuario(u.id)
    usuarios.value = usuarios.value.filter(x => x.id !== u.id)
    if (selectedUser.value?.id === u.id) {
      selectedUser.value = null
      tareasDelUsuario.value = []
    }
    // Limpiar del índice de búsqueda si estaba cargado
    delete todasTareas.value[u.id]
    confirmDialog.value.visible = false
    mostrarSnack(`Usuario ${u.email} eliminado`)
  } catch (e) {
    mostrarSnack(e.response?.data?.error ?? 'Error al eliminar usuario', 'error')
  } finally {
    eliminando.value = false
  }
}

async function hacerLogout() {
  cerrando.value = true
  try {
    await logout()
    router.push('/')
  } finally {
    cerrando.value = false
  }
}
</script>

<style scoped>
/* ── Layout base ─────────────────────────────────────────────── */
.admin-bg {
  min-height: 100vh;
  display: flex;
  background-color: var(--cream);
  background-image:
    radial-gradient(circle at 90% 5%,  rgba(192,83,58,0.06)  0%, transparent 45%),
    radial-gradient(circle at 5%  95%, rgba(122,140,116,0.08) 0%, transparent 45%);
}

/* ── Sidebar ─────────────────────────────────────────────────── */
.admin-sidebar {
  width: 220px;
  flex-shrink: 0;
  background: #FFFDF9;
  border-right: 1px solid var(--sand);
  display: flex;
  flex-direction: column;
  padding: 24px 16px;
  min-height: 100vh;
}

.sidebar-brand {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 8px 24px;
  border-bottom: 1px solid var(--sand);
  margin-bottom: 16px;
}
.brand-icon { font-size: 1.4rem; color: var(--rust); }
.brand-name {
  font-family: 'Gill Sans', sans-serif;
  font-size: 1.3rem;
  font-weight: 700;
  color: var(--ink);
}

.sidebar-nav { flex: 1; }
.nav-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 10px;
  font-family: 'DM Sans', sans-serif;
  font-size: 0.84rem;
  color: #6b5e54;
  cursor: pointer;
  transition: background 0.15s;
  margin-bottom: 4px;
}
.nav-item:hover { background: rgba(214,201,180,0.25); }
.nav-item--active {
  background: rgba(192,83,58,0.08);
  color: var(--rust);
  font-weight: 600;
}

.sidebar-footer {
  border-top: 1px solid var(--sand);
  padding-top: 16px;
}
.sidebar-email {
  font-family: 'DM Sans', sans-serif;
  font-size: 0.72rem;
  color: #a09890;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.logout-btn {
  border-color: var(--sand) !important;
  color: #8a7e72 !important;
  font-family: 'DM Sans', sans-serif !important;
  font-size: 0.72rem !important;
  border-radius: 8px !important;
  width: 100%;
}

/* ── Main ────────────────────────────────────────────────────── */
.admin-main {
  flex: 1;
  padding: 32px 28px;
  overflow-y: auto;
  min-width: 0;
}

.admin-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}
.admin-title {
  font-family: 'Gill Sans', sans-serif;
  font-size: 1.9rem;
  font-weight: 700;
  color: var(--ink);
  letter-spacing: -0.3px;
  line-height: 1.1;
}
.admin-sub {
  font-family: 'DM Sans', sans-serif;
  font-size: 0.82rem;
  color: #a09890;
  margin-top: 4px;
}
.date-chip {
  background: var(--ink) !important;
  color: var(--cream) !important;
  font-family: 'DM Sans', sans-serif;
  font-size: 0.74rem;
}

/* ── Stats ───────────────────────────────────────────────────── */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 14px;
}
.stat-card {
  background: #FFFDF9;
  border: 1px solid var(--sand);
  border-radius: 16px;
  padding: 18px 16px;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 8px;
}
.stat-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.stat-value {
  font-family: 'Gill Sans', sans-serif;
  font-size: 1.8rem;
  font-weight: 700;
  color: var(--ink);
  line-height: 1;
}
.stat-label {
  font-family: 'DM Sans', sans-serif;
  font-size: 0.75rem;
  color: #a09890;
}

/* ── Panel grid (vista Usuarios) ─────────────────────────────── */
.panel-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  align-items: start;
}

.main-card {
  background: #FFFDF9 !important;
  border: 1px solid var(--sand) !important;
  border-radius: 20px !important;
  box-shadow: 0 4px 24px rgba(26,23,20,0.06) !important;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}
.panel-title {
  font-family: 'DM Sans', sans-serif;
  font-size: 0.92rem;
  font-weight: 600;
  color: var(--ink);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 200px;
}
.search-field {
  color: #6b5e54 !important;
  max-width: 200px;
}
.search-field :deep(.v-field__outline) { border-color: #2b1505 !important; }
.search-field :deep(input) {
  color: #6b5e54 !important;
  font-family: 'DM Sans', sans-serif;
  font-size: 0.8rem;
}
.search-field :deep(.v-field__prepend-inner) { color: #a09890 !important; }

.panel-empty {
  padding: 48px 0;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.empty-text {
  font-family: 'DM Sans', sans-serif;
  font-size: 0.84rem;
  color: #b0a49a;
}

/* ── Users list ──────────────────────────────────────────────── */
.users-list { max-height: 480px; overflow-y: auto; }
.user-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 20px;
  cursor: pointer;
  border-bottom: 1px solid rgba(214,201,180,0.4);
  transition: background 0.12s;
}
.user-row:last-child { border-bottom: none; }
.user-row:hover { background: rgba(214,201,180,0.15); }
.user-row--selected { background: rgba(192,83,58,0.06) !important; }

.user-avatar {
  font-family: 'DM Sans', sans-serif;
  font-size: 0.85rem;
  font-weight: 600;
  color: #fff !important;
  flex-shrink: 0;
}
.user-info { flex: 1; min-width: 0; }
.user-email {
  font-family: 'DM Sans', sans-serif;
  font-size: 0.82rem;
  font-weight: 500;
  color: var(--ink);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.user-meta {
  font-family: 'DM Sans', sans-serif;
  font-size: 0.72rem;
  color: #a09890;
  margin-top: 2px;
}
.delete-btn { color: #c9a49a !important; opacity: 0; transition: opacity 0.12s; }
.user-row:hover .delete-btn { opacity: 1; }

/* ── Tasks list (vista Usuarios) ─────────────────────────────── */
.tasks-filter { display: flex; align-items: center; flex-wrap: wrap; gap: 4px; }
.filter-chip {
  font-family: 'DM Sans', sans-serif;
  font-size: 0.7rem !important;
  color: #8a7e72 !important;
  cursor: pointer;
}
.filter-chip--active { font-weight: 600; }

.cat-filter-row { display: flex; align-items: center; flex-wrap: wrap; gap: 5px; }
.cat-filter-btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 3px 10px;
  border-radius: 20px;
  border: 1px solid var(--sand);
  background: transparent;
  color: #8a7e72;
  font-family: 'DM Sans', sans-serif;
  font-size: 0.7rem;
  cursor: pointer;
  transition: background 0.12s, border-color 0.12s, color 0.12s;
}
.cat-filter-btn:hover { background: rgba(214,201,180,0.25); }
.cat-filter-btn--all-active {
  background: var(--ink);
  border-color: var(--ink);
  color: #fff;
  font-weight: 600;
}
.cat-filter-btn--active { font-weight: 600; }
.cat-count { opacity: 0.75; font-size: 0.65rem; }

.tasks-list { max-height: 520px; overflow-y: auto; }
.task-row {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 12px 20px;
  border-bottom: 1px solid rgba(214,201,180,0.4);
}
.task-row:last-child { border-bottom: none; }
.task-row--done .task-title { color: #a09890; text-decoration: line-through; }

.task-content { flex: 1; min-width: 0; }
.task-title {
  font-family: 'DM Sans', sans-serif;
  font-size: 0.84rem;
  font-weight: 500;
  color: var(--ink);
}
.task-text {
  font-family: 'DM Sans', sans-serif;
  font-size: 0.76rem;
  color: #a09890;
  margin-top: 2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.task-cats { margin-top: 5px; display: flex; flex-wrap: wrap; gap: 4px; }
.task-cat-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 1px 8px;
  border-radius: 20px;
  border: 1px solid currentColor;
  font-family: 'DM Sans', sans-serif;
  font-size: 0.68rem;
  font-weight: 500;
}
.task-cat-none {
  font-family: 'DM Sans', sans-serif;
  font-size: 0.68rem;
  color: #c5b9af;
  font-style: italic;
}

.cat-dot {
  display: inline-block;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  flex-shrink: 0;
}

/* ── Vista Búsqueda ──────────────────────────────────────────── */
.busqueda-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 80px 0;
}
.busqueda-loading-text {
  font-family: 'DM Sans', sans-serif;
  font-size: 0.84rem;
  color: #a09890;
}

.tab-custom :deep(.v-tab) {
  font-family: 'DM Sans', sans-serif;
  font-weight: 500;
  font-size: 0.82rem;
  letter-spacing: 0.04em;
  text-transform: none;
  color: #2c2a28 !important;
}
.tab-custom :deep(.v-tab--selected) { color: var(--ink) !important; }
.tab-custom :deep(.v-tabs-slider) { background: var(--rust) !important; }

.busqueda-panel {
  padding: 20px 24px 24px;
}
.busqueda-label {
  font-family: 'DM Sans', sans-serif;
  font-size: 0.78rem;
  font-weight: 600;
  color: #6b5e54;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin-bottom: 12px;
}
.busqueda-results-label {
  font-family: 'DM Sans', sans-serif;
  font-size: 0.76rem;
  color: #a09890;
  margin-bottom: 12px;
}
.busqueda-hint {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 32px 0;
}
.cat-chips-row { display: flex; flex-wrap: wrap; gap: 8px; }
.busqueda-chip {
  font-family: 'DM Sans', sans-serif !important;
  font-size: 0.78rem !important;
  cursor: pointer;
  border-color: var(--sand) !important;
  color: #6b5e54 !important;
}
.busqueda-chip--active { font-weight: 600 !important; color: #fff !important; }

/* Usuarios resultado */
.busqueda-users-list { display: flex; flex-direction: column; gap: 2px; }
.busqueda-user-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 10px;
  border: 1px solid rgba(214,201,180,0.5);
  background: rgba(247,243,238,0.6);
}
.busqueda-users-chips { display: flex; flex-wrap: wrap; gap: 6px; }

/* Tareas resultado */
.busqueda-tareas-list { max-height: 420px; overflow-y: auto; }
.busqueda-task-row {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 10px 12px;
  border-bottom: 1px solid rgba(214,201,180,0.4);
}
.busqueda-task-row:last-child { border-bottom: none; }
.busqueda-task-row--done .task-title { color: #a09890; text-decoration: line-through; }
.busqueda-task-user {
  font-family: 'DM Sans', sans-serif;
  font-size: 0.7rem;
  color: #a09890;
  margin-top: 2px;
  display: flex;
  align-items: center;
}

/* Etiquetas resultado */
.busqueda-etiquetas-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 12px;
}
.busqueda-etiqueta-card {
  border-radius: 12px;
  border: 1px solid var(--sand);
  overflow: hidden;
}
.bet-header {
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 8px 12px;
  border-bottom: 1px solid;
}
.bet-label {
  font-family: 'DM Sans', sans-serif;
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--ink);
  flex: 1;
}
.bet-count {
  font-family: 'DM Sans', sans-serif;
  font-size: 0.68rem;
  color: #a09890;
}
.bet-users {
  padding: 8px 12px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.bet-user {
  font-family: 'DM Sans', sans-serif;
  font-size: 0.74rem;
  color: #6b5e54;
  display: flex;
  align-items: center;
}

/* ── Dialogs ─────────────────────────────────────────────────── */
.confirm-title {
  font-family: 'DM Sans', sans-serif;
  font-size: 1rem;
  font-weight: 600;
  color: var(--ink);
}
.confirm-sub {
  font-family: 'DM Sans', sans-serif;
  font-size: 0.84rem;
  color: #6b5e54;
}
.confirm-cancel {
  border-color: var(--sand) !important;
  color: #6b5e54 !important;
  font-family: 'DM Sans', sans-serif !important;
  border-radius: 10px !important;
}
.confirm-delete {
  background: #C0533A !important;
  color: #fff !important;
  font-family: 'DM Sans', sans-serif !important;
  border-radius: 10px !important;
}
.confirm-create {
  background: var(--ink) !important;
  color: var(--cream) !important;
  font-family: 'DM Sans', sans-serif !important;
  border-radius: 10px !important;
}
.new-user-btn { color: var(--ink) !important; flex-shrink: 0; }
.crear-field :deep(.v-field__outline) { color: #6b5e54 !important; }
.crear-field :deep(input) {
  color: #6b5e54 !important;
  font-family: 'DM Sans', sans-serif;
  font-size: 0.8rem;
}
.crear-field :deep(.v-label) {
  color: #6b5e54 !important;
  font-family: 'DM Sans', sans-serif;
  font-size: 0.82rem;
}
.crear-error {
  font-family: 'DM Sans', sans-serif;
  font-size: 0.8rem;
  color: #C0533A;
  background: rgba(192,83,58,0.08);
  border-radius: 8px;
  padding: 8px 12px;
}

/* ── Responsive ──────────────────────────────────────────────── */
@media (max-width: 900px) {
  .admin-sidebar { display: none; }
  .stats-grid { grid-template-columns: repeat(2, 1fr); }
  .panel-grid { grid-template-columns: 1fr; }
  .busqueda-etiquetas-grid { grid-template-columns: 1fr 1fr; }
}
@media (max-width: 560px) {
  .admin-main { padding: 20px 14px; }
  .stats-grid { grid-template-columns: repeat(2, 1fr); gap: 10px; }
}
</style>
