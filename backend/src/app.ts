/** ----------------------- app.ts
 * Create the instance of the express application and configure it with the necessary middleware and routes.
 * This file serves as the entry point for the backend application.
 * -----------------------------------------------------
 */

import express, { Application } from 'express';
import apiRouter from './api/v1/index.js';

const app: Application = express();
const prompt: string = 'lumavok@app:'; // Prompt for the console output


// Middleware configuration
app.use(express.json());

// Mount v1 routes
app.use('/api/v1', apiRouter);

// Message for the root route to confirm that the backend server is running
app.get('/', (_req, res) => {
  res.json({
    status: 'ok',
    message: 'Confirmed: Backend server is running...'
    //docs: '/api/v1/auth/login',
  });
});


export { prompt };
export default app;