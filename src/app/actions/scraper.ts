'use server';

import { PrismaClient } from '@prisma/client';
import { ScraperManager } from '@/lib/scraper/ScraperManager';

/**
 * 最佳实践建议：
 * 将 Prisma 实例化移至 @/lib/prisma.ts，并在开发环境下挂载到 globalThis。
 * 这里为了保持你的结构直接使用，但大型项目中请务必拆分。
 */
const prisma = new PrismaClient();

/**
 * 核心功能：批量同步指定源、指定页码范围的数据
 */
export async function syncSourceData(sourceName: string, startPage: number, endPage: number) {
  const source = ScraperManager.getSource(sourceName);
  if (!source) return { success: false, message: "源不存在" };

  let totalCount = 0;

  try {
    for (let page = startPage; page <= endPage; page++) {
      // 1. 爬取列表数据
      const items = await source.scrapeCatalog(page);
      
      if (!items || items.length === 0) continue;

      // 2. 批量写入数据库 (使用 upsert 确保幂等性)
      // 注意：Promise.all 在并发量极大时可能导致连接池溢出，生产环境建议控制并发或使用 transaction
      await Promise.all(items.map(item => 
        prisma.video.upsert({
          where: { sourceId: item.sourceId },
          update: {
            title: item.title,
            coverUrl: item.coverUrl,
            description: item.desc,
            status: item.status,
            updatedAt: new Date()
          },
          create: {
            sourceId: item.sourceId,
            title: item.title,
            coverUrl: item.coverUrl,
            type: item.type,
            description: item.desc,
            status: item.status,
            videoUrl: "", 
            rating: item.rating || 0
          }
        })
      ));

      totalCount += items.length;
      console.log(`✅ [Sync] 第 ${page} 页同步完成，入库 ${items.length} 条`);
      
      // 建议：请求间隔，避免被目标站封禁 IP
      // await new Promise(r => setTimeout(r, 1000));
    }

    return { success: true, message: `同步完成，共入库 ${totalCount} 条数据` };

  } catch (error: any) {
    console.error("同步失败:", error);
    return { success: false, message: error.message || "未知错误" };
  }
}

/**
 * 修改后：获取爬虫源的详细数据 (包含详情、播放列表等)
 * @param sourceId 外部源的 ID
 * @param sourceName 爬虫源名称
 */
export async function getScraperDetailData(sourceId: string, sourceName: string = 'Age') {
  try {
    const source = ScraperManager.getSource(sourceName);
    
    // 校验源是否存在
    if (!source) {
      console.error(`[Scraper] 找不到名为 ${sourceName} 的源`);
      return { success: false, data: null };
    }

    // 实时爬取详情页（需确保 source.scrapeDetail 返回的是 ScraperFullDetail 对象）
    const detailData = await source.scrapeDetail(sourceId);
    
    return { 
      success: true, 
      data: detailData 
    };
  } catch (error) {
    console.error("获取详情失败:", error);
    return { success: false, data: null, message: "无法获取番剧详情" };
  }
}

/**
 * 解析具体集数的视频地址
 * @param playUrl 爬虫源提供的原始播放页面 URL
 * @param sourceName 源名称
 */
export async function getScraperVideo(playUrl: string, sourceName: string = 'Age') {
  try {
    const source = ScraperManager.getSource(sourceName);
    if (!source) return { success: false, message: "源不存在" };

    const videoData = await source.scrapeVideo(playUrl);
    
    if (videoData) {
      return { success: true, data: videoData };
    } else {
      return { success: false, message: "解析失败" };
    }
  } catch (error) {
    console.error(`[Scraper] 解析视频地址异常:`, error);
    return { success: false, message: "解析异常" };
  }
}