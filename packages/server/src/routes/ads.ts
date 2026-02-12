import { Router, Response, NextFunction } from 'express';
import type { Router as RouterType } from 'express';
import { z } from 'zod';
import { authenticate, AuthRequest } from '../middleware/auth';
import { searchApi } from '../services/searchApi';
import { prisma } from '../config/database';

const router: RouterType = Router();

const searchSchema = z.object({
  searchTerms: z.string().optional(),
  searchPageIds: z.array(z.string()).optional(),
  adReachedCountries: z.array(z.string()).default(['ALL']),
  adType: z.enum(['ALL', 'POLITICAL_AND_ISSUE_ADS', 'HOUSING_ADS', 'EMPLOYMENT_ADS', 'FINANCIAL_PRODUCTS_AND_SERVICES_ADS']).optional(),
  adActiveStatus: z.enum(['ACTIVE', 'INACTIVE', 'ALL']).optional(),
  adDeliveryDateMin: z.string().optional(),
  adDeliveryDateMax: z.string().optional(),
  publisherPlatforms: z.array(z.string()).optional(),
  languages: z.array(z.string()).optional(),
  mediaType: z.enum(['ALL', 'IMAGE', 'VIDEO', 'MEME', 'NONE']).optional(),
  limit: z.number().min(1).max(100).optional(),
});

// Search ads
router.post('/search', authenticate, async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const params = searchSchema.parse(req.body);

    await prisma.searchHistory.create({
      data: {
        userId: req.userId!,
        searchTerms: params.searchTerms,
        pageIds: params.searchPageIds || [],
        countries: params.adReachedCountries,
        filters: params,
      },
    });

    const result = await searchApi.searchAds(params);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// Get ads by page ID
router.get('/page/:pageId', authenticate, async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { pageId } = req.params;
    const countries = req.query.countries
      ? (req.query.countries as string).split(',')
      : ['ALL'];

    const ads = await searchApi.getAdsByPageId(pageId, countries);
    res.json({ ads });
  } catch (error) {
    next(error);
  }
});

// Get page info
router.get('/page-info/:pageId', authenticate, async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { pageId } = req.params;
    const pageInfo = await searchApi.getPageInfo(pageId);

    if (!pageInfo) {
      res.status(404).json({ error: 'Page not found' });
      return;
    }

    res.json(pageInfo);
  } catch (error) {
    next(error);
  }
});

// Get search history
router.get('/history', authenticate, async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const history = await prisma.searchHistory.findMany({
      where: { userId: req.userId },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    res.json({ history });
  } catch (error) {
    next(error);
  }
});

export const adsRouter: RouterType = router;
