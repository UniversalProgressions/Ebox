import { createCivitaiClient } from '../src/v1/index';
import {
  EXAMPLE_MODEL_ID,
  EXAMPLE_VERSION_ID,
} from './shared-ids';

async function demoUnifiedClient() {
  console.log('=== Civitai API Unified Client Demo ===\n');

  // Create client
  const client = createCivitaiClient({
    apiKey: process.env.CIVITAI_API_KEY,
  });

  console.log('1. Getting unified ModelVersion by ID...');
  
  try {
    // Example model version ID from shared module
    const versionId = EXAMPLE_VERSION_ID;
    
    // Using the new unified endpoint
    const result = await client.unifiedModelVersions.getById(versionId);
    
    if (result.isOk()) {
      const version = result.value;
      console.log(`✅ Successfully fetched unified ModelVersion ${versionId}`);
      console.log(`   Name: ${version.name}`);
      console.log(`   Base Model: ${version.baseModel}`);
      console.log(`   Files: ${version.files.length}`);
      console.log(`   Images: ${version.images.length}`);
      
      // You can safely access core fields
      console.log(`\n2. Getting core fields only...`);
      const coreResult = await client.unifiedModelVersions.getCoreById(versionId);
      
      if (coreResult.isOk()) {
        const core = coreResult.value;
        console.log(`✅ Core fields extracted:`);
        console.log(`   ID: ${core.id}`);
        console.log(`   Name: ${core.name}`);
        console.log(`   Base Model: ${core.baseModel}`);
        console.log(`   Description: ${core.description || 'No description'}`);
      }
    } else {
      console.log(`❌ Error: ${result.error.message}`);
    }
  } catch (error) {
    console.log(`❌ Exception: ${error}`);
  }

  console.log('\n3. Getting ModelVersion from model...');
  
  try {
    // Example model and version IDs from shared module
    const modelId = EXAMPLE_MODEL_ID;
    const versionId = EXAMPLE_VERSION_ID;
    
    const result = await client.unifiedModelVersions.getFromModel(modelId, versionId);
    
    if (result.isOk()) {
      console.log(`✅ Successfully fetched version ${versionId} from model ${modelId}`);
    } else {
      console.log(`❌ Error: ${result.error.message}`);
    }
  } catch (error) {
    console.log(`❌ Exception: ${error}`);
  }

  console.log('\n4. Getting unified Model by ID...');
  
  try {
    // Example model ID from shared module
    const modelId = EXAMPLE_MODEL_ID;
    
    const result = await client.unifiedModels.getUnifiedById(modelId);
    
    if (result.isOk()) {
      const model = result.value;
      console.log(`✅ Successfully fetched unified Model ${modelId}`);
      console.log(`   Name: ${model.name}`);
      console.log(`   Type: ${model.type}`);
      console.log(`   Versions: ${model.modelVersions.length}`);
      console.log(`   Tags: ${model.tags.length}`);
      
      // You can safely access core fields
      console.log(`\n5. Getting Model core fields only...`);
      const coreResult = await client.unifiedModels.getCoreById(modelId);
      
      if (coreResult.isOk()) {
        const core = coreResult.value;
        console.log(`✅ Core fields extracted:`);
        console.log(`   ID: ${core.id}`);
        console.log(`   Name: ${core.name}`);
        console.log(`   Type: ${core.type}`);
        console.log(`   Versions: ${core.modelVersions.length}`);
      }
    } else {
      console.log(`❌ Error: ${result.error.message}`);
    }
  } catch (error) {
    console.log(`❌ Exception: ${error}`);
  }

  console.log('\n6. Getting unified Models from list...');
  
  try {
    const result = await client.unifiedModels.getUnifiedFromList({
      limit: 3,
      types: ['Checkpoint'],
    });
    
    if (result.isOk()) {
      const models = result.value;
      console.log(`✅ Successfully fetched ${models.length} unified models`);
      models.forEach((model, index) => {
        console.log(`   ${index + 1}. ${model.name} (${model.type}) - ${model.modelVersions.length} versions`);
      });
    } else {
      console.log(`❌ Error: ${result.error.message}`);
    }
  } catch (error) {
    console.log(`❌ Exception: ${error}`);
  }

  console.log('\n7. Getting unified Model with specific version...');
  
  try {
    // Example model and version IDs from shared module
    const modelId = EXAMPLE_MODEL_ID;
    const versionId = EXAMPLE_VERSION_ID;
    
    const result = await client.unifiedModels.getUnifiedWithVersion(modelId, versionId);
    
    if (result.isOk()) {
      const model = result.value;
      console.log(`✅ Successfully fetched model ${modelId} with only version ${versionId}`);
      console.log(`   Model: ${model.name}`);
      console.log(`   Single version: ${model.modelVersions[0]?.name || 'Unknown'}`);
    } else {
      console.log(`❌ Error: ${result.error.message}`);
    }
  } catch (error) {
    console.log(`❌ Exception: ${error}`);
  }

  console.log('\n=== Demo Complete ===');
}

// Run demo if this file is executed directly
if (import.meta.main) {
  demoUnifiedClient().catch(console.error);
}

export { demoUnifiedClient };
