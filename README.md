# Atoyac Café

Sitio, kiosco, TV de turnos y portal interno del café, en un solo proyecto: SvelteKit 3 + TypeScript (adapter-node), SQLite en modo WAL con Drizzle ORM, validación con Zod, tiempo real con Server-Sent Events y pruebas con Vitest.

El plan está en `docs/PLAN.md`, el diseño en `docs/DISENO.md` y el contrato técnico (endpoints, eventos, dueños de archivos) en `docs/CONTRATO.md`. El código anterior (HTML sueltos con `localStorage`) está en `legacy/` solo como referencia.

## Puesta en marcha

Requiere Node 22 o superior.

```bash
npm install
cp .env.example .env        # en desarrollo funciona sin editarlo
npm run seed                # catálogo, insumos, recetas y usuarios de ejemplo
npm run dev                 # http://localhost:5173
```

PINs de desarrollo (solo si `NODE_ENV` no es `production`): admin `1111`, caja `2222`, cocina `3333`.

Rutas: `/` sitio, `/kiosco`, `/turnos`, `/portal` (pide PIN en `/portal/login`), `/api/*`.

## Scripts

| Script | Qué hace |
|---|---|
| `npm run dev` | Servidor de desarrollo (puerto 5173) |
| `npm run build` | Compila a `build/` |
| `npm run preview` | Sirve el build (puerto 4173) |
| `npm run test` | Vitest con una DB temporal por archivo |
| `npm run check` | `svelte-check` (tipos) |
| `npm run seed` | Siembra datos; `-- --reset` borra y vuelve a sembrar |
| `npm run db:generate` | Genera una migración en `drizzle/` tras cambiar `src/lib/server/db/schema.ts` |

Las migraciones se aplican solas al arrancar el servidor. Si cambias el esquema: `npm run db:generate`, revisa el SQL y súbelo con el código.

## Variables de entorno

Ver `.env.example`. Resumen:

| Variable | Uso |
|---|---|
| `DATABASE_PATH` | Archivo SQLite (por defecto `./data/atoyac.db`) |
| `SESSION_SECRET` | Firma de la cookie de sesión. Obligatoria en producción |
| `PIN_ADMIN`, `PIN_CAJA`, `PIN_COCINA` | PIN por rol. Obligatorios en producción al sembrar usuarios |
| `PORT`, `HOST` | Servidor (`node build`). VPS: `3095` y `127.0.0.1` |
| `ADDRESS_HEADER`, `XFF_DEPTH` | Detrás de nginx, para que el límite de intentos de login use la IP real |
| `MP_TOKEN`, `MP_TERMINAL` | Mercado Pago Point |
| `WA_TOKEN`, `WA_PHONE_ID` | WhatsApp Cloud API |
| Credenciales de DiDi, Rappi y Uber | Las agrega cada adaptador de canal |

Nunca se escriben tokens en el código ni se suben `.env`. En desarrollo y pruebas, los cobros, WhatsApp y apps de delivery se mockean.

## Despliegue (resumen)

`npm ci && npm run build`, `.env` con `chmod 600`, y un servicio systemd que corra `node build` desde la raíz del proyecto (necesita la carpeta `drizzle/` al lado). nginx con `proxy_buffering off` para `/api/stream`. Respaldo: copiar `data/atoyac.db` (con `sqlite3 data/atoyac.db ".backup ..."` si el servicio está corriendo).
