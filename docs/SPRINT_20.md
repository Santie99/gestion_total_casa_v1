# Sprint 20 — Correcciones de salida a producción cercana

## Objetivo

Preparar la PWA para uso con amigos y conocidos, corrigiendo fricciones de navegación, quitando textos internos de sprint y mejorando la experiencia móvil sin romper la lógica ni el diseño actual.

## Cambios principales

### Navegación desktop

- El menú lateral ahora usa layout flex vertical.
- La lista de secciones tiene `overflow-y-auto`.
- El botón de cerrar sesión queda fijo al final del panel, sin tapar enlaces.
- El usuario puede desplazarse por el menú completo cuando la pantalla no tiene altura suficiente.

### Limpieza de textos internos

- Se retiraron textos visibles tipo `Sprint ## · ...` de las secciones.
- Se reemplazaron descripciones internas por textos listos para producción.

### Guía

- Se retiró la subsección de checklist final de producción.
- La guía queda enfocada en onboarding operativo, mapa de módulos y flujos recomendados.

### PWA móvil

- Se agregó `Ingresos` al menú inferior móvil.
- Las tarjetas de resumen de las secciones principales ahora funcionan como carrusel horizontal en móvil:
  - Inicio
  - Mercado
  - Gastos
  - Presupuestos
  - Menús
  - Carro
  - Metas
  - Ingresos
- En desktop mantienen comportamiento de grilla.

### Mercado móvil

- La sección Mercado ahora tiene un flujo horizontal móvil para sus paneles operativos:
  - Crear quincena
  - Quincenas
  - Productos maestros
  - Stock inicial
  - Crear factura manual
  - Registrar compra
  - Agregar producto comprado
  - Detalle de compras
  - Stock en casa
  - Movimiento de stock
  - Movimientos recientes
  - Histórico de precios
- En desktop conserva la estructura de dos columnas.

### Apariencia

- Se agregó control de apariencia desde Configuración.
- Modos disponibles:
  - Claro
  - Oscuro
  - Automático
- El modo automático usa la hora local del dispositivo:
  - 7:00 a.m. a 7:00 p.m.: claro
  - 7:00 p.m. a 7:00 a.m.: oscuro
- La preferencia se guarda localmente en el navegador/PWA.

## SQL

No requiere migración nueva.

## Validación

- `tsc --noEmit`: sin errores.
- `npm run build`: compiló correctamente. El entorno agotó tiempo después de `Collecting page data`, sin mostrar error de código.
