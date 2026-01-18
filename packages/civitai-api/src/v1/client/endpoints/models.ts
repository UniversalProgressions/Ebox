import type { Result } from 'neverthrow';
import type { CivitaiClient } from '../client';
import type { CivitaiError } from '../errors';
import type { ModelsResponse, ModelsRequestOptions } from '../../models/models';
import type { ModelById } from '../../models/model-id';

/**
 * Models endpoint interface
 */
export interface ModelsEndpoint {
  /**
   * Get models list
   */
  list(options?: ModelsRequestOptions): Promise<Result<ModelsResponse, CivitaiError>>;
  
  /**
   * Get single model details
   */
  getById(id: number): Promise<Result<ModelById, CivitaiError>>;
}

/**
 * Models endpoint implementation
 */
export class ModelsEndpointImpl implements ModelsEndpoint {
  constructor(private readonly client: CivitaiClient) {}

  async list(options?: ModelsRequestOptions): Promise<Result<ModelsResponse, CivitaiError>> {
    // Convert array-type parameters to query string format
    const searchParams = this.prepareSearchParams(options);
    
    return this.client.get<ModelsResponse>('models', {
      searchParams,
    });
  }

  async getById(id: number): Promise<Result<ModelById, CivitaiError>> {
    return this.client.get<ModelById>(`models/${id}`);
  }

  /**
   * Prepare search parameters, handle array-type fields
   */
  private prepareSearchParams(options?: ModelsRequestOptions): Record<string, string | number | boolean | undefined> {
    if (!options) return {};

    const result: Record<string, string | number | boolean | undefined> = {};

    for (const [key, value] of Object.entries(options)) {
      if (value === undefined) continue;

      if (Array.isArray(value)) {
        // Array-type parameters need to be converted to comma-separated strings
        result[key] = value.join(',');
      } else {
        result[key] = value;
      }
    }

    return result;
  }
}
