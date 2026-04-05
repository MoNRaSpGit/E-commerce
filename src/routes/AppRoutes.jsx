import { Routes, Route, Navigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { selectIsAuthed, selectUser } from "../slices/authSlice";

import ProductosPage from "../pages/ProductosPage";
import CarritoPage from "../pages/CarritoPage";
import TestAuth from "../pages/TestAuth";
import Login from "../pages/Login";
import Register from "../pages/Register";
import MisPedidos from "../pages/MisPedidos";
import OperarioPedidos from "../pages/OperarioPedidos";
import AdminProductos from "../pages/AdminProductos";
import OperarioReposicion from "../pages/OperarioReposicion";
import OperarioDashboard from "../pages/OperarioDashboard";
import OperarioEscaneo from "../pages/OperarioEscaneo";
import OperarioParaActualizar from "../pages/OperarioParaActualizar";
import OperarioPrecio999 from "../pages/OperarioPrecio999";
import OperarioSinStock from "../pages/OperarioSinStock";
import PreciosManuales from "../pages/PreciosManuales";
import AdminDesclasificados from "../pages/AdminDesclasificados";
import AdminScanLive from "../pages/AdminScanLive";
import Caja from "../pages/Caja";
import AdminRanking from "../pages/AdminRanking";





/* =========================
   Guards simples y claros
   ========================= */

function RequireAuth({ children }) {
  const isAuthed = useSelector(selectIsAuthed);
  if (!isAuthed) return <Navigate to="/login" replace />;
  return children;
}

function RequireRole({ roles, children }) {
  const user = useSelector(selectUser);

  if (!user) return <Navigate to="/login" replace />;
  const userRol = String(user?.rol || "").toLowerCase();
  const allowed = roles.map((r) => String(r).toLowerCase());

  if (!allowed.includes(userRol)) return <Navigate to="/productos" replace />;

  return children;
}

/* ========================= */

export default function AppRoutes() {
  const isAuthed = useSelector(selectIsAuthed);

  return (
    <Routes>
      {/* ✅ Home: ahora va a productos */}
      <Route path="/" element={<Navigate to="/productos" replace />} />

      {/* ✅ Públicas */}
      <Route path="/productos" element={<ProductosPage />} />
      <Route
        path="/login"
        element={isAuthed ? <Navigate to="/productos" replace /> : <Login />}
      />
      <Route
        path="/registrar"
        element={isAuthed ? <Navigate to="/productos" replace /> : <Register />}
      />

      {/* Cliente / Admin */}
      <Route
        path="/carrito"
        element={
          <RequireAuth>
            <RequireRole roles={["cliente", "admin"]}>
              <CarritoPage />
            </RequireRole>
          </RequireAuth>
        }
      />

      <Route
        path="/operario/actualizar"
        element={
          <RequireAuth>
            <RequireRole roles={["admin"]}>
              <OperarioParaActualizar />
            </RequireRole>
          </RequireAuth>
        }
      />

      <Route
        path="/operario/sin-stock"
        element={
          <RequireAuth>
            <RequireRole roles={["admin"]}>
              <OperarioSinStock />
            </RequireRole>
          </RequireAuth>
        }
      />


      <Route
        path="/mis-pedidos"
        element={
          <RequireAuth>
            <RequireRole roles={["cliente", "admin"]}>
              <MisPedidos />
            </RequireRole>
          </RequireAuth>
        }
      />
      <Route
        path="/operario/reposicion"
        element={
          <RequireAuth>
            <RequireRole roles={["admin"]}>
              <OperarioReposicion />
            </RequireRole>
          </RequireAuth>
        }
      />
      <Route
        path="/admin/desclasificados"
        element={
          <RequireAuth>
            <RequireRole roles={["admin"]}>
              <AdminDesclasificados />
            </RequireRole>
          </RequireAuth>
        }
      />
      <Route
        path="/operario/dashboard"
        element={
          <RequireAuth>
            <RequireRole roles={["admin"]}>
              <OperarioDashboard />
            </RequireRole>
          </RequireAuth>
        }
      />

      <Route
        path="/caja"
        element={
          <RequireAuth>
            <RequireRole roles={["admin", "operario"]}>
              <Caja />
            </RequireRole>
          </RequireAuth>
        }
      />

      <Route
        path="/admin/scan-live"
        element={
          <RequireAuth>
            <RequireRole roles={["admin"]}>
              <AdminScanLive />
            </RequireRole>
          </RequireAuth>
        }
      />



      {/* Operario / Admin */}
      <Route
        path="/operario/pedidos"
        element={
          <RequireAuth>
            <RequireRole roles={["admin", "operario"]}>
              <OperarioPedidos />
            </RequireRole>
          </RequireAuth>
        }
      />

      <Route
        path="/admin/productos"
        element={
          <RequireAuth>
            <RequireRole roles={["admin"]}>
              <AdminProductos />
            </RequireRole>
          </RequireAuth>
        }
      />

      <Route
        path="/operario/escaneo"
        element={
          <RequireAuth>
            <RequireRole roles={["admin", "operario"]}>
              <OperarioEscaneo />
            </RequireRole>
          </RequireAuth>
        }
      />

      <Route
        path="/operario/precios"
        element={
          <RequireAuth>
            <RequireRole roles={["admin", "operario"]}>
              <PreciosManuales />
            </RequireRole>
          </RequireAuth>
        }
      />

      <Route
        path="/operario/precio-999"
        element={
          <RequireAuth>
            <RequireRole roles={["admin"]}>
              <OperarioPrecio999 />
            </RequireRole>
          </RequireAuth>
        }
      />

      <Route
        path="/admin/ranking"
        element={<AdminRanking
        />}
      />

      {/* Debug */}
      <Route
        path="/test-auth"
        element={
          <RequireAuth>
            <TestAuth />
          </RequireAuth>
        }
      />

      {/* 404 */}
      <Route
        path="*"
        element={<h2 style={{ padding: 16 }}>404 - Página no encontrada</h2>}
      />
    </Routes>
  );
}
