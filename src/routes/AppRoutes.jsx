import { Routes, Route, Navigate } from "react-router-dom";
import ProductosPage from "../pages/ProductosPage";
import CarritoPage from "../pages/CarritoPage";
import TestAuth from "../pages/TestAuth";
import Login from "../pages/Login";
import Register from "../pages/Register";
import MisPedidos from "../pages/MisPedidos";
import OperarioPedidos from "../pages/OperarioPedidos";
import AdminProductos from "../pages/AdminProductos";



export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/productos" replace />} />
      <Route path="/productos" element={<ProductosPage />} />
      <Route path="/carrito" element={<CarritoPage />} />
      <Route path="/test-auth" element={<TestAuth />} />
      <Route path="/login" element={<Login />} />
      <Route path="/mis-pedidos" element={<MisPedidos />} />
      <Route path="/operario/pedidos" element={<OperarioPedidos />} />
      <Route path="/admin/productos" element={<AdminProductos />} />



      <Route path="/registrar" element={<Register />} />

      <Route path="*" element={<h2 style={{ padding: 16 }}>404 - Página no encontrada</h2>} />
    </Routes>
  );
}
