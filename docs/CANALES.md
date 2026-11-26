# Canales de delivery (DiDi Food, Rappi, Uber Eats)

Código: `src/lib/server/canales/` (un archivo por app + `comun.ts`) y `src/routes/api/canales/[canal]/webhook`.
Pruebas: `npm run test` (usan fixtures en `src/lib/server/canales/fixtures/` y `fetch` simulado; nunca llaman a las apps reales).

## Flujo

1. La app manda el webhook a `https://atoyac.appsoluciones.duckdns.org/api/canales/<canal>/webhook` (`didi`, `rappi`, `uber`).
2. Se verifica la firma (HMAC con el secreto del canal). Firma mala: 401.
3. El payload se convierte a pedido por SKU (`productos.sku_didi / sku_rappi / sku_uber`). El precio lo calcula el servidor.
4. `crearPedido` es idempotente por `externoId` (`<canal>:<id>`): un webhook repetido no crea otro pedido.
5. Solo si se creó, se acepta en la app. Se responde 200 siempre que la firma sea válida (si aceptar falla solo se registra).
6. Cuando el pedido pasa a `listo`, se avisa a la app (`marcarListo`).

Si faltan credenciales, el canal queda deshabilitado: la verificación rechaza, las llamadas salientes se omiten y se registra `[canales:<canal>] sin credenciales`.

**SKU desconocido:** la línea va al producto genérico "Artículo de app (revisar)" (precio $0) con nombre, precio y SKU en las notas de la línea, y el pedido lleva "REVISAR" en sus notas. El total no incluye esas líneas: caja debe corregirlo. Solución real: dar de alta el SKU en el producto.

## Credenciales que debe pedir el cliente

| App | Qué solicitar | Variables de entorno |
|---|---|---|
| Uber Eats | Acceso a Uber Eats Marketplace API (Order Integration) para la tienda; app con `client_id` y `client_secret`; registrar la URL del webhook | `UBER_CLIENT_ID`, `UBER_CLIENT_SECRET` (firma del webhook y OAuth) |
| Rappi | Acceso a Rappi Partners/Developer API (integración de pedidos): `client_id`, `client_secret` y el id de tienda; registrar el webhook | `RAPPI_CLIENT_ID`, `RAPPI_CLIENT_SECRET` |
| DiDi Food | Alta en DiDi Food Open Platform (merchant): `app_id`, `app_secret`, `shop_id`; registrar el webhook | `DIDI_APP_ID`, `DIDI_APP_SECRET`, `DIDI_SHOP_ID` |

Opcionales para apuntar a sandbox: `UBER_API_URL`, `UBER_AUTH_URL`, `RAPPI_API_URL`, `RAPPI_AUTH_URL`, `DIDI_API_URL`.
Cada app pedirá que el SKU de cada platillo en su menú sea el de la columna correspondiente (`atoyac-<slug>` en el seed): Uber lo manda en `external_data`, Rappi en `sku`, DiDi en `app_item_id`.

## Qué está confirmado y qué no

No pude abrir las referencias completas (portales con login o contenido truncado). Probar con sandbox de cada app antes de producción.

**Uber Eats**
- Confirmado en la guía pública: evento `orders.notification`, detalle con `GET /eats/order/{id}`, aceptar con `POST /eats/orders/{id}/accept_pos_order`.
- SIN confirmar: encabezado `X-Uber-Signature` con HMAC-SHA256 hex del cuerpo y el client secret; URLs `https://api.uber.com/v1` y `https://auth.uber.com/oauth/v2/token`, scopes `eats.order eats.store.orders.read`; forma del detalle (`cart.items[].external_data`, `title`, `quantity`, `price.unit_price.amount` en centavos, `eater`); `meta.status == "created"` para pedido nuevo; el endpoint "listo" `POST /eats/orders/{id}/ready` (la guía solo mostró `restaurantdelivery/status`, para reparto propio).

**Rappi**
- Todo SIN confirmar: encabezado `Rappi-Signature: t=<ts>,sign=<hex>` con HMAC-SHA256 de `"<t>.<cuerpo>"`; evento `NEW_ORDER` con `order_detail.items[]` (`sku`, `name`, `quantity`, `unit_price`, `subitems`) y `customer`; auth Auth0 (`rests-integrations.auth0.com`, audience `https://int-public-api-v2/api`); base `services.rappi.com.mx/api/v2/restaurants-integrations-public-api`; `PUT /orders/{id}/take/15` y `PUT /orders/{id}/ready-for-pickup`.

**DiDi Food**
- Todo SIN confirmar (documentación solo para socios): firma (se supuso `X-Didi-Signature`, HMAC-SHA256 hex del cuerpo con `app_secret`; DiDi podría firmar con un campo `sign` en el cuerpo), payload (`order_id`, `order_items[].app_item_id/name/amount/price` en centavos, `receive_address`), `POST /v1/auth/authtoken/signin`, `POST /v1/order/order/confirm` y `/ready` con `auth_token` en el cuerpo.

Las firmas y las rutas están aisladas en una función por adaptador: corregir un formato es tocar un solo archivo.
