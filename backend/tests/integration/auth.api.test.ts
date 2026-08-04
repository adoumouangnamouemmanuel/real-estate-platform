/** -------------------- auth.api.test.ts
 * Integration tests for the authentication API endpoints.
 * Using Jest and Supertest to test authentication related requests and responses.
 * 
 */

import request from 'supertest';
import { describe, it, expect } from 'vitest';
import app from '../../src/app.js';


// Test the GET /api/v1/auth/login endpoint
describe('Authentication API Integration Tests', () => {
    it('should return 200 for GET /api/v1/auth/login', async () => {
        const response = await request(app).get('/api/v1/auth/login');
        expect(response.status).toBe(200);
        expect(response.text).toContain('login route');
    })
});

// Test the user registration endpoint
/*
describe('POST /api/v1/auth/register', () => {
    it('should register a new user and return 201', async () => {
        const newUser = {
            email: 'test@example.com',
            password: 'password123',
            confirmPassword: 'password123',
            role: 'USER'
        };

        const response = await request(app).post('/api/v1/auth/register').send(newUser);
        expect(response.status).toBe(201);
        expect(response.body.message).toBe('Registration successful');
    });
});
*/

// This time, register will fail because the user already exists
describe('POST /api/v1/auth/register', () => {
    it('should return 400 for duplicate user registration', async () => {
        const existingUser = {
            email: 'test@example.com',
            password: 'password123',
            confirmPassword: 'password123',
            role: 'USER'
        };

        const response = await request(app).post('/api/v1/auth/register').send(existingUser);
        expect(response.status).toBe(400);
        expect(response.body.message).toBe('User already exists');
    });
});

// Test the user login endpoint
describe('POST /api/v1/auth/login', () => {
    it('should login a user and return 200', async () => {
        const loginData = {
            email: 'test@example.com',
            password: 'password123'
        };

        const response = await request(app).post('/api/v1/auth/login').send(loginData);
        expect(response.status).toBe(200);
        expect(response.body.message).toBe('Login successful');
    });
});
