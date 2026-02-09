import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { authenticate, AuthRequest } from '../middleware/auth';
import { prisma } from '../config/database';
import { facebookApi } from '../services/facebookApi';
import { AppError } from '../middleware/errorHandler';

const router = Router();

const createMonitorSchema = z.object({
  pageId: z.string(),
  pageName: z.string().optional(),
});

// Get all monitors for user
router.get('/', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
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
router.post('/', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { pageId, pageName } = createMonitorSchema.parse(req.body);
    
    // Check if already monitoring
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
    
    // Get page name from Facebook if not provided
    let finalPageName = pageName;
    if (!finalPageName) {
      const pageInfo = await facebookApi.getPageInfo(pageId);
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
router.get('/:id', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
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
    
    // Fetch recent ads for this page
    const ads = await facebookApi.getAdsByPageId(monitor.pageId);
    
    res.json({ monitor, ads });
  } catch (error) {
    next(error);
  }
});

// Update monitor
router.patch('/:id', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
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
router.delete('/:id', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
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

export const monitorsRouter = router;
