# Sprint 14 — PWA completa + UX móvil avanzada

## Objetivo

Convertir Gestión Total Casa en una experiencia más cercana a una app instalable, con mejor navegación móvil, acciones rápidas y base PWA más completa.

## Cambios principales

### PWA

- Manifest ampliado con `scope`, `display_override`, `orientation`, `lang`, `icons` y shortcuts.
- Íconos PWA generados en `public/icons`:
  - `icon-192.png`
  - `icon-512.png`
  - `maskable-192.png`
  - `maskable-512.png`
  - `apple-touch-icon.png`
- Metadata de Next actualizada con Apple Web App, viewport y theme color.
- Service worker básico en `public/sw.js`.
- Registro del service worker en producción.
- Banner offline básico.
- Card de instalación en el dashboard.

### UX móvil

- AppShell convertido a cliente para detectar ruta activa.
- Sidebar desktop agrupado por áreas:
  - Inicio
  - Finanzas
  - Operación
  - Sistema
- Header móvil sticky.
- Navegación inferior móvil tipo app, con safe-area para iPhone.
- Estado activo de navegación.
- Scroll horizontal limpio en navegación inferior.
- Inputs protegidos contra zoom involuntario en iOS usando `font-size: 16px`.
- Ajustes globales de tap, safe-area y overscroll.

### Dashboard

- Nueva sección de acciones rápidas:
  - Lista de mercado
  - Mercado / stock
  - Registrar gasto
  - Carro
  - Menús
  - Objetivos
- Nueva tarjeta para instalación PWA.

## Archivos principales modificados

```txt
src/app/layout.tsx
src/app/manifest.ts
src/app/globals.css
src/app/(app)/dashboard/page.tsx
src/components/layout/app-shell.tsx
src/components/pwa/install-app-card.tsx
src/components/pwa/offline-banner.tsx
src/components/pwa/service-worker-register.tsx
src/components/dashboard/quick-actions.tsx
public/sw.js
public/icons/icon-192.png
public/icons/icon-512.png
public/icons/maskable-192.png
public/icons/maskable-512.png
public/icons/apple-touch-icon.png
```

## SQL

No requiere migración nueva en Supabase.

## Cómo probar

1. Ejecutar local:

```powershell
npm install
npm run dev
```

2. Probar responsive:

- `/dashboard`
- `/compras`
- `/mercado`
- `/menus`
- `/carro`

3. Probar build:

```powershell
npm run build
```

4. Para probar PWA completa, subir a Vercel. El service worker solo se registra en producción.

5. En Android/Chrome:

- Abrir la URL de Vercel.
- Revisar si aparece botón de instalar en dashboard.
- O usar menú del navegador → Instalar app.

6. En iPhone/Safari:

- Abrir la URL de Vercel en Safari.
- Compartir → Agregar a pantalla de inicio.

## Limitaciones

- El service worker es básico. Cachea shell y algunas páginas, pero guardar datos sigue requiriendo conexión.
- No se implementó sincronización offline de formularios.
- No se rediseñaron todas las pantallas a nivel pixel-perfect; se mejoró la base móvil global.

## Próximo sprint recomendado

Sprint 15: Forecasting y simulaciones.
