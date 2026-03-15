// Breadcrumbs component
export function Breadcrumbs({
  items,
}: {
  items?: { label: string; href?: string }[];
}) {
  return (
    <nav className="flex items-center space-x-2 text-sm text-gray-500 mb-4">
      {items?.map((item, index) => (
        <div key={index} className="flex items-center">
          {index > 0 && <span className="mx-2">/</span>}
          {item.href ? (
            <a href={item.href} className="hover:text-gray-700">
              {item.label}
            </a>
          ) : (
            <span className="text-gray-900 font-medium">{item.label}</span>
          )}
        </div>
      ))}
    </nav>
  );
}
