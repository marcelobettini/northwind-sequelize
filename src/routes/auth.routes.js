// Router público de autenticación. Se monta antes del middleware que protege
// el resto de /api.
// Los limitadores van antes del controlador: la petición que supera el límite
// no llega a validar credenciales ni a tocar bcrypt.
import { Router } from 'express';
import { login, logout, register } from '../controllers/auth.controller.js';
import { loginLimiter, registerLimiter } from '../middlewares/rateLimit.js';

export const authRouter = Router();

authRouter.post('/register', registerLimiter, register);
authRouter.post('/login', loginLimiter, login);
authRouter.post('/logout', logout);
