// src/app/actions/scraper.ts
'use server';

import { prisma } from '@/lib/prisma';
import { ScraperManager } from '@/lib/scraper/ScraperManager';

/**
 * 核心功能：批量同步指定源、指定页码范围的数据
 */
export async function syncSourceData(sourceName: string, startPage: number, endPage: number) {
  const source = ScraperManager.getSource(sourceName);
  if (!source) return { success: false, message: "源不存在" };

  let totalCount = 0;

  try {
    for (let page = startPage; page <= endPage; page++) {
      console.log(`[Sync] 正在抓取第 ${page} 页...`);
      const items = await source.scrapeCatalog(page);
      
      if (!items || items.length === 0) {
        console.log(`[Sync] 第 ${page} 页无数据，跳过`);
        continue;
      }

      await Promise.all(items.map(async (item) => {
        const validTags = item.tags ? item.tags.filter(t => t && t.trim() !== '') : [];
        const tagOperations = validTags.length > 0 
          ? {
              connectOrCreate: validTags.map((tagName) => ({
                where: { name: tagName },
                create: { name: tagName }
              }))
            }
          : undefined;

        return prisma.video.upsert({
          where: {
            sourceSite_sourceId: {
              sourceId: item.sourceId,
              sourceSite: sourceName
            }
          },
          update: {
            title: item.title,
            coverUrl: item.coverUrl,
            description: item.desc,
            status: item.status,
            type: item.type,
            year: item.year || null,
            studio: (item as any).studio || null,
            tags: tagOperations,
            updatedAt: new Date()
          },
          create: {
            sourceId: item.sourceId,
            sourceSite: sourceName,
            title: item.title,
            coverUrl: item.coverUrl,
            type: item.type || "动漫",
            description: item.desc,
            status: item.status,
            year: item.year || null,
            studio: (item as any).studio || null,
            videoUrl: "",
            rating: item.rating || 0,
            tags: tagOperations
          }
        });
      }));

      totalCount += items.length;
    }

    return { success: true, message: `同步完成，共 ${totalCount} 条数据` };
  } catch (error: any) {
    console.error("同步失败:", error);
    return { success: false, message: error.message || "未知错误" };
  }
}

/**
 * 修改后：同步首页数据，支持 Age(固定结构) 和 Yhmc(动态Section) 多源
 */
export async function syncHomeData(sourceName: string) {
  const source = ScraperManager.getSource(sourceName);
  // 检查是否具备首页抓取能力
  if (!source || !(source as any).scrapeHome) {
    return { success: false, message: "该源不支持首页抓取" };
  }

  try {
    const homeData = await (source as any).scrapeHome();

    await prisma.$transaction(async (tx) => {
      // 1. 重置该源的旧标记，防止首页下架的内容依然带标
      await tx.video.updateMany({
        where: { sourceSite: sourceName },
        data: { isRecommended: false, isRecent: false }
      });

      // 2. 处理 Age 类型的结构 { recommended: [], recent: [] }
      if (homeData.recommended && homeData.recent) {
        // 处理推荐列表
        for (const item of homeData.recommended) {
          await tx.video.upsert({
            where: { sourceSite_sourceId: { sourceId: item.sourceId, sourceSite: sourceName } },
            update: { isRecommended: true, updatedAt: new Date() },
            create: {
              sourceId: item.sourceId,
              sourceSite: sourceName,
              title: item.title,
              coverUrl: item.coverUrl,
              isRecommended: true,
              type: "动漫",
              status: item.status,
              videoUrl: ""
            }
          });
        }
        // 处理更新列表
        for (const item of homeData.recent) {
          await tx.video.upsert({
            where: { sourceSite_sourceId: { sourceId: item.sourceId, sourceSite: sourceName } },
            update: { isRecent: true, status: item.status, updatedAt: new Date() },
            create: {
              sourceId: item.sourceId,
              sourceSite: sourceName,
              title: item.title,
              coverUrl: item.coverUrl,
              isRecent: true,
              type: "动漫",
              status: item.status,
              videoUrl: ""
            }
          });
        }
      } 
      
      // 3. 处理 Yhmc 类型的动态 Section 结构 { sections: [...] }
      else if (homeData.sections && Array.isArray(homeData.sections)) {
        for (const section of homeData.sections) {
          // 根据标题关键词判断权重
          const isRec = section.title.includes("热映") || section.title.includes("推荐");
          
          for (const item of section.items) {
            await tx.video.upsert({
              where: { sourceSite_sourceId: { sourceId: item.sourceId, sourceSite: sourceName } },
              update: { 
                isRecommended: isRec, 
                isRecent: !isRec, 
                type: item.type || "动漫",
                status: item.status,
                updatedAt: new Date() 
              },
              create: {
                sourceId: item.sourceId,
                sourceSite: sourceName,
                title: item.title,
                coverUrl: item.coverUrl,
                type: item.type || "动漫",
                status: item.status,
                isRecommended: isRec,
                isRecent: !isRec,
                videoUrl: ""
              }
            });
          }
        }
      }
    });

    return { success: true, message: `首页同步成功 (${sourceName})` };
  } catch (error: any) {
    console.error("首页同步失败:", error);
    return { success: false, message: error.message || "未知错误" };
  }
}

export async function getScraperDetailData(sourceId: string, sourceName: string) {
  try {
    const source = ScraperManager.getSource(sourceName);
    if (!source) return { success: false, data: null };
    const detailData = await source.scrapeDetail(sourceId);
    return { success: true, data: detailData };
  } catch (error) {
    return { success: false, data: null, message: "无法获取详情" };
  }
}

export async function getScraperVideo(playUrl: string, sourceName: string) {
  try {
    const source = ScraperManager.getSource(sourceName);
    if (!source) return { success: false, message: "源不存在" };
    const videoData = await source.scrapeVideo(playUrl);
    return videoData ? { success: true, data: videoData } : { success: false, message: "视频解析失败" };
  } catch (error) {
    return { success: false, message: "解析异常" };
  }
}