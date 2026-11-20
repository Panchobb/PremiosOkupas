# Premios Okupas

Web hecha solo con HTML y CSS. Las propuestas y los votos se guardan en una planilla de Google Sheets que solo vos podés ver.

- `propuestas.html`: **etapa 1**. Cada uno escribe su candidata para las ternas abiertas (Mejor anécdota y Frase del año).
- `index.html`: **etapa 2**. La votación de las 24 ternas. En las abiertas se vota entre las finalistas que elegiste vos.

## Puesta en marcha (una sola vez)

1. **Crear la planilla:** en Google Sheets, creá una planilla nueva. No la compartas con nadie.
2. **Pegar el script:** andá a **Extensiones → Apps Script**, borrá lo que haya y pegá todo `apps-script.gs`. Guardá.
3. **Crear las hojas:** elegí la función `configurar` y tocá **Ejecutar**. Aceptá los permisos que pide Google (es tu propio script). Se crean las hojas "Propuestas", "Votos" y "Resultados".
4. **Publicar el script:** **Implementar → Nueva implementación → Aplicación web**, con *Ejecutar como: Yo* y *Quién tiene acceso: Cualquier usuario*. Copiá la URL que termina en `/exec`.
5. **Conectar las páginas:** en `index.html` y en `propuestas.html`, reemplazá `PEGAR_URL_DEL_APPS_SCRIPT` por esa URL.
6. **Publicar la web:** subí el repo a GitHub y activá **Settings → Pages → Deploy from a branch → main / (root)**.

"Cualquier usuario" significa que cualquiera puede *enviar* datos. Nadie más puede leer la planilla.

## Cómo se usa

1. **Propuestas:** pasales `https://panchobb.github.io/PremiosOkupas/propuestas.html`. Lo que escriben aparece en la hoja **Propuestas**. Si alguien manda de nuevo, se reemplaza lo que había mandado.
2. **Elegir finalistas:** en la hoja **Propuestas**, tildá la columna **Finalista** en las que entran. Si querés, podés corregir el texto ahí mismo antes de generar el HTML.
3. **Pasar las finalistas a la web:** recargá la planilla y usá el menú **Premios Okupas → Generar HTML de finalistas**. Copiá el texto y, en `index.html`, reemplazá todo desde `<!-- INICIO FINALISTAS` hasta `<!-- FIN FINALISTAS -->`. Subí el cambio a GitHub.
4. **Votación:** pasales `https://panchobb.github.io/PremiosOkupas/`. Los resultados se van armando solos en la hoja **Resultados**.

Si después de abrir la votación cambiás qué propuestas son finalistas, los votos que ya se hicieron por una opción que sacaste quedan guardados igual. Conviene definir las finalistas antes de pasar el link.

## Cambiar ternas o personas

Las listas están en `index.html`, `propuestas.html` y `apps-script.gs`, y tienen que coincidir. Para sumar otra terna abierta (por ejemplo "Plot twist"), agregala a `ABIERTAS` en el script y pedime que regenere las páginas.

Si cambiás el script: **Implementar → Gestionar implementaciones → editar → Nueva versión**. Volver a correr `configurar` **borra todo**.
