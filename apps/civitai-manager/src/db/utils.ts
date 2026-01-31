import { promises as fs } from "node:fs";
import { join } from "node:path";
import { pathExists } from "path-exists";
import fg from "fast-glob";
import { getSettings } from "../modules/settings";
import type { Model } from "@up/civitai-api/v1";
import { ModelLayout } from "../modules/civitai/file-layout";
import { type } from "arktype";
export const existedModelversionsSchema = type({
  versionId: "number.integer",
  filesOnDisk: "number.integer[]",
}).array();
export type ExistedModelversions = typeof existedModelversionsSchema.infer;

/**
 * 检查文件夹内是否存在至少一个 .safetensors 文件
 * @param dirPath 文件夹的绝对路径
 * @returns Promise<boolean> 是否存在 .safetensors 文件
 */
export async function hasSafetensorsFile(dirPath: string): Promise<boolean> {
  try {
    const files = await fs.readdir(dirPath);

    for (const file of files) {
      const fullPath = join(dirPath, file);
      const stats = await fs.stat(fullPath);

      if (stats.isFile() && file.endsWith(".safetensors")) {
        return true; // 找到立即返回 true
      }
    }

    return false; // 遍历完成未找到
  } catch (error) {
    console.error(`Error scanning directory ${dirPath}:`, error);
    return false; // 出错时返回 false
  }
}

export async function checkIfModelVersionOnDisk(modelVersionPath: string) {
  if (
    (await pathExists(modelVersionPath)) &&
    (await hasSafetensorsFile(modelVersionPath))
  ) {
    return true;
  }
  return false;
}

export async function scanModels() {
  const expression =
    process.platform === "win32"
      ? `${fg.convertPathToPattern(getSettings().basePath)}/**/*.safetensors`
      : `${getSettings().basePath}/**/*.safetensors`;
  const safetensors = await fg.async(expression);
  return safetensors;
}

export async function checkModelOnDisk(modelData: Model) {
  // check existed model versions
  const settings = getSettings();
  const mi = new ModelLayout(modelData, settings.basePath);
  const existedModelversions: ExistedModelversions = [];
  for (const version of modelData.modelVersions) {
    const IdsOfFilesOnDisk = await mi.checkVersionFilesOnDisk(version.id);
    if (IdsOfFilesOnDisk.isOk()) {
      existedModelversions.push({
        versionId: version.id,
        filesOnDisk: IdsOfFilesOnDisk.value,
      });
    }
  }
  return existedModelversions;
}
