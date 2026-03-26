// src/categories.js
// Datos compartidos de categorías disponibles

export const CATEGORIES = [
  { value: 'personal', label: 'Personal', color: '#C0533A' },
  { value: 'trabajo',  label: 'Trabajo',  color: '#C49A3C' },
  { value: 'salud',    label: 'Salud',    color: '#7A8C74' },
  { value: 'hogar',    label: 'Hogar',    color: '#7A90B5' },
]

export function getCatColor(val) {
  return CATEGORIES.find(c => c.value === val)?.color ?? '#ccc'
}

export function getCatLabel(val) {
  return CATEGORIES.find(c => c.value === val)?.label ?? val
}
