import { Routes, Route, Navigate } from "react-router-dom";
import ProductosPage from "../pages/ProductosPage";
import CarritoPage from "../pages/CarritoPage";
import TestAuth from "../pages/TestAuth";
import Login from "../pages/Login";


export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/productos" replace />} />
      <Route path="/productos" element={<ProductosPage />} />
      <Route path="/carrito" element={<CarritoPage />} />
      <Route path="/test-auth" element={<TestAuth />} />
      <Route path="/login" element={<Login />} />
      <Route path="/registrar" element={<div className="container py-4">Registro (pendiente)</div>} />

      <Route path="*" element={<h2 style={{ padding: 16 }}>404 - Página no encontrada</h2>} />
    </Routes>
  );
}
