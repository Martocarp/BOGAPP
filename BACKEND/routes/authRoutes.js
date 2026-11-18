const router = require("express").Router();
const controller = require("../controllers/authController");
const { autenticar } = require("../middlewares/authMiddleware");
router.post("/login", controller.login);
router.get("/me", autenticar, controller.me);
router.post("/logout", controller.logout);
module.exports = router;
