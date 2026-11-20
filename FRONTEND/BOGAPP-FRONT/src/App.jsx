import {
  BrowserRouter,
  Routes,
  Route,
  NavLink,
  Outlet,
  Navigate,
} from "react-router-dom";
import AuthProvider from "./context/AuthProvider";
import RutaPrivada from "./Components/RutaPrivada";
import Salir from "./Components/Salir";
import CambiarClave from "./Components/CambiarClave";
import Home from "./pages/Home";
import Home_p from "./pages/Home_p";
import ProDashboard from "./pages/profesional/ProDashboard";
import ProEstudios from "./pages/profesional/ProEstudios";
import ProClientes from "./pages/profesional/ProClientes";
import ProCasos from "./pages/profesional/ProCasos";
import ProDetalleCaso from "./pages/profesional/ProDetalleCaso";
import ProPerfil from "./pages/profesional/ProPerfil";
import ProIntegrantes from "./pages/profesional/ProIntegrantes";
import ProConfiguracion from "./pages/profesional/ProConfiguracion";
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
          <NavLink to="/admin/seguridad">♙ &nbsp; Mi contraseña</NavLink>
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
// Cada tipo de cuenta tiene su ruta principal. RutaPrivada comprueba la sesión.
function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Create_c />} />
          <Route path="/register/profesional" element={<Create_p />} />
          <Route
            path="/"
            element={
              <RutaPrivada rol="ADMIN_BOGAPP">
                <LayoutAdmin />
              </RutaPrivada>
            }
          >
            <Route index element={<Home />} />
            <Route path="admin/estudios" element={<Estudios_d />} />
            <Route path="admin/solicitudes" element={<Check />} />
            <Route path="admin/usuarios" element={<UsuariosAdmin />} />
            <Route path="admin/limpieza" element={<EliminarEstudios />} />
            <Route path="admin/seguridad" element={<CambiarClave />} />
          </Route>
          <Route path="/profesional" element={<RutaPrivada rol="PROFESIONAL"><Home_p /></RutaPrivada>}>
            <Route index element={<ProDashboard />} />
            <Route path="estudios" element={<ProEstudios />} />
            <Route path="clientes" element={<ProClientes />} />
            <Route path="casos" element={<ProCasos />} />
            <Route path="casos/:id" element={<ProDetalleCaso />} />
            <Route path="integrantes" element={<ProIntegrantes />} />
            <Route path="configuracion" element={<ProConfiguracion />} />
            <Route path="perfil" element={<ProPerfil />} />
          </Route>
          <Route
            path="/cliente"
            element={
              <RutaPrivada rol="CLIENTE">
                <Home_c />
              </RutaPrivada>
            }
          />
          <Route
            path="/sin-permiso"
            element={
              <div className="page-wrap">
                <h1>Acceso denegado</h1>
                <p>No tenés permisos para ver esta pantalla.</p>
                <NavLink to="/login">Volver al login</NavLink>
              </div>
            }
          />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
export default App;
