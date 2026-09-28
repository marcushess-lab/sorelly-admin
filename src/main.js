// Sorelly Admin — entrada da aplicação.
import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { e } from "@/shared/react";
import { rotas } from "@/router/rotas";
import "@/styles/theme.css";

const router = createBrowserRouter(rotas);

// Em desenvolvimento, o router fica acessível no console (window.__router):
// útil para conferir telas sem recarregar a página.
if (import.meta.env.DEV) window.__router = router;

createRoot(document.getElementById("root")).render(e(RouterProvider, { router: router }));
