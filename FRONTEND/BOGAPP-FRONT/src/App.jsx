import { BrowserRouter, Routes, Route as RUTA } from "react-router-dom";
import Home_p from "./pages/Home_p";
import Home_c from "./pages/Home_c";
import Home from "./pages/Home";
import Login from "./pages/Login";
import RutaPrivada from "./Components/RutaPrivada";

import "./App.css";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <RUTA path="/login" element={<Login />} />

        <RUTA
          path="/"
          element={
            <RutaPrivada rol="ADMIN_BOGAPP">
              <Home />
            </RutaPrivada>
          }
        />

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
          element={<h1>No tenés permiso para entrar a esta página</h1>}
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
