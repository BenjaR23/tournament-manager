
import { Link, NavLink } from "react-router";

const navigationLinkClass = ({ isActive }: { isActive: boolean }) =>
  `rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
    isActive
      ? "bg-white/10 text-white"
      : "text-zinc-400 hover:bg-white/5 hover:text-white"
  }`;

export default function Navbar() {
  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[#101014]/90 backdrop-blur-xl">
      <nav
        aria-label="Navegación principal"
        className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8"
      >
        <Link to="/" className="flex shrink-0 items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-600 font-black text-white shadow-lg shadow-violet-950/40">
            T
          </span>

          <span className="text-lg font-bold tracking-tight text-white">
            Tournament<span className="text-violet-400">Manager</span>
          </span>
        </Link>

        <div className="hidden items-center gap-2 sm:flex">
          <NavLink to="/" end className={navigationLinkClass}>
            Torneos
          </NavLink>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <Link
            to="/login"
            className="hidden rounded-lg px-3 py-2 text-sm font-medium text-zinc-300 transition-colors hover:text-white sm:inline-flex"
          >
            Iniciar sesión
          </Link>

          <Link
            to="/register"
            className="inline-flex items-center justify-center rounded-lg bg-violet-600 px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-violet-500 sm:px-4"
          >
            Registrarse
          </Link>
        </div>
      </nav>
    </header>
  );
}
