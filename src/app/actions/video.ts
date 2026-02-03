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

// 5. 获取视频列表 (已根据要求修改)
export async function getVideos(params: {
  category?: string; 
  search?: string;
  year?: string;     
  status?: string;   
  isRecommended?: boolean; 
  isRecent?: boolean;      
  page?: number;     // 当前页码
  pageSize?: number; // 每页数量 (新增参数，允许前端控制)
}) {
  try {
    const { 
      category, search, year, status, 
      isRecommended, isRecent, 
      page = 1, 
      pageSize = 24 // 默认每页 24 个
    } = params;

    const where: any = {};

    // --- 筛选条件构建 ---
    if (category && category !== '全部') where.type = category;
    if (year && year !== '全部') where.year = year;
    if (status && status !== '全部') where.status = { contains: status };
    if (isRecommended) where.isRecommended = true;
    if (isRecent) where.isRecent = true;
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
      // include: { likes: true } // 不需要不需要 include，列表页尽量轻量
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