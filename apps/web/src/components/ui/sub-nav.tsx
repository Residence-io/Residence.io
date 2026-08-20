import Link from 'next/link';

export function SubNav({
  items,
}: {
  items: { label: string; href: string }[];
}) {
  return (
    <nav className="flex space-x-4 border-b border-slate-200 pb-4">
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className="text-sm font-medium text-slate-600 hover:text-blue-600"
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
