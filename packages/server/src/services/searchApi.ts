import axios, { AxiosInstance } from 'axios';
import { redis } from '../config/redis';
import { logger } from '../utils/logger';
import type { AdSearchParams, FacebookAd } from '@fb-ad-spy/shared';

const SEARCHAPI_BASE = 'https://www.searchapi.io/api/v1/search';
const CACHE_TTL = 3600; // 1 hour

interface SearchApiAdSnapshot {
  page_id?: string;
  page_profile_uri?: string;
  page_name?: string;
  page_profile_picture_url?: string;
  body?: { text?: string };
  title?: string;
  caption?: string;
  cta_text?: string;
  cta_type?: string;
  link_url?: string;
  link_description?: string;
  display_format?: string;
  page_categories?: string[];
  page_like_count?: number;
  images?: Array<{ original_image_url?: string; resized_image_url?: string }>;
  videos?: Array<{
    video_hd_url?: string;
    video_sd_url?: string;
    video_preview_image_url?: string;
  }>;
}

interface SearchApiAd {
  ad_archive_id: string;
  page_id: string;
  page_name: string;
  snapshot: SearchApiAdSnapshot;
  is_active: boolean;
  categories?: string[];
  collation_count?: number;
  collation_id?: string;
  start_date?: string;
  end_date?: string;
  entity_type?: string;
  publisher_platform?: string[];
  total_active_time?: number;
  impressions_with_index?: { impressions_index: number };
}

interface SearchApiResponse {
  search_metadata: {
    id: string;
    status: string;
  };
  search_parameters: Record<string, any>;
  search_information: {
    ads_count?: number;
    ad_library_page_info?: {
      page_name?: string;
      page_id?: string;
      page_verification?: string;
      likes?: number;
      page_category?: string;
      ig_username?: string;
      ig_followers?: number;
      page_profile_uri?: string;
    };
    page?: Record<string, any>;
  };
  ads?: SearchApiAd[];
  pagination?: {
    next_page_token?: string;
  };
}

export class SearchApiService {
  private client: AxiosInstance;
  private apiKey: string;

  constructor() {
    this.apiKey = process.env.SEARCHAPI_API_KEY || '';
    this.client = axios.create({
      baseURL: SEARCHAPI_BASE,
      timeout: 30000,
    });
  }

  /**
   * Transform a SearchAPI ad object into the internal FacebookAd format.
   * Keeps backward compatibility with the existing frontend and database schema.
   */
  private transformAd(raw: SearchApiAd): FacebookAd {
    const snapshot = raw.snapshot || {};

    // Extract creative bodies
    const bodies: string[] = [];
    if (snapshot.body?.text) bodies.push(snapshot.body.text);

    // Extract link titles
    const linkTitles: string[] = [];
    if (snapshot.title) linkTitles.push(snapshot.title);

    // Extract link descriptions
    const linkDescriptions: string[] = [];
    if (snapshot.link_description) linkDescriptions.push(snapshot.link_description);

    // Extract link captions
    const linkCaptions: string[] = [];
    if (snapshot.caption) linkCaptions.push(snapshot.caption);

    // Build ad snapshot URL (link back to Facebook Ad Library)
    const adSnapshotUrl = `https://www.facebook.com/ads/library/?id=${raw.ad_archive_id}`;

    // Extract video URLs
    const videoUrls: string[] = [];
    if (snapshot.videos) {
      for (const v of snapshot.videos) {
        if (v.video_hd_url) videoUrls.push(v.video_hd_url);
        else if (v.video_sd_url) videoUrls.push(v.video_sd_url);
      }
    }

    // Extract image URLs
    const imageUrls: string[] = [];
    if (snapshot.images) {
      for (const img of snapshot.images) {
        if (img.original_image_url) imageUrls.push(img.original_image_url);
        else if (img.resized_image_url) imageUrls.push(img.resized_image_url);
      }
    }

    // Normalize publisher platforms to lowercase
    const platforms = (raw.publisher_platform || []).map((p) => p.toLowerCase());

    return {
      id: raw.ad_archive_id,
      adArchiveId: raw.ad_archive_id,
      pageId: raw.page_id,
      pageName: raw.page_name || snapshot.page_name || '',
      adCreationTime: raw.start_date || '',
      adDeliveryStartTime: raw.start_date || '',
      adDeliveryStopTime: raw.end_date || undefined,
      adCreativeBodies: bodies,
      adCreativeLinkTitles: linkTitles,
      adCreativeLinkDescriptions: linkDescriptions,
      adCreativeLinkCaptions: linkCaptions,
      adSnapshotUrl,
      publisherPlatforms: platforms,
      languages: [],
      currency: undefined,
      spend: undefined,
      impressions: undefined,
      // Extended fields from SearchAPI
      isActive: raw.is_active,
      displayFormat: snapshot.display_format,
      ctaText: snapshot.cta_text,
      ctaType: snapshot.cta_type,
      linkUrl: snapshot.link_url,
      videoUrls,
      imageUrls,
      pageProfilePictureUrl: snapshot.page_profile_picture_url,
      totalActiveTime: raw.total_active_time,
    };
  }

  /**
   * Build SearchAPI query parameters from the internal AdSearchParams.
   */
  private buildQueryParams(params: AdSearchParams): Record<string, any> {
    const query: Record<string, any> = {
      engine: 'meta_ad_library',
      api_key: this.apiKey,
    };

    // Keyword search
    if (params.searchTerms && params.searchTerms.trim()) {
      query.q = params.searchTerms;
    }

    // Page ID search
    if (params.searchPageIds?.length) {
      query.page_id = params.searchPageIds[0];
    }

    // Country
    if (params.adReachedCountries?.length) {
      query.country =
        params.adReachedCountries[0] === 'ALL'
          ? 'ALL'
          : params.adReachedCountries[0];
    }

    // Ad type
    if (params.adType) {
      query.ad_type = params.adType.toLowerCase();
    }

    // Active status
    if (params.adActiveStatus) {
      query.active_status = params.adActiveStatus.toLowerCase();
    }

    // Media type
    if (params.mediaType && params.mediaType !== 'ALL') {
      query.media_type = params.mediaType.toLowerCase();
    }

    return query;
  }

  /**
   * Search ads using SearchAPI's Meta Ad Library engine.
   * Public interface is identical to the old FacebookApiService.
   */
  async searchAds(
    params: AdSearchParams
  ): Promise<{ ads: FacebookAd[]; nextCursor?: string }> {
    // When neither searchTerms nor searchPageIds is provided, use a wildcard
    if (
      !params.searchTerms &&
      (!params.searchPageIds || params.searchPageIds.length === 0)
    ) {
      params.searchTerms = ' ';
    }

    const cacheKey = `ads:search:${JSON.stringify(params)}`;

    // Check cache first
    const cached = await redis.get(cacheKey);
    if (cached) {
      logger.debug('Cache hit for ads search');
      return JSON.parse(cached);
    }

    try {
      const queryParams = this.buildQueryParams(params);

      logger.info('SearchAPI request params:', {
        hasApiKey: !!this.apiKey,
        searchTerms: params.searchTerms,
        pageIds: params.searchPageIds,
        countries: params.adReachedCountries,
      });

      const response = await this.client.get<SearchApiResponse>('', {
        params: queryParams,
      });

      const rawAds = response.data.ads || [];
      const ads = rawAds.map((ad) => this.transformAd(ad));

      const result = {
        ads,
        nextCursor: response.data.pagination?.next_page_token,
      };

      // Cache the result
      if (ads.length > 0) {
        await redis.setex(cacheKey, CACHE_TTL, JSON.stringify(result));
      }

      return result;
    } catch (error: any) {
      const status = error.response?.status;
      const data = error.response?.data;

      logger.error('SearchAPI error:', {
        status,
        data,
        message: error.message,
      });

      if (status === 429) {
        throw new Error('Rate limit exceeded. Please try again later.');
      }
      if (status === 401 || status === 403) {
        throw new Error(
          'SearchAPI authentication failed. Please check your SEARCHAPI_API_KEY.'
        );
      }

      throw new Error('Failed to fetch ads from SearchAPI');
    }
  }

  /**
   * Get all ads for a specific Facebook Page ID.
   */
  async getAdsByPageId(
    pageId: string,
    countries: string[] = ['ALL']
  ): Promise<FacebookAd[]> {
    return this.searchAds({
      searchPageIds: [pageId],
      adReachedCountries: countries,
      adActiveStatus: 'ALL',
    }).then((result) => result.ads);
  }

  /**
   * Get page information using SearchAPI's ad_library_page_info.
   * Performs a lightweight search by page_id to extract page metadata.
   */
  async getPageInfo(
    pageId: string
  ): Promise<{
    id: string;
    name: string;
    likes?: number;
    category?: string;
    igUsername?: string;
    igFollowers?: number;
  } | null> {
    const cacheKey = `page:info:${pageId}`;

    const cached = await redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    try {
      const response = await this.client.get<SearchApiResponse>('', {
        params: {
          engine: 'meta_ad_library',
          api_key: this.apiKey,
          page_id: pageId,
          country: 'ALL',
          ad_type: 'all',
        },
      });

      const pageInfo = response.data.search_information?.ad_library_page_info;

      if (!pageInfo) {
        return null;
      }

      const result = {
        id: pageInfo.page_id || pageId,
        name: pageInfo.page_name || `Page ${pageId}`,
        likes: pageInfo.likes,
        category: pageInfo.page_category,
        igUsername: pageInfo.ig_username,
        igFollowers: pageInfo.ig_followers,
      };

      // Cache page info for 6 hours
      await redis.setex(cacheKey, 6 * 3600, JSON.stringify(result));

      return result;
    } catch (error) {
      logger.error('Failed to get page info from SearchAPI:', error);
      return null;
    }
  }
}

export const searchApi = new SearchApiService();
