// Civitai API v1 - Main Entry Point
// This file exports all v1 API functionality

// Main client exports
export { createCivitaiClient } from './client/index';
export type { CivitaiApiClient, CivitaiApiClientImpl } from './client/index';

// Configuration types
export type { ClientConfig } from './client/config';

// Error handling types and utilities
export type {
  CivitaiError,
  NetworkError,
  ValidationError,
  BadRequestError,
  UnauthorizedError,
  NotFoundError,
} from './client/errors';

export {
  createNetworkError,
  createValidationError,
  createBadRequestError,
  createUnauthorizedError,
  createNotFoundError,
  isNetworkError,
  isValidationError,
  isBadRequestError,
  isUnauthorizedError,
  isNotFoundError,
} from './client/errors';

// Creator-related types
export type {
  Creator,
  CreatorsRequestOptions,
  CreatorsResponse,
} from './models/creators';

// Model-related types (list endpoint)
export type {
  Model,
  ModelVersion as ModelVersionInList,
  ModelsRequestOptions,
  ModelsResponse,
} from './models/models';

// Model by ID types
export type {
  ModelById,
} from './models/model-id';

// Model version types
export type {
  ModelVersion,
} from './models/model-version';

// Unified type system for ModelVersion
export type {
  ModelVersionCore,
  ModelVersionAny,
  ModelsVersion,
  ModelByIdVersion,
  ModelVersionEndpoint,
  ModelAny,
  ModelCore,
  ModelsEndpointModel,
  ModelByIdEndpointModel,
} from './models/model-version-abstract';

export {
  toModelVersionCore,
  getModelId,
  getIndex,
  getAvailability,
  getPublishedAt,
  isModelsVersion,
  isModelByIdVersion,
  isModelVersionEndpoint,
  findModelVersion,
  findModelVersionTyped,
} from './models/model-version-abstract';

// Shared types used across multiple endpoints
export type {
  ModelFile,
  ModelImage,
  ModelStats,
  ModelVersionStats,
  PaginationMetadata,
  FileHashes,
} from './models/shared-types';

// Base models and enums
export {
  ModelTypesArray,
  ModelsRequestSortArray,
  ModelsRequestPeriodArray,
  BaseModelsArray,
  CheckpointTypeArray,
} from './models/base-models/misc';

export type {
  ModelTypes,
  ModelsRequestSort,
  ModelsRequestPeriod,
  BaseModels,
  CheckpointType,
  AllowCommercialUse,
} from './models/base-models/misc';

// Utility functions
export * from './utils';
