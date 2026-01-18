# Civitai API 迁移指南：从原始类型到统一类型系统

## 概述

Civitai API 客户端现在提供了一个统一类型系统，用于处理来自不同端点的 ModelVersion 和 Model 数据。本指南将帮助您从使用原始端点特定类型迁移到使用统一类型系统。

## 为什么需要迁移？

### 原始类型系统的问题

Civitai API 的不同端点返回相似但略有不同的 ModelVersion 和 Model 结构：

#### 对于 ModelVersion：
1. **/api/v1/models** - 搜索端点
2. **/api/v1/models/{id}** - 模型详情端点  
3. **/api/v1/model-versions/{id}** - 模型版本详情端点

#### 对于 Model：
1. **/api/v1/models** - 搜索端点（返回 Model 类型）
2. **/api/v1/models/{id}** - 模型详情端点（返回 ModelById 类型）

每个端点都有其特定的类型，这导致：
- 类型处理复杂
- 代码重复
- 难以编写通用的处理函数

### 统一类型系统的优势

1. **简化代码** - 使用单一接口处理所有端点数据
2. **类型安全** - 保持 TypeScript 类型安全
3. **渐进式迁移** - 可以逐步迁移，无需一次性重写所有代码
4. **向后兼容** - 原始类型仍然可用

## 迁移步骤

### 步骤 1：了解统一类型系统

统一类型系统提供以下核心组件：

#### 对于 ModelVersion：
```typescript
import {
  ModelVersionCore,      // 所有端点共有的核心字段
  ModelVersionAny,       // 所有端点类型的联合类型
  toModelVersionCore,    // 提取核心字段
  getModelId,           // 安全获取 modelId
  getIndex,             // 安全获取 index
  getAvailability,      // 安全获取 availability
  getPublishedAt,       // 安全获取 publishedAt
  isModelsVersion,      // 类型守卫
  isModelByIdVersion,   // 类型守卫
  isModelVersionEndpoint, // 类型守卫
  findModelVersion,     // 查找版本
} from 'civitai-api';
```

#### 对于 Model：
```typescript
import {
  ModelCore,            // 所有端点共有的核心字段
  ModelAny,             // 所有端点类型的联合类型
  toModelCore,          // 提取核心字段
  isModelsEndpointModel, // 类型守卫
  isModelByIdEndpointModel, // 类型守卫
  findModel,            // 查找模型
} from 'civitai-api';
```

### 步骤 2：识别需要迁移的代码

查找以下模式：

#### 对于 ModelVersion：
```typescript
// 模式 1：处理特定端点类型
function processModelsVersion(version: ModelsVersion) {
  // 只能处理 /models 端点的数据
}

// 模式 2：类型断言
function processAnyVersion(version: any) {
  if ('index' in version && 'availability' in version) {
    // 处理 models 或 model-id 端点
  } else if ('modelId' in version) {
    // 处理 model-version 端点
  }
}

// 模式 3：重复的逻辑
function processVersionFromModels(version: ModelsVersion) {
  console.log(version.name, version.baseModel);
}

function processVersionFromModelById(version: ModelByIdVersion) {
  console.log(version.name, version.baseModel);
}
```

#### 对于 Model：
```typescript
// 模式 1：处理特定端点类型
function processModelsEndpointModel(model: Model) {
  // 只能处理 /models 端点的数据
}

function processModelById(model: ModelById) {
  // 只能处理 /models/{id} 端点的数据
}

// 模式 2：重复的逻辑
function processModelFromList(model: Model) {
  console.log(model.name, model.type, model.modelVersions.length);
}

function processModelByIdDetail(model: ModelById) {
  console.log(model.name, model.type, model.modelVersions.length);
}
```

### 步骤 3：迁移到统一类型

#### 示例 1：处理来自任何端点的 ModelVersion 数据

**迁移前：**
```typescript
// 需要多个函数或复杂的类型检查
function processVersion(version: ModelsVersion | ModelByIdVersion | ModelVersionEndpoint) {
  if ('index' in version && 'availability' in version) {
    // 处理 models 或 model-id 端点
    console.log(`Index: ${version.index}, Availability: ${version.availability}`);
  } else if ('modelId' in version) {
    // 处理 model-version 端点
    console.log(`Model ID: ${version.modelId}`);
  }
  
  // 访问公共字段需要类型断言
  console.log(`Name: ${(version as any).name}`);
}
```

**迁移后：**
```typescript
import { ModelVersionAny, toModelVersionCore, getModelId, getIndex, getAvailability } from 'civitai-api';

function processVersion(version: ModelVersionAny) {
  // 提取核心字段（所有端点都安全）
  const core = toModelVersionCore(version);
  console.log(`Name: ${core.name}, Base Model: ${core.baseModel}`);
  
  // 安全访问端点特定字段
  const modelId = getModelId(version);
  const index = getIndex(version);
  const availability = getAvailability(version);
  
  if (modelId !== undefined) {
    console.log(`Model ID: ${modelId}`);
  }
  if (index !== undefined && availability !== undefined) {
    console.log(`Index: ${index}, Availability: ${availability}`);
  }
}
```

#### 示例 2：处理来自任何端点的 Model 数据

**迁移前：**
```typescript
// 需要处理两种不同的 Model 类型
function processModel(model: Model | ModelById) {
  // 访问公共字段需要类型检查
  console.log(`Name: ${model.name}, Type: ${model.type}`);
  
  // 处理 modelVersions 需要额外的逻辑
  if ('modelVersions' in model) {
    console.log(`Versions: ${model.modelVersions.length}`);
  }
}
```

**迁移后：**
```typescript
import { ModelAny, toModelCore } from 'civitai-api';

function processModel(model: ModelAny) {
  // 提取核心字段（所有端点都安全）
  const core = toModelCore(model);
  console.log(`Name: ${core.name}, Type: ${core.type}`);
  console.log(`Versions: ${core.modelVersions.length}, Tags: ${core.tags.length}`);
  
  // 可以安全访问所有端点共有的字段
  if (core.creator) {
    console.log(`Creator: ${core.creator.username}`);
  }
}
```

#### 示例 3：处理 ModelVersion 数组

**迁移前：**
```typescript
// 需要处理不同类型的数组
function findVersionById(versions: (ModelsVersion | ModelByIdVersion | ModelVersionEndpoint)[], id: number) {
  return versions.find(v => v.id === id);
}

// 使用时需要类型断言
const found = findVersionById(versions, 123);
if (found) {
  // 需要检查类型
  if ('modelId' in found) {
    console.log(`Found model-version: ${found.modelId}`);
  }
}
```

**迁移后：**
```typescript
import { ModelVersionAny, findModelVersion } from 'civitai-api';

// 使用内置的查找函数
const found = findModelVersion(versions, 123);
if (found) {
  // 可以使用统一类型系统的工具函数
  const modelId = getModelId(found);
  if (modelId !== undefined) {
    console.log(`Found model-version: ${modelId}`);
  }
}
```

#### 示例 4：处理 Model 数组

**迁移前：**
```typescript
// 需要处理两种不同的 Model 类型数组
function findModelById(models: (Model | ModelById)[], id: number) {
  return models.find(m => m.id === id);
}

// 使用时需要类型检查
const found = findModelById(models, 456);
if (found) {
  // 需要检查类型以确定可用的字段
  console.log(`Found model: ${found.name}`);
}
```

**迁移后：**
```typescript
import { ModelAny, findModel } from 'civitai-api';

// 使用内置的查找函数
const found = findModel(models, 456);
if (found) {
  // 可以使用统一类型系统的工具函数
  const core = toModelCore(found);
  console.log(`Found model: ${core.name}, Type: ${core.type}`);
}
```

#### 示例 5：创建通用 ModelVersion 组件

**迁移前：**
```typescript
// 需要为每个端点类型创建不同的组件
interface ModelsVersionCardProps {
  version: ModelsVersion;
}

interface ModelByIdVersionCardProps {
  version: ModelByIdVersion;
}

interface ModelVersionEndpointCardProps {
  version: ModelVersionEndpoint;
}

// 或者使用复杂的联合类型
type VersionCardProps = {
  version: ModelsVersion | ModelByIdVersion | ModelVersionEndpoint;
};
```

**迁移后：**
```typescript
import { ModelVersionAny, toModelVersionCore } from 'civitai-api';

interface VersionCardProps {
  version: ModelVersionAny;
}

function VersionCard({ version }: VersionCardProps) {
  // 提取核心字段用于显示
  const core = toModelVersionCore(version);
  
  return (
    <div>
      <h3>{core.name}</h3>
      <p>Base Model: {core.baseModel}</p>
      <p>Files: {core.files.length}</p>
      <p>Images: {core.images.length}</p>
    </div>
  );
}
```

#### 示例 6：创建通用 Model 组件

**迁移前：**
```typescript
// 需要为每个端点类型创建不同的组件
interface ModelsEndpointModelCardProps {
  model: Model;
}

interface ModelByIdEndpointModelCardProps {
  model: ModelById;
}

// 或者使用联合类型
type ModelCardProps = {
  model: Model | ModelById;
};
```

**迁移后：**
```typescript
import { ModelAny, toModelCore } from 'civitai-api';

interface ModelCardProps {
  model: ModelAny;
}

function ModelCard({ model }: ModelCardProps) {
  // 提取核心字段用于显示
  const core = toModelCore(model);
  
  return (
    <div>
      <h2>{core.name}</h2>
      <p>Type: {core.type}</p>
      <p>Versions: {core.modelVersions.length}</p>
      <p>Tags: {core.tags.join(', ')}</p>
      {core.creator && <p>Creator: {core.creator.username}</p>}
    </div>
  );
}
```

### 步骤 4：处理端点特定逻辑

如果需要访问端点特定字段，使用类型守卫：

#### 对于 ModelVersion：
```typescript
import { isModelsVersion, isModelByIdVersion, isModelVersionEndpoint } from 'civitai-api';

function processVersionWithEndpointLogic(version: ModelVersionAny) {
  if (isModelsVersion(version)) {
    // TypeScript 知道这是 ModelsVersion
    console.log(`Models endpoint: index=${version.index}, availability=${version.availability}`);
  } else if (isModelByIdVersion(version)) {
    // TypeScript 知道这是 ModelByIdVersion
    console.log(`Model-by-ID endpoint: index=${version.index}, availability=${version.availability}`);
  } else if (isModelVersionEndpoint(version)) {
    // TypeScript 知道这是 ModelVersionEndpoint
    console.log(`Model-version endpoint: modelId=${version.modelId}`);
  }
}

#### 对于 Model：
```typescript
import { isModelsEndpointModel, isModelByIdEndpointModel } from 'civitai-api';

function processModelWithEndpointLogic(model: ModelAny) {
  if (isModelsEndpointModel(model)) {
    // TypeScript 知道这是 ModelsEndpointModel
    console.log(`Models endpoint: first version index=${model.modelVersions[0]?.index}`);
  } else if (isModelByIdEndpointModel(model)) {
    // TypeScript 知道这是 ModelByIdEndpointModel
    console.log(`Model-by-ID endpoint: first version index=${model.modelVersions[0]?.index}`);
  }
}
```

## 最佳实践

### 1. 优先使用核心字段

当只需要基本信息时，使用 `toModelVersionCore()`：

```typescript
// 好：简单、安全
const core = toModelVersionCore(version);
console.log(core.name, core.baseModel, core.files.length);

// 不好：复杂的类型检查
if ('name' in version) {
  console.log(version.name);
}
```

### 2. 使用工具函数访问端点特定字段

```typescript
// 好：使用工具函数
const modelId = getModelId(version);
const index = getIndex(version);
const availability = getAvailability(version);

// 不好：手动类型检查
let modelId: number | undefined;
if ('modelId' in version) {
  modelId = (version as any).modelId;
}
```

### 3. 逐步迁移

不需要一次性迁移所有代码：

```typescript
// 阶段 1：在新代码中使用统一类型
function newFeature(version: ModelVersionAny) {
  // 使用统一类型系统
}

// 阶段 2：逐步更新现有代码
function legacyFeature(version: ModelsVersion | ModelByIdVersion | ModelVersionEndpoint) {
  // 暂时保持原样，稍后迁移
}

// 阶段 3：创建适配器函数
function adaptToUnifiedType(version: ModelsVersion | ModelByIdVersion | ModelVersionEndpoint): ModelVersionAny {
  return version as ModelVersionAny;
}
```

### 4. 保持向后兼容

```typescript
// 提供两种接口
export function processVersion(version: ModelVersionAny): void;
export function processVersion(version: ModelsVersion | ModelByIdVersion | ModelVersionEndpoint): void {
  // 内部转换为统一类型
  const unifiedVersion = version as ModelVersionAny;
  // 使用统一类型系统处理
  const core = toModelVersionCore(unifiedVersion);
  // ...
}
```

## 常见问题

### Q1：迁移后性能会受影响吗？

**A：** 不会。统一类型系统只是 TypeScript 类型，运行时没有任何开销。工具函数是简单的 JavaScript 函数，性能影响可以忽略不计。

### Q2：我需要迁移所有代码吗？

**A：** 不需要。统一类型系统是可选的。您可以：
- 在新代码中使用统一类型
- 逐步迁移现有代码
- 在需要时混合使用两种类型系统

### Q3：如何处理第三方库的依赖？

**A：** 如果第三方库使用原始类型，您可以：
1. 创建适配器函数
2. 在边界处进行类型转换
3. 请求库作者支持统一类型

### Q4：统一类型系统支持所有字段吗？

**A：** `ModelVersionCore` 只包含所有端点共有的字段。如果需要访问端点特定字段，使用：
- 类型守卫 (`isModelsVersion`, `isModelByIdVersion`, `isModelVersionEndpoint`)
- 工具函数 (`getModelId`, `getIndex`, `getAvailability`, `getPublishedAt`)

## 示例代码

查看完整示例：
- `examples/unified-types-demo.ts` - 统一类型系统使用示例
- `examples/basic-usage.ts` - 基本使用示例（已更新）

## 总结

统一类型系统提供了：
1. **简化** - 使用单一接口处理所有端点数据
2. **安全** - 类型安全的工具函数
3. **灵活** - 渐进式迁移，向后兼容
4. **可维护** - 减少代码重复，提高可读性

开始迁移吧！如果您遇到任何问题，请查看示例代码或提交 issue。
