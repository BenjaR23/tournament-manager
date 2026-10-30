import { Link } from "react-router";

export default function Footer() {
  return (
    <footer className="border-t border-white/10">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-6 text-sm text-zinc-500 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
        <Link to="/" className="font-semibold text-zinc-300">
          TournamentManager
        </Link>

        <p>
          Encuentra tu próximo torneo. Compite a tu manera.
        </p>

        <span>Proyecto personal · 2026</span>
      </div>
    </footer>
  );
}
