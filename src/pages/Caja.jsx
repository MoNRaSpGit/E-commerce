import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { useMemo, useState } from "react";
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
  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const [rankingDate, setRankingDate] = useState(today);
  const isTodayRanking = rankingDate === today;

  const cajaState = useCaja({ dispatch, navigate, user });
  const liveState = useAdminScanLive({ dispatch, navigate });
  const remoteRankingState = useRanking({
    dispatch,
    navigate,
    desde: rankingDate,
    hasta: rankingDate,
    enabled: !isTodayRanking,
  });
  const rankingState = isTodayRanking
    ? {
      data: cajaState.dashboardRanking.items,
      loading: cajaState.loading && cajaState.dashboardRanking.items.length === 0,
    }
    : remoteRankingState;

  return (
    <CajaContent
      cajaState={cajaState}
      liveState={liveState}
      rankingState={rankingState}
      rankingDate={rankingDate}
      setRankingDate={setRankingDate}
    />
  );
}
