import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { selectUser } from "../slices/authSlice";
import { useCaja } from "../features/caja/useCaja";
import CajaContent from "../features/caja/CajaContent";
import "../styles/caja.css";

export default function Caja() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector(selectUser);

  const cajaState = useCaja({ dispatch, navigate, user });

  return <CajaContent cajaState={cajaState} />;
}