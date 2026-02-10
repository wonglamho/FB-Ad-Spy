import { Router, Request, Response, NextFunction } from 'express';
import type { Router as RouterType } from 'express';
import bcrypt from 'bcryptjs';
import jwt, { SignOptions, Secret } from 'jsonwebtoken';
import { z } from 'zod';
import { prisma } from '../config/database';
import { authenticate, AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';

const router: RouterType = Router();
const JWT_SECRET: Secret = process.env.JWT_SECRET || 'fallback-dev-secret-please-change';
function generateToken(userId: string): string {
  return jwt.sign(
    { userId },
    JWT_SECRET,
    { expiresIn: 60 * 60 * 24 * 7 } as SignOptions   // 7天，用秒数代替字符串
  );
}

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(2),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

// Register
router.post('/register', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email, password, name } = registerSchema.parse(req.body);

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      throw new AppError('Email already registered', 400);
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: { email, password: hashedPassword, name },
      select: { id: true, email: true, name: true, createdAt: true, updatedAt: true },
    });

    const token = generateToken(user.id);

    res.status(201).json({ user, token });
  } catch (error) {
    next(error);
  }
});

// Login
router.post('/login', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email, password } = loginSchema.parse(req.body);

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new AppError('Invalid credentials', 401);
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      throw new AppError('Invalid credentials', 401);
    }

    const token = generateToken(user.id);

    const { password: _, ...userWithoutPassword } = user;
    res.json({ user: userWithoutPassword, token });
  } catch (error) {
    next(error);
  }
});

// Get current user
router.get('/me', authenticate, async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { id: true, email: true, name: true, createdAt: true, updatedAt: true },
    });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    res.json({ user });
  } catch (error) {
    next(error);
  }
});

// Update profile
router.patch('/me', authenticate, async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const updateSchema = z.object({
      name: z.string().min(2).optional(),
      password: z.string().min(8).optional(),
    });

    const data = updateSchema.parse(req.body);
    
    const updateData: { name?: string; password?: string } = {};
    if (data.name) updateData.name = data.name;
    if (data.password) updateData.password = await bcrypt.hash(data.password, 12);

    const user = await prisma.user.update({
      where: { id: req.userId },
      data: updateData,
      select: { id: true, email: true, name: true, createdAt: true, updatedAt: true },
    });

    res.json({ user });
  } catch (error) {
    next(error);
  }
});

export const authRouter: RouterType = router;
