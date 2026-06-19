// app/(dashboard)/loading.tsx
export default function Loading() {
  return (
    <div className="p-6 lg:p-8 max-w-[1500px] mx-auto">
      <div className="h-8 w-48 rounded-lg shimmer mb-2"/>
      <div className="h-4 w-72 rounded-lg shimmer mb-6"/>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_,i)=>(<div key={i} className="h-28 rounded-2xl shimmer"/>))}
      </div>
    </div>
  );
}
