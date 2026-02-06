// src/app/actions/scraper.ts
'use server';

import { prisma } from '@/lib/prisma';
import { ScraperManager } from '@/lib/scraper/ScraperManager';

/**
 * 修改后：同步指定源、指定分类、指定页码、指定年份的数据
 * 变更点：由原来的 loop 范围抓取改为单页抓取，并增加了 category 和 year 参数
 */
export async function syncCatalog(sourceName: string, page: number = 1, category: string = '日韩动漫', year: string = '') {
  const source = ScraperManager.getSource(sourceName);
  if (!source) return { success: false, message: "源不存在" };

  try {
    console.log(`[Sync] 正在抓取 ${sourceName} - ${category} - ${year || '全部年份'} - 第 ${page} 页...`);
    
    // 传入 category 和 year 调用源的抓取方法
    const items = await source.scrapeCatalog(page, category, year);
    
    if (!items || items.length === 0) {
      return { success: true, count: 0, message: "本页无数据" };
    }

    for (const item of items) {
      // 准备更新的数据对象
      // 这里的 upsert 逻辑简化了，专注于基础信息同步
      const updateData: any = { 
        updatedAt: new Date(),
        status: item.status,
        // 注意：这里移除了 title/coverUrl/type 的默认更新，
        // 如果你需要保持图片/标题与源站实时同步，请将它们加回来。
      };
      
      // 只有当爬虫明确抓到了年份（也就是我们在YhmcSource里强行赋值的year），才更新数据库的year
      // 这样防止"全部年份"的抓取覆盖掉已有的年份信息
      if (item.year) {
        updateData.year = item.year;
      }

      await prisma.video.upsert({
        where: { 
          sourceSite_sourceId: { sourceId: item.sourceId, sourceSite: sourceName }
        },
        update: updateData,
        create: {
          sourceId: item.sourceId,
          sourceSite: sourceName,
          title: item.title,
          coverUrl: item.coverUrl,
          type: item.type, // 这里会写入 "国产动漫"、"电影" 等
          year: item.year || "", // 创建时，如果有年份就存，没有就空
          status: item.status,
          description: item.desc,
          videoUrl: "" 
        }
      });
    }

    return { success: true, count: items.length, message: `成功同步 ${items.length} 条数据` };
  } catch (error: any) {
    console.error(`[Sync Error] ${sourceName} 第 ${page} 页失败:`, error);
    return { success: false, message: error.message || "同步异常" };
  }
}

/**
 * 同步首页数据，支持 Age(固定结构) 和 Yhmc(动态Section) 多源
 * (保持原有逻辑不变)
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

/**
 * 获取详情页数据
 */
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

/**
 * 获取视频播放地址
 */
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