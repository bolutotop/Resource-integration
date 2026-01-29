'use server';

import { PrismaClient } from '@prisma/client';
import { ScraperManager } from '@/lib/scraper/ScraperManager';

/**
 * 最佳实践：
 * 建议在大型项目中将此实例化移至 @/lib/prisma.ts 以防止热重载导致连接数过多
 */
const prisma = new PrismaClient();

/**
 * 核心功能：批量同步指定源、指定页码范围的数据
 * 集成了安全 Tag 过滤与 upsert 幂等写入
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

      // 2. 批量写入数据库
      await Promise.all(items.map(async (item) => {
        
        // --- 核心：安全地处理 Tags 关联 ---
        // 过滤掉 null、undefined 以及空字符串，防止 Prisma 报错
        const validTags = item.tags ? item.tags.filter(t => t && t.trim() !== '') : [];
        
        const tagOperations = validTags.length > 0 
          ? {
              connectOrCreate: validTags.map((tagName: string) => ({
                where: { name: tagName },
                create: { name: tagName }
              }))
            }
          : undefined;

        return prisma.video.upsert({
          where: { sourceId: item.sourceId },
          update: {
            title: item.title,
            coverUrl: item.coverUrl,
            description: item.desc,
            status: item.status,
            type: item.type,
            year: item.year || null,
            studio: (item as any).studio || null,
            tags: tagOperations, // 关联更新
            updatedAt: new Date()
          },
          create: {
            sourceId: item.sourceId,
            title: item.title,
            coverUrl: item.coverUrl,
            type: item.type || "动漫",
            description: item.desc,
            status: item.status,
            year: item.year || null,
            studio: (item as any).studio || null,
            videoUrl: "", 
            rating: item.rating || 0,
            tags: tagOperations // 关联创建
          }
        });
      }));

      totalCount += items.length;
      console.log(`✅ [Sync] 第 ${page} 页同步完成，入库 ${items.length} 条`);
    }

    return { success: true, message: `同步完成，共入库 ${totalCount} 条数据` };

  } catch (error: any) {
    console.error("同步失败:", error);
    return { success: false, message: error.message || "未知错误" };
  }
}

/**
 * 获取爬虫源的详细数据 (实时抓取)
 */
export async function getScraperDetailData(sourceId: string, sourceName: string = 'Age') {
  try {
    const source = ScraperManager.getSource(sourceName);
    if (!source) {
      console.error(`[Scraper] 找不到名为 ${sourceName} 的源`);
      return { success: false, data: null };
    }

    const detailData = await source.scrapeDetail(sourceId);
    return { success: true, data: detailData };
  } catch (error) {
    console.error("获取详情失败:", error);
    return { success: false, data: null, message: "无法获取番剧详情" };
  }
}

/**
 * 解析具体集数的视频播放地址
 */
export async function getScraperVideo(playUrl: string, sourceName: string = 'Age') {
  try {
    const source = ScraperManager.getSource(sourceName);
    if (!source) return { success: false, message: "源不存在" };

    const videoData = await source.scrapeVideo(playUrl);
    
    if (videoData) {
      return { success: true, data: videoData };
    } else {
      return { success: false, message: "视频解析失败" };
    }
  } catch (error) {
    console.error(`[Scraper] 解析视频地址异常:`, error);
    return { success: false, message: "解析异常" };
  }
}