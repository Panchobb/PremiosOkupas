# Premios Okupas

Web hecha solo con HTML y CSS. Los votos se guardan en una planilla de Google Sheets que solo vos podés ver.

- `index.html`: **la votación**, una terna por tarjeta con botones Atrás / Siguiente. Adentro de cada tarjeta se pasa de persona con las flechas ← → (foto grande y nombre abajo) y se vota tocando la foto. Se vota una persona en cada terna. En Mejor anécdota y Frase del año, cada uno escribe la suya.
- `finalistas.html`: **segunda vuelta**. Se vota entre las anécdotas y frases que elegiste como finalistas.

## Fotos

Poné una foto por persona en la carpeta `fotos/` con los nombres que figuran en `fotos/LEEME.md` (por ejemplo `fotos/fran.jpg`). Mientras falte alguna, se ve una silueta genérica (`fotos/sin-foto.webp`).

## Puesta en marcha (una sola vez)

1. **Crear la planilla:** en Google Sheets, creá una planilla nueva. No la compartas con nadie.
2. **Pegar el script:** andá a **Extensiones → Apps Script**, borrá lo que haya y pegá todo `apps-script.gs`. Guardá.
3. **Crear las hojas:** elegí la función `configurar` y tocá **Ejecutar**. Aceptá los permisos que pide Google (es tu propio script). Se crean las hojas "Votos", "Propuestas", "Finalistas" y "Resultados".
4. **Publicar el script:** **Implementar → Nueva implementación → Aplicación web**, con *Ejecutar como: Yo* y *Quién tiene acceso: Cualquier usuario*. Copiá la URL que termina en `/exec`.
5. **Conectar las páginas:** en `index.html` y en `finalistas.html`, reemplazá `PEGAR_URL_DEL_APPS_SCRIPT` por esa URL.
6. **Publicar la web:** subí el repo a GitHub y activá **Settings → Pages → Deploy from a branch → main / (root)**.

"Cualquier usuario" significa que cualquiera puede *enviar* un voto. Nadie más puede leer la planilla.

## Cómo se usa

1. **Votación:** pasales `https://panchobb.github.io/PremiosOkupas/`. Si alguien vota de nuevo, se reemplaza su voto anterior.
2. **Ver los votos:** en la hoja **Votos** hay una fila por persona, con todo lo que votó y lo que escribió. En **Resultados** está el conteo y el ganador de cada terna, y se actualiza solo.
3. **Eliminar votos:** usá el menú **Premios Okupas → Eliminar votos de una persona…** y escribí el nombre. Se borra todo lo de esa persona: su voto, lo que escribió y su voto de finalistas. Los resultados se recalculan solos. También podés borrar una fila a mano en "Votos".
4. **Elegir finalistas:** en la hoja **Propuestas** están todas las anécdotas y frases. Tildá la columna **Finalista** en las que entran. Si querés, corregí el texto ahí antes del paso siguiente.
5. **Pasar las finalistas a la web:** usá el menú **Premios Okupas → Generar HTML de finalistas**. Copiá el texto y, en `finalistas.html`, reemplazá todo desde `<!-- INICIO FINALISTAS` hasta `<!-- FIN FINALISTAS -->`. Subí el cambio a GitHub.
6. **Segunda vuelta:** pasales `https://panchobb.github.io/PremiosOkupas/finalistas`. El ranking aparece al final de **Resultados**.

El menú **Premios Okupas** aparece arriba en la planilla. Si no lo ves, recargá la página.

## Cambiar ternas o personas

Las listas están en `index.html`, `finalistas.html` y `apps-script.gs`, y tienen que coincidir. Para sumar otra terna abierta, agregala a `ABIERTAS` en el script y pedime que regenere las páginas.

Si cambiás el script: **Implementar → Gestionar implementaciones → editar → Nueva versión**. Volver a correr `configurar` **borra todo**.
