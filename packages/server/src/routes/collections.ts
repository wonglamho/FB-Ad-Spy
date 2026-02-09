import { Router, Response, NextFunction } from 'express';
import type { Router as RouterType } from 'express';
import { z } from 'zod';
import { authenticate, AuthRequest } from '../middleware/auth';
import { prisma } from '../config/database';
import { AppError } from '../middleware/errorHandler';

const router: RouterType = Router();

const createCollectionSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
});

// Get all collections
router.get('/', authenticate, async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const collections = await prisma.collection.findMany({
      where: { userId: req.userId },
      include: {
        _count: {
          select: { savedAds: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    
    res.json({ collections });
  } catch (error) {
    next(error);
  }
});

// Create collection
router.post('/', authenticate, async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { name, description } = createCollectionSchema.parse(req.body);
    
    const collection = await prisma.collection.create({
      data: {
        userId: req.userId!,
        name,
        description,
      },
    });
    
    res.status(201).json({ collection });
  } catch (error) {
    next(error);
  }
});

// Get collection with ads
router.get('/:id', authenticate, async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const collection = await prisma.collection.findFirst({
      where: {
        id: req.params.id,
        userId: req.userId,
      },
      include: {
        savedAds: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });
    
    if (!collection) {
      throw new AppError('Collection not found', 404);
    }
    
    res.json({ collection });
  } catch (error) {
    next(error);
  }
});

// Update collection
router.patch('/:id', authenticate, async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = createCollectionSchema.partial().parse(req.body);
    
    const result = await prisma.collection.updateMany({
      where: {
        id: req.params.id,
        userId: req.userId,
      },
      data,
    });
    
    if (result.count === 0) {
      throw new AppError('Collection not found', 404);
    }
    
    const collection = await prisma.collection.findUnique({
      where: { id: req.params.id },
    });
    
    res.json({ collection });
  } catch (error) {
    next(error);
  }
});

// Delete collection
router.delete('/:id', authenticate, async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const result = await prisma.collection.deleteMany({
      where: {
        id: req.params.id,
        userId: req.userId,
      },
    });
    
    if (result.count === 0) {
      throw new AppError('Collection not found', 404);
    }
    
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

export const collectionsRouter: RouterType = router;
