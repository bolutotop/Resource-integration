'use server';

import { prisma } from '@/lib/prisma'; // 采用单例模式，防止热重载产生过多连接
import { ScraperManager } from '@/lib/scraper/ScraperManager';

/**
 * 核心功能：批量同步指定源、指定页码范围的数据
 * 集成了安全 Tag 过滤与 upsert 幂等写入
 */
export async function syncSourceData(sourceName: string, startPage: number, endPage: number) {
  const source = ScraperManager.getSource(sourceName);
  if (!source) return { success: false, message: "源不存在" };

  let totalCount = 0;

  try {
    // 循环页码：从 startPage 爬到 endPage
    for (let page = startPage; page <= endPage; page++) {
      console.log(`[Sync] 正在抓取第 ${page} 页...`);
      const items = await source.scrapeCatalog(page);
      
      if (!items || items.length === 0) {
        console.log(`[Sync] 第 ${page} 页无数据，跳过`);
        continue;
      }

      // 并发写入数据库
      await Promise.all(items.map(async (item) => {
        
        // 1. 处理标签关联 (connectOrCreate)
        const validTags = item.tags ? item.tags.filter(t => t && t.trim() !== '') : [];
        
        const tagOperations = validTags.length > 0 
          ? {
              connectOrCreate: validTags.map((tagName) => ({
                where: { name: tagName },
                create: { name: tagName }
              }))
            }
          : undefined;

        // 2. 写入/更新视频
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
            tags: tagOperations, // 关联标签
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
            videoUrl: "", // 留空，待点击时解析
            rating: item.rating || 0,
            tags: tagOperations // 关联标签
          }
        });
      }));

      totalCount += items.length;
      console.log(`✅ [Sync] 第 ${page} 页同步完成，入库 ${items.length} 条`);
    }

    return { success: true, message: `同步完成，共抓取 ${endPage - startPage + 1} 页，入库 ${totalCount} 条数据` };

  } catch (error: any) {
    console.error("同步失败:", error);
    return { success: false, message: error.message || "未知错误" };
  }
}

/**
 * 新增：同步首页数据 (推荐与最近更新)
 * 使用事务确保数据标记的一致性
 */
export async function syncHomeData(sourceName: string = 'Age') {
  const source = ScraperManager.getSource(sourceName);
  // 检查是否支持 scrapeHome
  if (!source || !(source as any).scrapeHome) return { success: false, message: "源不支持首页抓取" };

  try {
    // 1. 抓取
    const { recommended, recent } = await (source as any).scrapeHome();

    // 2. 数据库事务操作
    await prisma.$transaction(async (tx) => {
      // A. 重置所有标记 (清除旧的推荐/更新状态)
      await tx.video.updateMany({
        data: { isRecommended: false, isRecent: false }
      });

      // B. 写入推荐列表 (存在则更新标记，不存在则创建)
      for (const item of recommended) {
        await tx.video.upsert({
          where: { sourceId: item.sourceId },
          update: { isRecommended: true, updatedAt: new Date() }, // 只更新标记，不覆盖详情页可能已有的丰富数据
          create: {
            sourceId: item.sourceId,
            title: item.title,
            coverUrl: item.coverUrl,
            isRecommended: true,
            type: "动漫",
            status: item.status,
            videoUrl: ""
          }
        });
      }

      // C. 写入最近更新列表
      for (const item of recent) {
        await tx.video.upsert({
          where: { sourceId: item.sourceId },
          update: { isRecent: true, status: item.status, updatedAt: new Date() }, // 更新状态(第几集)
          create: {
            sourceId: item.sourceId,
            title: item.title,
            coverUrl: item.coverUrl,
            isRecent: true,
            type: "动漫",
            status: item.status,
            videoUrl: ""
          }
        });
      }
    });

    return { success: true, message: `首页同步成功 (推荐:${recommended.length}, 更新:${recent.length})` };
  } catch (error: any) {
    console.error("首页同步失败:", error);
    return { success: false, message: error.message };
  }
}

/**
 * 获取爬虫源的详细数据 (实时抓取，不存库)
 */
export async function getScraperDetailData(sourceId: string, sourceName: string = 'Age') {
  try {
    const source = ScraperManager.getSource(sourceName);
    if (!source) return { success: false, data: null };

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