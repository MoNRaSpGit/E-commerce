import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { selectUser } from "../slices/authSlice";
import { useCaja } from "../features/caja/useCaja";
import CajaContent from "../features/caja/CajaContent";
import { useAdminScanLive } from "../hooks/useAdminScanLive";
import { useRanking } from "../features/ranking/useRanking";
import "../styles/caja.css";
import "../styles/ranking.css";

export default function Caja() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector(selectUser);

  const cajaState = useCaja({ dispatch, navigate, user });
  const liveState = useAdminScanLive({ dispatch, navigate });
  const rankingState = useRanking({ dispatch, navigate, desde: "", hasta: "" });

  return <CajaContent cajaState={cajaState} liveState={liveState} rankingState={rankingState} />;
}
