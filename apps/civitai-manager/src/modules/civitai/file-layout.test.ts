import { describe, test, expect, beforeEach, mock } from "bun:test";
import {
  getApiInfoJsonFileName,
  sanitizeFileName,
  FileLayoutBuilder,
  VersionLayout,
  ModelLayout,
  getModelIdPath,
  getModelIdApiInfoJsonPath,
  getModelVersionPath,
  getModelVersionApiInfoJsonPath,
  getMediaDir,
} from "./file-layout";
import type { Model, ModelFile, ModelImage, ModelTypes } from "@up/civitai-api/v1";
import type { ModelVersionLayout } from "./file-layout";

// Mock data for testing
const mockModelFile: ModelFile = {
  id: 123,
  sizeKB: 1024,
  name: "test_model.safetensors",
  type: "Model",
  metadata: {},
  downloadUrl: "https://example.com/file.safetensors",
};

const mockModelImage: ModelImage = {
  id: 456,
  url: "https://image.civitai.com/xG1nkqKTMzGDvpLrqFT7WA/width=450/456.jpeg",
  nsfwLevel: 1,
  width: 512,
  height: 512,
  hash: "abc123",
  type: "image",
};

const mockModelVersionLayout: ModelVersionLayout = {
  id: 789,
  files: [mockModelFile],
  images: [mockModelImage],
};

const mockModel: Model = {
  id: 456,
  name: "Test Model",
  description: "A test model",
  type: "Checkpoint" as ModelTypes,
  poi: false,
  nsfw: false,
  nsfwLevel: 1,
  stats: {
    downloadCount: 1000,
    thumbsUpCount: 50,
    thumbsDownCount: 2,
    commentCount: 10,
    tippedAmountCount: 5,
  },
  tags: ["test", "ai"],
  modelVersions: [
    {
      id: 789,
      name: "v1.0",
      baseModel: "SD 1.5",
      baseModelType: null,
      publishedAt: "2024-01-01T00:00:00Z",
      availability: "Public",
      nsfwLevel: 1,
      description: "Test version",
      stats: {
        downloadCount: 500,
        thumbsUpCount: 25,
        rating: 4.5,
      },
      files: [mockModelFile],
      images: [mockModelImage],
      index: 0,
      trainedWords: ["test"],
    },
  ],
};

describe("FileLayout Module", () => {
  describe("Utility Functions", () => {
    test("getApiInfoJsonFileName", () => {
      expect(getApiInfoJsonFileName(123)).toBe("123.api-info.json");
      expect(getApiInfoJsonFileName(456789)).toBe("456789.api-info.json");
    });

    test("sanitizeFileName", () => {
      // Note: sanitize-basename replaces path separators with special characters
      // The exact output depends on the library's implementation
      const sanitized = sanitizeFileName("test/file\\name.safetensors");
      expect(sanitized).not.toBe("test/file\\name.safetensors"); // Should be sanitized
      expect(sanitized).toContain(".safetensors"); // Should preserve extension
      
      expect(sanitizeFileName("normal_name.safetensors")).toBe("normal_name.safetensors");
      expect(sanitizeFileName("name with spaces.safetensors")).toBe("name with spaces.safetensors");
    });
  });

  describe("FileLayoutBuilder", () => {
    let builder: FileLayoutBuilder;

    beforeEach(() => {
      builder = new FileLayoutBuilder("/test/base");
    });

    test("constructor normalizes base path", () => {
      expect(builder.getBasePath()).toBe("\\test\\base");
    });

    test("getModelPath", () => {
      const path = builder.getModelPath("Checkpoint" as ModelTypes, 456);
      expect(path).toBe("\\test\\base\\Checkpoint\\456");
    });

    test("getVersionPath", () => {
      const path = builder.getVersionPath("Checkpoint" as ModelTypes, 456, 789);
      expect(path).toBe("\\test\\base\\Checkpoint\\456\\789");
    });

    test("getVersionMediaPath", () => {
      const path = builder.getVersionMediaPath("Checkpoint" as ModelTypes, 456, 789);
      expect(path).toBe("\\test\\base\\Checkpoint\\456\\789\\media");
    });

    test("getModelApiInfoPath", () => {
      const path = builder.getModelApiInfoPath("Checkpoint" as ModelTypes, 456);
      expect(path).toBe("\\test\\base\\Checkpoint\\456\\456.api-info.json");
    });

    test("getVersionApiInfoPath", () => {
      const path = builder.getVersionApiInfoPath("Checkpoint" as ModelTypes, 456, 789);
      expect(path).toBe("\\test\\base\\Checkpoint\\456\\789\\789.api-info.json");
    });

    test("getModelFilePath", () => {
      const path = builder.getModelFilePath(
        "Checkpoint" as ModelTypes,
        456,
        789,
        mockModelFile
      );
      expect(path).toBe("\\test\\base\\Checkpoint\\456\\789\\123_test_model.safetensors");
    });

    test("getMediaFilePath", () => {
      const result = builder.getMediaFilePath(
        "Checkpoint" as ModelTypes,
        456,
        789,
        mockModelImage
      );
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toBe("\\test\\base\\Checkpoint\\456\\789\\media\\456.jpeg");
      }
    });
  });

  describe("VersionLayout", () => {
    let versionLayout: VersionLayout;

    beforeEach(() => {
      versionLayout = new VersionLayout(
        mockModel,
        mockModelVersionLayout,
        "/test/base"
      );
    });

    test("getVersionPath", () => {
      expect(versionLayout.getVersionPath()).toBe("\\test\\base\\Checkpoint\\456\\789");
    });

    test("getApiInfoPath", () => {
      expect(versionLayout.getApiInfoPath()).toBe("\\test\\base\\Checkpoint\\456\\789\\789.api-info.json");
    });

    test("getMediaPath", () => {
      expect(versionLayout.getMediaPath()).toBe("\\test\\base\\Checkpoint\\456\\789\\media");
    });

    test("findFile - success", () => {
      const result = versionLayout.findFile(123);
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.id).toBe(123);
      }
    });

    test("findFile - failure", () => {
      const result = versionLayout.findFile(999);
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.message).toContain("has no file with ID");
      }
    });

    test("findMedia - success", () => {
      const result = versionLayout.findMedia(456);
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.id).toBe(456);
      }
    });

    test("findMedia - failure", () => {
      const result = versionLayout.findMedia(999);
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.message).toContain("has no media with ID");
      }
    });

    test("getFilePath", () => {
      const result = versionLayout.getFilePath(123);
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toBe("\\test\\base\\Checkpoint\\456\\789\\123_test_model.safetensors");
      }
    });
  });

  describe("ModelLayout", () => {
    let modelLayout: ModelLayout;

    beforeEach(() => {
      modelLayout = new ModelLayout(mockModel, "/test/base");
    });

    test("getModelPath", () => {
      expect(modelLayout.getModelPath()).toBe("\\test\\base\\Checkpoint\\456");
    });

    test("getApiInfoPath", () => {
      expect(modelLayout.getApiInfoPath()).toBe("\\test\\base\\Checkpoint\\456\\456.api-info.json");
    });

    test("findVersion - success", () => {
      const result = modelLayout.findVersion(789);
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.id).toBe(789);
        expect(result.value.files).toHaveLength(1);
        expect(result.value.images).toHaveLength(1);
      }
    });

    test("findVersion - failure", () => {
      const result = modelLayout.findVersion(999);
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.message).toContain("has no version with ID");
      }
    });

    test("getVersionLayout", () => {
      const result = modelLayout.getVersionLayout(789);
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toBeInstanceOf(VersionLayout);
        expect(result.value.version.id).toBe(789);
      }
    });
  });

  describe("Legacy API Functions", () => {
    test("getModelIdPath", () => {
      const path = getModelIdPath("/base", "Checkpoint" as ModelTypes, 456);
      expect(path).toBe("\\base\\Checkpoint\\456");
    });

    test("getModelIdApiInfoJsonPath", () => {
      const path = getModelIdApiInfoJsonPath("/base", "Checkpoint" as ModelTypes, 456);
      expect(path).toBe("\\base\\Checkpoint\\456\\456.api-info.json");
    });

    test("getModelVersionPath", () => {
      const path = getModelVersionPath("/base", "Checkpoint" as ModelTypes, 456, 789);
      expect(path).toBe("\\base\\Checkpoint\\456\\789");
    });

    test("getModelVersionApiInfoJsonPath", () => {
      const path = getModelVersionApiInfoJsonPath("/base", "Checkpoint" as ModelTypes, 456, 789);
      expect(path).toBe("\\base\\Checkpoint\\456\\789\\789.api-info.json");
    });

    test("getMediaDir", () => {
      const path = getMediaDir("/base");
      expect(path).toBe("\\base\\media");
    });
  });
});
