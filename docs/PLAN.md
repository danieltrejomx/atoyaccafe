# Atoyac Café: reconstrucción completa (3 pantallas + sitio + base de datos en VPS)

## Contexto
La "Parrilla de contenido" (PDF) y la nota de voz del 26-nov piden 3 pantallas conectadas:
1. **Kiosco iPad:** menú lateral (Ensaladas, Molletes, Chilaquiles, Paninis, Bebidas frías, Bebidas calientes, Promociones), cuadrícula con fotos, carrito, pago en efectivo/tarjeta/transferencia y ticket automático.
2. **TV vertical de turnos:** arriba, TURNO actual con sus productos y PRÓXIMOS, con aviso por voz en cada turno nuevo. Abajo, 2 videos en loop.
3. **Monitor interno de empleados:** pestañas DIDI | RAPPI | UBER | INTERNO | CAJA ("qué les piden desde ahí") e insumos.

Estado actual del repo `atoyaccafe/`:
- HTML sueltos de 1,000 a 2,000 líneas cada uno.
- Los datos solo viven en `localStorage` de cada navegador, así que el iPad y el monitor no se ven entre sí.
- Contraseñas visibles en `portal.html`.
- Token de Mercado Pago escrito en el código.
- Sin recetas ni integración con las apps de delivery.

Decisiones del usuario:
- Las 3 pantallas.
- Base de datos propia en el VPS.
- API real de DiDi, Rappi y Uber.
- Descuento automático de insumos por receta.
- **Reconstruir todo el sitio** para que escale y sea fácil de mantener.
- Hacerlo con un **agente creativo Fable** que dirige a **varios agentes Sonnet**.

## Stack recomendado (un solo proyecto, un solo despliegue)
- **SvelteKit + TypeScript** (adapter-node) para el sitio público, el kiosco, la TV de turnos y el portal interno. Un repo, con tipos compartidos entre frontend y backend y componentes reutilizables.
- **SQLite (modo WAL) + Drizzle ORM:** esquema tipado y migraciones versionadas. Es rápido, sin servidor aparte y respaldable con copiar un archivo. Si algún día hace falta, se migra a Postgres con el mismo Drizzle.
- **Tiempo real con Server-Sent Events** (`/api/stream`): pedidos, turnos e insumos se actualizan en todas las pantallas al instante.
- **Validación con Zod** en todos los endpoints. Es el punto de entrada de kiosco, webhooks y portal.
- **Pruebas con Vitest** para la lógica de negocio: turnos, recetas, idempotencia de webhooks y login.
- **Despliegue en maw-vps:**
  - servicio systemd `atoyac` en `127.0.0.1:3095` (libre)
  - nginx `atoyac.appsoluciones.duckdns.org` con certbot y `proxy_buffering off` para SSE
  - `.env` con chmod 600 (MP_TOKEN, MP_TERMINAL, WA_TOKEN, PINs, credenciales de las apps)
  - respaldo diario de la DB por cron

### Estructura del proyecto
```
atoyaccafe/   (rama nueva `reconstruccion`; el código viejo queda en el historial de git)
  src/lib/server/db/      esquema Drizzle + migraciones + seed (desde MENU_ITEMS, DISH_CONFIGS, INITIAL_INVENTORY de js/store.js)
  src/lib/server/         pedidos.ts, insumos.ts, turnos.ts, cobro-mp.ts, whatsapp.ts, sse.ts, auth.ts
  src/lib/server/canales/ didi.ts, rappi.ts, uber.ts (un adaptador por app, con la misma interfaz)
  src/lib/ui/             sistema de diseño: tokens, botones, tarjetas de producto, tarjeta de pedido
  src/routes/(sitio)/     inicio, menú, nosotros, inauguración, delivery, cursos
  src/routes/kiosco/      pantalla 1
  src/routes/turnos/      pantalla 2
  src/routes/portal/      pantalla 3 + caja, KDS, insumos, recetas, finanzas, checklists
  src/routes/api/         endpoints REST + /api/stream + webhooks
```

### Datos
- `productos`, con SKU por app y opciones/extras.
- `insumos`.
- `recetas` (producto u opción → insumo + cantidad).
- `pedidos`, con canal `caja|interno|kiosco|didi|rappi|uber`, `externo_id` único y turno diario.
- `pedido_items`.
- `movimientos_insumo` como bitácora de descuentos, mermas y ajustes.
- `usuarios` por rol con PIN hasheado.

Al crear un pedido, **en una sola transacción** se asigna el turno, se guardan los productos y se descuentan los insumos según la receta. Cancelar el pedido revierte el descuento.

## Las 3 pantallas
- **Kiosco:**
  - diseño del PDF (barra lateral de categorías + fotos)
  - carrito con opciones
  - pago con tarjeta (Mercado Pago Point, ahora desde el servidor) o efectivo/transferencia (pendiente de pago, se confirma en CAJA)
  - WhatsApp opcional para mandar el ticket automático por la Cloud API de Meta que ya está conectada
  - pantalla final con el número de turno
- **TV de turnos (1080×1920):**
  - TURNO grande con sus productos y los 3 PRÓXIMOS
  - cuando un pedido pasa a "listo", suena una campana y la voz dice "Turno 7, su pedido está listo" (`speechSynthesis` en es-MX; necesita un toque inicial para habilitar el audio)
  - 2 videos `muted loop` abajo, con marcadores hasta que el cliente mande los suyos
  - se reconecta sola si se cae la conexión
- **Monitor interno:**
  - pestañas DIDI/RAPPI/UBER/INTERNO/CAJA con contador
  - cada tarjeta muestra turno, productos, tiempo transcurrido y botones nuevo → preparando → listo → entregado
  - alerta con sonido al llegar un pedido
  - panel de insumos con stock, mínimo, alerta roja y ajuste/merma
  - editor de recetas

## DiDi / Rappi / Uber
Cada adaptador hace lo mismo:
1. verifica la firma del webhook
2. convierte el pedido al formato propio (por SKU)
3. lo acepta en la app
4. avisa a la app cuando está "listo"

Las plataformas que usaría son Uber Eats Marketplace API (Order Integration) y las APIs de comercios de Rappi y DiDi Food.
- **Bloqueo:** cada app da acceso a su API por comercio. El cliente tiene que pedir las credenciales de integración a su ejecutivo de cada app.
- Mientras llegan, cada pestaña tiene **"Capturar pedido"** manual, y el resto del sistema funciona igual.
- Los adaptadores quedan listos contra la documentación oficial y su sandbox.

## Ejecución con agentes (workflow, unos 8 agentes)
1. **Fable, dirección creativa:** lee el PDF, el sitio actual y `css/styles.css`, y produce `DISENO.md`: identidad, tokens (color, tipografía, espaciado), maquetas de las 3 pantallas y del sitio, tono de los textos y microinteracciones.
2. **Sonnet, base:** scaffold SvelteKit, esquema Drizzle + seed, contrato de API tipado, SSE, auth y pruebas Vitest de la lógica central. Todos los demás construyen sobre este contrato.
3. **Sonnet en paralelo (5 agentes):**
   - (a) kiosco + cobro MP + ticket WhatsApp
   - (b) TV de turnos
   - (c) portal interno: monitor, KDS, caja, insumos, recetas
   - (d) sitio público reconstruido
   - (e) adaptadores DiDi/Rappi/Uber + captura manual
4. **Fable, revisión:** recorre las pantallas con capturas, corrige lo que no respete `DISENO.md` y revisa la coherencia visual.
5. **Yo:** integro, corro pruebas y build, y verifico todo el flujo de punta a punta antes de desplegar.

## Verificación
- `npm run test` (Vitest): turno diario, descuento y reversa por receta, webhook duplicado que no crea 2 pedidos, login por PIN.
- `npm run build` sin errores de tipos.
- Prueba local en 3 pestañas: pedido en kiosco → aparece al instante en INTERNO/CAJA → marcar "listo" → la TV cambia de turno y habla → el stock baja según la receta.
- En el VPS: `curl https://atoyac.appsoluciones.duckdns.org/api/turnos` y las 3 pantallas abiertas en dispositivos distintos.
- Cobro real con la terminal Point solo con un monto pequeño y coordinado con el cliente, porque cobra dinero real.
- No se hace push al repo de GitHub (es de danieltrejomx) sin tu OK.
