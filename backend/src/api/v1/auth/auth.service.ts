/** ---------------------- auth.service.ts
 * 
 * Definitions and implementations of the authentication service functions.
 * 
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import { LoginSchema, RegisterSchema } from './auth.schema.js';

const prisma = new PrismaClient();


// Login function to authenticate a user based on email and password
export const loginService = async (input: LoginSchema) => {
    const user = await prisma.user.findUnique({
        where: { email: input.email },
    });

    if (!user) {
        throw new Error('User not found');
    }

    const isMatch = await bcrypt.compare(input.password, user.passwordHash);
    if (!isMatch) {
        throw new Error('Invalid credentials');
    }

    return user;
}


// register function to create a new user in the database
export const registerService = async (input: RegisterSchema) => {
    if (input.password !== input.confirmPassword) {
        throw new Error('Passwords do not match');
    }

    const existingUser = await prisma.user.findUnique({
        where: { email: input.email },
    });

    if (existingUser) {
        throw new Error('User already exists');
    }

    const passwordHash = await bcrypt.hash(input.password, 10);

    const newUser = await prisma.user.create({
        data: {
            email: input.email,
            passwordHash,
            role: input.role,
        },
    });

    return newUser;
}