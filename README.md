# StudyNext

StudyNext es una aplicación web para que estudiantes organicen su vida académica en un solo lugar. Incluye pantallas de acceso y un espacio de estudio con materias, tareas, calendario y seguimiento del progreso.

## Funcionalidades

- Registro e inicio de sesión con correo y contraseña mediante Firebase Authentication.
- Opción para mostrar u ocultar la contraseña y validaciones en los formularios.
- Panel de estudio con resumen de tareas, materias, calendario y progreso.
- Gestión de materias y tareas desde la sección académica.
- Guardado local de la información académica en el navegador (`localStorage`). Esa información queda en el navegador utilizado y no se sincroniza entre dispositivos.
- Pantallas de splash, recuperación de contraseña, perfil y configuración. Algunas de estas pantallas son actualmente interfaces y no tienen todas sus acciones conectadas.

## Tecnologías

- Angular 21 y TypeScript
- HTML y SCSS
- Firebase Authentication
- JavaScript y `localStorage` para las funciones del panel académico

## Requisitos

- Node.js y npm instalados.
- Acceso a Internet para instalar dependencias y utilizar Firebase Authentication.

## Ejecutar en local

1. Clona el repositorio y entra a la carpeta del proyecto:

   ```bash
   git clone https://github.com/CarlosTaquez/StudyNext.git
   cd StudyNext
   ```

2. Instala las dependencias:

   ```bash
   npm install
   ```

3. Inicia el servidor de desarrollo:

   ```bash
   npm start
   ```

4. Abre `http://localhost:4200` en el navegador. La ruta inicial muestra Splash; también puedes abrir `/login` o `/registro`.

Para generar la versión de producción, ejecuta:

```bash
npm run build
```

## Firebase Authentication

La aplicación usa el proyecto Firebase `studynext-1b59f` y el proveedor de acceso por correo electrónico y contraseña. Para que el registro e inicio de sesión funcionen, el proveedor debe estar habilitado en Firebase Console. Si se ejecuta o publica la aplicación en otro dominio, agrega ese dominio a **Authentication → Configuración → Dominios autorizados**.

Las cuentas se administran en Firebase Authentication. Los datos de materias y tareas del panel se guardan por separado en el almacenamiento local del navegador.

## Estructura principal

```text
src/app/
├── pages/auth/       # Splash, login, registro, recuperación, perfil y configuración
├── services/         # Servicio de autenticación Firebase
├── app.routes.ts     # Rutas de la aplicación Angular
└── app.config.ts     # Configuración de Angular y Firebase

dashboard.html        # Panel de estudio
dashboard.js          # Interacciones y datos académicos locales
academico.html        # Sección de materias y tareas
academic.ts           # Lógica académica en TypeScript
```

`npm start` y `npm run build` compilan `academic.ts` antes de ejecutar Angular. Para recompilar el módulo automáticamente mientras editas el archivo, ejecuta `npm run watch:academic` en otra terminal.

## Equipo

Proyecto desarrollado en equipo. Cada integrante contribuye desde su rama de trabajo y los cambios integrados se encuentran en `main`.
