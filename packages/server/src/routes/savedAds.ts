import { Router, Response, NextFunction } from 'express';
import type { Router as RouterType } from 'express';
import { z } from 'zod';
import { authenticate, AuthRequest } from '../middleware/auth';
import { prisma } from '../config/database';
import { AppError } from '../middleware/errorHandler';

const router: RouterType = Router();

const saveAdSchema = z.object({
  adData: z.object({
    id: z.string(),
    adArchiveId: z.string(),
    pageId: z.string(),
    pageName: z.string(),
    adCreationTime: z.string(),
    adDeliveryStartTime: z.string(),
    adDeliveryStopTime: z.string().optional(),
    adCreativeBodies: z.array(z.string()),
    adCreativeLinkTitles: z.array(z.string()),
    adCreativeLinkDescriptions: z.array(z.string()),
    adCreativeLinkCaptions: z.array(z.string()),
    adSnapshotUrl: z.string(),
    publisherPlatforms: z.array(z.string()),
    languages: z.array(z.string()),
  }),
  collectionId: z.string().optional(),
  notes: z.string().max(1000).optional(),
  tags: z.array(z.string()).optional(),
});

// Get all saved ads
router.get('/', authenticate, async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { collectionId, tag } = req.query;
    
    const where: any = { userId: req.userId };
    if (collectionId) where.collectionId = collectionId;
    if (tag) where.tags = { has: tag as string };
    
    const savedAds = await prisma.savedAd.findMany({
      where,
      include: {
        collection: {
          select: { id: true, name: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    
    res.json({ savedAds });
  } catch (error) {
    next(error);
  }
});

// Save an ad
router.post('/', authenticate, async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { adData, collectionId, notes, tags } = saveAdSchema.parse(req.body);
    
    const existing = await prisma.savedAd.findUnique({
      where: {
        userId_adArchiveId: {
          userId: req.userId!,
          adArchiveId: adData.adArchiveId,
        },
      },
    });
    
    if (existing) {
      throw new AppError('Ad already saved', 400);
    }
    
    if (collectionId) {
      const collection = await prisma.collection.findFirst({
        where: { id: collectionId, userId: req.userId },
      });
      if (!collection) {
        throw new AppError('Collection not found', 404);
      }
    }
    
    const savedAd = await prisma.savedAd.create({
      data: {
        userId: req.userId!,
        adArchiveId: adData.adArchiveId,
        adData: adData as any,
        collectionId,
        notes,
        tags: tags || [],
      },
      include: {
        collection: {
          select: { id: true, name: true },
        },
      },
    });
    
    res.status(201).json({ savedAd });
  } catch (error) {
    next(error);
  }
});

// Update saved ad
router.patch('/:id', authenticate, async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const updateSchema = z.object({
      collectionId: z.string().nullable().optional(),
      notes: z.string().max(1000).optional(),
      tags: z.array(z.string()).optional(),
    });
    
    const data = updateSchema.parse(req.body);
    
    const result = await prisma.savedAd.updateMany({
      where: {
        id: req.params.id,
        userId: req.userId,
      },
      data,
    });
    
    if (result.count === 0) {
      throw new AppError('Saved ad not found', 404);
    }
    
    const savedAd = await prisma.savedAd.findUnique({
      where: { id: req.params.id },
      include: {
        collection: {
          select: { id: true, name: true },
        },
      },
    });
    
    res.json({ savedAd });
  } catch (error) {
    next(error);
  }
});

// Delete saved ad
router.delete('/:id', authenticate, async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const result = await prisma.savedAd.deleteMany({
      where: {
        id: req.params.id,
        userId: req.userId,
      },
    });
    
    if (result.count === 0) {
      throw new AppError('Saved ad not found', 404);
    }
    
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

// Check if ad is saved
router.get('/check/:adArchiveId', authenticate, async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const savedAd = await prisma.savedAd.findUnique({
      where: {
        userId_adArchiveId: {
          userId: req.userId!,
          adArchiveId: req.params.adArchiveId,
        },
      },
    });
    
    res.json({ isSaved: !!savedAd, savedAd });
  } catch (error) {
    next(error);
  }
});

// Get all tags
router.get('/tags', authenticate, async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const savedAds = await prisma.savedAd.findMany({
      where: { userId: req.userId },
      select: { tags: true },
    });
    
    const allTags = savedAds.flatMap((ad) => ad.tags);
    const uniqueTags = [...new Set(allTags)].sort();
    
    res.json({ tags: uniqueTags });
  } catch (error) {
    next(error);
  }
});

export const savedAdsRouter: RouterType = router;
