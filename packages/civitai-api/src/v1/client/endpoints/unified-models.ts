import type { Result } from 'neverthrow';
import { err, ok } from 'neverthrow';
import type { CivitaiClient } from '../client';
import type { CivitaiError } from '../errors';
import type { ModelAny, ModelCore } from '../../models/model-version-abstract';
import { toModelCore } from '../../models/model-version-abstract';
import type { ModelById } from '../../models/model-id';
import type { Model } from '../../models/models';
import type { ModelsResponse } from '../../models/models';

/**
 * Unified Models endpoint interface
 * Provides methods that return unified Model types
 */
export interface UnifiedModelsEndpoint {
  /**
   * Get unified Model by ID
   * Automatically chooses the best endpoint to fetch from
   */
  getUnifiedById(id: number): Promise<Result<ModelAny, CivitaiError>>;

  /**
   * Get Model core fields by ID
   * Returns only the fields common to all endpoints
   */
  getCoreById(id: number): Promise<Result<ModelCore, CivitaiError>>;

  /**
   * Get unified Model from list endpoint
   * Fetches from models endpoint and converts to unified type
   */
  getUnifiedFromList(options?: ModelsRequestOptions): Promise<Result<ModelAny[], CivitaiError>>;

  /**
   * Get multiple unified Models
   * Efficiently fetches multiple models in parallel
   */
  getUnifiedBatch(ids: number[]): Promise<Result<ModelAny[], CivitaiError>>;

  /**
   * Search for unified Models
   * Combines search functionality with unified types
   */
  searchUnified(options: ModelsRequestOptions): Promise<Result<ModelAny[], CivitaiError>>;

  /**
   * Get unified Model with specific version
   * Returns model with only the specified version
   */
  getUnifiedWithVersion(modelId: number, versionId: number): Promise<Result<ModelAny, CivitaiError>>;
}

// Re-export ModelsRequestOptions type
import type { ModelsRequestOptions } from '../../models/models';

/**
 * Unified Models endpoint implementation
 */
export class UnifiedModelsEndpointImpl implements UnifiedModelsEndpoint {
  constructor(private readonly client: CivitaiClient) {}

  async getUnifiedById(id: number): Promise<Result<ModelAny, CivitaiError>> {
    // Use model-id endpoint for single model by ID
    // This endpoint provides the most complete data for a specific model
    const result = await this.client.get<ModelById>(`models/${id}`);
    
    if (result.isOk()) {
      // ModelById is already a ModelAny
      return ok(result.value as ModelAny);
    }
    
    return err(result.error);
  }

  async getCoreById(id: number): Promise<Result<ModelCore, CivitaiError>> {
    const result = await this.getUnifiedById(id);
    
    if (result.isOk()) {
      const unifiedModel = result.value;
      const core = toModelCore(unifiedModel);
      return ok(core);
    }
    
    return err(result.error);
  }

  async getUnifiedFromList(options?: ModelsRequestOptions): Promise<Result<ModelAny[], CivitaiError>> {
    // Get models list
    const result = await this.client.get<ModelsResponse>('models', {
      searchParams: options as any,
    });
    
    if (result.isErr()) {
      return err(result.error);
    }

    const response = result.value;
    
    // Model array from models endpoint is already ModelAny array
    return ok(response.items as ModelAny[]);
  }

  async getUnifiedBatch(ids: number[]): Promise<Result<ModelAny[], CivitaiError>> {
    // Fetch all models in parallel
    const promises = ids.map(id => this.getUnifiedById(id));
    const results = await Promise.all(promises);
    
    // Check for any errors and collect successful results
    const models: ModelAny[] = [];
    for (const result of results) {
      if (result.isErr()) {
        return err(result.error);
      }
      models.push(result.value);
    }
    
    return ok(models);
  }

  async searchUnified(options: ModelsRequestOptions): Promise<Result<ModelAny[], CivitaiError>> {
    // Search is essentially the same as getUnifiedFromList but with search parameters
    return this.getUnifiedFromList(options);
  }

  async getUnifiedWithVersion(modelId: number, versionId: number): Promise<Result<ModelAny, CivitaiError>> {
    // Get model details first
    const modelResult = await this.getUnifiedById(modelId);
    
    if (modelResult.isErr()) {
      return err(modelResult.error);
    }

    const model = modelResult.value;
    
    // Find specific version
    const version = model.modelVersions.find(v => v.id === versionId);
    if (!version) {
      return err({
        type: 'NOT_FOUND',
        message: `Version ${versionId} not found in model ${modelId}`,
        status: 404,
      });
    }
    
    // Create a new model object with only the requested version
    const modelWithSingleVersion = {
      ...model,
      modelVersions: [version],
    };
    
    return ok(modelWithSingleVersion as ModelAny);
  }
}
