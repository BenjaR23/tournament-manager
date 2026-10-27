import { Link } from "react-router";

export default function Register() {
  return (
    <section className="mx-auto max-w-md py-12 text-center">
      <h1 className="text-3xl font-bold text-white">Crear cuenta</h1>
      <p className="mt-3 text-sm text-zinc-400">
        Aquí construiremos el formulario de registro.
      </p>
      <Link
        to="/login"
        className="mt-6 inline-flex text-sm font-medium text-violet-400 hover:text-violet-300"
      >
        ¿Ya tienes cuenta? Inicia sesión
      </Link>
    </section>
  );
}
