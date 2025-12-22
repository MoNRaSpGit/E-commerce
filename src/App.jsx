import Navbar from "./components/Navbar";
import AppRoutes from "./routes/AppRoutes";
import { Toaster } from "react-hot-toast";

export default function App() {
  return (
    <>
     <Toaster position="top-right" />
      <Navbar />
      <AppRoutes />
    </>
  );
}
