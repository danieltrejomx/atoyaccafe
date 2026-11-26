# Atoyac Café: sistema de diseño

Fuente única de verdad visual para los 5 agentes constructores. Si algo no está aquí, se resuelve con los tokens de `src/lib/ui/tokens.css`, no con valores nuevos. Todo el texto de interfaz va en español de México. Sin emojis: iconos SVG.

## 1. Dirección

**Idea:** "Barra de barrio al amanecer". El logo es un sol que sale sobre una hoja. La interfaz se siente como papel crema con tinta verde bosque: mucho aire, fotos redondas de platos como en la maqueta del cliente, números grandes y redondos, y un solo acento cálido de terracota para lo que se toca o se paga.

Lo que se conserva del sitio actual: logo de línea (`assets/img/logo.svg`), verdes bosque y salvia, fondos crema y arena, terracota y ocre, Outfit para títulos, Instrument Serif en cursiva como acento.

Lo que se eleva:
- El verde salvia `#698975` no pasa contraste AA como texto (3.5:1). Queda como decorativo y entra `--c-hoja #3E6B50` para texto y acciones.
- Inter se cambia por **Figtree**: más cálida y redonda, combina con Outfit.
- Una sola regla de forma: **foto de platillo siempre en círculo** (como en el PDF), tarjetas con radio 22px, botones en píldora.
- Etiquetas en versalitas con tracking (`ENSALADAS`, `TURNO`, `PRÓXIMOS`, `DIDI`), igual que la maqueta del cliente.
- Trazo del logo como recurso gráfico: iconos de línea de 2px con puntas redondas, y los rayos del sol como separador o detalle de fondo. Nada de degradados morados, glassmorphism ni sombras duras.

Tres registros, mismo sistema:

| Superficie | Fondo | Carácter |
|---|---|---|
| Sitio público | papel + secciones bosque | editorial, con cursiva serif y fotos grandes |
| Kiosco y TV | arena + blanco | enorme, calmado, cero ruido |
| Portal interno | papel + blanco | denso, funcional, color solo para canal y estado |

## 2. Voz y microtextos

**Voz:** cercana, de tú, breve, de barrio pero cuidada. Habla como quien atiende la barra: saluda, dice qué sigue y no explica de más. Nunca regaña al cliente por un error. Sin signos de exclamación dobles, sin anglicismos ("checkout", "ticket" sí se usa porque así lo dice el cliente), sin mayúsculas sostenidas salvo en etiquetas.

Reglas:
- Botón = verbo + objeto: "Agregar al pedido", "Pagar $135", "Marcar listo".
- Precios: `$45`, sin decimales si son `.00`; con MXN solo en el ticket.
- Números de turno siempre sin ceros a la izquierda: "Turno 7".
- Errores: qué pasó + qué hacer. Nunca códigos técnicos al cliente.
- En el portal se habla de usted a nadie: es impersonal y directo ("Pedido nuevo de Rappi").

| Lugar | Texto |
|---|---|
| Kiosco, reposo | "Toca para ordenar" · "Fresco, rápido y a tu gusto" |
| Kiosco, categoría vacía | "Por ahora no hay nada aquí. Prueba otra categoría." |
| Kiosco, agotado | "Agotado por hoy" |
| Kiosco, agregar | "Agregar al pedido · $85" |
| Kiosco, carrito vacío | "Tu pedido está vacío. Elige algo rico." |
| Kiosco, carrito | "Tu pedido" · "Total" · "Continuar al pago" |
| Kiosco, nombre | "¿A nombre de quién?" (opcional) |
| Kiosco, pago | "¿Cómo quieres pagar?" · "Efectivo" · "Tarjeta" · "Transferencia" |
| Kiosco, efectivo/transferencia | "Pasa a caja para pagar. Tu pedido entra a cocina en cuanto se confirme." |
| Kiosco, tarjeta | "Acerca o inserta tu tarjeta en la terminal" · "Esperando el pago…" |
| Kiosco, pago rechazado | "No se pudo cobrar. Intenta de nuevo o elige otra forma de pago." |
| Kiosco, ticket | "¿Te mandamos tu ticket por WhatsApp?" · "Sí, enviarlo" · "No, gracias" |
| Kiosco, final | "Listo. Tu turno es el" + número · "Te avisamos en la pantalla cuando esté listo." |
| Kiosco, inactividad | "¿Sigues ahí?" · "Seguir ordenando" · "Empezar de nuevo" (15 s) |
| TV | "TURNO" · "PRÓXIMOS" · "En preparación" |
| TV, voz | "Turno 7, su pedido está listo" |
| TV, sin turnos | "Bienvenido a Atoyac. Ordena en el kiosco o en caja." |
| TV, activar audio | "Toca la pantalla para activar el sonido" |
| TV, sin conexión | "Reconectando…" (chip discreto, no pantalla completa) |
| Portal, pestañas | "DIDI" · "RAPPI" · "UBER" · "INTERNO" · "CAJA" |
| Portal, acciones | "Empezar a preparar" · "Marcar listo" · "Entregar" · "Cobrar $135" · "Cancelar pedido" |
| Portal, vacío | "Sin pedidos de DiDi por ahora." |
| Portal, captura manual | "Capturar pedido" |
| Portal, tiempo | "hace 4 min" (ámbar a los 8 min, rojo a los 12) |
| Insumos | "Insumos" · "Quedan 3 de mínimo 5" · "Ajustar" · "Registrar merma" |
| Stock bajo | "Queda poco aguacate: 3 pzas (mínimo 5)" |
| Stock en cero | "Se acabó el aguacate. Los platillos que lo usan salen como agotados." |
| PIN | "Escribe tu PIN" · "PIN incorrecto. Intenta otra vez." · "Demasiados intentos. Espera 1 minuto." |
| Sitio, hero | "Comida fresca para tu día a día." (cursiva en "día a día") |
| Sitio, CTA | "Ver el menú" · "Pedir a domicilio" · "Cómo llegar" |
| Delivery | "Pide sin comisiones, a precio de mostrador." |
| Datos | "Av. Popocatépetl 289, Local A, Santa Cruz Atoyac" · "Lun a sáb, 7:00 a 21:00" |

## 3. Tokens

El bloque completo vive en `src/lib/ui/tokens.css` (ya creado; importarlo una vez en `src/routes/+layout.svelte`). Resumen:

```css
:root {
  /* superficies */
  --c-papel: #F7F3EC;  --c-arena: #EFEAE2;  --c-blanco: #FFFFFF;
  --c-linea: rgba(31,45,36,.12);  --c-linea-fuerte: rgba(31,45,36,.24);
  /* marca */
  --c-bosque: #1F2D24;  --c-bosque-2: #2F4336;
  --c-hoja: #3E6B50;  --c-hoja-fuerte: #2F5D45;
  --c-salvia: #698975;  --c-salvia-claro: #E2EBE5;  --c-menta-tv: #A9C9B4;
  --c-barro: #B4552F;  --c-barro-texto: #9E4725;  --c-barro-claro: #F7E6DD;
  --c-maiz: #D9A441;  --c-maiz-claro: #F8EED9;
  /* texto */
  --c-texto: var(--c-bosque);  --c-texto-suave: #55615A;  --c-texto-inverso: #F7F3EC;
  /* estados (fondo / texto) */
  --c-nuevo-bg: #E1ECF7;       --c-nuevo: #1D4E89;
  --c-preparando-bg: #FBEBD0;  --c-preparando: #8A4B00;
  --c-listo-bg: #DDF0E3;       --c-listo: #1E6B3F;
  --c-entregado-bg: #E9E6E0;   --c-entregado: #55615A;
  --c-cancelado-bg: #FAE1E1;   --c-cancelado: #A12626;
  --c-peligro: #B3261E;
  /* canales */
  --c-canal-didi: #C2410C;  --c-canal-rappi: #D81B60;  --c-canal-uber: #1A1A1A;
  --c-canal-interno: #2F5D45;  --c-canal-caja: #8A6A1F;  --c-canal-kiosco: #5B4B8A;
  /* tipografía */
  --f-titulo: 'Outfit Variable', 'Outfit', ui-rounded, system-ui, sans-serif;
  --f-texto: 'Figtree Variable', 'Figtree', system-ui, -apple-system, sans-serif;
  --f-acento: 'Instrument Serif', Georgia, serif;
  --fs-12: .75rem; --fs-14: .875rem; --fs-16: 1rem; --fs-18: 1.125rem; --fs-20: 1.25rem;
  --fs-24: 1.5rem; --fs-32: 2rem; --fs-40: 2.5rem; --fs-56: 3.5rem; --fs-72: 4.5rem;
  --fs-hero: clamp(2.5rem, 6vw, 5rem);
  --lh-titulo: 1.05;  --lh-texto: 1.55;  --ls-etiqueta: .12em;
  /* espaciado base 4 */
  --sp-1: 4px; --sp-2: 8px; --sp-3: 12px; --sp-4: 16px; --sp-5: 24px;
  --sp-6: 32px; --sp-7: 48px; --sp-8: 64px; --sp-9: 96px;
  /* forma */
  --r-sm: 8px; --r-md: 14px; --r-lg: 22px; --r-pill: 999px;
  --sh-1: 0 1px 2px rgba(31,45,36,.06), 0 2px 8px rgba(31,45,36,.05);
  --sh-2: 0 8px 24px rgba(31,45,36,.10);
  --sh-3: 0 20px 48px rgba(31,45,36,.16);
  --foco: 0 0 0 3px var(--c-papel), 0 0 0 6px var(--c-hoja);
  /* táctil */
  --toque: 44px;  --toque-kiosco: 56px;  --toque-kiosco-xl: 72px;
  /* movimiento */
  --dur-1: 120ms; --dur-2: 240ms; --dur-3: 420ms; --dur-4: 900ms;
  --ease-salida: cubic-bezier(.22,1,.36,1);
  --ease-entrada: cubic-bezier(.55,0,1,.45);
  --ease-rebote: cubic-bezier(.34,1.56,.64,1);
}
.tv { --tv-numero: 320px; --tv-titulo: 88px; --tv-proximo: 96px; --tv-texto: 44px; --tv-etiqueta: 40px; }
```

### Tipografía

Fuentes autoalojadas con Fontsource (`@fontsource-variable/outfit`, `@fontsource-variable/figtree`, `@fontsource/instrument-serif`). El kiosco y la TV no deben depender del CDN de Google: si se cae el internet del local, la letra no cambia.

| Rol | Fuente | Peso | Uso |
|---|---|---|---|
| Título | Outfit | 600 (700 en números de turno) | h1 a h3, precios, números, botones |
| Texto | Figtree | 400 / 600 | párrafos, listas, formularios, tablas |
| Acento | Instrument Serif itálica | 400 | una o dos palabras por título, solo en el sitio público |
| Etiqueta | Outfit | 600, mayúsculas, `letter-spacing: var(--ls-etiqueta)` | categorías, pestañas, TURNO, PRÓXIMOS |

Números siempre con `font-variant-numeric: tabular-nums` en precios, turnos, contadores y cronómetros.

### Contraste verificado (WCAG)

| Par | Razón |
|---|---|
| bosque sobre papel | 13.0 |
| texto-suave sobre papel / arena | 5.9 / 5.4 |
| hoja sobre papel / arena | 5.6 / 5.1 |
| blanco sobre hoja-fuerte (botón primario) | 7.6 |
| blanco sobre barro (botón de pago) | 4.9 |
| barro-texto sobre papel | 5.6 |
| menta-tv sobre bosque | 8.0 |
| chips de estado (texto sobre su fondo) | 5.2 a 7.0 |
| blanco sobre cada color de canal | 4.9 a 17.4 |
| salvia sobre papel | 3.5: prohibido para texto menor a 32px |

## 4. Componentes

Viven en `src/lib/ui/`. Svelte 5 con runes, estilos con `<style>` local y tokens. Estados obligatorios en todo lo interactivo: normal, hover (solo puntero), presionado (`transform: scale(.97)`, `--dur-1`), foco visible (`box-shadow: var(--foco)`), deshabilitado (opacidad .45, sin sombra).

Para que los 5 agentes no choquen, cada componente tiene dueño. Los demás lo importan, no lo copian:

| Componente | Archivo | Dueño |
|---|---|---|
| Botón, Icono, Logo, ChipEstado | `Boton.svelte`, `Icono.svelte`, `Logo.svelte`, `ChipEstado.svelte` | base (si no existen, el primero que lo necesite los crea con esta especificación exacta) |
| Tarjeta de producto, riel de categorías, cajón de carrito | `TarjetaProducto.svelte`, `RielCategorias.svelte`, `CajonCarrito.svelte` | kiosco (el sitio los reutiliza) |
| Tarjeta de pedido, pestañas, alerta de stock, teclado PIN | `TarjetaPedido.svelte`, `Pestanas.svelte`, `AlertaStock.svelte`, `TecladoPin.svelte` | portal (los adaptadores reutilizan la tarjeta) |

**Iconos:** un solo `Icono.svelte` con un mapa `nombre → path` (trazos tomados de Lucide, licencia ISC, sin instalar el paquete). `stroke-width: 2`, `stroke-linecap: round`, `fill: none`, `currentColor`. Tamaños 20, 24, 32. Todo icono sin texto lleva `aria-label`. Lista mínima: carrito, más, menos, cerrar, flecha-izq, flecha-der, check, reloj, campana, alerta, efectivo, tarjeta, transferencia, whatsapp, moto, tienda, caja, hoja, borrar, volumen.

### Botón

```
variante     fondo            texto            uso
primario     hoja-fuerte      blanco           acción principal de la vista
pago         barro            blanco           pagar / cobrar (una sola vez por pantalla)
secundario   transparente     bosque + borde   acción alterna
quieto       transparente     hoja             enlaces de acción, "Cancelar"
peligro      transparente     cancelado + borde cancelar pedido, merma
```

- Forma: píldora (`--r-pill`), Outfit 600, sin mayúsculas.
- Tamaños: `md` alto 44px, padding 0 20px, `--fs-16` · `lg` alto 56px, padding 0 28px, `--fs-18` · `xl` alto 72px, padding 0 36px, `--fs-24` (solo kiosco).
- Hover: oscurece 6% (`filter: brightness(.94)`). Presionado: escala .97.
- Con icono: icono a la izquierda, separación 8px. Cargando: el texto se cambia por "Procesando…" y se deshabilita; no se usa spinner solo.
- Props: `variante`, `tamano`, `icono?`, `cargando?`, `disabled?`, `href?` (si hay `href` se pinta `<a>`).

### Tarjeta de producto

```
+------------------------+
|        .------.        |   foto circular, 1:1, object-fit: cover
|       (  foto  )       |   kiosco 160px · sitio 140px
|        '------'        |   sombra --sh-2 bajo el plato
|      TRADICIONAL       |   Outfit 600, mayúsculas, --ls-etiqueta
|  pollo, aguacate, ...  |   Figtree --fs-14, texto-suave, máx. 2 líneas
|         $85       (+)  |   precio Outfit 600 --fs-24 · botón redondo 56px
+------------------------+
```

- Fondo blanco, radio `--r-lg`, sin borde, `--sh-1`. Toda la tarjeta es un solo `<button>` (kiosco) o `<a>` (sitio).
- Presionada: escala .98 y la foto gira 4 grados (`--dur-2`, `--ease-salida`). Es el único gesto "juguetón" del sistema.
- Agotado: foto en escala de grises al 60%, etiqueta "Agotado por hoy" en chip `entregado`, no se puede tocar (`aria-disabled`).
- Promoción: sello ocre (`--c-maiz`, texto bosque) arriba a la izquierda, rotado -6 grados.
- Sin foto: círculo `--c-arena` con el icono de la categoría en salvia a 48px. Solo hay 4 fotos reales (`assets/img/dishes`), así que este caso es el normal hasta que el cliente mande fotos.

### Riel de categorías

- Kiosco: columna vertical dentro de la barra lateral arena. Cada categoría es un botón de alto 64px, texto Outfit 600 mayúsculas `--fs-16`, centrado, texto-suave.
- Activa: texto bosque, peso 700 y una píldora blanca detrás con `--sh-1`. La píldora se desliza entre categorías (`--dur-2`).
- Sitio (menú, móvil): la misma lista en horizontal, pegajosa bajo el encabezado, con desplazamiento lateral y `scroll-snap`.
- Orden fijo del cliente: Ensaladas, Molletes, Chilaquiles, Paninis, Bebidas frías, Bebidas calientes, Promociones.
- Accesibilidad: `role="tablist"`, flechas del teclado, `aria-selected`.

### Cajón de carrito

- Entra desde la derecha, ancho 440px en kiosco, 100% en móvil. Fondo papel, `--sh-3`, velo bosque al 40% detrás. `--dur-3`, `--ease-salida`.
- Encabezado "Tu pedido" + cerrar (56px). Lista: nombre, opciones en texto-suave, contador `[-] 2 [+]` con botones de 56px, subtotal a la derecha.
- Pie fijo: "Total" con precio `--fs-32`, y botón `pago xl` de ancho completo "Continuar al pago".
- Quitar un producto: bajar a 0 pide confirmación en línea ("¿Quitar?" · "Sí" · "No"), no un modal.
- Disparador en kiosco: botón flotante abajo a la derecha (como el carrito del PDF), píldora bosque de 72px de alto con icono, cantidad y total: `[carrito] 3 · $215`. Al agregar un producto hace un rebote (`--ease-rebote`, `--dur-2`). Oculto si el carrito está vacío.
- `role="dialog"`, `aria-modal`, foco atrapado, se cierra con Escape y tocando el velo.

### Tarjeta de pedido

```
+--+---------------------------------------------+
|  | RAPPI                      [ Preparando ]   |  canal en etiqueta + chip de estado
|c |  47        hace 4 min                       |  turno Outfit 700 --fs-56 · cronómetro
|a | ------------------------------------------- |
|n | 2  Panini de jamón                          |  cantidad en negritas, tabular
|a |    sin cebolla · extra queso                |  opciones en texto-suave
|l | 1  Café americano                           |
|  | Nota: tocar el timbre                       |  nota en fondo maiz-claro
|  | ------------------------------------------- |
|  | Ana G. · #RP-88231            [Marcar listo]|  cliente, id externo, acción siguiente
+--+---------------------------------------------+
```

- Franja izquierda de 8px con el color del canal, de arriba a abajo. Fondo blanco, radio `--r-md`, `--sh-1`.
- Colores de canal: DIDI `#C2410C` naranja quemado · RAPPI `#D81B60` magenta · UBER `#1A1A1A` negro · INTERNO `#2F5D45` verde · CAJA `#8A6A1F` ocre · KIOSCO `#5B4B8A` ciruela. DiDi y Rappi usan naranjas casi iguales en su marca; aquí se separan a propósito. El canal nunca se comunica solo con color: siempre lleva su etiqueta en texto.
- Un solo botón de acción: el paso siguiente. `nuevo` → "Empezar a preparar" (primario), `preparando` → "Marcar listo" (primario), `listo` → "Entregar" (secundario). "Cancelar pedido" va en un menú de tres puntos, con confirmación.
- Pendiente de pago (efectivo o transferencia): banda `maiz-claro` arriba con "Pendiente de pago" y botón `pago` "Cobrar $135". No se puede preparar hasta cobrar.
- Cronómetro: texto-suave; a los 8 min pasa a `--c-preparando`; a los 12 min a `--c-peligro` y peso 700.
- Pedido recién llegado: entra desde arriba con desvanecido (`--dur-3`) y un contorno `--c-hoja` de 3px que se apaga en 4 s. Suena la alerta una vez.
- Props: `pedido` (tipo del contrato de la API), `onAvanzar`, `onCancelar`, `onCobrar`.

### Chips de estado

Píldora de alto 28px (40px en kiosco), padding 0 12px, Outfit 600 `--fs-14`, con un punto de 8px a la izquierda del mismo color del texto.

| Estado | Texto | Tokens |
|---|---|---|
| `nuevo` | Nuevo | `--c-nuevo-bg` / `--c-nuevo` |
| `preparando` | Preparando | `--c-preparando-bg` / `--c-preparando` |
| `listo` | Listo | `--c-listo-bg` / `--c-listo` |
| `entregado` | Entregado | `--c-entregado-bg` / `--c-entregado` |
| `cancelado` | Cancelado | `--c-cancelado-bg` / `--c-cancelado` |

### Alerta de stock

- En la fila del insumo: barra de nivel de 6px (stock sobre el doble del mínimo). Verde `--c-listo` si está arriba del mínimo, ámbar `--c-preparando` si está en el mínimo o hasta 20% arriba, rojo `--c-peligro` si está debajo.
- Debajo del mínimo: la fila toma fondo `--c-cancelado-bg`, icono de alerta y el texto "Quedan 3 de mínimo 5". En cero: "Agotado" en negritas.
- Aviso global: si hay insumos bajo mínimo, una banda de 44px arriba del panel con fondo `--c-peligro`, texto blanco: "3 insumos por debajo del mínimo" y enlace "Ver". `role="status"`, no `alert` (no debe interrumpir al lector de pantalla en cada cambio).
- El rojo nunca va solo: siempre icono + texto.

### Pestañas

- Texto Outfit 600 mayúsculas con `--ls-etiqueta`, `--fs-20` en el monitor (se leen a 1.5 m), color hoja como en el PDF. Alto 64px.
- Cada pestaña lleva un punto del color del canal a la izquierda y un contador en píldora a la derecha (bosque sobre salvia-claro; si hay pedidos `nuevo`, el contador pasa a fondo barro con texto blanco).
- Activa: texto bosque y subrayado de 4px del color del canal, que se desliza (`--dur-2`).
- `role="tablist"`, flechas izquierda/derecha, atajos de teclado 1 a 5.

### Teclado de PIN

```
      o  o  o  o          4 puntos de 20px; llenos en bosque
   [ 1 ] [ 2 ] [ 3 ]
   [ 4 ] [ 5 ] [ 6 ]      teclas redondas de 72px, separación 16px
   [ 7 ] [ 8 ] [ 9 ]      Outfit 600 --fs-32, fondo blanco, --sh-1
   [   ] [ 0 ] [ <x]      borrar con icono
```

- Se envía solo al cuarto dígito. Error: los puntos se sacuden 3 veces (`--dur-3`) y aparece "PIN incorrecto. Intenta otra vez." con `aria-live="polite"`.
- Acepta teclado físico. Nunca muestra los dígitos. Sin autocompletado.
- Se usa también (con 10 dígitos visibles) para capturar el teléfono del ticket por WhatsApp en el kiosco.

## 5. Pantalla 1: kiosco (iPad horizontal)

Diseño base 1180x820 (iPad 10); debe funcionar desde 1024x768. Sin scroll de página: solo se desplaza la cuadrícula. `user-select: none`, `touch-action: manipulation`, sin zoom. Todo lo tocable mide al menos 56px.

```
+------------+----------------------------------------------------------+
|   (logo)   |  Ensaladas                                               |
|            |  Frescas, hechas al momento                              |
| ENSALADAS  |                                                          |
|  Molletes  |   .----.          .----.          .----.                 |
| Chilaquiles|  ( foto )        ( foto )        ( foto )                |
|  Paninis   |   '----'          '----'          '----'                 |
|  Bebidas   |  TRADICIONAL       ATÚN            POLLO                 |
|   frías    |   $85    (+)      $95    (+)      $95    (+)             |
|  Bebidas   |                                                          |
|  calientes |   .----.                                                 |
| Promociones|  ( foto )                                                |
|            |   '----'                                                 |
|            |    RES                                                   |
|            |   $105   (+)                      +--------------------+ |
|  Español   |                                   | [carrito] 3 · $215 | |
+------------+-----------------------------------+--------------------+-+
   232px                         resto (fondo blanco)
```

Reglas:
- Barra lateral: 232px, fondo `--c-arena`, logo arriba (72px de ancho, margen 32px), riel de categorías centrado verticalmente como en el PDF.
- Área de productos: fondo blanco, padding 32px. Título de categoría Outfit 600 `--fs-40`. Cuadrícula `repeat(auto-fill, minmax(240px, 1fr))`, separación 24px: 3 columnas en iPad.
- Botón flotante del carrito: abajo a la derecha, a 24px de los bordes. Es la posición del carrito en la maqueta.
- Al cambiar de categoría, las tarjetas entran con desvanecido y 12px de subida, escalonadas 40 ms (máximo 8 tarjetas animadas).

Flujo (una ruta, pasos como estado):

```
reposo -> menú -> producto (hoja modal) -> carrito (cajón) -> pago -> ticket -> turno -> reposo
```

1. **Reposo:** fondo bosque, logo en crema, "Toca para ordenar" en `--fs-72`. Los rayos del sol del logo pulsan despacio (opacidad .6 a 1, 3 s). Cualquier toque entra al menú.
2. **Producto:** hoja modal centrada de 720px, foto circular de 220px a la izquierda, opciones a la derecha. Opciones de una sola elección como píldoras grandes (56px); extras como filas con casilla de 32px y precio "+$15". Pie con contador y "Agregar al pedido · $85".
3. **Pago:** tres tarjetas grandes en fila (alto 200px, icono 48px, título `--fs-24`): Efectivo, Tarjeta, Transferencia. A la izquierda, resumen del pedido. Campo opcional "¿A nombre de quién?".
   - Tarjeta: pantalla de espera con el icono de terminal y "Acerca o inserta tu tarjeta en la terminal". Botón quieto "Cancelar cobro".
   - Efectivo y transferencia: el pedido se crea como pendiente de pago y aparece en CAJA.
4. **Ticket:** "¿Te mandamos tu ticket por WhatsApp?" con teclado numérico (mismo componente del PIN) para 10 dígitos, y "No, gracias" igual de visible.
5. **Turno:** fondo arena, "Tu turno es el" y el número en Outfit 700 a 240px en color hoja, igual que en la TV. Vuelve a reposo solo a los 12 s o con "Terminar".

Inactividad: a los 75 s sin tocar, aviso "¿Sigues ahí?" con cuenta de 15 s; después se vacía el carrito y vuelve a reposo. No aplica mientras se espera el cobro con tarjeta.

## 6. Pantalla 2: TV vertical de turnos (1080x1920)

Lienzo fijo de 1080x1920 escalado con `transform: scale()` para llenar la ventana (así se ve igual en cualquier TV y en pruebas de escritorio). Tres tercios exactos de 640px. Sin cursor, sin scroll, sin interacción salvo el toque inicial de audio.

```
+--------------------------------------------------+  0
|  TURNO                         PRÓXIMOS   (logo) |
|                                                  |
|  77777     · Café americano        8             |   BANDA DE TURNO
|     77     · Panini de jamón       12            |   640px, fondo arena
|    77      · +2 más                18            |
|   77                                             |
+--------------------------------------------------+  640
|                                                  |
|                  VIDEO 1                         |   640px
|              (muted, loop, cover)                |
|                                                  |
+--------------------------------------------------+  1280
|                                                  |
|                  VIDEO 2                         |   640px
|              (muted, loop, cover)                |
|                                                  |
+--------------------------------------------------+  1920
```

Banda de turno (padding 48px, rejilla de 3 columnas: `390px 1fr 200px`, separación 32px):
- **Izquierda:** "TURNO" en Outfit 700, 88px, color hoja, con tracking. Debajo el número en Outfit 700, 320px, `line-height: .9`, color hoja (el verde de la maqueta). Con 3 dígitos baja a 220px.
- **Centro:** productos del turno, Figtree 600 a 44px, color bosque, máximo 3 líneas; si hay más, "+2 más". Nombre del cliente arriba en texto-suave 40px si existe.
- **Derecha:** logo de 96px arriba; "PRÓXIMOS" en 40px bosque con tracking; 3 números en Outfit 700 a 96px color hoja, uno por línea. Los próximos son los pedidos en `preparando`, en orden de turno.
- Línea vertical `--c-linea-fuerte` entre centro y derecha, como en el PDF.
- Mínimo absoluto de texto en la TV: 40px. Legible a 3 m (el número mide unos 15 cm de alto en una TV de 43").

Cambio de turno (cuando un pedido pasa a `listo`):
1. Suena la campana (un solo tono, archivo local).
2. La banda cambia a fondo bosque y el número nuevo entra desde abajo en color crema con rebote (`--dur-4`, `--ease-rebote`).
3. La voz dice "Turno 7, su pedido está listo" (`speechSynthesis`, `es-MX`, velocidad .9).
4. A los 6 s la banda vuelve a arena. Si llegan varios turnos listos, se encolan: uno cada 8 s, nunca se pisan.

Otros estados:
- Sin turnos: en lugar del número, el logo grande y "Bienvenido a Atoyac. Ordena en el kiosco o en caja."
- Audio bloqueado: velo con "Toca la pantalla para activar el sonido". Desaparece al primer toque y no vuelve.
- Sin conexión: chip pequeño "Reconectando…" abajo a la izquierda de la banda; los videos siguen.
- Videos: `<video muted loop autoplay playsinline>` con `object-fit: cover`. Marcadores mientras el cliente manda los suyos: fondo bosque y fondo barro con el logo en crema y un texto corto ("Ensaladas frescas, hechas al momento" / "Pide tu bebida en combo y ahorra"). Una línea de 2px color papel separa los dos videos.
- Con `prefers-reduced-motion` el número cambia sin animación; el sonido y la voz se mantienen.

## 7. Pantalla 3: monitor interno (escritorio, 1440x900 en adelante)

Tras el PIN. Fondo papel. Dos zonas: pedidos a la izquierda (lo que pide la gente por canal) e insumos fijos a la derecha, siempre visibles. Así lo pidió el cliente en la nota de voz: ver lo que les piden y poder checar los insumos ahí mismo.

```
+-----------------------------------------------------------------------------+
| (logo) Atoyac · Monitor        [sonido]  12:41   Ana (cocina)   [Salir]     |  56px
+-------------------------------------------------------+---------------------+
| o DIDI 2 | o RAPPI 1 | o UBER 0 | o INTERNO 4 | o CAJA 1 |  INSUMOS         |  64px
|          =========                    [+ Capturar pedido] |  [buscar...]     |
+-------------------------------------------------------+  ! 3 bajo mínimo    |
|  NUEVOS (1)        PREPARANDO (2)      LISTOS (1)      |---------------------|
| +--------------+  +--------------+   +--------------+  | Aguacate            |
| |R| 47  4 min  |  |R| 45  9 min  |   |R| 44  2 min  |  | ====----  3 / 5 pza |
| | 2 Panini...  |  | 1 Ensalada.. |   | 1 Mollete..  |  | [Ajustar] [Merma]   |
| | [Empezar]    |  | [Marcar listo|   | [Entregar]   |  |---------------------|
| +--------------+  +--------------+   +--------------+  | Pan de panini       |
|                   +--------------+                     | ========  24 / 10   |
|                   |R| 46  6 min  |                     |---------------------|
|                   +--------------+                     | Leche               |
|                                                        | ======--  4.5 / 3 L |
+-------------------------------------------------------+---------------------+
              resto (mínimo 880px)                              360px
```

Reglas:
- Pestañas en el orden del PDF: DIDI, RAPPI, UBER, INTERNO, CAJA. Ver especificación de Pestañas.
- **INTERNO** muestra los pedidos de canal `interno` y `kiosco` (los de kiosco con su etiqueta KIOSCO en ciruela). **CAJA** muestra los pedidos de caja y todo pedido pendiente de pago, con "Cobrar".
- Dentro de cada pestaña, 3 columnas por estado: Nuevos, Preparando, Listos. Los entregados salen de la vista (historial aparte). Cada columna se desplaza sola. Debajo de 1200px de ancho, las columnas se apilan en una lista ordenada por estado.
- Estado vacío por columna: texto-suave centrado, sin ilustración.
- "Capturar pedido": botón secundario a la derecha de las pestañas; abre un cajón con el mismo selector de productos del kiosco en versión compacta. El canal se preselecciona con la pestaña activa.
- Panel de insumos: 360px, fondo blanco, borde izquierdo `--c-linea`. Orden: primero los que están bajo mínimo, luego alfabético. Cada fila: nombre, barra de nivel, "stock / mínimo unidad", y al pasar el puntero o tocar, "Ajustar" y "Registrar merma" (abren un popover con cantidad y motivo). Cuando un pedido descuenta, la fila afectada parpadea una vez en salvia-claro.
- Debajo de 1100px el panel de insumos se vuelve una sexta pestaña "INSUMOS".
- Densidad: texto base `--fs-16`, números de turno `--fs-56`. Todo lo clicable mide al menos 44px (se usa con ratón, pero también puede ser una pantalla táctil).
- Pedido nuevo en una pestaña que no está activa: su contador pasa a barro y la pestaña hace un pulso corto. El sonido se puede silenciar desde el encabezado; el estado se guarda por dispositivo.
- Navegación del resto del portal (caja, KDS, recetas, finanzas, checklists): menú en el encabezado, no barra lateral, para no robarle ancho al monitor.

## 8. Sitio público

Contenedor máximo 1200px, padding lateral 24px (16px en móvil). Secciones con 96px de aire vertical (64px en móvil). Mobile first: una columna hasta 720px.

Encabezado común: logo + "ATOYAC" en Outfit 600 con tracking a la izquierda; Inicio, Menú, Nosotros, Delivery; botón primario "Pedir a domicilio". Pegajoso, fondo papel al 92% con desenfoque ligero. En móvil, menú en cajón.
Pie común: fondo bosque, texto crema; dirección, horario, WhatsApp, enlaces. Sin emojis.

Recurso de marca: una o dos palabras por título en Instrument Serif itálica color salvia (a 32px o más, donde sí pasa contraste). Fotos con radio `--r-lg`; platillos siempre en círculo.

### Inicio

```
+----------------------------------------------------------+
| (logo) ATOYAC      Inicio  Menú  Nosotros  Delivery [CTA]|
+----------------------------------------------------------+
|  SANTA CRUZ ATOYAC · CDMX                    .--------.  |
|  Comida fresca para                         /  foto    \ |
|  tu *día a día.*                           (  de plato  )|
|  Ensaladas, paninis, chilaquiles y café.    \          / |
|  [Ver el menú]  [Pedir a domicilio]          '--------'  |
+----------------------------------------------------------+
|  ( ) Ensaladas  ( ) Molletes  ( ) Chilaquiles  ( ) ...   |  categorías en círculos
+----------------------------------------------------------+
|  Favoritos de la barra      [tarjetas de producto x4]    |
+----------------------------------------------------------+
|  fondo bosque: Pide como quieras                         |
|  En el local · Kiosco sin fila · A domicilio             |
+----------------------------------------------------------+
|  [foto del local]   23.7 m² diseñados para *frescura*    |
|                     Dirección · Horario · Cómo llegar    |
+----------------------------------------------------------+
|  pie                                                     |
+----------------------------------------------------------+
```

Hero: texto a la izquierda, foto circular grande (480px) a la derecha con los rayos del sol del logo dibujados detrás en salvia. En móvil la foto va arriba a 280px.

### Menú

```
+----------------------------------------------------------+
|  Menú                                                    |
|  [Ensaladas][Molletes][Chilaquiles][Paninis][Frías]...   |  riel pegajoso
+----------------------------------------------------------+
|  Ensaladas                                               |
|  [tarjeta] [tarjeta] [tarjeta] [tarjeta]                 |  4 col / 2 en móvil
|  Molletes                                                |
|  [tarjeta] [tarjeta] ...                                 |
+----------------------------------------------------------+
```

Todas las categorías en una sola página con anclas; el riel marca la sección visible. Solo lectura (se pide en Delivery o en el local). Precios desde la base de datos; productos agotados se muestran como agotados.

### Nosotros

```
+----------------------------------------------------------+
|  Comida para tu *día a día.*           [foto interior]   |
|  texto de historia, 60 caracteres por línea              |
+----------------------------------------------------------+
|  3 principios en fila: Fresco · Rápido · Precio justo    |
+----------------------------------------------------------+
|  [foto degustación]   El local: dirección, horario, mapa |
+----------------------------------------------------------+
```

### Inauguración

Página de una sola pantalla, fondo bosque, texto crema. Logo grande con los rayos animados, "ATOYAC" con tracking amplio, fecha y hora en Outfit `--fs-56`, dirección, y dos botones: "Cómo llegar" y "Ver el menú". Si la página trae promociones de apertura, van en sellos ocre. Es la única página oscura de punta a punta.

```
+----------------------------------------------------------+
|                        (logo)                            |
|                     A T O Y A C                          |
|               Gran *inauguración*                        |
|            fecha · hora · dirección                      |
|        [Cómo llegar]   [Ver el menú]                     |
|   ( sello: promo 1 )  ( sello: promo 2 )                 |
+----------------------------------------------------------+
```

### Delivery

```
+--------------------------------------+-------------------+
|  Pide sin comisiones, a precio de    |  Tu pedido        |
|  mostrador.                          |  2 Panini   $170  |
|  [riel de categorías]                |  1 Café      $45  |
|  [tarjeta] [tarjeta] [tarjeta]       |  Envío       $25  |
|  [tarjeta] [tarjeta] [tarjeta]       |  Total      $240  |
|                                      |  [Continuar]      |
+--------------------------------------+-------------------+
```

Reutiliza la tarjeta de producto, el riel y el carrito del kiosco. En escritorio el carrito es una columna pegajosa de 380px; en móvil es el cajón con una barra inferior fija "Ver pedido · $240". Datos de entrega en un formulario corto (nombre, teléfono, dirección, referencias, forma de pago) con etiquetas visibles arriba de cada campo, errores en línea debajo del campo.

Formularios (todo el proyecto): campo de alto 48px (56px en kiosco), radio `--r-sm`, borde `--c-linea-fuerte`, foco con `--foco`. Etiqueta siempre visible; nunca solo placeholder. Error: borde y texto `--c-cancelado` con icono.

## 9. Movimiento

- Todo lo que entra usa `--ease-salida`; lo que sale, `--ease-entrada` y dura la mitad.
- Solo se animan `transform` y `opacity`.
- Rebote (`--ease-rebote`) reservado para dos momentos: agregar al carrito y turno nuevo en la TV.
- Sitio: los bloques aparecen al entrar en pantalla con 16px de subida y desvanecido, una sola vez. Sin parallax ni cursores personalizados (el sitio viejo los tenía; se quitan).
- `prefers-reduced-motion`: los tokens de duración pasan a 0 (ya está en `tokens.css`).

## 10. Accesibilidad (obligatoria)

- Contraste AA en todo texto; pares verificados en la sección 3. No inventar combinaciones nuevas de color con texto.
- Kiosco: objetivos táctiles de 56px o más, separados 8px o más. Acciones de pago y PIN: 72px.
- Portal y sitio: 44px o más.
- TV: nada menor a 40px; número de turno a 320px; información clave nunca solo por color.
- Foco visible siempre (`--foco`). Orden de tabulación lógico. Modales y cajones atrapan el foco y lo devuelven al cerrar.
- Color nunca es el único canal de información: canal con etiqueta, estado con texto, stock con icono y texto.
- HTML semántico: `<button>` para acciones, `<a>` para navegar, un `<h1>` por página, `lang="es-MX"`.
- Imágenes con `alt` descriptivo ("Ensalada tradicional con pollo y aguacate"); decorativas con `alt=""`.
- Regiones vivas: carrito (`aria-live="polite"` al agregar), pedidos nuevos en el monitor (`role="status"`), errores de formulario.
- Sonidos siempre acompañados de un cambio visual, y silenciables en el portal.

## 11. Lo que no se hace

- Emojis en la interfaz, degradados llamativos, sombras negras, bordes de 1px grises en todo.
- Colores fuera de los tokens, o texto en salvia menor a 32px.
- Fotos de platillo cuadradas o con esquinas rectas.
- Más de un botón `pago` o `primario` por vista.
- Spinners sin texto, placeholders como etiqueta, modales para confirmar cosas triviales.
- Copiar estilos en línea del sitio viejo (`style="..."`): todo pasa por tokens y componentes.
