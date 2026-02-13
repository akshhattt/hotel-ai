import { Router, Request, Response } from 'express';
import prisma from '../../lib/prisma';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import logger from '../../lib/logger';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';
const JWT_EXPIRY = process.env.JWT_EXPIRY || '24h';

/**
 * POST /auth/register
 * Register a new team member (admin only in production)
 */
router.post('/register', async (req: Request, res: Response) => {
    try {
        const schema = z.object({
            email: z.string().email(),
            password: z.string().min(8),
            firstName: z.string().min(1),
            lastName: z.string().min(1),
            role: z.enum(['ADMIN', 'MANAGER', 'ANALYST', 'VIEWER']).default('ANALYST'),
        });

        const data = schema.parse(req.body);
        const passwordHash = await bcrypt.hash(data.password, 12);

        const user = await prisma.user.create({
            data: {
                email: data.email,
                passwordHash,
                firstName: data.firstName,
                lastName: data.lastName,
                role: data.role,
            },
            select: { id: true, email: true, firstName: true, lastName: true, role: true },
        });

        res.status(201).json({ data: user });
    } catch (error: any) {
        if (error.code === 'P2002') {
            res.status(409).json({ error: 'Email already registered' });
            return;
        }
        if (error instanceof z.ZodError) {
            res.status(400).json({ error: 'Validation failed', details: error.errors });
            return;
        }
        logger.error('Error registering user', { error });
        res.status(500).json({ error: 'Registration failed' });
    }
});

/**
 * POST /auth/login
 * Authenticate and return JWT
 */
router.post('/login', async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user || !user.active) {
            res.status(401).json({ error: 'Invalid credentials' });
            return;
        }

        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) {
            res.status(401).json({ error: 'Invalid credentials' });
            return;
        }

        const token = jwt.sign(
            { userId: user.id, email: user.email, role: user.role },
            JWT_SECRET,
            { expiresIn: JWT_EXPIRY }
        );

        res.json({
            data: {
                token,
                user: {
                    id: user.id,
                    email: user.email,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    role: user.role,
                },
            },
        });
    } catch (error) {
        logger.error('Error logging in', { error });
        res.status(500).json({ error: 'Login failed' });
    }
});

export default router;
