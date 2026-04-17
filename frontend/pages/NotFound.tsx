import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white">
      <div className="max-w-lg text-center p-8">
        <h1 className="text-7xl font-extrabold mb-4">404</h1>
        <p className="text-lg mb-6 text-slate-300">
          Page not found — the requested route does not exist.
        </p>
        <Link
          to="/"
          className="inline-block rounded-full bg-sky-500 px-5 py-2 font-semibold text-white shadow hover:bg-sky-400 transition"
        >
          Return home
        </Link>
      </div>
    </div>
  );
}
