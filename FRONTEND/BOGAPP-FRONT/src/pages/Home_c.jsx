import Salir from "../Components/Salir";
import useAuth from "../context/useAuth";
function Home_c() {
  const { usuario } = useAuth();
  return (
    <div className="page-wrap">
      <header className="page-topbar"><span className="brand-small">BOGAPP <small>Portal cliente</small></span><Salir /></header>
      <section className="page-heading"><h1>Hola, {usuario.Nombre}</h1><p>Bienvenido a tu espacio de seguimiento jurídico.</p></section>
      <section className="panel-card"><h2>Mis casos jurídicos</h2><p>La consulta de casos y avances se incorporará en el próximo módulo.</p></section>
      <section className="panel-card"><h2>Mis estudios</h2><p>La vinculación de clientes con estudios se implementará en la siguiente etapa.</p></section>
    </div>
  );
}
export default Home_c;
