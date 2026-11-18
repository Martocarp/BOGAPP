const router=require('express').Router();
const {autenticar}=require('../middlewares/authMiddleware');
const {especializaciones}=require('../controllers/profesionalController');
router.get('/',autenticar,especializaciones);
module.exports=router;
