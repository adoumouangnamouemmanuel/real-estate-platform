/** ---------------- auth.controller.ts
 * 
 * Controller for handling authentication-related HTTP requests.
 * 
 */

import { prompt } from '../../../app.js';
import { Request, Response } from 'express';
import { loginService } from './auth.service.js';
import { registerService } from './auth.service.js';

// Simplet get route for testing the login endpoint
export const testController = async(req: Request, res: Response) => {
    console.log(`${prompt} login route accessed`);
    res.send(`${prompt} login route`);
};

// Controller function for handling user login requests
export const loginController = async (req: Request, res: Response) => {
    try {
        const user = await loginService(req.body);
        res.status(200).json({ message: 'Login successful', user });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
}

// Controller function for handling user registration requests
export const registerController = async (req: Request, res: Response) => {
    try {
        const user = await registerService(req.body);
        res.status(201).json({ message: 'Registration successful', user });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
}