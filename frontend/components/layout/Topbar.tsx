export function Topbar({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <header>
      <h1 className="text-3xl font-bold text-slate-950">{title}</h1>
      {description && <p className="mt-2 text-slate-500">{description}</p>}
    </header>
  );
}
