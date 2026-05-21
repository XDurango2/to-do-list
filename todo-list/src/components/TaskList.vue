<template>
  <!-- =========================================================
    TaskList
    Props:
      - tasks      (Array)  – todas las tareas
      - categories (Array)  – lista de categorías
    Emits:
      - toggle (id)  – alternar done de una tarea
      - remove (id)  – eliminar una tarea
      - clear-done   – eliminar todas las completadas
    Incluye las pestañas de filtro, la lista animada y el footer.
  ========================================================= -->
  <v-card class="main-card pa-2">
    <!-- Pestañas de filtro -->
    <v-tabs v-model="activeTab" class="tab-custom px-3 pt-2" density="compact">
      <v-tab value="all">Todas</v-tab>
      <v-tab value="pending">Pendientes</v-tab>
      <v-tab value="done">Hechas</v-tab>
    </v-tabs>

    <v-divider class="divider-ink mx-4" />

    <!-- Filtro por tags -->
    <div class="tag-filter px-4 py-2">
      <v-chip
        size="small"
        class="tag-chip mr-1"
        :class="{ 'tag-chip--active': selectedTag === null }"
        variant="tonal"
        @click="selectedTag = null"
      >
        Todas
      </v-chip>
      <v-chip
        v-for="cat in props.categories"
        :key="cat.value"
        size="small"
        class="tag-chip mr-1"
        :class="{ 'tag-chip--active': selectedTag === cat.value }"
        :style="selectedTag === cat.value ? `background:${cat.color}22; border-color:${cat.color};` : ''"
        variant="tonal"
        @click="selectedTag = selectedTag === cat.value ? null : cat.value"
      >
        <span
          class="tag-dot mr-1"
          :style="`background:${cat.color}`"
        />
        {{ cat.label }}
      </v-chip>
    </div>

    <v-divider class="divider-ink mx-4 mb-2" />

    <!-- Lista de tareas -->
    <div class="px-3 pb-3" style="min-height: 200px;">

      <!-- Estado vacío -->
      <div v-if="filteredTasks.length === 0" class="empty-state">
        <div class="empty-icon">{{ activeTab === 'done' ? '✓' : '◎' }}</div>
        <div class="empty-text">
          {{ activeTab === 'done' ? 'Aún no has terminado nada' : 'Sin tareas aquí' }}
        </div>
      </div>

      <!-- Tareas con animación -->
      <transition-group name="task">
        <TaskItem
          v-for="task in filteredTasks"
          :key="task.id"
          :task="task"
          :categories="props.categories"
          @toggle="emit('toggle', $event)"
          @remove="emit('remove', $event)"
        />
      </transition-group>
    </div>

    <!-- Footer -->
    <v-divider class="divider-ink mx-4" />
    <div class="d-flex justify-space-between align-center px-5 py-3">
      <span class="footer-count">
        {{ pendingCount }} pendiente{{ pendingCount !== 1 ? 's' : '' }}
      </span>
      <v-btn
        variant="text"
        size="x-small"
        class="clear-btn"
        :disabled="doneCount === 0"
        @click="emit('clear-done')"
      >
        Limpiar completadas
      </v-btn>
    </div>
  </v-card>
</template>

<script setup>
import { ref, computed } from 'vue'
import TaskItem from './TaskItem.vue'

const props = defineProps({
  tasks:      { type: Array, required: true },
  categories: { type: Array, required: true },
})

const emit = defineEmits(['toggle', 'remove', 'clear-done'])

const activeTab  = ref('all')
const selectedTag = ref(null)

const filteredTasks = computed(() => {
  let list = props.tasks
  if (activeTab.value === 'pending') list = list.filter(t => !t.done)
  if (activeTab.value === 'done')    list = list.filter(t => t.done)
  if (selectedTag.value)             list = list.filter(t => t.categorias?.includes(selectedTag.value))
  return list
})

const doneCount    = computed(() => props.tasks.filter(t => t.done).length)
const pendingCount = computed(() => props.tasks.filter(t => !t.done).length)
</script>

<style scoped>
.tab-custom :deep(.v-tab) {
  font-family: 'DM Sans', sans-serif;
  font-weight: 500;
  font-size: 0.82rem;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: #2c2a28 !important;
}
.tab-custom :deep(.v-tab--selected) {
  color: var(--ink) !important;
}
.tab-custom :deep(.v-tabs-slider) {
  background: var(--rust) !important;
}
.divider-ink {
  border-color: var(--sand) !important;
}
.empty-state {
  padding: 40px 0;
  text-align: center;
}
.empty-icon {
  font-size: 3rem;
  margin-bottom: 12px;
}
.empty-text {
  font-family: 'Playfair Display', serif;
  color: var(--sand);
  font-size: 1.1rem;
}
.footer-count {
  font-size: 0.75rem;
  color: #a09890;
}
.clear-btn {
  color: var(--rust) !important;
  font-size: 0.75rem !important;
  font-family: 'DM Sans', sans-serif !important;
}

.tag-filter {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}
.tag-chip {
  font-family: 'DM Sans', sans-serif;
  color: #815427;
  font-size: 0.72rem !important;
  cursor: pointer;
  border: 1px solid transparent;
  transition: border-color 0.15s, background 0.15s;
}
.tag-chip--active {
  font-weight: 600;
}
.tag-dot {
  display: inline-block;
  width: 7px;
  height: 7px;
  border-radius: 50%;
  flex-shrink: 0;
}

/* Animaciones de lista */
.task-enter-active { animation: slideIn 0.3s ease; }
.task-leave-active { animation: slideOut 0.25s ease; }
@keyframes slideIn {
  from { opacity: 0; transform: translateY(-8px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes slideOut {
  from { opacity: 1; transform: translateX(0); }
  to   { opacity: 0; transform: translateX(30px); }
}
</style>
