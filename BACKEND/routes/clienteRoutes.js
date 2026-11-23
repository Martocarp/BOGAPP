const router = require('express').Router();
const c = require('../controllers/clienteController');
const { autenticar, permitirRoles } = require('../middlewares/authMiddleware');

router.use(autenticar);

// Consultas de nuevos casos. El backend filtra según el usuario autenticado.
router.get('/solicitudes', permitirRoles('CLIENTE', 'PROFESIONAL'), c.listarSolicitudes);
router.post('/solicitudes', permitirRoles('CLIENTE'), c.crearSolicitud);
router.patch('/solicitudes/:id', permitirRoles('PROFESIONAL'), c.responderSolicitud);
router.get('/actividad', permitirRoles('CLIENTE'), c.actividad);

module.exports = router;
