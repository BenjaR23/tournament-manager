import { Link } from "react-router";

export default function Home() {
  return (
    <div className="space-y-8">
      <section className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-violet-950/60 via-[#191820] to-[#18181f] p-6 sm:p-10 lg:p-12">
        <div className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-violet-600/15 blur-3xl" />

        <div className="relative max-w-2xl space-y-5">
          <span className="inline-flex items-center gap-2 rounded-full border border-violet-400/20 bg-violet-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-violet-300">
            <span className="h-1.5 w-1.5 rounded-full bg-violet-400" />
            Tu próxima competencia empieza aquí
          </span>

          <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl">
            Encuentra tu próximo{" "}
            <span className="text-violet-400">torneo.</span>
          </h1>

          <p className="max-w-xl text-sm leading-7 text-zinc-400 sm:text-base">
            Explora competencias, encuentra jugadores y participa en torneos
            de tus juegos favoritos.
          </p>

          <div className="flex flex-wrap gap-3 pt-1">
            <a
              href="#tournaments"
              className="inline-flex items-center justify-center rounded-lg bg-violet-600 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-violet-500"
            >
              Explorar torneos
            </a>

            <Link
              to="/register"
              className="inline-flex items-center justify-center rounded-lg border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-zinc-200 transition-colors hover:bg-white/10"
            >
              Crear una cuenta
            </Link>
          </div>
        </div>
      </section>

      <section id="tournaments" className="scroll-mt-24 space-y-5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-1">
            <h2 className="text-xl font-bold tracking-tight text-white sm:text-2xl">
              Explorar torneos
            </h2>

            <p className="text-sm text-zinc-400">
              Encuentra una competencia y prepárate para jugar.
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-dashed border-white/10 bg-white/[0.02] px-5 py-12 text-center sm:py-16">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-violet-300">
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              className="h-6 w-6"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M8 21h8m-4-4v4m-7-17h14a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M7 8h4m-4 3h7"
              />
            </svg>
          </div>

          <h3 className="mt-4 text-base font-semibold text-white">
            Los torneos aparecerán aquí
          </h3>

          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-zinc-400">
            Estamos preparando el listado para mostrar competencias,
            fechas y plazas disponibles.
          </p>
        </div>
      </section>
    </div>
  );
}
