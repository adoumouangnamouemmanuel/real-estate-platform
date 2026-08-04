/** -------------------- auth.api.test.ts
 * Integration tests for the authentication API endpoints.
 * Using Jest and Supertest to test authentication related requests and responses.
 * 
 */

import request from 'supertest';
import { describe, it, expect } from 'vitest';
import app from '../../src/app.js';


describe('Authentication API Integration Tests', () => {
    it('should return 200 for GET /api/v1/auth/login', async () => {
        const response = await request(app).get('/api/v1/auth/login');
        expect(response.status).toBe(200);
        expect(response.text).toContain('login route');
    })
});