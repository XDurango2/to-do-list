import { test, expect, type Page } from '@playwright/test'

// Credenciales desde variables de entorno:
//   $env:ADMIN_EMAIL="tu@email.com"; $env:ADMIN_PASS="tupass"; npx playwright test admin
// O ponlas en e2e/.env.test y carga con dotenv en playwright.config.ts
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? ''
const ADMIN_PASS  = process.env.ADMIN_PASS  ?? ''

// ── Helper: hace login como admin y espera a que cargue el panel ──
async function loginAdmin(page: Page) {
  await page.route('https://accounts.google.com/**', r => r.abort())
  await page.goto('/')

  await page.getByRole('button', { name: /Acceso Admin/i }).click()
  await page.getByLabel('Correo administrador').fill(ADMIN_EMAIL)
  await page.locator('input[autocomplete="off"][type="password"], .admin-form input[type="password"], .admin-form input[type="text"]').last().fill(ADMIN_PASS)
  await page.getByRole('button', { name: 'Entrar como Admin' }).click()

  // Espera a que cargue el panel de control
  await expect(page.getByText('Panel de Control')).toBeVisible({ timeout: 10000 })
}

// ── Setup ─────────────────────────────────────────────────────────
test.beforeEach(async ({ page }) => {
  if (!ADMIN_EMAIL || !ADMIN_PASS) {
    test.skip(true, 'Credenciales de admin no configuradas (ADMIN_EMAIL / ADMIN_PASS)')
  }
  await loginAdmin(page)
})

// ── Panel de Control ──────────────────────────────────────────────

test('muestra el panel de control con las 4 estadísticas', async ({ page }) => {
  await expect(page.locator('.stat-label', { hasText: 'Usuarios' })).toBeVisible()
  await expect(page.locator('.stat-label', { hasText: 'Tareas totales' })).toBeVisible()
  await expect(page.locator('.stat-label', { hasText: 'Completadas' })).toBeVisible()
  await expect(page.locator('.stat-label', { hasText: 'Pendientes' })).toBeVisible()
})

test('muestra la sidebar con los ítems de navegación', async ({ page }) => {
  await expect(page.getByRole('navigation').or(page.locator('.sidebar-nav'))).toBeVisible()
  await expect(page.locator('.nav-item', { hasText: 'Usuarios' })).toBeVisible()
  await expect(page.locator('.nav-item', { hasText: 'Buscar' })).toBeVisible()
})

test('muestra el email del admin en el footer de la sidebar', async ({ page }) => {
  await expect(page.locator('.sidebar-email')).toContainText(ADMIN_EMAIL)
})

// ── Vista Usuarios ────────────────────────────────────────────────

test('carga y muestra la lista de usuarios', async ({ page }) => {
  await expect(page.locator('.users-list')).toBeVisible()
})

test('filtra usuarios por email al escribir en el buscador', async ({ page }) => {
  const searchInput = page.getByPlaceholder('Buscar por email...')
  await searchInput.fill('zzz_no_existe_xyz')
  await expect(page.getByText('Sin resultados')).toBeVisible()
  await searchInput.clear()
})

test('selecciona un usuario y muestra sus tareas', async ({ page }) => {
  const primeraFila = page.locator('.user-row').first()
  await expect(primeraFila).toBeVisible()
  await primeraFila.click()

  // El panel de tareas debe mostrar algo (loading o lista o "sin tareas")
  await expect(
    page.locator('.tasks-list, .panel-empty').last()
  ).toBeVisible({ timeout: 8000 })
})

test('el filtro multi-etiqueta de tareas funciona', async ({ page }) => {
  // Seleccionar primer usuario que tenga tareas
  const fila = page.locator('.user-row').first()
  await fila.click()
  await page.waitForSelector('.tasks-list, .panel-empty', { timeout: 8000 })

  // Si hay tareas, intentar activar un filtro de categoría
  const hayTareas = await page.locator('.tasks-list').isVisible()
  if (!hayTareas) return

  // Click en primera categoría disponible
  const catBtn = page.locator('.cat-filter-btn').nth(1)
  await catBtn.click()
  await expect(catBtn).toHaveClass(/cat-filter-btn--active/)

  // Click en segunda categoría — multi-select
  const catBtn2 = page.locator('.cat-filter-btn').nth(2)
  await catBtn2.click()
  await expect(catBtn2).toHaveClass(/cat-filter-btn--active/)

  // Limpiar con "Todas"
  await page.locator('.cat-filter-btn').first().click()
  await expect(page.locator('.cat-filter-btn').nth(1)).not.toHaveClass(/cat-filter-btn--active/)
})

test('filtra tareas por estado (Pendientes / Hechas)', async ({ page }) => {
  const fila = page.locator('.user-row').first()
  await fila.click()
  await page.waitForSelector('.tasks-list, .panel-empty', { timeout: 8000 })

  const hayTareas = await page.locator('.tasks-list').isVisible()
  if (!hayTareas) return

  await page.locator('.filter-chip', { hasText: 'Pendientes' }).click()
  await expect(page.locator('.filter-chip', { hasText: 'Pendientes' })).toHaveClass(/filter-chip--active/)

  await page.locator('.filter-chip', { hasText: 'Hechas' }).click()
  await expect(page.locator('.filter-chip', { hasText: 'Hechas' })).toHaveClass(/filter-chip--active/)

  await page.locator('.filter-chip', { hasText: 'Todas' }).click()
})

// ── Crear usuario (mock para no contaminar la BD) ─────────────────

test('abre y cierra el diálogo de crear usuario', async ({ page }) => {
  await page.locator('.new-user-btn').click()
  await expect(page.getByText('Nuevo usuario')).toBeVisible()
  await page.getByRole('button', { name: 'Cancelar' }).click()
  await expect(page.getByText('Nuevo usuario')).not.toBeVisible()
})

test('valida que todos los campos sean obligatorios al crear', async ({ page }) => {
  await page.locator('.new-user-btn').click()
  await page.getByRole('button', { name: 'Crear' }).click()
  await expect(page.getByText('Todos los campos son obligatorios')).toBeVisible()
})

test('crea un usuario con mock y lo muestra en la lista', async ({ page }) => {
  await page.route('**/api/admin/usuarios', route => {
    if (route.request().method() === 'POST') {
      route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'mock-99', email: 'mock@test.com',
          nombre: 'Mock User', tareaCount: 0, completadasCount: 0,
        }),
      })
    } else {
      route.continue()
    }
  })

  await page.locator('.new-user-btn').click()
  await page.getByLabel('Nombre').fill('Mock User')
  await page.getByLabel('Correo electrónico').last().fill('mock@test.com')
  await page.locator('.crear-field input[type="password"], .crear-field input[type="text"]').last().fill('pass123')
  await page.getByRole('button', { name: 'Crear' }).click()

  await expect(page.locator('.user-email', { hasText: 'mock@test.com' })).toBeVisible()
})

// ── Eliminar usuario (mock) ───────────────────────────────────────

test('muestra confirmación antes de eliminar', async ({ page }) => {
  // Hover sobre la primera fila para que aparezca el botón
  const fila = page.locator('.user-row').first()
  await fila.hover()
  await fila.locator('.delete-btn').click()

  await expect(page.getByText('¿Eliminar usuario?')).toBeVisible()
  await page.getByRole('button', { name: 'Cancelar' }).click()
  await expect(page.getByText('¿Eliminar usuario?')).not.toBeVisible()
})

// ── Vista Buscar ──────────────────────────────────────────────────

test('navega a la vista Buscar y pre-carga los datos', async ({ page }) => {
  await page.locator('.nav-item', { hasText: 'Buscar' }).click()

  // Puede mostrar spinner mientras carga
  await expect(
    page.getByText('Panel de Control')
  ).toBeVisible() // el header siempre debe estar

  // Esperar a que aparezcan las pestañas (carga terminada)
  await expect(
    page.locator('.v-tabs').filter({ hasText: 'Usuarios por etiqueta' })
  ).toBeVisible({ timeout: 30000 })
})

test('pestaña "Usuarios por etiqueta" — pide seleccionar una etiqueta', async ({ page }) => {
  await page.locator('.nav-item', { hasText: 'Buscar' }).click()
  await expect(
    page.locator('.v-tabs').filter({ hasText: 'Usuarios por etiqueta' })
  ).toBeVisible({ timeout: 30000 })

  await expect(page.locator('.v-window-item--active .empty-text')).toContainText('Selecciona al menos una etiqueta')
})

test('seleccionar etiqueta en "Usuarios por etiqueta" muestra resultados', async ({ page }) => {
  await page.locator('.nav-item', { hasText: 'Buscar' }).click()
  await expect(
    page.locator('.v-tabs').filter({ hasText: 'Usuarios por etiqueta' })
  ).toBeVisible({ timeout: 30000 })

  // Hacer click en la primera etiqueta disponible
  await page.locator('.v-window-item--active .busqueda-chip').first().click()
  await expect(page.locator('.v-window-item--active .busqueda-chip').first()).toHaveClass(/busqueda-chip--active/)

  // Debe mostrar resultados o el mensaje de "ningún usuario"
  await expect(
    page.locator('.v-window-item--active').filter({ hasText: /usuario\(s\) encontrado\(s\)|Ningún usuario tiene/ })
  ).toBeVisible()
})

test('pestaña "Tareas por etiqueta" — muestra resultados al seleccionar etiqueta', async ({ page }) => {
  await page.locator('.nav-item', { hasText: 'Buscar' }).click()
  await expect(
    page.locator('.v-tabs').filter({ hasText: 'Usuarios por etiqueta' })
  ).toBeVisible({ timeout: 30000 })

  await page.getByRole('tab', { name: /Tareas por etiqueta/i }).click()
  await expect(page.locator('.v-window-item--active .empty-text')).toContainText('Selecciona al menos una etiqueta')

  await page.locator('.v-window-item--active .busqueda-chip').first().click()
  await expect(
    page.locator('.v-window-item--active').filter({ hasText: /tarea\(s\) encontrada\(s\)|No hay tareas/ })
  ).toBeVisible()
})

test('pestaña "Etiquetas por usuario" — muestra etiquetas al seleccionar usuario', async ({ page }) => {
  await page.locator('.nav-item', { hasText: 'Buscar' }).click()
  await expect(
    page.locator('.v-tabs').filter({ hasText: 'Usuarios por etiqueta' })
  ).toBeVisible({ timeout: 30000 })

  await page.getByRole('tab', { name: /Etiquetas por usuario/i }).click()
  await expect(page.locator('.v-window-item--active .empty-text')).toContainText('Selecciona al menos un usuario')

  // Seleccionar el primer usuario de la lista de chips
  await page.locator('.v-window-item--active .busqueda-users-chips .busqueda-chip').first().click()
  await expect(
    page.locator('.v-window-item--active').filter({ hasText: /etiqueta\(s\) en uso|no tienen tareas con etiquetas/ })
  ).toBeVisible()
})

test('puede seleccionar múltiples etiquetas en búsqueda', async ({ page }) => {
  await page.locator('.nav-item', { hasText: 'Buscar' }).click()
  await expect(
    page.locator('.v-tabs').filter({ hasText: 'Usuarios por etiqueta' })
  ).toBeVisible({ timeout: 30000 })

  const chips = page.locator('.v-window-item--active .busqueda-chip')
  await chips.nth(0).click()
  await chips.nth(1).click()

  await expect(chips.nth(0)).toHaveClass(/busqueda-chip--active/)
  await expect(chips.nth(1)).toHaveClass(/busqueda-chip--active/)

  // Deseleccionar una
  await chips.nth(0).click()
  await expect(chips.nth(0)).not.toHaveClass(/busqueda-chip--active/)
  await expect(chips.nth(1)).toHaveClass(/busqueda-chip--active/)
})

// ── Logout ────────────────────────────────────────────────────────

test('cierra sesión y vuelve a la pantalla de login', async ({ page }) => {
  await page.route('**/api/auth/logout', r =>
    r.fulfill({ status: 200, contentType: 'application/json', body: '{}' })
  )
  await page.locator('.logout-btn').click()
  await expect(page.getByText('Organiza tu día con calma')).toBeVisible()
})
