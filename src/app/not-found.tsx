import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="text-center">
        <div className="mb-4 text-6xl">🔍</div>
        <h1 className="mb-4 text-3xl font-bold">404 – Stran ni bila najdena</h1>
        <p className="mb-8 text-gray-600 dark:text-gray-400">
          Stran, ki jo iščete, ne obstaja ali je bila premaknjena.
        </p>
        <Link
          href="/"
          className="rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-blue-700"
        >
          Nazaj na domačo stran
        </Link>
      </div>
    </div>
  );
}
