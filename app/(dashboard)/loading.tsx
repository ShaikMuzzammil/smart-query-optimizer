// app/(dashboard)/loading.tsx
export default function DashboardLoading() {
  return (
    <div className="p-6 lg:p-8 max-w-[1500px] mx-auto">
      <div className="h-8 w-48 rounded-xl shimmer mb-2" />
      <div className="h-4 w-64 rounded-lg shimmer mb-8" />
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
        {[...Array(6)].map((_, i) => <div key={i} className="h-28 rounded-2xl shimmer" />)}
      </div>
      <div className="grid lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 h-72 rounded-2xl shimmer" />
        <div className="h-72 rounded-2xl shimmer" />
      </div>
    </div>
  );
}
