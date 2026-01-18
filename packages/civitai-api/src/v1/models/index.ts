// Civitai API v1 Models - Entry Point
// This file exports all v1 model-related types

// Creator-related types
export type {
  Creator,
  CreatorsRequestOptions,
  CreatorsResponse,
} from './creators';

// Model-related types (list endpoint)
export type {
  Model,
  ModelVersion as ModelVersionInList,
  ModelsRequestOptions,
  ModelsResponse,
} from './models';

// Model by ID types
export type {
  ModelById,
} from './model-id';

// Model version types
export type {
  ModelVersion,
} from './model-version';

// Unified type system for ModelVersion
export type {
  ModelVersionCore,
  ModelVersionAny,
  ModelsVersion,
  ModelByIdVersion,
  ModelVersionEndpoint,
} from './model-version-abstract';

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
} from './model-version-abstract';

// Shared types used across multiple endpoints
export type {
  ModelFile,
  ModelImage,
  ModelStats,
  ModelVersionStats,
  PaginationMetadata,
  FileHashes,
} from './shared-types';

// Base models and enums
export {
  ModelTypesArray,
  ModelsRequestSortArray,
  ModelsRequestPeriodArray,
  BaseModelsArray,
  CheckpointTypeArray,
} from './base-models/misc';

export type {
  ModelTypes,
  ModelsRequestSort,
  ModelsRequestPeriod,
  BaseModels,
  CheckpointType,
  AllowCommercialUse,
} from './base-models/misc';
