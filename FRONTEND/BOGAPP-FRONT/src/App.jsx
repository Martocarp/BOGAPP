import { BrowserRouter, Routes, Route as RUTA } from "react-router-dom";
import Home from "./pages/Home";
import RutaPrivada from "./Components/RutaPrivada";
import "./App.css";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <RUTA
          path="/"
          element={
            <RutaPrivada>
              <Home />
            </RutaPrivada>
          }
        />

        <RUTA path="/login" element={<h1>LOGIN BOGAPP</h1>} />

        <RUTA path="/sin-permiso" element={<h1>ACCESO DENEGADO</h1>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
