# Videos de la TV de turnos

La pantalla `/turnos` reproduce en bucle, sin sonido, dos videos en el tercio medio e inferior:

| Archivo | Posición |
|---|---|
| `ensaladas.mp4` | medio |
| `bebidas-calientes.mp4` | inferior |

Formato: MP4 H.264, apaisado o vertical (se recorta con `object-fit: cover` a 1080x640), 1080 px de ancho como mínimo, sin audio o con audio ignorado. Mientras el archivo no exista se muestra un marcador animado con el logo.
