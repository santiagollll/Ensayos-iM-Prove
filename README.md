# Usar la extension web para generar PDFs PAES

Este tutorial explica como instalar y usar la extension web para generar directamente los PDFs de un ensayo PAES desde la pagina de resultados de iM-PROVE.

Con esta extension puedes generar:

- El solucionario del ensayo.
- El ensayo original sin soluciones.

## 1. Descargar el proyecto desde GitHub

Haz clic en este enlace para descargar el proyecto como archivo ZIP:

```text
https://github.com/santiagollll/Ensayos-iM-Prove/archive/refs/heads/main.zip
```

## 2. Extraer el archivo ZIP

1. Busca el archivo `.zip` descargado.
2. Normalmente estara en la carpeta `Descargas`.
3. Haz doble clic sobre el archivo `.zip`.
4. Se creara una carpeta con el contenido del proyecto.
5. Entra a esa carpeta.

Si el codigo fue subido a la raiz del repositorio, dentro de la carpeta extraida deberias ver archivos como:

```text
manifest.json
content.js
pdf-renderer.js
popup.html
popup.js
popup.css
background.js
assets/
```

## 3. Instalar la extension en Chrome

1. Abre Google Chrome.
2. En la barra de direcciones escribe:

```text
chrome://extensions
```

3. Presiona `Enter`.
4. Activa el interruptor `Modo desarrollador`.
5. Haz clic en `Cargar descomprimida`.
6. Selecciona la carpeta extraida del ZIP.
7. La extension deberia aparecer instalada con el nombre:

```text
iM-PROVE PDF Generator
```

Importante: debes seleccionar la carpeta que contiene el archivo `manifest.json`.

## 4. Usar la extension

1. Abre la pagina de resultados del ensayo en iM-PROVE.
2. La URL debe comenzar asi:

```text
https://acceso-improve.santillana.cl/pruebas/resultado/
```

3. Espera a que la pagina cargue completamente.
4. Si la pagina es compatible, aparecera una pequena ventana arriba a la derecha.
5. Haz clic en `Generar PDFs`.
6. Espera mientras la extension trabaja. Puede tardar varios segundos.
7. Al terminar, se descargaran dos archivos:

```text
Nombre del ensayo.pdf
Nombre del ensayo - Ensayo.pdf
```

El primer archivo es el solucionario. El segundo archivo es el ensayo original.

## 5. Si no aparece el boton

Revisa estas cosas:

- La pagina debe ser una pagina de resultados de iM-PROVE.
- La URL debe comenzar con `https://acceso-improve.santillana.cl/pruebas/resultado/`.
- La pagina debe haber cargado completamente.
- La extension debe estar activada en `chrome://extensions`.
- Si acabas de actualizar la extension, presiona el boton de recargar en `chrome://extensions`.

## 6. Descargar el JSON opcional

Normalmente no necesitas descargar el `.json`.

Si alguien te lo pide:

1. Abre la pagina de resultados del ensayo.
2. Espera a que aparezca la ventana de la extension.
3. Abre `Opciones avanzadas`.
4. Haz clic en `Descargar JSON`.
5. Espera a que se descargue el archivo `.json`.

