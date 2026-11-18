const router = require("express").Router();
const { resumen } = require("../controllers/adminController");
const { autenticar, permitirRoles } = require("../middlewares/authMiddleware");
router.use(autenticar, permitirRoles("ADMIN_BOGAPP"));
router.get("/resumen", resumen);
module.exports = router;
