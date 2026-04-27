<template>
  <v-card class="main-card pa-5 mb-5">
    <!-- Campo de título -->
    <v-row dense class="mb-1">
      <v-col>
        <v-text-field
          v-model="newTitle"
          class="input-field"
          placeholder="Título de la tarea"
          variant="outlined"
          hide-details
          density="comfortable"
        />
      </v-col>
    </v-row>

    <!-- Campo de texto + botón -->
    <v-row align="center" dense>
      <v-col>
        <v-text-field
          v-model="newText"
          class="input-field"
          placeholder="¿Qué tienes que hacer?"
          variant="outlined"
          hide-details
          density="comfortable"
          @keyup.enter="submit"
        />
      </v-col>
      <v-col cols="auto">
        <v-btn
          class="add-btn"
          elevation="0"
          :disabled="!newTitle.trim() || !newText.trim()"
          @click="submit"
        >
          <v-icon>mdi-plus</v-icon>
        </v-btn>
      </v-col>
    </v-row>

    <!-- Selector de categorías (múltiple) -->
    <v-row class="mt-3" dense>
      <v-col>
        <div class="cat-label mb-2">
          Categorías
          <span v-if="selectedCats.length" class="cat-count">({{ selectedCats.length }})</span>
        </div>
        <div class="d-flex flex-wrap" style="gap: 8px;">
          <v-chip
            v-for="cat in categories"
            :key="cat.value"
            class="filter-chip"
            :class="{ 'active-chip': selectedCats.includes(cat.value) }"
            size="small"
            variant="outlined"
            @click="toggleCat(cat.value)"
          >
            <span class="cat-dot" :style="{ background: cat.color }"></span>
            {{ cat.label }}
            <v-icon
              v-if="selectedCats.includes(cat.value)"
              size="12"
              class="ml-1"
            >
              mdi-check
            </v-icon>
          </v-chip>
        </div>
      </v-col>
    </v-row>
  </v-card>
</template>

<script setup>
import { ref } from 'vue'

const props = defineProps({
  categories: { type: Array, required: true },
})

const emit = defineEmits(['add-task'])

const newTitle    = ref('')
const newText     = ref('')
// Array en lugar de string para múltiple selección
const selectedCats = ref(
  props.categories[0]?.value ? [props.categories[0].value] : []
)

function toggleCat(value) {
  const idx = selectedCats.value.indexOf(value)
  if (idx === -1) {
    selectedCats.value.push(value)
  } else {
    // Evita dejar la selección vacía (mínimo 1)
    if (selectedCats.value.length > 1) {
      selectedCats.value.splice(idx, 1)
    }
  }
}

function submit() {
  const title = newTitle.value.trim()
  const text  = newText.value.trim()
  if (!title || !text) return
  // Emite un array de categorías en lugar de una sola
  emit('add-task', { title, text, categorias: [...selectedCats.value] })
  newTitle.value = ''
  newText.value  = ''
}
</script>

<style scoped>
.cat-label {
  font-size: 0.72rem;
  color: #181716;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}
.cat-label-text {
  font-size: 0.72rem;
  color: #181716;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}
.cat-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  display: inline-block;
  margin-right: 5px;
  flex-shrink: 
  0;
}
.input-field :deep(.v-field) {
  background: var(--beige) !important;
  border-radius: 12px !important;
  border: 1.5px solid var(--sand) !important;
  box-shadow: none !important;
}
.input-field :deep(input::placeholder) {
  color: #9e9e9e !important;
  opacity: 1 !important;
}
.input-field :deep(input) {
  color: #1a1a1a !important;
}
.input-field :deep(.v-field--focused) {
  border-color: var(--rust) !important;
}
.add-btn {
  background: var(--rust) !important;
  color: white !important;
  border-radius: 12px !important;
  height: 56px !important;
  font-family: 'DM Sans', sans-serif;
  font-weight: 500;
  box-shadow: 0 4px 16px rgba(192, 83, 58, 0.3) !important;
  transition: transform 0.15s, box-shadow 0.15s !important;
}
.add-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(192, 83, 58, 0.35) !important;
}
.filter-chip {
  border-radius: 20px !important;
  font-size: 0.75rem !important;
  background-color: rgb(223, 210, 168) !important;
  font-family: 'DM Sans', sans-serif !important;
  font-weight: 500 !important;
  cursor: pointer;
}
.filter-chip.active-chip {
  background: var(--ink) !important;
  color: var(--cream) !important;
}
</style>