import { Router } from 'express';

const prompt = 'lumavov@app>$';
const authRouter = Router();

authRouter.get('/login', (_req, res) => {
    res.send(`${prompt} This is the Login route`);
});

export default authRouter;