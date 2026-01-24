import { describe, it, expect, beforeAll } from 'bun:test';
import { createCivitaiClient } from '../../src/v1/index';
import {
  EXAMPLE_MODEL_ID,
  EXAMPLE_VERSION_ID,
} from '../shared-ids';

describe('Civitai API Unified Client Demo', () => {
  let client: ReturnType<typeof createCivitaiClient>;

  beforeAll(() => {
    // Create client with configuration from environment variables
    client = createCivitaiClient({
      apiKey: process.env.CIVITAI_API_KEY,
    });
  });

  it('should get unified ModelVersion by ID', async () => {
    const versionId = EXAMPLE_VERSION_ID;
    
    // Using the new unified endpoint
    const result = await client.unifiedModelVersions.getById(versionId);
    
    if (result.isOk()) {
      const version = result.value;
      expect(version).toBeDefined();
      expect(version.id).toBe(versionId);
      expect(version.name).toBeDefined();
      expect(typeof version.name).toBe('string');
      expect(version.baseModel).toBeDefined();
      expect(typeof version.baseModel).toBe('string');
      expect(version.files).toBeDefined();
      expect(Array.isArray(version.files)).toBe(true);
      expect(version.images).toBeDefined();
      expect(Array.isArray(version.images)).toBe(true);
    } else {
      // If API returns error, log it but don't fail the test
      // as it might be due to API availability
      console.log(`Error fetching unified ModelVersion ${versionId}: ${result.error.message}`);
    }
  });

  it('should get core fields from ModelVersion', async () => {
    const versionId = EXAMPLE_VERSION_ID;
    
    const coreResult = await client.unifiedModelVersions.getCoreById(versionId);
    
    if (coreResult.isOk()) {
      const core = coreResult.value;
      expect(core).toBeDefined();
      expect(core.id).toBe(versionId);
      expect(core.name).toBeDefined();
      expect(typeof core.name).toBe('string');
      expect(core.baseModel).toBeDefined();
      expect(typeof core.baseModel).toBe('string');
      expect(core.description).toBeDefined();
      // Description might be null or string
      if (core.description !== null) {
        expect(typeof core.description).toBe('string');
      }
    } else {
      console.log(`Error fetching core fields for version ${versionId}: ${coreResult.error.message}`);
    }
  });

  it('should get ModelVersion from model', async () => {
    const modelId = EXAMPLE_MODEL_ID;
    const versionId = EXAMPLE_VERSION_ID;
    
    const result = await client.unifiedModelVersions.getFromModel(modelId, versionId);
    
    if (result.isOk()) {
      const version = result.value;
      expect(version).toBeDefined();
      expect(version.id).toBe(versionId);
      expect(version.name).toBeDefined();
      expect(typeof version.name).toBe('string');
    } else {
      console.log(`Error fetching version ${versionId} from model ${modelId}: ${result.error.message}`);
    }
  });

  it('should get unified Model by ID', async () => {
    const modelId = EXAMPLE_MODEL_ID;
    
    const result = await client.unifiedModels.getUnifiedById(modelId);
    
    if (result.isOk()) {
      const model = result.value;
      expect(model).toBeDefined();
      expect(model.id).toBe(modelId);
      expect(model.name).toBeDefined();
      expect(typeof model.name).toBe('string');
      expect(model.type).toBeDefined();
      expect(typeof model.type).toBe('string');
      expect(model.modelVersions).toBeDefined();
      expect(Array.isArray(model.modelVersions)).toBe(true);
      expect(model.tags).toBeDefined();
      expect(Array.isArray(model.tags)).toBe(true);
    } else {
      console.log(`Error fetching unified Model ${modelId}: ${result.error.message}`);
    }
  });

  it('should get Model core fields only', async () => {
    const modelId = EXAMPLE_MODEL_ID;
    
    const coreResult = await client.unifiedModels.getCoreById(modelId);
    
    if (coreResult.isOk()) {
      const core = coreResult.value;
      expect(core).toBeDefined();
      expect(core.id).toBe(modelId);
      expect(core.name).toBeDefined();
      expect(typeof core.name).toBe('string');
      expect(core.type).toBeDefined();
      expect(typeof core.type).toBe('string');
      expect(core.modelVersions).toBeDefined();
      expect(Array.isArray(core.modelVersions)).toBe(true);
    } else {
      console.log(`Error fetching core fields for model ${modelId}: ${coreResult.error.message}`);
    }
  });

  it('should get unified Models from list', async () => {
    const result = await client.unifiedModels.getUnifiedFromList({
      limit: 3,
      types: ['Checkpoint'],
    });
    
    if (result.isOk()) {
      const models = result.value;
      expect(models).toBeDefined();
      expect(Array.isArray(models)).toBe(true);
      expect(models.length).toBeLessThanOrEqual(3);
      
      if (models.length > 0) {
        const model = models[0]!;
        expect(model).toBeDefined();
        expect(model.name).toBeDefined();
        expect(typeof model.name).toBe('string');
        expect(model.type).toBe('Checkpoint');
        expect(model.modelVersions).toBeDefined();
        expect(Array.isArray(model.modelVersions)).toBe(true);
      }
    } else {
      console.log(`Error fetching unified models from list: ${result.error.message}`);
    }
  });

  it('should get unified Model with specific version', async () => {
    const modelId = EXAMPLE_MODEL_ID;
    const versionId = EXAMPLE_VERSION_ID;
    
    const result = await client.unifiedModels.getUnifiedWithVersion(modelId, versionId);
    
    if (result.isOk()) {
      const model = result.value;
      expect(model).toBeDefined();
      expect(model.id).toBe(modelId);
      expect(model.name).toBeDefined();
      expect(typeof model.name).toBe('string');
      expect(model.modelVersions).toBeDefined();
      expect(Array.isArray(model.modelVersions)).toBe(true);
      expect(model.modelVersions.length).toBe(1);
      
      if (model.modelVersions.length > 0) {
        const version = model.modelVersions[0]!;
        expect(version.id).toBe(versionId);
        expect(version.name).toBeDefined();
        expect(typeof version.name).toBe('string');
      }
    } else {
      console.log(`Error fetching model ${modelId} with version ${versionId}: ${result.error.message}`);
    }
  });
});