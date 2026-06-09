# Sprint 14.1 — Correcciones UX PWA

Este hotfix corrige fricciones detectadas en la prueba móvil del Sprint 14.

## Cambios

- Se eliminó el botón hamburguesa móvil porque no ejecutaba ninguna acción útil.
- Se reemplazó por una etiqueta visual simple `PWA` en el header móvil.
- Se removió el bloque de acciones rápidas del dashboard.
- Se removió la tarjeta de instalación/`App instalada` del dashboard.
- Se agregó `Presupuestos` al menú inferior móvil.
- En `/compras`, las listas ahora se muestran en carrusel horizontal.
- Dentro de cada lista, los grupos por proveedor/lugar también se muestran en carrusel horizontal.

## SQL

No requiere migración en Supabase.

## Pruebas sugeridas

1. Abrir la app desde el celular o responsive.
2. Confirmar que no aparece el botón hamburguesa inservible.
3. Confirmar que el dashboard no muestra acciones rápidas ni aviso de app instalada.
4. Confirmar que `Presup.` aparece en el menú inferior.
5. Entrar a `/compras` y verificar scroll horizontal entre listas.
6. Verificar scroll horizontal entre grupos por lugar/proveedor dentro de una lista.
