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

## Installation

```bash
# Using bun (recommended)
bun add ky neverthrow arktype

# Using npm
npm install ky neverthrow arktype

# Using yarn
yarn add ky neverthrow arktype

# Using pnpm
pnpm add ky neverthrow arktype
```

## Quick Start

### Using the HTTP Client

```typescript
import { createCivitaiClient } from 'civitai-api';

// Create client
const client = createCivitaiClient({
  apiKey: process.env.CIVITAI_API_KEY, // optional
  timeout: 60000, // optional, default: 30000
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

### Using Type Definitions Only

```typescript
import { 
  Model, 
  ModelsResponse, 
  ModelsRequestOptions,
  Creator,
  CreatorsResponse,
  CreatorsRequestOptions,
  ModelById,
  ModelVersion
} from 'civitai-api';

// Define search parameters with type safety
const searchParams: ModelsRequestOptions = {
  limit: 10,
  page: 1,
  query: 'stable diffusion',
  types: ['Checkpoint', 'LORA'],
  sort: 'Most Downloaded',
  period: 'Month',
  nsfw: false,
  baseModels: ['SDXL 1.0', 'SD 1.5']
};

// Use with your preferred HTTP client
async function fetchModels(params: ModelsRequestOptions) {
  const queryString = new URLSearchParams(params as any).toString();
  const response = await fetch(`https://civitai.com/api/v1/models?${queryString}`);
  const data = await response.json();
  
  // Data will match the ModelsResponse type
  return data;
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
import type { CivitaiError } from 'civitai-api';
import { 
  isNetworkError, 
  isValidationError, 
  isBadRequestError,
  isUnauthorizedError,
  isNotFoundError 
} from 'civitai-api';

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

### Arktype Validation Errors

When `validateResponses` is enabled, the client uses Arktype for runtime validation. Arktype provides detailed, human-readable error messages:

```typescript
// Example Arktype error output:
// - "Expected number at 'items[0].id', got string ('not-a-number')"
// - "Expected string at 'items[0].name', got number (123)"
// - "Expected one of ['Checkpoint', 'LORA', ...] at 'items[0].type', got 'InvalidType'"
// - "Expected boolean at 'items[0].poi', got string ('not-boolean')"

// You can access Arktype's detailed error information:
if (isValidationError(error)) {
  console.error('Validation summary:', error.details.summary);
  console.error('Problems:', error.details.problems);
  console.error('Errors by path:', error.details.byPath);
}
```

## Advanced Usage

### Updating Configuration

```typescript
// Update configuration at runtime
client.updateConfig({
  timeout: 120000,
  validateResponses: true,
  headers: { 'X-Custom-Header': 'value' },
});
```

### Direct HTTP Client Access

```typescript
// Get underlying HTTP client
const httpClient = client.client;

// Use HTTP methods directly
const result = await httpClient.get<CustomType>('/custom-endpoint', {
  searchParams: { param1: 'value1' },
  headers: { 'X-Custom-Header': 'value' },
  validateResponse: true, // Enable validation for this request
});
```

### Custom Endpoints

```typescript
import { CivitaiClient } from 'civitai-api';

class CustomEndpoint {
  constructor(private client: CivitaiClient) {}
  
  async customMethod(id: number) {
    return this.client.get<CustomResponse>(`/custom/${id}`);
  }
}

// Use custom endpoint
const customEndpoint = new CustomEndpoint(client.client);
```

## Design Philosophy

### Endpoint-Specific Type Definitions

Civitai API different endpoints return similar but slightly different JSON structures. To provide precise type safety, this package defines independent types for each endpoint:

- `ModelById` - From `/api/v1/models/{id}` endpoint
- `ModelVersion` - From `/api/v1/model-versions/{id}` endpoint  
- `Model` - From `/api/v1/models` list endpoint

This design ensures:
1. **Type Precision**: Each type exactly matches the corresponding endpoint response
2. **Developer Experience**: IDE autocompletion and type checking are more accurate
3. **Runtime Safety**: ArkType validation matches API responses exactly

### ArkType Integration

This package uses ArkType for runtime type validation. All exported types are created using ArkType's `type()` function, which provides both TypeScript types and runtime validators.

```typescript
import { modelSchema, Model } from 'civitai-api';

// Runtime validation
const data = { /* ... */ };
const result = modelSchema(data);

if (result instanceof type.errors) {
  console.error('Validation failed:', result.summary);
} else {
  // Type-safe access
  const validModel: Model = result;
}
```

## Available Type Arrays

Utility arrays are provided for enum-like types:

```typescript
import { 
  ModelTypesArray,
  ModelsRequestSortArray,
  ModelsRequestPeriodArray,
  BaseModelsArray,
  CheckpointTypeArray 
} from 'civitai-api';

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
│   │       └── tags.ts           # Tags endpoint
│   └── models/                   # Data model definitions
│       ├── creators.ts
│       ├── model-id.ts
│       ├── model-version.ts
│       ├── models.ts
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
