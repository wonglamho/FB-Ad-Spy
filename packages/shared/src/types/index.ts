// ============ User Types ============
export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserCreateInput {
  email: string;
  password: string;
  name: string;
}

export interface UserLoginInput {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

// ============ Facebook Ad Types ============
export interface FacebookAd {
  id: string;
  adArchiveId: string;
  pageId: string;
  pageName: string;
  adCreationTime: string;
  adDeliveryStartTime: string;
  adDeliveryStopTime?: string;
  adCreativeBodies: string[];
  adCreativeLinkTitles: string[];
  adCreativeLinkDescriptions: string[];
  adCreativeLinkCaptions: string[];
  adSnapshotUrl: string;
  publisherPlatforms: string[];
  languages: string[];
  currency?: string;
  spend?: { lowerBound: string; upperBound: string };
  impressions?: { lowerBound: string; upperBound: string };

  // Extended fields from SearchAPI (optional, backward compatible)
  isActive?: boolean;
  displayFormat?: string;
  ctaText?: string;
  ctaType?: string;
  linkUrl?: string;
  videoUrls?: string[];
  imageUrls?: string[];
  pageProfilePictureUrl?: string;
  totalActiveTime?: number;
}

export interface AdSearchParams {
  searchTerms?: string;
  searchPageIds?: string[];
  adReachedCountries: string[];
  adType?: 'ALL' | 'POLITICAL_AND_ISSUE_ADS' | 'HOUSING_ADS' | 'EMPLOYMENT_ADS' | 'FINANCIAL_PRODUCTS_AND_SERVICES_ADS';
  adActiveStatus?: 'ACTIVE' | 'INACTIVE' | 'ALL';
  adDeliveryDateMin?: string;
  adDeliveryDateMax?: string;
  publisherPlatforms?: string[];
  languages?: string[];
  mediaType?: 'ALL' | 'IMAGE' | 'VIDEO' | 'MEME' | 'NONE';
  limit?: number;
}

// ============ Monitor Types ============
export interface Monitor {
  id: string;
  userId: string;
  pageId: string;
  pageName: string;
  isActive: boolean;
  lastCheckedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface MonitorCreateInput {
  pageId: string;
  pageName: string;
}

// ============ Collection Types ============
export interface Collection {
  id: string;
  userId: string;
  name: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CollectionCreateInput {
  name: string;
  description?: string;
}

export interface SavedAd {
  id: string;
  userId: string;
  collectionId?: string;
  adData: FacebookAd;
  notes?: string;
  tags: string[];
  createdAt: Date;
}

export interface SaveAdInput {
  adData: FacebookAd;
  collectionId?: string;
  notes?: string;
  tags?: string[];
}

// ============ API Response Types ============
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
