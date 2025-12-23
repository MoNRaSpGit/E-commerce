import Navbar from "./components/Navbar";
import AppRoutes from "./routes/AppRoutes";
import { Toaster } from "react-hot-toast";
import useAfkLogout from "./hooks/useAfkLogout";


export default function App() {
  useAfkLogout({ minutes:  10 });
  return (
    <>
     <Toaster position="top-right" />
      <Navbar />
      <AppRoutes />
    </>
  );
}
