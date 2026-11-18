import {
  BrowserRouter,
  Routes,
  Route as RUTA,
  NavLink,
  Outlet,
  Navigate,
} from "react-router-dom";
import AuthProvider from "./context/AuthProvider";
import RutaPrivada from "./Components/RutaPrivada";
import Salir from "./Components/Salir";
import Home from "./pages/Home";
import Home_p from "./pages/Home_p";
import Home_c from "./pages/Home_c";
import Login from "./pages/Login";
import Create_c from "./pages/Create_c";
import Create_p from "./pages/Create_p";
import Estudios_d from "./Components/Estudios_d";
import Check from "./Components/Check";
import UsuariosAdmin from "./Components/UsuariosAdmin";
import EliminarEstudios from "./Components/EliminarEstudios";
import useAuth from "./context/useAuth";
import "sweetalert2/dist/sweetalert2.min.css";
import "./App.css";
function LayoutAdmin() {
  const { usuario } = useAuth();
  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div className="sidebar-brand">
          <div className="sidebar-symbol">⚖</div>
          <div>
            <h2>BOGAPP</h2>
            <p>ADMINISTRACIÓN</p>
          </div>
        </div>
        <span className="sidebar-label">NAVEGACIÓN</span>
        <nav className="admin-nav">
          <NavLink to="/" end>
            ▦ &nbsp; Dashboard
          </NavLink>
          <NavLink to="/admin/estudios">▤ &nbsp; Estudios</NavLink>
          <NavLink to="/admin/solicitudes">◷ &nbsp; Solicitudes</NavLink>
          <NavLink to="/admin/usuarios">♙ &nbsp; Usuarios</NavLink>
          <NavLink to="/admin/limpieza">♻ &nbsp; Limpieza</NavLink>
        </nav>
        <div className="sidebar-bottom">
          <div className="sidebar-profile">
            <div className="avatar">
              {usuario?.Nombre?.[0]?.toUpperCase() || "A"}
            </div>
            <div>
              <b>
                {usuario?.Nombre} {usuario?.Apellido}
              </b>
              <small>Super Admin</small>
            </div>
          </div>
          <Salir />
        </div>
      </aside>
      <main className="admin-content">
        <Outlet />
      </main>
    </div>
  );
}
function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <RUTA path="/login" element={<Login />} />
          <RUTA path="/register" element={<Create_c />} />
          <RUTA path="/register/profesional" element={<Create_p />} />
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
            <RUTA path="admin/usuarios" element={<UsuariosAdmin />} />
            <RUTA path="admin/limpieza" element={<EliminarEstudios />} />
          </RUTA>
          <RUTA
            path="/profesional"
            element={
              <RutaPrivada rol="PROFESIONAL">
                <Home_p />
              </RutaPrivada>
            }
          />
          <RUTA
            path="/cliente"
            element={
              <RutaPrivada rol="CLIENTE">
                <Home_c />
              </RutaPrivada>
            }
          />
          <RUTA
            path="/sin-permiso"
            element={
              <div className="page-wrap">
                <h1>Acceso denegado</h1>
                <p>No tenés permisos para ver esta pantalla.</p>
                <NavigateHome />
              </div>
            }
          />
          <RUTA path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
function NavigateHome() {
  return <NavLink to="/login">Volver al login</NavLink>;
}
export default App;
