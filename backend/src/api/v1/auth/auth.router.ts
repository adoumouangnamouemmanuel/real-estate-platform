import { Router } from 'express';
import { testController, loginController, registerController } from './auth.controller.js';

const authRouter = Router();

authRouter.get('/login', testController);
authRouter.post('/login', loginController);
authRouter.post('/register', registerController);

export default authRouter;