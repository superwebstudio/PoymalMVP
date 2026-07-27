export default function CatchLoading(): React.JSX.Element {
  return (
    <div className="min-h-screen bg-zinc-950 p-4 pb-24">
      <div className="mb-4 h-10 w-40 animate-pulse rounded-lg bg-zinc-800" />
      <div className="mb-4 aspect-[4/3] w-full animate-pulse rounded-xl bg-zinc-800" />
      <div className="mb-3 h-6 w-2/3 animate-pulse rounded bg-zinc-800" />
      <div className="h-4 w-1/2 animate-pulse rounded bg-zinc-800" />
    </div>
  );
}
