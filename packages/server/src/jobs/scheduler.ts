import cron from 'node-cron';
import { prisma } from '../config/database';
import { searchApi } from '../services/searchApi';
import { logger } from '../utils/logger';

export function startScheduler() {
  // Check monitors every hour
  cron.schedule('0 * * * *', async () => {
    logger.info('Running monitor check job');
    await checkMonitors();
  });

  // Clean up expired cache every day at 3 AM
  cron.schedule('0 3 * * *', async () => {
    logger.info('Running cache cleanup job');
    await cleanupCache();
  });

  logger.info('Scheduler started');
}

async function checkMonitors() {
  try {
    const activeMonitors = await prisma.monitor.findMany({
      where: { isActive: true },
    });

    for (const monitor of activeMonitors) {
      try {
        // Fetch latest ads for this page
        const ads = await searchApi.getAdsByPageId(monitor.pageId);

        // Update last checked time
        await prisma.monitor.update({
          where: { id: monitor.id },
          data: { lastCheckedAt: new Date() },
        });

        // Cache the ads
        for (const ad of ads) {
          await prisma.cachedAd.upsert({
            where: { adArchiveId: ad.adArchiveId },
            create: {
              adArchiveId: ad.adArchiveId,
              pageId: ad.pageId,
              adData: ad as any,
              expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
            },
            update: {
              adData: ad as any,
              fetchedAt: new Date(),
              expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
            },
          });
        }

        logger.debug(`Checked monitor ${monitor.id}: found ${ads.length} ads`);
      } catch (error) {
        logger.error(`Failed to check monitor ${monitor.id}:`, error);
      }
    }
  } catch (error) {
    logger.error('Monitor check job failed:', error);
  }
}

async function cleanupCache() {
  try {
    const result = await prisma.cachedAd.deleteMany({
      where: {
        expiresAt: { lt: new Date() },
      },
    });

    logger.info(`Cleaned up ${result.count} expired cached ads`);
  } catch (error) {
    logger.error('Cache cleanup job failed:', error);
  }
}
