import {
  BrowserRouter,
  Routes,
  Route as RUTA,
  NavLink,
  Outlet,
} from "react-router-dom";

import Home from "./pages/Home";
import Home_p from "./pages/Home_p";
import Home_c from "./pages/Home_c";
import Login from "./pages/Login";

import RutaPrivada from "./Components/RutaPrivada";
import Estudios_d from "./Components/Estudios_d";
import Check from "./Components/Check";
import EliminarEstudios from "./Components/EliminarEstudios";

import "./App.css";

// ESTRUCTURA GENERAL DEL ADMIN
function LayoutAdmin() {
  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <h2>BOGAPP</h2>
        <p>Administración</p>

        <nav className="admin-nav">
          <NavLink to="/" end>
            Dashboard
          </NavLink>

          <NavLink to="/admin/estudios">Estudios</NavLink>

          <NavLink to="/admin/solicitudes">Solicitudes</NavLink>

          <NavLink to="/admin/usuarios">Usuarios</NavLink>

          <NavLink to="/admin/limpieza">Limpieza</NavLink>
        </nav>
      </aside>

      <main className="admin-content">
        <Outlet />
      </main>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* LOGIN */}
        <RUTA path="/login" element={<Login />} />

        {/* RUTAS DEL ADMIN */}
        <RUTA
          path="/"
          element={
            <RutaPrivada rol="ADMIN_BOGAPP">
              <LayoutAdmin />
            </RutaPrivada>
          }
        >
          <RUTA index element={<Home />} />

          <RUTA path="admin/estudios" element={<Estudios_d />} />

          <RUTA path="admin/solicitudes" element={<Check />} />

          <RUTA path="admin/usuarios" element={<h2>Gestión de usuarios</h2>} />

          <RUTA path="admin/limpieza" element={<EliminarEstudios />} />
        </RUTA>

        {/* PROFESIONAL */}
        <RUTA
          path="/profesional"
          element={
            <RutaPrivada rol="PROFESIONAL">
              <Home_p />
            </RutaPrivada>
          }
        />

        {/* CLIENTE */}
        <RUTA
          path="/cliente"
          element={
            <RutaPrivada rol="CLIENTE">
              <Home_c />
            </RutaPrivada>
          }
        />

        <RUTA path="/sin-permiso" element={<h1>Acceso denegado</h1>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
