import type { Result } from 'neverthrow';
import type { CivitaiClient } from '../client.js';
import type { CivitaiError } from '../errors.js';
import type { ModelVersion } from '../../models/model-version.js';

/**
 * ModelVersions endpoint interface
 */
export interface ModelVersionsEndpoint {
  /**
   * Get model version details
   */
  getById(id: number): Promise<Result<ModelVersion, CivitaiError>>;
  
  /**
   * Get model version by hash
   */
  getByHash(hash: string): Promise<Result<ModelVersion, CivitaiError>>;
}

/**
 * ModelVersions endpoint implementation
 */
export class ModelVersionsEndpointImpl implements ModelVersionsEndpoint {
  constructor(private readonly client: CivitaiClient) {}

  async getById(id: number): Promise<Result<ModelVersion, CivitaiError>> {
    return this.client.get<ModelVersion>(`model-versions/${id}`);
  }

  async getByHash(hash: string): Promise<Result<ModelVersion, CivitaiError>> {
    return this.client.get<ModelVersion>(`model-versions/by-hash/${hash}`);
  }
}
