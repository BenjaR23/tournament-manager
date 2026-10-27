import { Link, useParams } from "react-router";

export default function TournamentDetail() {
  const { id } = useParams();

  return (
    <section className="py-8">
      <Link
        to="/"
        className="text-sm font-medium text-violet-400 hover:text-violet-300"
      >
        ← Volver a torneos
      </Link>

      <h1 className="mt-6 text-3xl font-bold text-white">
        Detalle del torneo
      </h1>

      <p className="mt-3 text-sm text-zinc-400">
        Identificador del torneo: {id}
      </p>

      <p className="mt-2 text-sm text-zinc-500">
        Aquí mostraremos los datos reales del torneo y sus participantes.
      </p>
    </section>
  );
}
