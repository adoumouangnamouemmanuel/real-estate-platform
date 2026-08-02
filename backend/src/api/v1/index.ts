/** ------------------------ index.ts
 * 
 * Routing and configuration for the API v1 endpoints.
 * 
 * 
 */

import { Router } from 'express';
import authRouter from './auth/auth.router.js';
import developersRouter from './developers/developers.router.js';

// Create the main router for the API
const apiRouter = Router();

// Mount the router for all other routes
apiRouter.use('/auth', authRouter);
apiRouter.use('/developers', developersRouter);

export default apiRouter;