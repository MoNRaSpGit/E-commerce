export default function ProductCardSkeleton() {
  return (
    <div className="pc-skel">
      <div className="pc-skel-img shimmer" />
      <div className="pc-skel-body">
        <div className="pc-skel-line lg shimmer" />
        <div className="pc-skel-line md shimmer" />
        <div className="pc-skel-line sm shimmer" />
        <div className="pc-skel-btn shimmer" />
      </div>
    </div>
  );
}
