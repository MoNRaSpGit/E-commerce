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
  if (!roles.includes(user.rol)) return <Navigate to="/productos" replace />;

  return children;
}

/* ========================= */

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />

      {/* Públicas */}
      <Route
        path="/productos"
        element={
          <RequireAuth>
            <ProductosPage />
          </RequireAuth>
        }
      />
      <Route path="/login" element={<Login />} />
      <Route path="/registrar" element={<Register />} />

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
        path="/mis-pedidos"
        element={
          <RequireAuth>
            <RequireRole roles={["cliente", "admin"]}>
              <MisPedidos />
            </RequireRole>
          </RequireAuth>
        }
      />

      {/* Operario / Admin */}
      <Route
        path="/operario/pedidos"
        element={
          <RequireAuth>
            <RequireRole roles={["admin","operario"]}>
              <OperarioPedidos />
            </RequireRole>
          </RequireAuth>
        }
      />

      <Route
        path="/admin/productos"
        element={
          <RequireAuth>
            <RequireRole roles={["operario", "admin"]}>
              <AdminProductos />
            </RequireRole>
          </RequireAuth>
        }
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
