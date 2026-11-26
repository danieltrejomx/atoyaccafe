# Contrato técnico (base)

Fuente de verdad para los 5 builders. Todo lo marcado "base" ya existe y **no se edita**: si falta algo, se avisa al integrador. Texto de interfaz en es-MX, sin emojis (iconos SVG), colores solo con tokens de `src/lib/ui/tokens.css` (ver `DISENO.md`).

## Convenciones

- Importa con `$lib/...` (alias fijado en `vite.config.ts`). SvelteKit 3, Svelte 5 con runes, TypeScript estricto.
- Dinero: **pesos MXN enteros**. Fechas de negocio `YYYY-MM-DD` en `America/Mexico_City`; marcas de tiempo en milisegundos (`creadoEn`).
- Los nombres de campos van en español y camelCase en la API (`pagoEstado`, `externoId`); las columnas SQL van en snake_case.
- Errores de la API: `{ "error": "texto en español", "detalle"?: ... }` con 400 (datos), 401 (sin sesión), 403 (rol), 404, 409 (estado inválido), 429 (demasiados intentos de login).
- El precio **siempre** lo calcula el servidor desde la DB. Los canales externos mandan SKU, no precios.
- Secretos solo desde `env` (`src/lib/server/env.ts`): `MP_TOKEN`, `MP_TERMINAL`, `WA_TOKEN`, `WA_PHONE_ID` y las credenciales de cada canal. Nada de tokens en código. En desarrollo y pruebas, las integraciones externas se mockean.

## Puertos y comandos

| Qué | Comando | Puerto |
|---|---|---|
| Dev integrador | `npm run dev` | 5173 |
| Builder a (kiosco) | `npm run dev -- --port 5174` | 5174 |
| Builder b (TV) | `npm run dev -- --port 5175` | 5175 |
| Builder c (portal) | `npm run dev -- --port 5176` | 5176 |
| Builder d (sitio) | `npm run dev -- --port 5177` | 5177 |
| Builder e (canales) | `npm run dev -- --port 5178` | 5178 |
| Producción (VPS) | `node build` con `PORT=3095 HOST=127.0.0.1` | 3095 |

Cada builder usa su propia DB para no pisar a otro: `DATABASE_PATH=./data/<letra>.db npm run seed` y luego `DATABASE_PATH=./data/<letra>.db npm run dev -- --port ...`. PINs de desarrollo: admin 1111, caja 2222, cocina 3333.
Otros: `npm run test`, `npm run check`, `npm run build`, `npm run db:generate` (solo si cambia el esquema, y solo el integrador).

## Quién es dueño de qué

**Base (congelado):** `src/lib/types.ts`, `src/lib/schemas.ts`, `src/lib/api.ts`, `src/lib/stream.svelte.ts`, `src/lib/server/{env,http,auth,sse,turnos,pedidos,insumos,productos,recetas}.ts`, `src/lib/server/db/**`, `src/hooks.server.ts`, `src/app.html`, `src/app.d.ts`, `src/routes/+layout.svelte`, `src/routes/api/{productos,pedidos,turnos,insumos,recetas,login,logout,stream}/**`, `src/lib/ui/tokens.css`, `drizzle/**`, configuración raíz, `static/img/**`.

| Builder | Archivos propios |
|---|---|
| a. Kiosco | `src/routes/kiosco/**`, `src/lib/kiosco/**`, `src/lib/server/cobro-mp.ts`, `src/lib/server/whatsapp.ts`, `src/routes/api/cobro/**`, `src/routes/api/whatsapp/**` |
| b. TV de turnos | `src/routes/turnos/**`, `src/lib/turnos/**`, `static/video/**` |
| c. Portal | `src/routes/portal/**` (incluye `/portal/login`), `src/lib/portal/**` salvo `CapturaManual.svelte` |
| d. Sitio público | `src/routes/(sitio)/**`, `src/lib/sitio/**` |
| e. Canales | `src/lib/server/canales/**`, `src/routes/api/webhooks/**`, `src/lib/portal/CapturaManual.svelte` |

Componentes de UI compartidos nuevos van en `src/lib/ui/<Nombre>.svelte` con prefijo del builder en el commit; no se modifica un componente de otro. Pruebas nuevas: `src/lib/server/<modulo>.test.ts` junto a su módulo (usar `./testdb` como en `pedidos.test.ts`).

## Acceso (hooks.server.ts + `rolesPermitidos` en `auth.ts`)

Sesión: cookie `atoyac_sesion` (HMAC con `SESSION_SECRET`, 12 h, httpOnly). `event.locals.usuario` es `{ id, nombre, rol } | null`.

| Ruta | Quién |
|---|---|
| `GET /api/productos`, `GET /api/turnos`, `GET /api/stream`, `POST /api/login`, `POST /api/logout` | público |
| `POST /api/pedidos` | público solo con `canal: "kiosco"`; los demás canales piden sesión |
| `/api/webhooks/**`, `/api/cobro/**`, `/api/whatsapp/**` (cualquier método) | público (el builder valida firma / limita lo que expone) |
| `PUT/POST/PATCH/DELETE` en `/api/recetas/**` y `/api/productos/**` | `admin` |
| `PATCH /api/pedidos/:id` con `pagado` | `admin` o `caja` |
| Todo lo demás de `/api/**` y todo `/portal/**` (excepto `/portal/login`) | sesión con cualquier rol (`admin`, `caja`, `cocina`) |

Sin sesión, `/portal/**` responde 303 a `/portal/login?next=...`; `/api/**` responde 401. Para una regla más fina en un endpoint: `exigirRol(locals, 'admin', 'caja')`. Para una ruta pública nueva en `/api`, usa uno de los prefijos públicos de arriba (`webhooks`, `cobro`, `whatsapp`).

## Endpoints

Tipos de respuesta en `src/lib/types.ts`; entradas en `src/lib/schemas.ts`. Cliente tipado: `api` en `src/lib/api.ts` (`crearApi(fetch)` dentro de `load`).

| Método y ruta | Entrada | Respuesta |
|---|---|---|
| `GET /api/productos` | `?todos=1` (solo con sesión) incluye inactivos | `Producto[]` con `opciones` y `disponible` (false si algún insumo de su receta base está en 0) |
| `POST /api/pedidos` | `CrearPedidoInput` | `Pedido`, 201 si se creó, 200 si ya existía ese `externoId` |
| `GET /api/pedidos` | `?canal=&estado=` | `Pedido[]` del día, turno más nuevo primero |
| `GET /api/pedidos/:id` | | `Pedido` |
| `PATCH /api/pedidos/:id` | `{ estado? , pagado?: true, pagoMetodo? }` | `Pedido` |
| `GET /api/turnos` | | `TurnosRespuesta` |
| `GET /api/insumos` | | `Insumo[]` (con `bajoMinimo`) |
| `PATCH /api/insumos` | `{ id, tipo: "ajuste"\|"merma"\|"compra", cantidad, nota? }` o `{ id, minimo }` | `Insumo` |
| `GET /api/recetas/:productoId` | | `{ productoId, base: Linea[], opciones: { opcionId, lineas: Linea[] }[] }` |
| `PUT /api/recetas/:productoId` | `{ base, opciones }` (reemplaza toda la receta; lo no enviado queda vacío) | igual que GET |
| `POST /api/login` | `{ pin }` | `{ id, nombre, rol }` y cookie |
| `POST /api/logout` | | `{ ok: true }` |
| `GET /api/stream` | | SSE |

`Linea = { insumoId, cantidad }`. `CrearPedidoInput`:

```json
{
  "canal": "kiosco",
  "externoId": "didi:123",
  "cliente": "Ana",
  "telefono": "5215512345678",
  "pagoMetodo": "efectivo",
  "notas": "sin cebolla",
  "items": [{ "productoId": 3, "cantidad": 2, "opcionIds": [11, 14], "notas": "" }]
}
```

Reglas de `crearPedido`: una sola transacción (turno diario, líneas, descuento de insumos por receta de producto y de cada opción, movimientos `consumo`). Dos opciones `unica` del mismo grupo se rechazan. El stock puede quedar negativo (no bloquea la venta; el portal lo marca en rojo). `pagoEstado` inicia `pendiente` para `kiosco` y `caja`, y `pagado` para `interno`, `didi`, `rappi`, `uber`.

### Ciclo de vida de un pedido

`estado`: `nuevo` → `preparando` → `listo` → `entregado`; `cancelado` desde cualquiera salvo `entregado` (revierte el descuento de insumos una sola vez). Un pedido con `pagoEstado: "pendiente"` no puede avanzar de estado (409) ni aparece en la TV.

- **Efectivo / transferencia (kiosco):** el kiosco crea el pedido con `pagoMetodo`; caja confirma con `PATCH { pagado: true }` (botón "Cobrar $X").
- **Tarjeta (kiosco):** el kiosco crea el pedido (`pagoMetodo: "tarjeta"`, queda pendiente), llama a `/api/cobro/...` (builder a), y el servidor del cobro, al aprobarse en Mercado Pago, llama `confirmarPago(id, 'tarjeta')` de `pedidos.ts`.
- **Apps de delivery:** el webhook valida la firma, `toPedido` arma el `CrearPedidoInput` con `externoId: "<canal>:<id>"` y llama a `crearPedido` directo (no pasa por `POST /api/pedidos`). Llegan `pagado`.

### Turnos (`GET /api/turnos`)

```json
{ "actual": { "turno": 7, "pedidoId": 41, "estado": "preparando", "productos": ["Americano", "Panini Jamón"] },
  "proximos": [8, 12, 18], "listos": [6, 5] }
```

`actual` = el pedido pagado más antiguo en `preparando` (si no hay, en `nuevo`); `proximos` = hasta 3 en espera; `listos` = turnos en `listo`, más reciente primero (hasta 5). Solo hoy y solo pagados.

## SSE: `GET /api/stream`

`text/event-stream`, latido cada 20 s (`: latido`), `retry: 3000`. Cada evento: `event: <nombre>` y `data: <json>`.

| Evento | `data` (interno, con sesión) | Para anónimos (TV, kiosco) |
|---|---|---|
| `pedido.creado` | `Pedido` completo | `{ id, turno, estado }` |
| `pedido.actualizado` | `Pedido` completo | `{ id, turno, estado }` |
| `turno.listo` | `{ turno, pedidoId }` | igual |
| `insumo.actualizado` | `Insumo` | no se envía |

Patrón en pantallas: `crearStream(manejadores, { alAbrir: recargar })` de `$lib/stream.svelte.ts` (reconecta con espera creciente; `alAbrir` corre en cada conexión, ahí se recarga el estado completo con `api`). `stream.conectado` es reactivo para el chip "Reconectando…". La TV, ante cualquier `pedido.*`, vuelve a pedir `/api/turnos`; con `turno.listo` suena la campana y habla.

## Biblioteca de servidor (`src/lib/server`)

| Módulo | Funciones |
|---|---|
| `pedidos.ts` | `crearPedido(input) → { pedido, creado }`, `cambiarEstado(id, estado)`, `confirmarPago(id, metodo?)`, `cancelar(id)`, `obtenerPedido(id)`, `listarPedidos({ canal?, estado? })`. Emiten los eventos SSE. |
| `insumos.ts` | `listarInsumos()`, `obtenerInsumo(id)`, `bajoMinimo()`, `actualizarInsumo(patch)` (ajuste, merma, compra, mínimo), `moverStock(tx, ...)` |
| `turnos.ts` | `turnosActuales()`, `fechaNegocio(ts?)`, `siguienteTurno(tx, fecha)` |
| `productos.ts` | `listarProductos(soloActivos = true)` |
| `recetas.ts` | `obtenerReceta(productoId)`, `guardarReceta(productoId, receta)` |
| `sse.ts` | `emitir(evento, data)`, `suscribir(fn) → baja` |
| `auth.ts` | `login(pin, origen)`, `hashPin`, `verificarPin`, `crearToken`, `leerToken`, `rolesPermitidos`, `exigirRol` |
| `http.ts` | `manejar(fn)` (Zod → 400, `ErrorNegocio` → su status), `cuerpo(request)`, `ErrorNegocio` |
| `db/` | `getDb()` (perezoso, migra al abrir), tablas en `db/schema.ts` |

Patrón de endpoint nuevo: `export const POST = ({ request }) => manejar(async () => servicio(esquema.parse(await cuerpo(request))))`. Toda entrada pasa por Zod.

## Contratos que implementan los builders

**Canales (e)** en `src/lib/server/canales/index.ts`:

```ts
interface ChannelAdapter {
  canal: 'didi' | 'rappi' | 'uber';
  verify(request: Request): Promise<boolean>;                   // firma del webhook
  toPedido(payload: unknown): CrearPedidoInput | Promise<...>;  // por SKU (productos.skuDidi / skuRappi / skuUber)
  aceptar(externoId: string): Promise<void>;
  marcarListo(externoId: string): Promise<void>;
}
export const canales: Partial<Record<Canal, ChannelAdapter>>;   // registro
export function iniciarCanales(): void;                         // llamada al arrancar; suscribirse a 'listo'
```

Webhook en `src/routes/api/webhooks/[canal]/+server.ts`: `verify` → 401 si falla; `toPedido`; `crearPedido` (idempotente); `aceptar` solo si `creado`; responder 200 siempre que la firma sea válida para que la app no reintente. El portal incluye "Capturar pedido" con `CapturaManual.svelte` (usa `api.crearPedido` con sesión).

**Kiosco (a):** `cobro-mp.ts` (`iniciarCobro`, `consultarCobro`) y `whatsapp.ts` (`enviarTicket`) hoy son solo firmas con `declare`; se implementan con `fetch` y credenciales de `env`, con modo mock fuera de producción.

## Datos de ejemplo (`npm run seed`)

19 productos en las 7 categorías, con opciones y SKU por app (`atoyac-<slug>`), 26 insumos, recetas de ejemplo y 3 usuarios. `npm run seed -- --reset` borra todo (incluidos pedidos) y vuelve a sembrar. Los precios de ensaladas y bebidas calientes son propuestos: confirmar con el cliente. Fotos: solo hay genéricas en `static/img/dishes/`; `foto` es `null` donde no hay y la UI debe mostrar un círculo de reemplazo.
