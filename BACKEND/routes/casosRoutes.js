const router = require('express').Router();
const c = require('../controllers/casosController');
const cliente = require('../controllers/clienteController');
const { autenticar, permitirRoles } = require('../middlewares/authMiddleware');
const { upload } = require('../helpers/archivos');
router.use(autenticar);
router.get('/', c.listar);
router.post('/', permitirRoles('PROFESIONAL'), c.crear);
router.get('/:id', c.buscar);
router.put('/:id', permitirRoles('PROFESIONAL', 'ADMIN_BOGAPP'), c.editar);
router.delete('/:id', permitirRoles('PROFESIONAL', 'ADMIN_BOGAPP'), c.eliminar);
router.get('/:id/abogados', c.abogados);
router.post('/:id/abogados', permitirRoles('PROFESIONAL'), c.agregarAbogado);
router.delete('/:id/abogados/:abogadoId', permitirRoles('PROFESIONAL'), c.quitarAbogado);
// Las consultas pertenecen a UN expediente, no son un chat público.
router.get('/:id/consultas', cliente.consultas);
router.post('/:id/consultas', permitirRoles('CLIENTE'), cliente.preguntar);
router.patch('/:id/consultas/:consultaId', permitirRoles('PROFESIONAL'), cliente.responderConsulta);

router.get('/:id/avances', c.avances);
router.post('/:id/avances', permitirRoles('PROFESIONAL'), c.crearAvance);
router.patch('/:id/avances/:avanceId/publicar', permitirRoles('PROFESIONAL'), c.publicarAvance);
router.delete('/:id/avances/:avanceId', permitirRoles('PROFESIONAL'), c.quitarAvance);
router.get('/:id/documentos', c.documentos);
router.post('/:id/documentos', permitirRoles('PROFESIONAL', 'CLIENTE'), upload.single('archivo'), c.subirDocumento);
router.get('/:id/documentos/:docId/descargar', c.descargarDocumento);
router.delete('/:id/documentos/:docId', permitirRoles('PROFESIONAL', 'CLIENTE'), c.quitarDocumento);
module.exports = router;
