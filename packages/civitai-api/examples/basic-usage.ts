import { createCivitaiClient } from '../src/v1/client/index.js';

async function main() {
  console.log('=== Civitai API Client 使用示例 ===\n');

  // 1. 创建客户端
  console.log('1. 创建客户端...');
  const client = createCivitaiClient({
    apiKey: process.env.CIVITAI_API_KEY, // 从环境变量读取API密钥
    timeout: 60000, // 60秒超时
    validateResponses: false, // 不验证响应（生产环境建议开启）
  });

  console.log('客户端配置:', client.getConfig());
  console.log('');

  // 2. 获取创作者列表
  console.log('2. 获取创作者列表...');
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
    console.error('获取创作者列表失败:', creatorsResult.error);
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
  const modelId = 3036; // 示例模型ID
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

  console.log('\n=== 示例完成 ===');
}

// 运行示例
main().catch(console.error);
