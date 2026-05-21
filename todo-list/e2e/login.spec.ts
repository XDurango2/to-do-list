import { test, expect } from '@playwright/test'

// Helpers para los inputs de contraseña — getByLabel falla porque Vuetify
// genera aria-label en el ícono del ojo que también coincide con "Contraseña"
const passInput    = (page: any) => page.locator('input[autocomplete="current-password"]')
const newPassInput = (page: any) => page.locator('input[autocomplete="new-password"]')

test.beforeEach(async ({ page }) => {
  // Bloquea el SDK de Google para no depender de red externa
  await page.route('https://accounts.google.com/**', route => route.abort())

  await page.goto('/')
})

// ── Pantalla de login ─────────────────────────────────────────────

test('muestra la pantalla de login cuando no hay sesión', async ({ page }) => {
  await expect(page.getByText('Mis Tareas')).toBeVisible()
  await expect(page.getByText('Organiza tu día con calma')).toBeVisible()
})

test('muestra los campos de email y contraseña', async ({ page }) => {
  await expect(page.getByLabel('Correo electrónico')).toBeVisible()
  await expect(passInput(page)).toBeVisible()
  await expect(page.getByRole('button', { name: 'Iniciar sesión' })).toBeVisible()
})

test('muestra el enlace de Acceso Admin', async ({ page }) => {
  await expect(page.getByRole('button', { name: /Acceso Admin/i })).toBeVisible()
})

// ── Toggle login / registro ───────────────────────────────────────

test('cambia a modo registro al hacer click en "Crear cuenta"', async ({ page }) => {
  await page.getByRole('button', { name: 'Crear cuenta' }).click()

  await expect(page.getByLabel('Nombre')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Crear cuenta' })).toBeVisible()
  await expect(page.getByText('¿Ya tienes cuenta?')).toBeVisible()
})

test('vuelve a modo login desde registro', async ({ page }) => {
  await page.getByRole('button', { name: 'Crear cuenta' }).click()
  await page.getByRole('button', { name: 'Iniciar sesión' }).click()

  await expect(page.getByLabel('Nombre')).not.toBeVisible()
  await expect(page.getByRole('button', { name: 'Iniciar sesión' })).toBeVisible()
})

test('limpia los campos al cambiar de modo', async ({ page }) => {
  await page.getByLabel('Correo electrónico').fill('test@test.com')
  await page.getByRole('button', { name: 'Crear cuenta' }).click()

  await expect(page.getByLabel('Correo electrónico')).toHaveValue('')
})

// ── Toggle de contraseña ──────────────────────────────────────────

test('muestra y oculta la contraseña al hacer click en el ícono', async ({ page }) => {
  const field = passInput(page)
  await expect(field).toHaveAttribute('type', 'password')

  await page.getByRole('button', { name: 'Contraseña appended action' }).click()
  await expect(field).toHaveAttribute('type', 'text')

  await page.getByRole('button', { name: 'Contraseña appended action' }).click()
  await expect(field).toHaveAttribute('type', 'password')
})

// ── Validación de formulario (sin credenciales) ───────────────────

test('no llama a la API si los campos están vacíos', async ({ page }) => {
  let llamoApi = false
  page.on('request', req => {
    if (req.url().includes('/auth/login-local')) llamoApi = true
  })

  await page.getByRole('button', { name: 'Iniciar sesión' }).click()
  await page.waitForTimeout(300)

  expect(llamoApi).toBe(false)
})

test('no llama a la API en registro si falta el nombre', async ({ page }) => {
  let llamoApi = false
  page.on('request', req => {
    if (req.url().includes('/auth/registro')) llamoApi = true
  })

  await page.getByRole('button', { name: 'Crear cuenta' }).click()
  await page.getByLabel('Correo electrónico').fill('test@test.com')
  await newPassInput(page).fill('123456')
  // No rellena el nombre
  await page.getByRole('button', { name: 'Crear cuenta' }).click()
  await page.waitForTimeout(300)

  expect(llamoApi).toBe(false)
})

// ── Sección Admin ─────────────────────────────────────────────────

test('despliega el formulario admin al hacer click', async ({ page }) => {
  await page.getByRole('button', { name: /Acceso Admin/i }).click()

  await expect(page.getByText('Acceso administrador')).toBeVisible()
  await expect(page.getByLabel('Correo administrador')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Entrar como Admin' })).toBeVisible()
})

test('cierra el formulario admin al cancelar', async ({ page }) => {
  await page.getByRole('button', { name: /Acceso Admin/i }).click()
  await page.getByRole('button', { name: 'Cancelar' }).click()

  await expect(page.getByText('Acceso administrador')).not.toBeVisible()
})

// ── Login con credenciales incorrectas ────────────────────────────

test('muestra error cuando el servidor rechaza las credenciales', async ({ page }) => {
  await page.route('**/api/auth/login-local', route =>
    route.fulfill({
      status: 401,
      contentType: 'application/json',
      body: JSON.stringify({ error: 'Credenciales incorrectas' }),
    })
  )

  await page.getByLabel('Correo electrónico').fill('malo@test.com')
  await passInput(page).fill('wrongpass')
  await page.getByRole('button', { name: 'Iniciar sesión' }).click()

  await expect(page.getByText('Credenciales incorrectas')).toBeVisible()
})

// ── Login exitoso (mock) ──────────────────────────────────────────

test('redirige a la app principal tras login exitoso', async ({ page }) => {
  await page.route('**/api/auth/login-local', route =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ csrfToken: 'tok123' }),
    })
  )
  await page.route('**/api/auth/verify', route =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        autenticado: true,
        usuario: { _id: '1', nombre: 'Juan', email: 'juan@test.com' },
      }),
    })
  )
  await page.route('**/api/tareas', route =>
    route.fulfill({ status: 200, contentType: 'application/json', body: '[]' })
  )

  await page.getByLabel('Correo electrónico').fill('juan@test.com')
  await passInput(page).fill('mipass123')
  await page.getByRole('button', { name: 'Iniciar sesión' }).click()

  await expect(page.getByText('Mis Tareas')).toBeVisible()
  // La pantalla de login ya no está
  await expect(page.getByText('Organiza tu día con calma')).not.toBeVisible()
})
