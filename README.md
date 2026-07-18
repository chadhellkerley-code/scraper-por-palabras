# InstaLead Extractor 🎯 - Extensión de Google Chrome

Esta es una extensión de Google Chrome (Manifest V3) diseñada para buscar y extraer leads calificados de Instagram mediante la automatización simulada de clics y la barra de búsqueda de seguidores/seguidos.

## Características:
- **Automatización Segura**: Simula el comportamiento humano con delays personalizables (mínimo/máximo) entre búsquedas para proteger la integridad de tu cuenta.
- **Multitarget**: Introduce una lista de usernames y los procesará uno a uno de forma consecutiva.
- **Doble Origen**: Busca y extrae contactos filtrados tanto en la lista de **Seguidores** como en la de **Seguidos** de cada perfil target.
- **Eliminación Automática de Duplicados**: Evita guardar cuentas repetidas durante toda la sesión de extracción.
- **Exportación Directa**: Descarga un archivo CSV limpio con todos tus leads calificados listos para tus campañas de prospección.

---

## 🛠️ Instrucciones de Instalación en Google Chrome

Para instalar y utilizar esta extensión localmente en tu navegador Chrome, sigue estos sencillos pasos:

1. **Descarga y Extrae el Archivo ZIP**:
   - Descarga el archivo ZIP generado de la extensión.
   - Descomprímelo en una carpeta accesible en tu computadora (ej. en tu Escritorio o Carpeta de Documentos).

2. **Abre la página de Extensiones en Chrome**:
   - En Google Chrome, abre una nueva pestaña y dirígete a: `chrome://extensions`
   - O bien, haz clic en el menú de 3 puntos (esquina superior derecha) -> **Extensiones** -> **Administrar extensiones**.

3. **Activa el Modo de Desarrollador**:
   - En la esquina superior derecha de la pantalla de extensiones, activa el interruptor que dice **"Modo de desarrollador"** (Developer mode).

4. **Carga la Extensión Descomprimida**:
   - Haz clic en el botón que aparece en la esquina superior izquierda llamado **"Cargar descomprimida"** (Load unpacked).
   - Selecciona la carpeta que descomprimiste en el Paso 1 (la carpeta que contiene los archivos `manifest.json`, `background.js`, `dashboard.html`, etc.).

5. **¡Listo para usar!**:
   - El icono de la extensión aparecerá en tu barra de herramientas. Haz clic en él y automáticamente se abrirá la pestaña del **Panel de Control (dashboard.html)**.

---

## 🚀 Cómo usar el InstaLead Extractor

1. **Inicia Sesión en Instagram**:
   - Antes de iniciar cualquier extracción, asegúrate de tener una sesión activa con tu cuenta en la pestaña de Chrome en [instagram.com](https://www.instagram.com). La herramienta usará tus permisos de navegador para acceder a los listados de seguidores/seguidos.

2. **Configura tus Parámetros**:
   - **Usernames**: Añade las cuentas de Instagram de las que deseas buscar leads (ej. competidores, referentes de tu sector). Coloca un username por línea. No es necesario incluir el signo "@".
   - **Palabras Clave (Keywords)**: Introduce las palabras clave por las que deseas filtrar a las personas (ej. *marketing, fitness, coach, real estate*), separadas por comas.
   - **Delays de Seguridad**: Configura los segundos mínimos y máximos de espera (ej. mínimo: 4s, máximo: 10s). *Se recomienda usar delays generosos para prevenir bloqueos temporales por parte de la plataforma de Instagram.*

3. **Inicia el Proceso**:
   - Haz clic en **"Comenzar Extracción"**. 
   - El extractor abrirá una pestaña de Instagram para el primer perfil de la lista, accederá a sus seguidores, escribirá consecutivamente cada palabra clave, extraerá los nombres de usuario resultantes, repetirá el proceso en los seguidos, y luego pasará al siguiente perfil de tu lista.
   - Mientras tanto, puedes volver a la pestaña de la extensión para ver el progreso, estadísticas de duplicados y el registro de eventos en tiempo real.

4. **Descarga tus Leads**:
   - Al finalizar, haz clic en **"Descargar CSV"** para obtener un archivo con los leads recolectados.

---

## ⚠️ Consejos importantes de Seguridad de Instagram

- **Delays Razonables**: Instagram monitorea las actividades rápidas de las cuentas. Asegúrate de configurar delays mínimos de al menos **4 a 8 segundos** entre palabras clave.
- **Límites de Uso Diario**: No extraigas miles de perfiles en una sola sesión. Trata de mantener tus operaciones de prospección moderadas (por ejemplo, analizar 3-5 perfiles por lote de trabajo).
- **Cuentas Secundarias**: Se recomienda utilizar una cuenta de Instagram secundaria o de prospección (cuenta espejo) para ejecutar la extracción de leads, protegiendo así tu perfil personal o de negocio principal de posibles limitaciones temporales de Instagram.
