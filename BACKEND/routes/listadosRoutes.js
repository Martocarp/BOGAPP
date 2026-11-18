const router = require("express").Router();
const ctrl = require("../controllers/usuariosController");
const { autenticar, permitirRoles } = require("../middlewares/authMiddleware");
router.get("/clientes", autenticar, permitirRoles("ADMIN_BOGAPP"), ctrl.clientes);
router.get("/profesionales", autenticar, permitirRoles("ADMIN_BOGAPP"), ctrl.profesionales);
module.exports = router;
