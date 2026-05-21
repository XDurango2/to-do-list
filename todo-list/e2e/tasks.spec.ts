import { test, expect } from '@playwright/test'

// Simula una sesión autenticada antes de cada test
test.beforeEach(async ({ page }) => {
  await page.route('https://accounts.google.com/**', route => route.abort())

  await page.route('**/api/auth/verify', route =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        autenticado: true,
        usuario: { _id: 'u1', nombre: 'Juan', email: 'juan@test.com' },
      }),
    })
  )
  await page.route('**/api/tareas', route => {
    if (route.request().method() === 'GET') {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { _id: '1', titulo: 'Comprar leche', texto: '', completada: false, categorias: ['personal'] },
          { _id: '2', titulo: 'Revisar correos', texto: 'Ver bandeja de entrada', completada: true, categorias: ['trabajo'] },
        ]),
      })
    } else {
      route.continue()
    }
  })

  await page.goto('/')
})

// ── Vista principal ───────────────────────────────────────────────

test('muestra las tareas del usuario al cargar', async ({ page }) => {
  await expect(page.getByText('Comprar leche')).toBeVisible()
  await expect(page.getByText('Revisar correos')).toBeVisible()
})

test('muestra la barra de progreso', async ({ page }) => {
  // 1 de 2 completadas
  await expect(page.getByText(/1.*2|1\/2/)).toBeVisible()
})

test('muestra el nombre del usuario en el header', async ({ page }) => {
  await expect(page.getByText('Juan')).toBeVisible()
})

// ── Filtros de pestaña ────────────────────────────────────────────

test('pestaña Pendientes muestra solo tareas no completadas', async ({ page }) => {
  await page.getByRole('tab', { name: /Pendientes|Pending/i }).click()

  await expect(page.getByText('Comprar leche')).toBeVisible()
  await expect(page.getByText('Revisar correos')).not.toBeVisible()
})

test('pestaña Hechas muestra solo tareas completadas', async ({ page }) => {
  await page.getByRole('tab', { name: /Hechas|Done/i }).click()

  await expect(page.getByText('Revisar correos')).toBeVisible()
  await expect(page.getByText('Comprar leche')).not.toBeVisible()
})

// ── Crear tarea ───────────────────────────────────────────────────

test('crea una tarea nueva y la muestra en la lista', async ({ page }) => {
  await page.route('**/api/tareas', route => {
    if (route.request().method() === 'POST') {
      route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({
          _id: '3', titulo: 'Nueva tarea', texto: 'Descripción', completada: false, categorias: ['personal'],
        }),
      })
    } else {
      route.continue()
    }
  })

  // El botón solo tiene ícono — localizarlo por clase
  await page.getByPlaceholder('Título de la tarea').fill('Nueva tarea')
  await page.getByPlaceholder('¿Qué tienes que hacer?').fill('Descripción')
  await page.locator('.add-btn').click()

  await expect(page.getByText('Nueva tarea')).toBeVisible()
})

// ── Completar tarea ───────────────────────────────────────────────

test('marca una tarea como completada', async ({ page }) => {
  await page.route('**/api/tareas/1', route =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ _id: '1', titulo: 'Comprar leche', completada: true, categorias: ['personal'] }),
    })
  )

  // Encuentra el item por texto y hace click en el control de selección de Vuetify
  await page.locator('.task-item')
    .filter({ hasText: 'Comprar leche' })
    .locator('.v-selection-control__input')
    .click()
})

// ── Logout ────────────────────────────────────────────────────────

test('vuelve a la pantalla de login al cerrar sesión', async ({ page }) => {
  await page.route('**/api/auth/logout', route =>
    route.fulfill({ status: 200, contentType: 'application/json', body: '{}' })
  )

  await page.getByRole('button', { name: /Cerrar sesión|Logout|salir/i }).click()

  await expect(page.getByText('Organiza tu día con calma')).toBeVisible()
})
