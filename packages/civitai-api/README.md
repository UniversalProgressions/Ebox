# Civitai API Client

A comprehensive TypeScript client for the Civitai API with runtime type safety using [ArkType](https://arktype.io/). This package provides both type definitions and a fully-featured HTTP client for interacting with Civitai's AI model platform.

## Features

- **Full TypeScript Support**: Complete type definitions for all Civitai API endpoints
- **Runtime Type Safety**: Powered by ArkType for validation at runtime
- **Comprehensive Coverage**: Supports all major Civitai API endpoints
- **Modern ES Modules**: Built as an ES module with tree-shaking support
- **Result-based Error Handling**: Using neverthrow for type-safe error handling
- **Configurable HTTP Client**: Built on Ky with support for timeouts, proxies, and custom headers
- **Modular Design**: Separated endpoint interfaces and implementations
- **Versioned Exports**: Clean API version separation using package.json exports
- **Unified Type System**: Consistent types across different API endpoints

## Installation

```bash
# Using bun (recommended)
bun add @up/civitai-api

# Using npm
npm install @up/civitai-api

# Using yarn
yarn add @up/civitai-api

# Using pnpm
pnpm add @up/civitai-api
```

## Quick Start

### Using the HTTP Client

```typescript
import { createCivitaiClient } from '@up/civitai-api/v1';

// Create client
const client = createCivitaiClient({
  apiKey: process.env.CIVITAI_API_KEY, // optional
  timeout: 30000, // optional, default: 30000
  validateResponses: true, // optional, enable response validation
});

// Use client
const result = await client.models.list({
  limit: 10,
  types: ['Checkpoint', 'LORA'],
  sort: 'Highest Rated',
});

if (result.isOk()) {
  const models = result.value;
  console.log(`Found ${models.metadata.totalItems} models`);
  models.items.forEach(model => {
    console.log(`- ${model.name} (${model.type})`);
  });
} else {
  console.error('Request failed:', result.error);
}
```

### Using the Unified ModelVersions Client

```typescript
import { createCivitaiClient } from '@up/civitai-api/v1';

const client = createCivitaiClient();

// Get unified ModelVersion (works with any endpoint)
const result = await client.unifiedModelVersions.getById(12345);

if (result.isOk()) {
  const version = result.value;
  console.log(`ModelVersion: ${version.name}`);
  console.log(`Base Model: ${version.baseModel}`);
  console.log(`Files: ${version.files.length}`);
  console.log(`Images: ${version.images.length}`);
  
  // Get core fields only (safe for all endpoints)
  const coreResult = await client.unifiedModelVersions.getCoreById(12345);
  if (coreResult.isOk()) {
    const core = coreResult.value;
    console.log(`Core: ${core.id} - ${core.name}`);
  }
}
```

## API Endpoints

### Creators

```typescript
// Get creators list
const result = await client.creators.list({
  limit: 20,
  page: 1,
  query: 'search term',
});
```

### Models

```typescript
// Get models list
const result = await client.models.list({
  limit: 50,
  types: ['Checkpoint', 'LORA', 'TextualInversion'],
  sort: 'Most Downloaded',
  period: 'Month',
  nsfw: false,
});

// Get single model details
const modelResult = await client.models.getById(1234);
```

### Model Versions

```typescript
// Get model version details
const versionResult = await client.modelVersions.getById(5678);

// Get model version by hash
const hashResult = await client.modelVersions.getByHash('abc123');
```

### Unified Model Versions

```typescript
// Get unified ModelVersion by ID (smart endpoint selection)
const unifiedResult = await client.unifiedModelVersions.getById(12345);

// Get ModelVersion core fields only
const coreResult = await client.unifiedModelVersions.getCoreById(12345);

// Get ModelVersion from a model
const fromModelResult = await client.unifiedModelVersions.getFromModel(123, 456);

// Get multiple ModelVersions
const batchResult = await client.unifiedModelVersions.getBatch([123, 456, 789]);

// Get all ModelVersions from a model
const allFromModelResult = await client.unifiedModelVersions.getAllFromModel(123);

// Get ModelVersion by hash
const byHashResult = await client.unifiedModelVersions.getByHash('abc123');
```

### Unified Models

```typescript
// Get unified Model by ID (smart endpoint selection)
const unifiedResult = await client.unifiedModels.getUnifiedById(123);

// Get Model core fields only
const coreResult = await client.unifiedModels.getCoreById(123);

// Get unified Models from list endpoint
const listResult = await client.unifiedModels.getUnifiedFromList({
  limit: 10,
  types: ['Checkpoint']
});

// Get multiple unified Models
const batchResult = await client.unifiedModels.getUnifiedBatch([123, 456, 789]);

// Search for unified Models
const searchResult = await client.unifiedModels.searchUnified({
  query: 'anime',
  limit: 5
});

// Get unified Model with specific version
const modelWithVersionResult = await client.unifiedModels.getUnifiedWithVersion(123, 456);
```

### Tags

```typescript
// Get tags list
const tagsResult = await client.tags.list({
  limit: 50,
  query: 'search term',
});
```

## Configuration Options

```typescript
interface ClientConfig {
  // API base URL, default: 'https://civitai.com/api/v1'
  baseUrl?: string;
  
  // API key for authenticated requests
  apiKey?: string;
  
  // Request timeout in milliseconds, default: 30000
  timeout?: number;
  
  // Whether to validate response data, default: false
  validateResponses?: boolean;
  
  // Custom request headers
  headers?: Record<string, string>;
  
  // Proxy configuration (Node.js only)
  proxy?: string | { host: string; port: number };
}
```

## Error Handling

The client uses `neverthrow`'s `Result<T, E>` pattern for type-safe error handling:

```typescript
import type { Result } from 'neverthrow';
import type { CivitaiError } from '@up/civitai-api/v1';
import { 
  isNetworkError, 
  isValidationError, 
  isBadRequestError,
  isUnauthorizedError,
  isNotFoundError 
} from '@up/civitai-api/v1';

// All API methods return Promise<Result<T, CivitaiError>>
const result: Result<ModelsResponse, CivitaiError> = await client.models.list();

if (result.isOk()) {
  // Success handling
  const data = result.value;
} else {
  // Error handling
  const error = result.error;
  
  if (isNetworkError(error)) {
    console.error('Network error:', error.message);
    console.error('Status code:', error.status);
  } else if (isValidationError(error)) {
    console.error('Validation error:', error.message);
    // Arktype provides detailed error information
    console.error('Arktype error details:', error.details);
  } else if (isBadRequestError(error)) {
    console.error('Bad request:', error.message);
  } else if (isUnauthorizedError(error)) {
    console.error('Unauthorized:', error.message);
    console.error('Suggestion:', error.details?.suggestion);
  } else if (isNotFoundError(error)) {
    console.error('Not found:', error.message);
  }
}
```

### Error Types

- `NETWORK_ERROR`: Network connection errors, timeouts, etc.
- `VALIDATION_ERROR`: Response data validation failed (using Arktype)
- `BAD_REQUEST`: HTTP 400 error
- `UNAUTHORIZED`: HTTP 401 error (missing or invalid API key)
- `NOT_FOUND`: HTTP 404 error (resource does not exist)
- Other HTTP errors: Automatically categorized by status code

## Versioned Exports

The package uses Node.js package.json `exports` field for versioned imports, requiring you to import specific API versions. This ensures clear version boundaries and prevents accidental usage of wrong API versions.

### Available Exports

```typescript
// Import v1 API (main entry point)
import { createCivitaiClient } from '@up/civitai-api/v1';

// Import v1 models types
import type { Model, ModelVersion } from '@up/civitai-api/v1/models';

// Import v1 client types
import type { ClientConfig } from '@up/civitai-api/v1/client';

// Import unified type system
import { ModelVersionAny, toModelVersionCore } from '@up/civitai-api/v1/models/unified';

// Import utilities
import { extractFilenameFromUrl } from '@up/civitai-api/v1/utils';
```

### Why Versioned Exports?

1. **Clear API Boundaries**: Each version has its own import path
2. **Future-Proof**: Easy to add v2, v3, etc. without breaking existing code
3. **Explicit Dependencies**: Developers know exactly which API version they're using
4. **Better Tooling**: TypeScript and bundlers can optimize version-specific code

### Package.json Exports Configuration

The package uses the following exports configuration:

```json
{
  "exports": {
    "./v1": {
      "import": "./dist/v1/index.js",
      "types": "./dist/v1/index.d.ts"
    },
    "./v1/client": {
      "import": "./dist/v1/client/index.js",
      "types": "./dist/v1/client/index.d.ts"
    },
    "./v1/models": {
      "import": "./dist/v1/models/index.js",
      "types": "./dist/v1/models/index.d.ts"
    },
    "./v1/models/unified": {
      "import": "./dist/v1/models/model-version-abstract.js",
      "types": "./dist/v1/models/model-version-abstract.d.ts"
    },
    "./v1/utils": {
      "import": "./dist/v1/utils.js",
      "types": "./dist/v1/utils.d.ts"
    },
    "./package.json": "./package.json"
  }
}
```

### Important Note

**Root path imports are not available** (e.g., `import { createCivitaiClient } from '@up/civitai-api'`). You must specify the API version explicitly:

```typescript
// ✅ Correct - explicit version
import { createCivitaiClient } from '@up/civitai-api/v1';

// ❌ Incorrect - root path no longer works
import { createCivitaiClient } from '@up/civitai-api';
```

This design ensures that when new API versions are released, your code continues to use the version you explicitly imported, preventing accidental breaking changes.

## Unified Type System

Civitai API different endpoints return similar but slightly different JSON structures. To provide precise type safety while maintaining flexibility, we provide a unified type system for both ModelVersion and Model types:

### Core Concepts

#### For ModelVersion:
- **`ModelVersionCore`** - Contains only fields present in ALL ModelVersion endpoints
- **`ModelVersionAny`** - Union type of all endpoint-specific ModelVersion types
- **Type guards** - Functions to check which endpoint a ModelVersion came from
- **Utility functions** - Safe access to endpoint-specific fields

#### For Model:
- **`ModelCore`** - Contains only fields present in ALL Model endpoints
- **`ModelAny`** - Union type of all endpoint-specific Model types
- **Type guards** - Functions to check which endpoint a Model came from
- **Utility functions** - Safe access to endpoint-specific fields

### Usage Example

```typescript
import {
  ModelVersionCore,
  ModelVersionAny,
  ModelCore,
  ModelAny,
  toModelVersionCore,
  toModelCore,
  getModelId,
  getIndex,
  getAvailability,
  getPublishedAt,
  isModelsVersion,
  isModelByIdVersion,
  isModelVersionEndpoint,
  isModelsEndpointModel,
  isModelByIdEndpointModel,
  findModelVersion,
  findModel,
} from '@up/civitai-api/v1/models/unified';

// Example: Process ModelVersion from any endpoint
function processModelVersion(version: ModelVersionAny) {
  // Extract core fields (safe for all endpoints)
  const core: ModelVersionCore = toModelVersionCore(version);
  console.log(`Processing ${core.name} (ID: ${core.id})`);
  
  // Safely access endpoint-specific fields
  const modelId = getModelId(version); // undefined for some endpoints
  const index = getIndex(version); // undefined for model-version endpoint
  const availability = getAvailability(version); // undefined for model-version endpoint
  const publishedAt = getPublishedAt(version); // handles different nullability
  
  // Use type guards for conditional logic
  if (isModelsVersion(version)) {
    console.log(`From models endpoint, index: ${version.index}`);
  } else if (isModelByIdVersion(version)) {
    console.log(`From model-id endpoint, index: ${version.index}`);
  } else if (isModelVersionEndpoint(version)) {
    console.log(`From model-version endpoint, modelId: ${version.modelId}`);
  }
}

// Example: Process Model from any endpoint
function processModel(model: ModelAny) {
  // Extract core fields (safe for all endpoints)
  const core: ModelCore = toModelCore(model);
  console.log(`Processing ${core.name} (ID: ${core.id})`);
  console.log(`Type: ${core.type}, Versions: ${core.modelVersions.length}`);
  
  // Use type guards for conditional logic
  if (isModelsEndpointModel(model)) {
    console.log(`From models endpoint, first version index: ${model.modelVersions[0]?.index}`);
  } else if (isModelByIdEndpointModel(model)) {
    console.log(`From model-id endpoint, first version index: ${model.modelVersions[0]?.index}`);
  }
}

// Example: Find version in array (works with any endpoint type)
const versions: ModelVersionAny[] = [...];
const foundVersion = findModelVersion(versions, 123);
if (foundVersion) {
  processModelVersion(foundVersion);
}

// Example: Find model in array (works with any endpoint type)
const models: ModelAny[] = [...];
const foundModel = findModel(models, 456);
if (foundModel) {
  processModel(foundModel);
}
```

## Image ID Extraction Utilities

Civitai API sometimes returns `null` for `ModelImage.id`, but the ID can be extracted from the image URL. The package provides utilities to handle this scenario at different abstraction levels:

### Core Utility Functions

#### 1. **Low-level URL Processing** (`extractIdFromImageUrl`)
```typescript
import { extractIdFromImageUrl } from '@up/civitai-api/v1/utils';

// Extract ID directly from URL
const url = "https://image.civitai.com/xG1nkqKTMzGDvpLrqFT7WA/cbe20dcf-7721-4f34-bc24-9ff14b96cab2/width=1024/1743606.jpeg";
const idResult = extractIdFromImageUrl(url);

if (idResult.isOk()) {
  console.log(`Extracted ID: ${idResult.value}`); // Output: 1743606
} else {
  console.error(`Failed to extract ID: ${idResult.error.message}`);
}
```

#### 2. **ModelImage-specific Functions** (`getImageId`, `ensureImageIds`)
```typescript
import { getImageId, ensureImageIds } from '@up/civitai-api/v1/models/unified';

// Example: Extract ID from a single ModelImage
const image = {
  id: null,
  url: "https://image.civitai.com/xG1nkqKTMzGDvpLrqFT7WA/cbe20dcf-7721-4f34-bc24-9ff14b96cab2/width=1024/1743606.jpeg",
  nsfwLevel: 1,
  width: 512,
  height: 512,
  hash: "abc123",
  type: "image",
};

const idResult = getImageId(image);
if (idResult.isOk()) {
  console.log(`Extracted ID: ${idResult.value}`); // Output: 1743606
} else {
  console.error(`Failed to extract ID: ${idResult.error.message}`);
}

// Example: Process multiple ModelImages
const images = [
  { id: 111, url: "https://example.com/image1.jpg", /* ... */ },
  { id: null, url: "https://image.civitai.com/.../222222.jpeg", /* ... */ },
  { id: 333, url: "https://example.com/image3.jpg", /* ... */ },
];

const processedResult = ensureImageIds(images);
if (processedResult.isOk()) {
  const processedImages = processedResult.value;
  // All images now have non-null IDs
  processedImages.forEach(img => {
    console.log(`Image ID: ${img.id}`);
  });
}
```

### How It Works

#### URL Pattern
Civitai image URLs typically follow this pattern:
```
https://image.civitai.com/{path}/{width}/{imageId}.{extension}
```
Example: `https://image.civitai.com/xG1nkqKTMzGDvpLrqFT7WA/cbe20dcf-7721-4f34-bc24-9ff14b96cab2/width=1024/1743606.jpeg`

#### ID Extraction Process
1. **Filename Extraction**: Uses `extractFilenameFromUrl()` to get the filename from URL
2. **Extension Removal**: Uses `removeFileExtension()` to remove file extension
3. **Numeric Parsing**: Parses the remaining string as integer

Examples:
- URL: `.../1743606.jpeg` → ID: `1743606`
- URL: `.../6039981.png` → ID: `6039981`
- URL: `.../123456` (no extension) → ID: `123456`

#### Error Handling
All functions return `Result<T, Error>` for type-safe error handling:
- Returns existing ID if already present in `ModelImage`
- Extracts ID from URL if `id` is `null`
- Returns error for:
  - Invalid URLs
  - URLs without filename
  - Non-numeric filenames

### Architecture Design

The utilities are organized in a layered architecture:

1. **Base Layer** (`utils.ts`):
   - `extractIdFromImageUrl(url: string): Result<number, Error>`
   - Generic URL processing, reusable across the codebase

2. **Domain Layer** (`model-version-abstract.ts`):
   - `getImageId(image: ModelImage): Result<number, Error>`
   - `ensureImageIds(images: ModelImage[]): Result<ModelImage[], Error>`
   - Type-specific functions that use the base utilities

This design provides:
- **Code Reuse**: Base function can be used independently
- **Type Safety**: Domain functions work with specific types
- **Separation of Concerns**: URL processing vs. domain logic

### Use Cases

- **Data Processing**: When working with Civitai API responses that have `null` image IDs
- **File Management**: When organizing downloaded images by their Civitai IDs
- **Database Operations**: When storing images with their proper IDs
- **Batch Processing**: When processing multiple images at once
- **URL Analysis**: When you only have the URL and need to extract the ID

## Available Type Arrays

Utility arrays are provided for enum-like types:

```typescript
import { 
  ModelTypesArray,
  ModelsRequestSortArray,
  ModelsRequestPeriodArray,
  BaseModelsArray,
  CheckpointTypeArray 
} from '@up/civitai-api/v1';

// Use in UI components or validation
console.log(ModelTypesArray); // ['Checkpoint', 'TextualInversion', ...]
console.log(BaseModelsArray); // ['SD 1.5', 'SDXL 1.0', ...]
```

## Base Models and Enums

The package includes comprehensive type definitions for:

- **Model Types**: `Checkpoint`, `TextualInversion`, `Hypernetwork`, `LORA`, `Controlnet`, etc.
- **Base Models**: `SD 1.5`, `SDXL 1.0`, `Stable Cascade`, `Pony`, `Flux`, etc.
- **Sort Options**: `Highest Rated`, `Most Downloaded`, `Newest`
- **Time Periods**: `AllTime`, `Day`, `Week`, `Month`, `Year`
- **Commercial Use**: `Image`, `RentCivit`, `Rent`, `Sell`, `None`

## Examples

Check the `examples/` directory for complete usage examples:

- `basic-usage.ts` - Basic client usage
- `validation-demo.ts` - Arktype validation error handling demonstration
- `unified-types-demo.ts` - Unified type system usage demonstration
- `unified-client-demo.ts` - Unified client usage demonstration

## Migration Guide

If you're migrating from endpoint-specific types to the unified type system, check the [MIGRATION-GUIDE.md](MIGRATION-GUIDE.md) for detailed instructions and best practices.

## Development

### Project Structure

```
src/
├── v1/
│   ├── client/                    # HTTP client implementation
│   │   ├── index.ts              # Main export and factory function
│   │   ├── client.ts             # Core HTTP client
│   │   ├── config.ts             # Configuration management
│   │   ├── errors.ts             # Error type definitions
│   │   └── endpoints/            # API endpoint implementations
│   │       ├── creators.ts       # Creators endpoint
│   │       ├── models.ts         # Models endpoint
│   │       ├── model-versions.ts # Model versions endpoint
│   │       ├── unified-model-versions.ts # Unified model versions endpoint
│   │       ├── unified-models.ts         # Unified models endpoint
│   │       └── tags.ts           # Tags endpoint
│   └── models/                   # Data model definitions
│       ├── creators.ts
│       ├── model-id.ts
│       ├── model-version.ts
│       ├── models.ts
│       ├── model-version-abstract.ts # Unified type system (ModelVersion & Model)
│       └── shared-types.ts
└── index.ts                      # Package main exports
```

### Building from Source

```bash
# Clone the repository
git clone <repository-url>
cd civitai-api

# Install dependencies
bun install

# Build the package
bun run build

# Run tests
bun test
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [Civitai](https://civitai.com/) for providing the API
- [ArkType](https://arktype.io/) for the excellent runtime type system
- [neverthrow](https://github.com/supermacro/neverthrow) for type-safe error handling
- [Ky](https://github.com/sindresorhus/ky) for the excellent HTTP client
- All contributors and users of this package

## Support

For issues, questions, or feature requests, please open an issue on the GitHub repository.

---

**Note**: This is an unofficial Civitai API client and is not affiliated with or endorsed by Civitai.
