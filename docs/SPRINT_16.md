# Sprint 16 — Insights y recomendaciones determinísticas

## Objetivo

Agregar una capa de lectura tipo CFO doméstico basada en reglas internas, sin depender todavía de IA externa.

## Qué incluye

- Nueva ruta `/insights`.
- Insights por área:
  - Finanzas.
  - Mercado.
  - Stock.
  - Carro.
  - Objetivos.
  - Riesgo.
  - Operación.
- Severidad:
  - Crítico.
  - Alerta.
  - Informativo.
  - Positivo.
- Acción recomendada por insight.
- Acceso desde dashboard.
- Acceso desde navegación desktop y móvil.
- Endpoint interno preparado para futura IA: `/api/insights/draft`.

## Reglas determinísticas iniciales

La app genera señales con reglas como:

- Flujo neto consolidado negativo.
- Tasa de ahorro baja o fuerte.
- Presupuestos excedidos o cerca del límite.
- Deuda mensual alta frente a ingresos.
- Runway doméstico bajo o sólido.
- Stock agotado o bajo.
- Productos con aumento fuerte de precio.
- Compras prioritarias pendientes.
- Recordatorios de carro pendientes.
- Objetivos atrasados o en riesgo.
- Patrimonio neto negativo.

## IA

No se conectó ningún proveedor externo.

El endpoint `/api/insights/draft` queda preparado para recibir contexto e insights determinísticos y, más adelante, generar recomendaciones con IA. En Sprint 16 solo devuelve una respuesta de preparación.

## SQL

No requiere migración nueva.

## Pruebas sugeridas

1. Entrar a `/insights`.
2. Revisar resumen de insights.
3. Revisar acción más importante.
4. Revisar links de acción.
5. Probar en móvil.
6. Verificar que `/dashboard` tenga entrada a insights.
7. Confirmar que el menú móvil incluya Insights.
