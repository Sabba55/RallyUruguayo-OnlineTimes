import express from 'express';
import { loginAdmin, logoutAdmin, obtenerSesionAdmin } from '../../controladores/auth/authController.js';
import { requiereAuthAdmin } from '../../middlewares/requiereAuthAdmin.js';

const router = express.Router();

router.post('/login', loginAdmin);
router.post('/logout', requiereAuthAdmin, logoutAdmin);
router.get('/me', requiereAuthAdmin, obtenerSesionAdmin);

export default router;
