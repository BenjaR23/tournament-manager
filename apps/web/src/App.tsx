import { Route, Routes } from "react-router";
import MainLayout from "./layouts/MainLayout";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import CreateTournament from "./pages/CreateTournament";
import TournamentDetail from "./pages/TournamentDetail";

function NotFound() {
  return (
    <section className="py-16 text-center">
      <p className="text-sm font-semibold text-violet-400">404</p>
      <h1 className="mt-3 text-2xl font-bold text-white">
        Página no encontrada
      </h1>
      <p className="mt-2 text-sm text-zinc-400">
        La página que buscas no existe.
      </p>
    </section>
  );
}

export default function App() {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/tournaments/create"
          element={<CreateTournament />}
        />
        <Route
          path="/tournaments/:id"
          element={<TournamentDetail />}
        />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
