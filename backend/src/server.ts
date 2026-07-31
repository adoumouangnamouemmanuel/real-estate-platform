/** ------------------------ server.ts
 * This file serves as the entry point for the backend application. 
 * It imports the express application instance from app.ts and starts the server on the specified port.
 * 
 * 
 * REMARKS: for debugging purposes, the server will start even if the database connection fails.
 * 
 * 
 * -----------------------------------------------------------
 */

import { PrismaClient } from '@prisma/client';
import app, { prompt } from './app.js';

const prisma = new PrismaClient();
const PORT = 3000;

console.log(`${prompt} Server file executing...`);

async function startServer() {
    try {
        if (process.env.DATABASE_URL) {
            await prisma.$connect();
            console.log(`${prompt} Connected to the database!`);
        } else {
            console.warn(`${prompt} DATABASE_URL is not set; continuing without database connection.`);
        }
    } catch (error) {
        console.error(`${prompt} Database connection failed, but continuing to serve HTTP traffic.`, error);
    }

    // Start the server anyway, even if the database connection fails
    app.listen(PORT, () => {
        console.log(`${prompt} Server is running on http://localhost:${PORT}`);
    });
}

startServer();