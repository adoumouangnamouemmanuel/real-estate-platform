import { Router } from 'express';
import { prompt } from '../../../app.js';

const authRouter = Router();

authRouter.get('/login', (_req, res) => {
    console.log(`${prompt} login route accessed`);
    res.send(`${prompt} login route`);
});

export default authRouter;