<template>
  <!-- =========================================================
    ProgressCard
    Props:
      - done   (Number) – tareas completadas
      - total  (Number) – total de tareas
    Muestra el conteo y la barra de progreso.
  ========================================================= -->
  <v-card class="main-card pa-5 mb-5">
    <v-row align="center" no-gutters>
      <v-col>
        <div class="progress-label">{{ done }} / {{ total }}</div>
        <div class="progress-sub mt-1">tareas completadas</div>
      </v-col>
      <v-col cols="8">
        <v-progress-linear
          :model-value="percent"
          height="8"
          rounded
          :color="percent === 100 ? '#7A8C74' : '#C0533A'"
          bg-color="#E8E0D5"
        />
        <div class="text-right mt-1 percent-label">{{ percent }}%</div>
      </v-col>
    </v-row>
  </v-card>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  done:  { type: Number, required: true },
  total: { type: Number, required: true },
})

const percent = computed(() =>
  props.total === 0 ? 0 : Math.round((props.done / props.total) * 100)
)
</script>

<style scoped>
.progress-label {
  font-family: 'Playfair Display', serif;
  font-size: 1.6rem;
  font-weight: 700;
  color: var(--rust);
}
.progress-sub {
  font-size: 0.78rem;
  color: #8a7e72;
  letter-spacing: 0.04em;
}
.percent-label {
  font-size: 0.72rem;
  color: #8a7e72;
}
</style>
