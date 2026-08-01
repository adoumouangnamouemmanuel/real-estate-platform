import { Router } from 'express';
import { prompt } from '../../../app.js';
import { loginController } from './auth.controller.js';
import { LoginSchema } from './auth.schema.js';

const authRouter = Router();

authRouter.get('/login', (_req, res) => {
    console.log(`${prompt} login route accessed`);
    res.send(`${prompt} login route`);
});

authRouter.post('/login', loginController);

export default authRouter;