import { Router, Response, NextFunction } from 'express';
import type { Router as RouterType } from 'express';
import { z } from 'zod';
import { authenticate, AuthRequest } from '../middleware/auth';
import { prisma } from '../config/database';
import { searchApi } from '../services/searchApi';
import { AppError } from '../middleware/errorHandler';

const router: RouterType = Router();

const createMonitorSchema = z.object({
  pageId: z.string(),
  pageName: z.string().optional(),
});

// Get all monitors for user
router.get('/', authenticate, async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const monitors = await prisma.monitor.findMany({
      where: { userId: req.userId },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ monitors });
  } catch (error) {
    next(error);
  }
});

// Create monitor
router.post('/', authenticate, async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { pageId, pageName } = createMonitorSchema.parse(req.body);

    const existing = await prisma.monitor.findUnique({
      where: {
        userId_pageId: {
          userId: req.userId!,
          pageId,
        },
      },
    });

    if (existing) {
      throw new AppError('Already monitoring this page', 400);
    }

    let finalPageName = pageName;
    if (!finalPageName) {
      const pageInfo = await searchApi.getPageInfo(pageId);
      finalPageName = pageInfo?.name || `Page ${pageId}`;
    }

    const monitor = await prisma.monitor.create({
      data: {
        userId: req.userId!,
        pageId,
        pageName: finalPageName,
      },
    });

    res.status(201).json({ monitor });
  } catch (error) {
    next(error);
  }
});

// Get monitor details with recent ads
router.get('/:id', authenticate, async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const monitor = await prisma.monitor.findFirst({
      where: {
        id: req.params.id,
        userId: req.userId,
      },
    });

    if (!monitor) {
      throw new AppError('Monitor not found', 404);
    }

    const ads = await searchApi.getAdsByPageId(monitor.pageId);
    res.json({ monitor, ads });
  } catch (error) {
    next(error);
  }
});

// Update monitor
router.patch('/:id', authenticate, async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const updateSchema = z.object({
      isActive: z.boolean().optional(),
      pageName: z.string().optional(),
    });

    const data = updateSchema.parse(req.body);

    const result = await prisma.monitor.updateMany({
      where: {
        id: req.params.id,
        userId: req.userId,
      },
      data,
    });

    if (result.count === 0) {
      throw new AppError('Monitor not found', 404);
    }

    const updated = await prisma.monitor.findUnique({
      where: { id: req.params.id },
    });

    res.json({ monitor: updated });
  } catch (error) {
    next(error);
  }
});

// Delete monitor
router.delete('/:id', authenticate, async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const result = await prisma.monitor.deleteMany({
      where: {
        id: req.params.id,
        userId: req.userId,
      },
    });

    if (result.count === 0) {
      throw new AppError('Monitor not found', 404);
    }

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

export const monitorsRouter: RouterType = router;
