import Swal from "sweetalert2";

// Una sola configuración visual para las alertas de BOGAPP.
export function mostrarAlerta(mensaje, tipo = "success") {
  const titulos = {
    success: "¡Listo!",
    error: "Ocurrió un error",
    warning: "Atención",
    info: "Información",
  };

  return Swal.fire({
    title: titulos[tipo] || "Aviso",
    text: mensaje,
    icon: tipo,
    confirmButtonText: "Aceptar",
    buttonsStyling: false,
    customClass: {
      popup: "bogapp-alerta",
      confirmButton: "bogapp-alerta-boton",
    },
  });
}

// Devuelve un resultado con .isConfirmed (true únicamente si confirma).
// Opciones permiten personalizar el texto sin duplicar la configuración.
export function confirmarAccion(mensaje, opciones = {}) {
  const { titulo = "¿Estás seguro?", confirmar = "Confirmar", peligro = false } = opciones;

  return Swal.fire({
    title: titulo,
    text: mensaje,
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: confirmar,
    cancelButtonText: "Cancelar",
    reverseButtons: true,
    focusCancel: true,
    buttonsStyling: false,
    customClass: {
      popup: "bogapp-alerta",
      confirmButton: peligro ? "bogapp-alerta-boton bogapp-alerta-peligro" : "bogapp-alerta-boton",
      cancelButton: "bogapp-alerta-cancelar",
    },
  });
}
