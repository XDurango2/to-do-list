# To-Do List

A single-page task management app with Google OAuth authentication, category tagging, and a REST API backend.

## Stack

- **Vue 3** (Composition API, `<script setup>`)
- **Vuetify 4** — Material Design UI components
- **Vite** — build tool with HMR
- **Axios** — HTTP client with CSRF interceptor
- **Vue Router** — SPA routing

## Getting started

```bash
npm install
npm run dev      # dev server at http://localhost:3000
npm run build    # production build → dist/
npm run preview  # preview production build
```

## Project structure

```
src/
├── pages/
│   ├── index.vue         # root component — global state, auth, CRUD
│   ├── admin.vue         # admin panel
│   └── categories.js     # category definitions + getCatColor/getCatLabel helpers
├── components/
│   ├── LoginScreen.vue   # Google OAuth login screen
│   ├── TodoHeader.vue    # header, date display, login/logout button
│   ├── ProgressCard.vue  # progress bar (completed/total)
│   ├── TaskInput.vue     # form for creating tasks (title, description, categories)
│   ├── TaskList.vue      # All/Pending/Done tabs + tag filter + animated list
│   └── TaskItem.vue      # individual task row
├── services/
│   └── api.js            # centralized Axios client — auth + task CRUD
├── router/index.ts
└── plugins/
    ├── index.ts
    └── vuetify.ts
```

## Task model

```js
// Frontend format
{
  id:         string,    // MongoDB _id
  title:      string,
  text:       string,
  done:       boolean,
  categorias: string[]   // values from CATEGORIES
}

// Server format (normalized in normalizarTarea())
{ _id, titulo, texto, completada, categorias }
```

## Categories

Defined in `src/pages/categories.js` (fixed — not fetched from the server).

| value      | label    | color   |
|------------|----------|---------|
| `personal` | Personal | #C0533A |
| `trabajo`  | Trabajo  | #C49A3C |
| `salud`    | Salud    | #7A8C74 |
| `hogar`    | Hogar    | #7A90B5 |

## Authentication

- Google OAuth (SDK `accounts.id`) → POST `/api/auth/login` with the Google credential
- Server responds with HTTP-Only cookie `jwt_token` + regular cookie `csrf_token`
- CSRF token is stored in memory and injected into every request via Axios interceptor
- On page reload, `verificarSesion()` reads `csrf_token` from the cookie and calls `GET /api/auth/verify`

## State management

No Vuex/Pinia. Reactive state via `ref()` in `pages/index.vue`:

```js
const usuario = ref(null)   // authenticated user object or null
const tasks   = ref([])     // array of normalized tasks
```

All task mutations go through `addTask`, `toggleTask`, `removeTask`, and `clearDone`, which call the API first and then update the local array.

## Task list filters

Two independent filters chained in the `filteredTasks` computed property:

1. **Status tab** — `all` / `pending` / `done`
2. **Selected tag** — `null` (all) or a category value (`personal`, `trabajo`, etc.)

## E2E tests

```bash
npm run test:e2e          # run Playwright tests (headless)
npm run test:e2e:headed   # run with browser visible
npm run test:e2e:ui       # open Playwright UI
npm run test:e2e:report   # view last test report
```

## License

MIT
