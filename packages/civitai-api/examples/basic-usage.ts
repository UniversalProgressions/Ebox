import { createCivitaiClient } from '../src/v1/index';
import {
  toModelCore,
  isModelsEndpointModel,
  isModelByIdEndpointModel,
  findModel,
} from '../src/v1/models/model-version-abstract';
import {
  EXAMPLE_MODEL_ID,
  EXAMPLE_VERSION_ID,
  LEGACY_EXAMPLE_MODEL_ID,
} from './shared-ids';

async function main() {
  console.log('=== Civitai API Client 使用示例 ===\n');

  // 1. 创建客户端
  console.log('1. 创建客户端...');
  const client = createCivitaiClient({
    apiKey: process.env.CIVITAI_API_KEY, // 从环境变量读取API密钥
    timeout: 30000, // 缩短为30秒超时，避免长时间等待
    validateResponses: false, // 不验证响应（生产环境建议开启）
  });

  console.log('客户端配置:', client.getConfig());
  console.log('');

  // 2. 获取创作者列表
  console.log('2. 获取创作者列表...');
  console.log('注意: Civitai API的creators端点可能不稳定，有时会返回500错误');
  console.log('这是API服务端的问题，不是客户端的问题\n');
  
  try {
    const creatorsResult = await client.creators.list({
      limit: 3,
      page: 1,
    });

    if (creatorsResult.isOk()) {
      const creators = creatorsResult.value;
      console.log(`找到 ${creators.metadata.totalItems} 个创作者`);
      console.log(`当前页: ${creators.metadata.currentPage}/${creators.metadata.totalPages}`);
      console.log(`每页大小: ${creators.metadata.pageSize}`);
      console.log('前3个创作者:');
      creators.items.slice(0, 3).forEach((creator, index) => {
        console.log(`  ${index + 1}. ${creator.username} (${creator.modelCount} 个模型)`);
      });
    } else {
      console.log('获取创作者列表失败（这可能是API服务端的问题）:');
      const error = creatorsResult.error;
      console.log(`错误类型: ${error.type}`);
      // 安全地访问可能存在的status属性
      if ('status' in error && error.status !== undefined) {
        console.log(`状态码: ${error.status}`);
      }
      console.log(`错误信息: ${error.message}`);
    }
  } catch (error) {
    console.log('调用creators API时发生异常:');
    console.log(error);
  }
  console.log('');

  // 3. 获取模型列表
  console.log('3. 获取模型列表...');
  const modelsResult = await client.models.list({
    limit: 2,
    types: ['Checkpoint'],
    sort: 'Highest Rated',
  });

  if (modelsResult.isOk()) {
    const models = modelsResult.value;
    console.log(`找到 ${models.metadata.totalItems} 个模型`);
    console.log(`当前页: ${models.metadata.currentPage}/${models.metadata.totalPages}`);
    console.log('前2个模型:');
    models.items.slice(0, 2).forEach((model, index) => {
      console.log(`  ${index + 1}. ${model.name} (${model.type})`);
      console.log(`     创建者: ${model.creator?.username || '未知'}`);
      console.log(`     下载次数: ${model.stats.downloadCount}`);
      console.log(`     版本数: ${model.modelVersions.length}`);
    });
  } else {
    console.error('获取模型列表失败:', modelsResult.error);
  }
  console.log('');

  // 4. 获取单个模型详情
  console.log('4. 获取单个模型详情...');
  const modelId = LEGACY_EXAMPLE_MODEL_ID; // 使用共享的示例模型ID
  const modelResult = await client.models.getById(modelId);

  if (modelResult.isOk()) {
    const model = modelResult.value;
    console.log(`模型: ${model.name}`);
    console.log(`描述: ${model.description?.substring(0, 100)}...`);
    console.log(`类型: ${model.type}`);
    console.log(`NSFW: ${model.nsfw}`);
    console.log(`标签: ${model.tags.join(', ')}`);
    console.log(`版本数: ${model.modelVersions.length}`);
  } else {
    console.error(`获取模型 ${modelId} 详情失败:`, modelResult.error);
  }
  console.log('');

  // 5. 获取标签列表
  console.log('5. 获取标签列表...');
  const tagsResult = await client.tags.list({
    limit: 5,
  });

  if (tagsResult.isOk()) {
    const tags = tagsResult.value;
    console.log(`找到 ${tags.metadata.totalItems} 个标签`);
    console.log('前5个标签:');
    tags.items.slice(0, 5).forEach((tag, index) => {
      console.log(`  ${index + 1}. ${tag.name} (${tag.modelCount} 个模型)`);
    });
  } else {
    console.error('获取标签列表失败:', tagsResult.error);
  }

  console.log('');

  // 6. 使用统一类型系统
  console.log('6. 使用统一类型系统...');
  
  // 从不同端点获取数据
  const [unifiedModelsResult, unifiedModelByIdResult] = await Promise.all([
    client.models.list({ limit: 1 }),
    client.models.getById(LEGACY_EXAMPLE_MODEL_ID), // 使用共享的示例模型ID
  ]);

  if (unifiedModelsResult.isOk() && unifiedModelByIdResult.isOk()) {
    const modelFromList = unifiedModelsResult.value.items[0]!;
    const modelById = unifiedModelByIdResult.value;
    
    console.log('从不同端点获取的模型数据:');
    console.log(`  列表中的模型: ${modelFromList.name} (${modelFromList.type})`);
    console.log(`  详细模型: ${modelById.name} (${modelById.type})`);
    
    // 使用统一类型系统的工具函数
    console.log('\n使用统一类型系统的工具函数:');
    
    // 创建模型数组
    const models = [modelFromList, modelById];
    
    // 提取核心字段
    models.forEach((model, index) => {
      const core = toModelCore(model as any);
      console.log(`  模型 ${index + 1}: ${core.name}`);
      console.log(`    类型: ${core.type}, 版本数: ${core.modelVersions.length}`);
      console.log(`    标签: ${core.tags.slice(0, 3).join(', ')}${core.tags.length > 3 ? '...' : ''}`);
    });
    
    // 使用类型守卫
    console.log('\n使用类型守卫:');
    models.forEach((model, index) => {
      if (isModelsEndpointModel(model as any)) {
        console.log(`  模型 ${index + 1}: 来自 /models 端点`);
      } else if (isModelByIdEndpointModel(model as any)) {
        console.log(`  模型 ${index + 1}: 来自 /models/{id} 端点`);
      }
    });
    
    // 使用查找函数
    console.log('\n使用查找函数:');
    const foundModel = findModel(models as any, LEGACY_EXAMPLE_MODEL_ID);
    if (foundModel) {
      const core = toModelCore(foundModel);
      console.log(`  找到模型 ID ${LEGACY_EXAMPLE_MODEL_ID}: ${core.name}`);
    }
  } else {
    console.log('获取统一类型数据失败');
  }

  console.log('\n7. 使用统一客户端端点...');
  
  try {
    // 使用统一的模型端点
    const unifiedResult = await client.unifiedModels.getUnifiedById(EXAMPLE_MODEL_ID);
    
    if (unifiedResult.isOk()) {
      const unifiedModel = unifiedResult.value;
      console.log(`统一模型端点: ${unifiedModel.name} (${unifiedModel.type})`);
      console.log(`版本数: ${unifiedModel.modelVersions.length}`);
      
      // 获取核心字段
      const coreResult = await client.unifiedModels.getCoreById(EXAMPLE_MODEL_ID);
      if (coreResult.isOk()) {
        const core = coreResult.value;
        console.log(`核心字段: ${core.name}, ${core.type}, ${core.modelVersions.length} 个版本`);
      }
    }
  } catch (error) {
    console.log('统一端点调用失败:', error);
  }

  console.log('\n=== 示例完成 ===');
}

// 运行示例
main().catch(console.error);
