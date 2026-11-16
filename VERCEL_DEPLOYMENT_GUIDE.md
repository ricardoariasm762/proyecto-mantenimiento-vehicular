# Guía de Despliegue en Vercel (Angular 19 Standalone)

Instrucciones para el despliegue del frontend estático en Vercel con reglas de enrutamiento SPA.

---

## 1. Configuración de `vercel.json`

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "cleanUrls": true,
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```
Esto asegura que las rutas internas de Angular (`/login`, `/register`, etc.) no generen errores 404 en Vercel al recargar la página.

---

## 2. Directorio de Salida (Output Directory)

Con el application builder de Angular 19+, los archivos compilados se ubican en:
```text
dist/frontend/browser
```
Es fundamental ingresar esta ruta en el campo **Output Directory** de Vercel.

---

## 3. Variables de Entorno y Producción

En `src/environments/environment.prod.ts`:
```typescript
export const environment = {
  production: true,
  apiUrl: 'https://mantenimiento-backend.onrender.com'
};
```
Angular reemplaza automáticamente `environment.ts` con `environment.prod.ts` durante `ng build` gracias a la sección `fileReplacements` de `angular.json`.

