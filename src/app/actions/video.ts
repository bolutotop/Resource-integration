'use server';

import { PrismaClient } from '@prisma/client';
import { revalidatePath } from 'next/cache';
import { getSession } from './user-auth';

const prisma = new PrismaClient();

// 1. 定义接口
interface VideoFormData {
  title: string;
  videoUrl: string;
  coverUrl: string;
  description: string;
  rating: string;
  categories: string; 
  tags: string;       
  type: string;
}

// 2. 添加视频逻辑
export async function addVideo(formData: VideoFormData) {
  const categoryList = formData.categories.split(/[,，]/).map(s => s.trim()).filter(Boolean);
  const tagList = formData.tags.split(/[,，]/).map(s => s.trim()).filter(Boolean);

  try {
    const newVideo = await prisma.video.create({
      data: {
        title: formData.title,
        videoUrl: formData.videoUrl,
        coverUrl: formData.coverUrl, 
        description: formData.description,
        rating: parseFloat(formData.rating) || 0,
        type: formData.type,
        categories: {
          connectOrCreate: categoryList.map(name => ({
            where: { name },
            create: { name },
          })),
        },
        tags: {
          connectOrCreate: tagList.map(name => ({
            where: { name },
            create: { name },
          })),
        },
      },
    });

    revalidatePath('/');
    revalidatePath('/admin');
    revalidatePath('/admin/videos');
    
    return { success: true, message: `"${newVideo.title}" 添加成功` };
  } catch (error) {
    console.error("添加视频失败:", error);
    return { success: false, message: "数据库写入失败" };
  }
}

// 3. 更新视频逻辑
export async function updateVideo(id: number, formData: VideoFormData) {
  const categoryList = formData.categories.split(/[,，]/).map(s => s.trim()).filter(Boolean);
  const tagList = formData.tags.split(/[,，]/).map(s => s.trim()).filter(Boolean);

  try {
    await prisma.video.update({
      where: { id },
      data: {
        title: formData.title,
        videoUrl: formData.videoUrl,
        coverUrl: formData.coverUrl,
        description: formData.description,
        rating: parseFloat(formData.rating) || 0,
        type: formData.type,
        categories: {
          set: [], 
          connectOrCreate: categoryList.map(name => ({
            where: { name },
            create: { name },
          })),
        },
        tags: {
          set: [],
          connectOrCreate: tagList.map(name => ({
            where: { name },
            create: { name },
          })),
        },
      },
    });

    revalidatePath('/');
    revalidatePath('/admin/videos');
    revalidatePath(`/movies/${id}`);
    
    return { success: true, message: "更新成功" };
  } catch (error) {
    console.error(error);
    return { success: false, message: "更新失败" };
  }
}

// 4. 删除视频逻辑
export async function deleteVideo(id: number) {
  try {
    await prisma.video.delete({
      where: { id },
    });
    revalidatePath('/admin/videos'); 
    revalidatePath('/'); 
    return { success: true, message: "删除成功" };
  } catch (error) {
    return { success: false, message: "删除失败" };
  }
}

// src/app/actions/video.ts

export async function getVideos(params: {
  source?: string;     // <--- [新增] 数据源参数
  category?: string; 
  search?: string;
  year?: string;      
  status?: string;    
  isRecommended?: boolean; 
  isRecent?: boolean;       
  page?: number;      
  pageSize?: number; 
}) {
  try {
    const { 
      source = 'Age',  // <--- [新增] 默认值为 'Age'
      category, 
      search, 
      year, 
      status, 
      isRecommended, 
      isRecent, 
      page = 1, 
      pageSize = 24 
    } = params;

    // --- 核心修改：初始化 where 时加入 sourceSite 过滤 ---
    const where: any = {
      sourceSite: source 
    };

    // --- 筛选条件构建 ---
    if (category && category !== '全部') where.type = category;
    if (year && year !== '全部') where.year = year;
    if (status && status !== '全部') where.status = { contains: status };
    if (isRecommended) where.isRecommended = true;
    if (isRecent) where.isRecent = true;
    
    // 搜索逻辑
    if (search) {
      where.OR = [
        { title: { contains: search } },
        { description: { contains: search } }
      ];
    }

    // --- 1. 查询总数 ---
    const totalCount = await prisma.video.count({ where });

    // --- 2. 查询当前页数据 ---
    const videos = await prisma.video.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
      // include: { likes: true } 
    });
     
    // --- 3. 返回结构化数据 ---
    return {
      data: videos,
      pagination: {
        total: totalCount,
        page: page,
        pageSize: pageSize,
        totalPages: Math.ceil(totalCount / pageSize)
      }
    };

  } catch (error) {
    console.error("查询失败:", error);
    return { 
      data: [], 
      pagination: { total: 0, page: 1, pageSize: 24, totalPages: 0 } 
    };
  }
}

// 6. 获取单个视频详情
export async function getVideoById(id: number) {
  try {
    const video = await prisma.video.findUnique({
      where: { id },
      include: {
        likes: true, // 关联点赞记录
        tags: true,  // 包含标签数据
        categories: true // 包含分类
      }
    });

    if (video) {
      // 浏览量自增
      await prisma.video.update({
        where: { id },
        data: { views: { increment: 1 } }
      });
    }
    
    return video;
  } catch (error) {
    console.error("获取详情失败:", error);
    return null;
  }
}

// 7. 获取相关推荐
export async function getRelatedVideos(currentId: number, type: string) {
  try {
    return await prisma.video.findMany({
      where: { 
        type, 
        id: { not: currentId } 
      },
      take: 4,
      orderBy: { views: 'desc' },
      include: {
        categories: true,
        tags: true
      }
    });
  } catch (error) {
    return [];
  }
}

// 8. 点赞切换
export async function toggleVideoLike(videoId: number) {
  const user = await getSession();
  if (!user) {
    return { success: false, message: "请先登录" };
  }

  try {
    const existingLike = await prisma.like.findUnique({
      where: {
        userId_videoId: {
          userId: user.id,
          videoId: videoId,
        },
      },
    });

    if (existingLike) {
      await prisma.$transaction([
        prisma.like.delete({
          where: { id: existingLike.id },
        }),
        prisma.video.update({
          where: { id: videoId },
          data: { likesCount: { decrement: 1 } },
        }),
      ]);
      return { success: true, liked: false };
    } else {
      await prisma.$transaction([
        prisma.like.create({
          data: {
            userId: user.id,
            videoId: videoId,
          },
        }),
        prisma.video.update({
          where: { id: videoId },
          data: { likesCount: { increment: 1 } },
        }),
      ]);
      return { success: true, liked: true };
    }
  } catch (error) {
    console.error("点赞失败:", error);
    return { success: false, message: "操作失败" };
  }
}

// 9. 获取点赞状态
export async function getVideoLikeStatus(videoId: number) {
  const user = await getSession();
  
  const video = await prisma.video.findUnique({
    where: { id: videoId },
    select: { likesCount: true }
  });

  let isLiked = false;

  if (user) {
    const like = await prisma.like.findUnique({
      where: {
        userId_videoId: {
          userId: user.id,
          videoId: videoId,
        },
      },
    });
    isLiked = !!like;
  }

  return { 
    likesCount: video?.likesCount || 0, 
    isLiked 
  };
}


export async function getHomeGroupedData(source: string) {
  try {
    // 1. 查出所有 isRecent=true 或 isRecommended=true 的视频
    const videos = await prisma.video.findMany({
      where: {
        sourceSite: source,
        OR: [
          { isRecommended: true },
          { isRecent: true }
        ]
      },
      orderBy: { updatedAt: 'desc' },
      take: 500 // 限制数量，防止太多
    });

    // 2. 在内存中按 type 分组
    const grouped: Record<string, any[]> = {};
    
    // 先处理推荐
    grouped['正在热映'] = videos.filter(v => v.isRecommended);

    // 再处理其他类型
    videos.filter(v => !v.isRecommended).forEach(v => {
      const typeKey = v.type || "其他"; // 如 "日韩动漫"
      if (!grouped[typeKey]) grouped[typeKey] = [];
      grouped[typeKey].push(v);
    });

    return grouped;
  } catch (error) {
    return {};
  }
}


export async function getFilterOptions(source: string) {
  try {
    // 1. 查出该源下所有不重复的分类 (type)
    const categories = await prisma.video.findMany({
      where: { 
        sourceSite: source,
        type: { not: '' } // 排除空分类
      },
      distinct: ['type'],
      select: { type: true },
    });

    // 2. 查出该源下所有不重复的年份 (year)
    const years = await prisma.video.findMany({
      where: { 
        sourceSite: source,
        year: { not: '' } // 排除空年份
      },
      distinct: ['year'],
      select: { year: true },
    });

    // 3. 数据处理与排序
    // 分类：提取字符串
    const categoryList = categories.map(c => c.type).filter(Boolean);
    
    // 年份：提取字符串 -> 过滤非数字(如"老片")分开处理 -> 排序
    const yearListRaw = years.map(y => y.year).filter(Boolean);
    
    // 简单的年份排序逻辑：数字大的排前面，非数字(如"10年代")放后面
    const yearList = yearListRaw.sort((a, b) => {
      const numA = parseInt(a);
      const numB = parseInt(b);
      if (!isNaN(numA) && !isNaN(numB)) return numB - numA; // 降序 (2025 -> 2024)
      if (!isNaN(numA)) return -1; // 数字排在文字前
      if (!isNaN(numB)) return 1;
      return a.localeCompare(b); // 都是文字则按字母
    });

    return {
      categories: categoryList,
      years: yearList
    };

  } catch (error) {
    console.error("获取筛选选项失败:", error);
    return { categories: [], years: [] };
  }
}