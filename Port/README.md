# Portafolio · Juan David Ochoa (Och8a.mov)

Página estática (HTML + CSS + JavaScript, sin librerías ni compilación) pensada para **GitHub Pages**.

## Qué hay en cada archivo

| Archivo / carpeta | Para qué sirve |
|---|---|
| `index.html` | Contenido y textos de la página (aquí se editan las descripciones) |
| `style.css` | Todo el diseño |
| `script.js` | Interacciones: visor de video, adelantos, menú móvil, animaciones |
| `videos/` | Los videos ya optimizados para web |
| `videos/posters/` | Miniatura (JPG) de cada video |
| `videos/previews/` | Adelanto de 5 s, sin sonido, que se ve dentro de cada tarjeta |
| `og-cover.jpg` | Imagen que aparece al compartir el enlace (WhatsApp, Instagram, LinkedIn…) |
| `IMG_0474.jpeg` | Foto de la sección "Sobre mí" |

## Publicar en GitHub Pages

1. Sube **todo el contenido de esta carpeta** a un repositorio (los archivos deben quedar en la raíz, junto a `index.html`).
2. En el repositorio: **Settings → Pages → Build and deployment → Deploy from a branch** → rama `main`, carpeta `/ (root)` → **Save**.
3. En un par de minutos la página queda en `https://TU-USUARIO.github.io/TU-REPOSITORIO/`.
4. Abre `index.html` y busca `og:image`: cambia `og-cover.jpg` por la URL completa de esa imagen
   (`https://TU-USUARIO.github.io/TU-REPOSITORIO/og-cover.jpg`). Sin eso, al compartir el enlace no se ve la imagen de vista previa.

**Límites de GitHub:** si subes archivos desde el navegador (botón *Upload files*), cada archivo puede pesar hasta **25 MB**; con git o GitHub Desktop, hasta **100 MB**. Todos los videos actuales pesan menos de 22 MB.

## Añadir un video nuevo

1. Exporta el video en **MP4 (H.264 + audio AAC)**. Verticales 9:16 → 720×1280; horizontales 16:9 → 1280×720 o 1920×1080. Que pese menos de 25 MB.
2. Copia el archivo a `videos/` (sin espacios ni tildes en el nombre, por ejemplo `mi-video.mp4`).
3. En `index.html`, copia uno de los bloques `<article class="card …">` y cámbiale el `id`, las rutas, el título, la descripción, las etiquetas y la duración. Las instrucciones están en un comentario justo encima de las tarjetas.
4. `class="card tall"` = vertical · `class="card wide"` = horizontal · `featured` = pieza estrella a todo el ancho.
5. Miniatura (`posters/`) y adelanto (`previews/`) son opcionales, pero hacen que la tarjeta se vea mucho mejor.
6. ¿El video dura mucho (por ejemplo 30 minutos)? Súbelo a YouTube y usa `data-yt="ID_DEL_VIDEO"` en lugar de `data-src` (la tarjeta de Westcol ya enlaza al episodio completo).

Cada pieza tiene un **enlace directo**: `https://…/#video-redman` abre el visor con ese video (el `id` de la tarjeta, con `video-` delante).

## Probarlo en tu computador

Doble clic en `index.html` funciona. Para verlo igual que en GitHub (recomendado), abre una terminal en esta carpeta y ejecuta:

```bash
python -m http.server 8000
```

y entra a <http://localhost:8000>.

## Nota sobre animaciones

La página respeta el ajuste de accesibilidad **"Reducir movimiento"** del sistema: si está activo, no hay animaciones ni reproducción automática de los adelantos (estos se reproducen solo al pasar el mouse sobre la tarjeta). En Windows se cambia en *Configuración → Accesibilidad → Efectos visuales → Efectos de animación*.
