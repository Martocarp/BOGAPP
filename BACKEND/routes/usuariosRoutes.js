const router = require("express").Router();
const ctrl = require("../controllers/usuariosController");
const { registrar } = require("../controllers/authController");
const { autenticar, permitirRoles } = require("../middlewares/authMiddleware");
// Registro público: permite CLIENTE o PROFESIONAL, nunca ADMIN_BOGAPP.
router.post("/", registrar);
router.get("/", autenticar, permitirRoles("ADMIN_BOGAPP"), ctrl.listar);
router.get("/:id", autenticar, permitirRoles("ADMIN_BOGAPP"), ctrl.buscar);
router.put("/:id", autenticar, permitirRoles("ADMIN_BOGAPP"), ctrl.editar);
router.delete("/:id", autenticar, permitirRoles("ADMIN_BOGAPP"), ctrl.eliminar);
module.exports = router;
