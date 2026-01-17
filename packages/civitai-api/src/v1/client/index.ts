import type { ClientConfig } from './config.js';
import { CivitaiClient } from './client.js';
import type { CreatorsEndpoint } from './endpoints/creators.js';
import { CreatorsEndpointImpl } from './endpoints/creators.js';
import type { ModelsEndpoint } from './endpoints/models.js';
import { ModelsEndpointImpl } from './endpoints/models.js';
import type { ModelVersionsEndpoint } from './endpoints/model-versions.js';
import { ModelVersionsEndpointImpl } from './endpoints/model-versions.js';
import type { TagsEndpoint } from './endpoints/tags.js';
import { TagsEndpointImpl } from './endpoints/tags.js';

/**
 * Civitai API Client main interface
 * Provides all available API endpoints
 */
export interface CivitaiApiClient {
  /**
   * Core HTTP client
   */
  readonly client: CivitaiClient;
  
  /**
   * Creators related API
   */
  readonly creators: CreatorsEndpoint;
  
  /**
   * Models related API
   */
  readonly models: ModelsEndpoint;
  
  /**
   * Model versions related API
   */
  readonly modelVersions: ModelVersionsEndpoint;
  
  /**
   * Tags related API
   */
  readonly tags: TagsEndpoint;
  
  /**
   * Get current configuration
   */
  getConfig(): ClientConfig;
  
  /**
   * Update configuration
   */
  updateConfig(config: Partial<ClientConfig>): void;
}

/**
 * Civitai API Client implementation
 */
export class CivitaiApiClientImpl implements CivitaiApiClient {
  readonly client: CivitaiClient;
  readonly creators: CreatorsEndpoint;
  readonly models: ModelsEndpoint;
  readonly modelVersions: ModelVersionsEndpoint;
  readonly tags: TagsEndpoint;

  constructor(config: ClientConfig = {}) {
    this.client = new CivitaiClient(config);
    this.creators = new CreatorsEndpointImpl(this.client);
    this.models = new ModelsEndpointImpl(this.client);
    this.modelVersions = new ModelVersionsEndpointImpl(this.client);
    this.tags = new TagsEndpointImpl(this.client);
  }

  getConfig(): ClientConfig {
    return this.client.getConfig();
  }

  updateConfig(config: Partial<ClientConfig>): void {
    this.client.updateConfig(config);
  }
}

/**
 * Create Civitai API Client
 */
export function createCivitaiClient(config: ClientConfig = {}): CivitaiApiClient {
  return new CivitaiApiClientImpl(config);
}

/**
 * Default export
 */
export default createCivitaiClient;

// Export all types
export type { ClientConfig } from './config.js';
export type {
  CivitaiError,
  NetworkError,
  ValidationError,
  BadRequestError,
} from './errors.js';

export type {
  CreatorsRequestOptions,
  CreatorsResponse,
} from '../models/creators.js';

export type {
  ModelsRequestOptions,
  ModelsResponse,
  Model,
  ModelVersion as ModelVersionInList,
} from '../models/models.js';

export type {
  ModelById,
} from '../models/model-id.js';

export type {
  ModelVersion,
} from '../models/model-version.js';
