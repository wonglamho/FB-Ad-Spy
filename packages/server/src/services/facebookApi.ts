import axios, { AxiosInstance } from 'axios';
import { redis } from '../config/redis';
import { logger } from '../utils/logger';
import type { AdSearchParams, FacebookAd } from '@fb-ad-spy/shared';

const FB_API_VERSION = 'v18.0';
const FB_API_BASE = `https://graph.facebook.com/${FB_API_VERSION}`;
const CACHE_TTL = 3600; // 1 hour

interface FacebookApiResponse {
  data: any[];
  paging?: {
    cursors?: {
      before: string;
      after: string;
    };
    next?: string;
  };
}

export class FacebookApiService {
  private client: AxiosInstance;
  private accessToken: string;

  constructor() {
    this.accessToken = process.env.FACEBOOK_ACCESS_TOKEN || '';
    this.client = axios.create({
      baseURL: FB_API_BASE,
      timeout: 30000,
    });
  }

  private transformAd(rawAd: any): FacebookAd {
    return {
      id: rawAd.id,
      adArchiveId: rawAd.id,
      pageId: rawAd.page_id,
      pageName: rawAd.page_name,
      adCreationTime: rawAd.ad_creation_time,
      adDeliveryStartTime: rawAd.ad_delivery_start_time,
      adDeliveryStopTime: rawAd.ad_delivery_stop_time,
      adCreativeBodies: rawAd.ad_creative_bodies || [],
      adCreativeLinkTitles: rawAd.ad_creative_link_titles || [],
      adCreativeLinkDescriptions: rawAd.ad_creative_link_descriptions || [],
      adCreativeLinkCaptions: rawAd.ad_creative_link_captions || [],
      adSnapshotUrl: rawAd.ad_snapshot_url,
      publisherPlatforms: rawAd.publisher_platforms || [],
      languages: rawAd.languages || [],
      currency: rawAd.currency,
      spend: rawAd.spend,
      impressions: rawAd.impressions,
    };
  }

  async searchAds(params: AdSearchParams): Promise<{ ads: FacebookAd[]; nextCursor?: string }> {
    const cacheKey = `ads:search:${JSON.stringify(params)}`;
    
    // Check cache first
    const cached = await redis.get(cacheKey);
    if (cached) {
      logger.debug('Cache hit for ads search');
      return JSON.parse(cached);
    }

    try {
      const queryParams: Record<string, any> = {
        access_token: this.accessToken,
        ad_reached_countries: JSON.stringify(params.adReachedCountries),
        ad_type: params.adType || 'ALL',
        ad_active_status: params.adActiveStatus || 'ALL',
        fields: [
          'id',
          'page_id',
          'page_name',
          'ad_creation_time',
          'ad_delivery_start_time',
          'ad_delivery_stop_time',
          'ad_creative_bodies',
          'ad_creative_link_titles',
          'ad_creative_link_descriptions',
          'ad_creative_link_captions',
          'ad_snapshot_url',
          'publisher_platforms',
          'languages',
          'currency',
          'spend',
          'impressions',
        ].join(','),
        limit: params.limit || 25,
      };

      if (params.searchTerms) {
        queryParams.search_terms = params.searchTerms;
      }

      if (params.searchPageIds?.length) {
        queryParams.search_page_ids = JSON.stringify(params.searchPageIds);
      }

      if (params.adDeliveryDateMin) {
        queryParams.ad_delivery_date_min = params.adDeliveryDateMin;
      }

      if (params.adDeliveryDateMax) {
        queryParams.ad_delivery_date_max = params.adDeliveryDateMax;
      }

      if (params.publisherPlatforms?.length) {
        queryParams.publisher_platforms = JSON.stringify(params.publisherPlatforms);
      }

      if (params.languages?.length) {
        queryParams.languages = JSON.stringify(params.languages);
      }

      if (params.mediaType && params.mediaType !== 'ALL') {
        queryParams.media_type = params.mediaType;
      }

      const response = await this.client.get<FacebookApiResponse>('/ads_archive', {
        params: queryParams,
      });

      const ads = response.data.data.map((ad) => this.transformAd(ad));
      const result = {
        ads,
        nextCursor: response.data.paging?.cursors?.after,
      };

      // Cache the result
      await redis.setex(cacheKey, CACHE_TTL, JSON.stringify(result));

      return result;
    } catch (error: any) {
      logger.error('Facebook API error:', error.response?.data || error.message);
      
      if (error.response?.status === 613) {
        throw new Error('Rate limit exceeded. Please try again later.');
      }
      
      throw new Error('Failed to fetch ads from Facebook');
    }
  }

  async getAdsByPageId(pageId: string, countries: string[] = ['ALL']): Promise<FacebookAd[]> {
    return this.searchAds({
      searchPageIds: [pageId],
      adReachedCountries: countries,
      adActiveStatus: 'ALL',
    }).then((result) => result.ads);
  }

  async getPageInfo(pageId: string): Promise<{ id: string; name: string } | null> {
    try {
      const response = await this.client.get(`/${pageId}`, {
        params: {
          access_token: this.accessToken,
          fields: 'id,name',
        },
      });
      return response.data;
    } catch (error) {
      logger.error('Failed to get page info:', error);
      return null;
    }
  }
}

export const facebookApi = new FacebookApiService();
