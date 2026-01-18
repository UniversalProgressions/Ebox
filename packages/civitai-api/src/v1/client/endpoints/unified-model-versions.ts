import type { Result } from 'neverthrow';
import { err, ok } from 'neverthrow';
import type { CivitaiClient } from '../client';
import type { CivitaiError } from '../errors';
import type { ModelVersionAny, ModelVersionCore } from '../../models/model-version-abstract';
import { toModelVersionCore } from '../../models/model-version-abstract';
import type { ModelVersion } from '../../models/model-version';
import type { ModelById } from '../../models/model-id';
import type { Model } from '../../models/models';

/**
 * Unified ModelVersions endpoint interface
 * Provides methods that return unified ModelVersion types
 */
export interface UnifiedModelVersionsEndpoint {
  /**
   * Get unified ModelVersion by ID
   * Automatically chooses the best endpoint to fetch from
   */
  getById(id: number): Promise<Result<ModelVersionAny, CivitaiError>>;

  /**
   * Get ModelVersion core fields by ID
   * Returns only the fields common to all endpoints
   */
  getCoreById(id: number): Promise<Result<ModelVersionCore, CivitaiError>>;

  /**
   * Get unified ModelVersion from a model
   * Fetches from model-id endpoint and converts to unified type
   */
  getFromModel(modelId: number, versionId?: number): Promise<Result<ModelVersionAny, CivitaiError>>;

  /**
   * Get multiple unified ModelVersions
   * Efficiently fetches multiple versions in parallel
   */
  getBatch(ids: number[]): Promise<Result<ModelVersionAny[], CivitaiError>>;

  /**
   * Get all ModelVersions from a model as unified types
   */
  getAllFromModel(modelId: number): Promise<Result<ModelVersionAny[], CivitaiError>>;

  /**
   * Get ModelVersion by hash as unified type
   */
  getByHash(hash: string): Promise<Result<ModelVersionAny, CivitaiError>>;
}

/**
 * Unified ModelVersions endpoint implementation
 */
export class UnifiedModelVersionsEndpointImpl implements UnifiedModelVersionsEndpoint {
  constructor(private readonly client: CivitaiClient) {}

  async getById(id: number): Promise<Result<ModelVersionAny, CivitaiError>> {
    // Always use model-versions endpoint for single version by ID
    // This endpoint provides the most complete data
    const result = await this.client.get<ModelVersion>(`model-versions/${id}`);
    
    if (result.isOk()) {
      // ModelVersion from model-versions endpoint is already a ModelVersionAny
      return ok(result.value as ModelVersionAny);
    }
    
    return err(result.error);
  }

  async getCoreById(id: number): Promise<Result<ModelVersionCore, CivitaiError>> {
    const result = await this.getById(id);
    
    if (result.isOk()) {
      const unifiedVersion = result.value;
      const core = toModelVersionCore(unifiedVersion);
      return ok(core);
    }
    
    return err(result.error);
  }

  async getFromModel(modelId: number, versionId?: number): Promise<Result<ModelVersionAny, CivitaiError>> {
    // Get model details first
    const modelResult = await this.client.get<ModelById>(`models/${modelId}`);
    
    if (modelResult.isErr()) {
      return err(modelResult.error);
    }

    const model = modelResult.value;
    
    if (versionId !== undefined) {
      // Find specific version
      const version = model.modelVersions.find(v => v.id === versionId);
      if (!version) {
        return err({
          type: 'NOT_FOUND',
          message: `Version ${versionId} not found in model ${modelId}`,
          status: 404,
        });
      }
      
      // ModelByIdVersion is already a ModelVersionAny
      return ok(version as ModelVersionAny);
    }
    
    // Return first version if no specific version requested
    if (model.modelVersions.length === 0) {
      return err({
        type: 'NOT_FOUND',
        message: `No versions found for model ${modelId}`,
        status: 404,
      });
    }
    
    // ModelByIdVersion is already a ModelVersionAny
    return ok(model.modelVersions[0] as ModelVersionAny);
  }

  async getBatch(ids: number[]): Promise<Result<ModelVersionAny[], CivitaiError>> {
    // Fetch all versions in parallel
    const promises = ids.map(id => this.getById(id));
    const results = await Promise.all(promises);
    
    // Check for any errors and collect successful results
    const versions: ModelVersionAny[] = [];
    for (const result of results) {
      if (result.isErr()) {
        return err(result.error);
      }
      versions.push(result.value);
    }
    
    return ok(versions);
  }

  async getAllFromModel(modelId: number): Promise<Result<ModelVersionAny[], CivitaiError>> {
    const modelResult = await this.client.get<ModelById>(`models/${modelId}`);
    
    if (modelResult.isErr()) {
      return err(modelResult.error);
    }

    const model = modelResult.value;
    
    // ModelByIdVersion array is already ModelVersionAny array
    return ok(model.modelVersions as ModelVersionAny[]);
  }

  async getByHash(hash: string): Promise<Result<ModelVersionAny, CivitaiError>> {
    const result = await this.client.get<ModelVersion>(`model-versions/by-hash/${hash}`);
    
    if (result.isOk()) {
      // ModelVersion from model-versions endpoint is already a ModelVersionAny
      return ok(result.value as ModelVersionAny);
    }
    
    return err(result.error);
  }
}
