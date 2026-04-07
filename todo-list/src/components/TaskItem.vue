<template>
  <!-- =========================================================
    TaskItem
    Props:
      - task       (Object)  – { id, text, done, category }
      - catColor   (String)  – color hex de la categoría
      - catLabel   (String)  – nombre de la categoría
    Emits:
      - toggle (id)  – alternar estado done
      - remove (id)  – eliminar la tarea
    Representa una fila individual de tarea.
  ========================================================= -->
  <div
    class="task-item d-flex align-start px-2 py-3"
    :class="{ 'done-item': task.done }"
  >
    <!-- Checkbox -->
    <v-checkbox
      :model-value="task.done"
      hide-details
      density="compact"
      class="mt-0 pt-0 mr-2"
      style="flex-shrink: 0;"
      @update:model-value="emit('toggle', task.id)"
    />

    <!-- Texto y categoría -->
    <div class="flex-grow-1 mt-1">
     <div class="task-title" :class="{strikethrough: task.done}" >
        {{ task.title }}
     </div>
      <div class="task-text" :class="{ strikethrough: task.done }">
        {{ task.text }}
      </div>
      <div class="d-flex align-center mt-1" style="gap: 6px;">
        <span class="category-dot" :style="{ background: catColor }"></span>
        <span class="cat-name">{{ catLabel }}</span>
      </div>
    </div>

    <!-- Botón eliminar -->
    <v-btn
      icon
      variant="text"
      size="x-small"
      density="compact"
      color="#c9bdb0"
      style="margin-top: 2px;"
      @click="emit('remove', task.id)"
    >
      <v-icon size="16">mdi-close</v-icon>
    </v-btn>
  </div>
</template>

<script setup>
defineProps({
  task:     { type: Object, required: true },
  catColor: { type: String, default: '#ccc' },
  catLabel: { type: String, default: '' },
})

const emit = defineEmits(['toggle', 'remove'])
</script>

<style scoped>
.task-item {
  border-radius: 14px;
  margin-bottom: 10px;
  border: 1px solid transparent;
  transition: all 0.25s ease;
  background: transparent;
}
.task-item:hover {
  background: rgba(214, 201, 180, 0.2);
  border-color: var(--sand);
}
.task-item.done-item {
  opacity: 0.55;
}
.task-title {
  font-family: 'DM Sans', sans-serif;
  font-size: 1.05rem;
  color: #181717;
  font-weight: 500;
  line-height: 1.2;
}
.task-text {
  font-family: 'DM Sans', sans-serif;
  font-size: 0.97rem;
  color: #181717;
  font-weight: 400;
  line-height: 1.4;
}
.task-title.strikethrough {
  text-decoration: line-through;
  color: #181717;
}
.task-text.strikethrough {
  text-decoration: line-through;
  color: #181717;
}
.category-dot {
  width: 9px;
  height: 9px;
  border-radius: 50%;
  flex-shrink: 0;
  margin-top: 2px;
}
.cat-name {
  font-size: 0.7rem;
  color: #b86818;
  text-transform: uppercase;
  letter-spacing: 0.07em;
}
/* Overrides globales de Vuetify dentro del componente */
:deep(.v-checkbox .v-selection-control__input > .v-icon) {
  color: var(--rust) !important;
}
</style>
