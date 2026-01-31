import { normalize, join, basename } from "node:path";
import { readdir, stat } from "node:fs/promises";
import sanitize from "sanitize-basename";
import type {
  ModelAny,
  ModelVersionAny,
  ModelCore,
  ModelVersionCore,
  ModelTypes,
  ModelFile,
  ModelImage,
} from "@up/civitai-api/v1";
import { 
  extractIdFromImageUrl,
  extractFilenameFromUrl
} from "@up/civitai-api/v1";
import { getSettings } from "../settings/service";
import { pathExists } from "path-exists";
import { type Result, err, ok } from "neverthrow";

// Type alias for backward compatibility
type Model = ModelAny;

/**
 * Generic model version interface that contains the minimum required properties
 * for file layout operations. This allows compatibility between different
 * ModelVersion type definitions (API vs database).
 */
export interface ModelVersionLayout {
  id: number;
  files: ModelFile[];
  images: ModelImage[];
}

/**
 * File layout structure for Civitai model management
 * 
 * Directory structure:
 * {baseDir} / {modelType} / {modelId} / {modelId}.api-info.json
 * {baseDir} / {modelType} / {modelId} / {versionId} / {fileId}_{sanitizedFileName}
 * {baseDir} / {modelType} / {modelId} / {versionId} / {versionId}.api-info.json
 * {baseDir} / {modelType} / {modelId} / {versionId} / media / {imageId}.{ext}
 */

// ==================== Utility Functions ====================

/**
 * Get the API info JSON file name for a given ID
 */
export function getApiInfoJsonFileName(id: number): string {
  return `${id}.api-info.json`;
}

/**
 * Sanitize a filename for safe filesystem usage
 */
export function sanitizeFileName(fileName: string): string {
  return sanitize(fileName);
}

// ==================== Path Builder ====================

/**
 * Builder class for constructing file paths according to the layout structure
 */
export class FileLayoutBuilder {
  constructor(private readonly basePath: string) {
    this.basePath = normalize(basePath);
  }

  /**
   * Get the base path
   */
  getBasePath(): string {
    return this.basePath;
  }

  /**
   * Get the path for a specific model
   */
  getModelPath(modelType: ModelTypes, modelId: number): string {
    return join(this.basePath, modelType, modelId.toString());
  }

  /**
   * Get the path for a specific model version
   */
  getVersionPath(modelType: ModelTypes, modelId: number, versionId: number): string {
    return join(this.getModelPath(modelType, modelId), versionId.toString());
  }

  /**
   * Get the path for media files of a specific version
   */
  getVersionMediaPath(modelType: ModelTypes, modelId: number, versionId: number): string {
    return join(this.getVersionPath(modelType, modelId, versionId), "media");
  }

  /**
   * Get the path for model API info JSON file
   */
  getModelApiInfoPath(modelType: ModelTypes, modelId: number): string {
    return join(
      this.getModelPath(modelType, modelId),
      getApiInfoJsonFileName(modelId)
    );
  }

  /**
   * Get the path for version API info JSON file
   */
  getVersionApiInfoPath(modelType: ModelTypes, modelId: number, versionId: number): string {
    return join(
      this.getVersionPath(modelType, modelId, versionId),
      getApiInfoJsonFileName(versionId)
    );
  }

  /**
   * Get the path for a model file
   */
  getModelFilePath(
    modelType: ModelTypes, 
    modelId: number, 
    versionId: number, 
    file: ModelFile
  ): string {
    const sanitizedName = sanitizeFileName(file.name);
    const fileName = `${file.id}_${sanitizedName}`;
    return join(this.getVersionPath(modelType, modelId, versionId), fileName);
  }

  /**
   * Get the path for a media file
   */
  getMediaFilePath(
    modelType: ModelTypes,
    modelId: number,
    versionId: number,
    image: ModelImage
  ): Result<string, Error> {
    return extractFilenameFromUrl(image.url)
      .andThen((filename) => {
        if (!filename) {
          return err(new Error(`Failed to extract filename from URL: ${image.url}`));
        }
        const mediaPath = this.getVersionMediaPath(modelType, modelId, versionId);
        return ok(join(mediaPath, filename));
      })
      .mapErr((error) => new Error(`Failed to extract filename from URL: ${error.message}`));
  }
}

// ==================== Media Scanner ====================

export interface MediaFileInfo {
  imageId: number;
  filePath: string;
  fileName: string;
  size: number;
}

/**
 * Scanner for media files in a directory
 */
export class MediaScanner {
  /**
   * Scan a media directory and return information about media files
   */
  static async scanMediaDirectory(mediaPath: string): Promise<Result<MediaFileInfo[], Error>> {
    try {
      // Check if directory exists
      const exists = await pathExists(mediaPath);
      if (!exists) {
        return ok([]); // Return empty array if directory doesn't exist
      }

      const files = await readdir(mediaPath, { withFileTypes: true });
      const mediaFiles: MediaFileInfo[] = [];

      for (const file of files) {
        if (file.isFile()) {
          const filePath = join(mediaPath, file.name);
          const imageIdResult = this.extractImageIdFromFilename(file.name);
          
          if (imageIdResult.isOk()) {
            // For now, we'll use 0 as placeholder size since we don't have actual file stats
            // In a real implementation, you would use fs.stat to get file size
            mediaFiles.push({
              imageId: imageIdResult.value,
              filePath,
              fileName: file.name,
              size: 0 // Placeholder
            });
          }
          // If extraction fails, we simply skip this file (it's not a valid media file)
        }
      }

      return ok(this.sortByMediaId(mediaFiles));
    } catch (error) {
      return err(error instanceof Error ? error : new Error(`Failed to scan media directory: ${String(error)}`));
    }
  }

  /**
   * Extract image ID from filename
   * Supports multiple filename formats:
   * - {imageId}.{ext} (e.g., "12345.jpeg")
   * - {imageId}-{suffix}.{ext} (e.g., "12345-preview.jpeg")
   * - {prefix}-{imageId}.{ext} (e.g., "preview-12345.jpeg")
   * 
   * Returns the first numeric sequence found in the filename
   */
  private static extractImageIdFromFilename(filename: string): Result<number, Error> {
    // Match the first sequence of digits in the filename
    const match = filename.match(/\b(\d+)\b/);
    if (!match) {
      return err(new Error(`No numeric ID found in filename: ${filename}`));
    }
    
    const matchedValue = match[1];
    if (matchedValue === undefined) {
      return err(new Error(`Regex matched but captured group is undefined in filename: ${filename}`));
    }
    
    const imageId = parseInt(matchedValue, 10);
    if (isNaN(imageId)) {
      return err(new Error(`Failed to parse numeric ID from matched value: ${matchedValue} in filename: ${filename}`));
    }
    
    return ok(imageId);
  }

  /**
   * Sort media files by image ID in ascending order
   */
  static sortByMediaId(files: MediaFileInfo[]): MediaFileInfo[] {
    return [...files].sort((a, b) => a.imageId - b.imageId);
  }
}

// ==================== Version Layout ====================

/**
 * Layout information for a specific model version
 */
export class VersionLayout {
  private readonly builder: FileLayoutBuilder;

  constructor(
    public readonly model: Model,
    public readonly version: ModelVersionLayout,
    basePath: string
  ) {
    this.builder = new FileLayoutBuilder(basePath);
  }

  /**
   * Get the path to this version's directory
   */
  getVersionPath(): string {
    return this.builder.getVersionPath(this.model.type, this.model.id, this.version.id);
  }

  /**
   * Get the path to this version's API info JSON file
   */
  getApiInfoPath(): string {
    return this.builder.getVersionApiInfoPath(this.model.type, this.model.id, this.version.id);
  }

  /**
   * Get the path to this version's media directory
   */
  getMediaPath(): string {
    return this.builder.getVersionMediaPath(this.model.type, this.model.id, this.version.id);
  }

  /**
   * Find a specific file by ID
   */
  findFile(fileId: number): Result<ModelFile, Error> {
    const file = this.version.files.find(file => file.id === fileId);
    if (!file) {
      return err(new Error(`Version ${this.version.id} has no file with ID: ${fileId}`));
    }
    return ok(file);
  }

  /**
   * Get the path for a specific file
   */
  getFilePath(fileId: number): Result<string, Error> {
    const fileResult = this.findFile(fileId);
    if (fileResult.isErr()) {
      return err(fileResult.error);
    }

    return ok(this.builder.getModelFilePath(
      this.model.type,
      this.model.id,
      this.version.id,
      fileResult.value
    ));
  }

  /**
   * Find a specific media/image by ID
   */
  findMedia(mediaId: number): Result<ModelImage, Error> {
    const image = this.version.images.find(img => img.id === mediaId);
    if (!image) {
      return err(new Error(`Version ${this.version.id} has no media with ID: ${mediaId}`));
    }
    return ok(image);
  }

  /**
   * Get the path for a specific media file
   */
  getMediaPathById(mediaId: number): Result<string, Error> {
    const mediaResult = this.findMedia(mediaId);
    if (mediaResult.isErr()) {
      return err(mediaResult.error);
    }

    return this.builder.getMediaFilePath(
      this.model.type,
      this.model.id,
      this.version.id,
      mediaResult.value
    );
  }

  /**
   * Check which files exist on disk
   */
  async checkFilesOnDisk(): Promise<Result<number[], Error>> {
    const existingFiles: number[] = [];

    for (const file of this.version.files) {
      const filePathResult = this.getFilePath(file.id);
      if (filePathResult.isErr()) {
        return err(filePathResult.error);
      }

      const exists = await pathExists(filePathResult.value);
      if (exists) {
        existingFiles.push(file.id);
      }
    }

    return ok(existingFiles);
  }

  /**
   * Scan media files in this version's media directory
   */
  async scanMediaFiles(): Promise<Result<MediaFileInfo[], Error>> {
    const mediaPath = this.getMediaPath();
    return MediaScanner.scanMediaDirectory(mediaPath);
  }
}

// ==================== Model Layout ====================

/**
 * Layout information for a specific model
 */
export class ModelLayout {
  private readonly builder: FileLayoutBuilder;

  constructor(
    public readonly model: Model,
    basePath: string
  ) {
    this.builder = new FileLayoutBuilder(basePath);
  }

  /**
   * Get the path to this model's directory
   */
  getModelPath(): string {
    return this.builder.getModelPath(this.model.type, this.model.id);
  }

  /**
   * Get the path to this model's API info JSON file
   */
  getApiInfoPath(): string {
    return this.builder.getModelApiInfoPath(this.model.type, this.model.id);
  }

  /**
   * Find a specific version by ID
   */
  findVersion(versionId: number): Result<ModelVersionLayout, Error> {
    const version = this.model.modelVersions.find((v: ModelVersionAny) => v.id === versionId);
    if (!version) {
      return err(new Error(`Model ${this.model.id} has no version with ID: ${versionId}`));
    }
    
    // Convert to ModelVersionLayout
    const versionLayout: ModelVersionLayout = {
      id: version.id,
      files: version.files,
      // @ts-ignore: Type 'string' is not assignable to type "'image' | 'video'".
      images: version.images,
    };
    
    return ok(versionLayout);
  }

  /**
   * Get layout for a specific version
   */
  getVersionLayout(versionId: number): Result<VersionLayout, Error> {
    const versionResult = this.findVersion(versionId);
    if (versionResult.isErr()) {
      return err(versionResult.error);
    }

    return ok(new VersionLayout(
      this.model,
      versionResult.value,
      this.builder.getBasePath()
    ));
  }

  /**
   * Check which files exist on disk for a specific version
   */
  async checkVersionFilesOnDisk(versionId: number): Promise<Result<number[], Error>> {
    const versionLayoutResult = this.getVersionLayout(versionId);
    if (versionLayoutResult.isErr()) {
      return err(versionLayoutResult.error);
    }

    return versionLayoutResult.value.checkFilesOnDisk();
  }
}

// ==================== Factory Functions ====================

/**
 * Create a FileLayoutBuilder instance using settings base path
 */
export function createFileLayoutBuilder(): FileLayoutBuilder {
  const settings = getSettings();
  return new FileLayoutBuilder(settings.basePath);
}

/**
 * Create a ModelLayout instance using settings base path
 */
export function createModelLayout(model: Model): ModelLayout {
  const settings = getSettings();
  return new ModelLayout(model, settings.basePath);
}

/**
 * Create a VersionLayout instance using settings base path
 */
export function createVersionLayout(model: Model, version: ModelVersionLayout): VersionLayout {
  const settings = getSettings();
  return new VersionLayout(model, version, settings.basePath);
}

// ==================== Legacy API (for backward compatibility) ====================

/**
 * Legacy functions for backward compatibility
 * These will be deprecated in the future
 */

export function getModelIdPath(
  basePath: string,
  modelType: ModelTypes,
  modelId: number
): string {
  const builder = new FileLayoutBuilder(basePath);
  return builder.getModelPath(modelType, modelId);
}

export function getModelIdApiInfoJsonPath(
  basePath: string,
  modelType: ModelTypes,
  modelId: number
): string {
  const builder = new FileLayoutBuilder(basePath);
  return builder.getModelApiInfoPath(modelType, modelId);
}

export function getModelVersionPath(
  basePath: string,
  modelType: ModelTypes,
  modelId: number,
  versionId: number
): string {
  const builder = new FileLayoutBuilder(basePath);
  return builder.getVersionPath(modelType, modelId, versionId);
}

export function getModelVersionApiInfoJsonPath(
  basePath: string,
  modelType: ModelTypes,
  modelId: number,
  modelVersionId: number
): string {
  const builder = new FileLayoutBuilder(basePath);
  return builder.getVersionApiInfoPath(modelType, modelId, modelVersionId);
}

export function getMediaDir(basePath: string): string {
  // Note: This legacy function returns the old global media directory
  // In the new layout, media is organized per version
  return join(normalize(basePath), "media");
}

export function getMediaFilePathByFileName(fileName: string): string {
  // Note: This legacy function uses the old global media directory
  const settings = getSettings();
  return join(getMediaDir(settings.basePath), fileName);
}
