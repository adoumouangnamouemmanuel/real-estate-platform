/** ---------------- auth.controller.ts
 * 
 * Controller for handling authentication-related HTTP requests.
 * 
 */

import { Request, Response } from 'express';
import { loginService } from './auth.service.js';

// Controller function for handling user login requests
export const loginController = async (req: Request, res: Response) => {
    try {
        const user = await loginService(req.body);
        res.status(200).json({ message: 'Login successful', user });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
}