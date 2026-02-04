import { Router } from 'express';
import { z } from 'zod';
import { authenticate, AuthRequest } from '../middleware/auth';
import { facebookApi } from '../services/facebookApi';
import { prisma } from '../config/database';

export const adsRouter = Router();

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
adsRouter.post('/search', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const params = searchSchema.parse(req.body);
    
    // Save search history
    await prisma.searchHistory.create({
      data: {
        userId: req.userId!,
        searchTerms: params.searchTerms,
        pageIds: params.searchPageIds || [],
        countries: params.adReachedCountries,
        filters: params,
      },
    });

    const result = await facebookApi.searchAds(params);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// Get ads by page ID
adsRouter.get('/page/:pageId', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { pageId } = req.params;
    const countries = req.query.countries 
      ? (req.query.countries as string).split(',') 
      : ['ALL'];
    
    const ads = await facebookApi.getAdsByPageId(pageId, countries);
    res.json({ ads });
  } catch (error) {
    next(error);
  }
});

// Get page info
adsRouter.get('/page-info/:pageId', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { pageId } = req.params;
    const pageInfo = await facebookApi.getPageInfo(pageId);
    
    if (!pageInfo) {
      return res.status(404).json({ error: 'Page not found' });
    }
    
    res.json(pageInfo);
  } catch (error) {
    next(error);
  }
});

// Get search history
adsRouter.get('/history', authenticate, async (req: AuthRequest, res, next) => {
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
