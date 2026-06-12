# Guía de conexión: Supabase + GitHub + Vercel

## 1. Crear proyecto en Supabase

1. Entra a Supabase.
2. Crea un nuevo proyecto.
3. Guarda:
   - Project URL.
   - anon public key.
4. Ve a Authentication > Providers > Email.
5. Para desarrollo inicial, desactiva temporalmente la confirmación obligatoria de email. Si la dejas activa, el usuario tendrá que confirmar correo antes de poder entrar y crear su familia.

## 2. Crear tablas y políticas

1. En Supabase, entra a SQL Editor.
2. Abre el archivo `supabase/schema.sql` de este proyecto.
3. Copia todo el contenido.
4. Ejecútalo en SQL Editor.
5. Verifica que existan estas tablas:
   - families
   - family_members
   - categories
   - income_entries
   - expense_entries
   - manual_invoices
   - market_periods
   - market_purchases
   - market_purchase_items

## 3. Configurar local

1. Extrae el ZIP.
2. Abre la carpeta en VS Code.
3. Crea el archivo `.env.local` en la raíz.
4. Copia el contenido de `.env.example`.
5. Reemplaza los valores:

```env
NEXT_PUBLIC_SUPABASE_URL=https://TU-PROYECTO.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=TU_SUPABASE_ANON_KEY
```

6. Instala dependencias:

```bash
npm install
```

7. Corre local:

```bash
npm run dev
```

8. Abre:

```txt
http://localhost:3000
```

## 4. Probar auth local

1. Entra a `/register`.
2. Crea una familia.
3. Debe redirigir a `/dashboard`.
4. Cierra sesión.
5. Entra de nuevo con `/login`.
6. Prueba que `/dashboard`, `/mercado`, `/ingresos`, `/gastos`, `/carro` y `/configuracion` estén protegidas.

## 5. Subir a GitHub

Desde la raíz del proyecto:

```bash
git init
git add .
git commit -m "Sprint 1 base desplegable"
git branch -M main
git remote add origin URL_DE_TU_REPO
git push -u origin main
```

## 6. Conectar Vercel

1. Entra a Vercel.
2. Importa el repo desde GitHub.
3. Framework: Next.js.
4. Build command: `npm run build`.
5. Output: automático.
6. Agrega las mismas variables de entorno:

```env
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
```

7. Deploy.

## 7. Configurar URLs en Supabase Auth

Cuando Vercel te dé una URL, ve a Supabase:

Authentication > URL Configuration

Configura:

- Site URL: tu URL de Vercel.
- Redirect URLs:
  - `http://localhost:3000/**`
  - `https://TU-DOMINIO-VERCEL.vercel.app/**`

## 8. Validación final

En producción:

1. Abre la URL de Vercel.
2. Crea una familia nueva.
3. Verifica que entres al dashboard.
4. Revisa en Supabase que se haya creado una fila en `families` y otra en `family_members`.

## 9. Validación de versión estable

Después de aplicar todos los sprints hasta Sprint 19, valida también:

- `/guia`: onboarding operativo y mapa de módulos.
- `/compras`: listas manuales/inteligentes, proveedor por producto y conversión parcial.
- `/mercado`: compra real, stock e histórico de precios.
- `/proyecciones`: escenarios y stress testing.
- `/insights`: reglas determinísticas y acción prioritaria.
- `/reportes`: reportes mensuales y exportación CSV.
- `/configuracion`: miembros, categorías y estado técnico.

Sprint 19 no agrega datos de ejemplo ni migración SQL nueva.
