export function PageHeader({
  eyebrow,
  title,
  description,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
}) {
  return (
    <header>
      {eyebrow ? (
        <p className="text-sm font-semibold uppercase tracking-wider text-blue-700">
          {eyebrow}
        </p>
      ) : null}
      <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-950">
        {title}
      </h1>
      {description ? (
        <p className="mt-2 max-w-2xl text-slate-600">{description}</p>
      ) : null}
    </header>
  );
}
