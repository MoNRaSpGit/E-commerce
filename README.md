🛒 E-commerce Demo – Full Stack

Proyecto full-stack tipo e-commerce, desarrollado como portfolio técnico, con foco en:

flujo realista de compra

manejo de roles (cliente / operario / admin)

actualizaciones en tiempo real (SSE)



👉 Pensado para que un reclutador técnico pueda probar todo rápido, sin registros manuales.

🚀 Demo online

Frontend (GitHub Pages)
👉 https://monraspgit.github.io/E-commerce/

Backend API (Render)
👉 https://e-commerce-backend-24wp.onrender.com

Repositorio Frontend
👉 https://github.com/MoNRaSpGit/E-commerce

Repositorio Backend
👉 https://github.com/MoNRaSpGit/E-commerce-Backend

👥 Roles del sistema

El sistema maneja tres roles, todos probables desde la UI:

Cliente

Ver productos

Agregar al carrito

Confirmar compra

Ver Mis pedidos

Recibe actualizaciones en tiempo real cuando cambia el estado

Operario

Panel de pedidos

Cambiar estado del pedido
pendiente → en_proceso → listo / cancelado

Ver detalle del pedido (ítems)

Archivar pedidos finalizados

Actualizaciones en tiempo real

Admin

Todo lo anterior

Administración de productos
(editar nombre, precio, imagen y estado)

⚡ Acceso rápido (modo demo)

Para facilitar la prueba del sistema:

El login incluye botones de acceso rápido por rol

No es necesario registrarse

No se exponen credenciales en este repositorio

👉 Ideal para probar el flujo completo en minutos.

🔁 Flujo de pedidos (resumen)

Cliente confirma compra
POST /api/pedidos

Backend:

crea pedido

guarda snapshot de precios (no confía en el frontend)

Se emiten eventos SSE:

pedido_creado → operarios/admin

pedido_creado → cliente

Operario cambia estado
PATCH /api/pedidos/:id/estado

Se emiten eventos SSE:

pedido_estado → operarios/admin

pedido_estado → cliente

Frontend se actualiza sin refrescar la página

📡 Tiempo real (SSE)

Se utiliza Server-Sent Events en lugar de polling:

Conexión persistente

Ping keep-alive

Reconexión automática

Auth por token (query param)

Endpoints SSE

/api/pedidos/stream → operario / admin

/api/pedidos/mios/stream → cliente

🧱 Stack tecnológico
Frontend

React + Vite

React Router

Redux Toolkit (auth + carrito)

SSE (EventSource)

CSS custom + Bootstrap base

Responsive real (desktop / mobile)

Backend

Node.js + Express

MySQL

JWT (access + refresh)

SSE

Arquitectura controller / service

Deploy en Render

🧪 Testing y calidad

El proyecto incluye tests unitarios reales, enfocados en lógica crítica (no UI trivial), siguiendo un criterio práctico y profesional.

Frontend – Tests (Vitest)

Se testean los componentes más sensibles del sistema:

Redux slices

authSlice (login, logout, persistencia, errores)

cartSlice (lógica de carrito y cálculos)

Servicios

apiFetch

inyección automática de Authorization

refresh token con reintento

logout automático si la sesión expira

manejo de errores y edge cases

Tiempo real (SSE)

sseClient (wrapper de EventSource)

pedidosSse (canales por rol)

Hooks

useAfkLogout (auto-logout por inactividad, timers y eventos)

CI

GitHub Actions

build del frontend

ejecución automática de tests

Estado actual: todo correcto

🧠 Decisiones de arquitectura

SSE en lugar de polling

Snapshot de precios en DB (seguridad)

Redux solo donde aporta valor

Guards por rol en rutas

Código legible > complejidad innecesaria

UX pensada para demo técnico

🛠️ Próximos pasos (opcional)

Métricas y monitoreo SSE

Optimización fina de UX

Refactor puntual de services grandes

Mejoras visuales de demo


🎯 Objetivo del proyecto

Este proyecto busca demostrar:

backend real y funcional

frontend moderno

tiempo real

manejo de roles

buenas prácticas

deploy funcional

👉 Pensado 100% como portfolio profesional.