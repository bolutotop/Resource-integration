'use server';

import { PrismaClient } from '@prisma/client';
import { revalidatePath } from 'next/cache';

import { getSession } from './user-auth';

const prisma = new PrismaClient();

// 1. 定义接口 (新增 coverUrl)
interface VideoFormData {
  title: string;
  videoUrl: string;
  coverUrl: string; // --- 核心修复：加上这个字段 ---
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
        // --- 核心修复：写入封面链接 ---
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
        // --- 核心修复：更新封面链接 ---
        coverUrl: formData.coverUrl,

        description: formData.description,
        rating: parseFloat(formData.rating) || 0,
        type: formData.type,

        // 重置并更新分类
        categories: {
          set: [], 
          connectOrCreate: categoryList.map(name => ({
            where: { name },
            create: { name },
          })),
        },
        // 重置并更新标签
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

// 5. 获取视频列表 (支持搜索)
export async function getVideos(category: string = '首页', searchTerm: string = '') {
  try {
    let whereClause: any = {};

    if (searchTerm) {
      whereClause = {
        OR: [
          { title: { contains: searchTerm } }, 
          { description: { contains: searchTerm } }, 
          { tags: { some: { name: { contains: searchTerm } } } } 
        ]
      };
    } else if (category !== '首页') {
      whereClause = { type: category };
    }

    return await prisma.video.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      include: {
        categories: true, 
        tags: true
      }
    });
  } catch (error) {
    console.error("获取视频列表失败:", error);
    return [];
  }
}

// 6. 获取单个视频详情
export async function getVideoById(id: number) {
  try {
    const video = await prisma.video.findUnique({
      where: { id },
      include: {
        categories: true,
        tags: true,
      }
    });
    return video;
  } catch (error) {
    console.error("获取视频详情失败:", error);
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
      orderBy: { views: 'desc' } 
    });
  } catch (error) {
    return [];
  }
}



export async function toggleVideoLike(videoId: number) {
  const user = await getSession();
  if (!user) {
    return { success: false, message: "请先登录" };
  }

  try {
    // 检查是否已经点赞
    const existingLike = await prisma.like.findUnique({
      where: {
        userId_videoId: {
          userId: user.id,
          videoId: videoId,
        },
      },
    });

    if (existingLike) {
      // 已经赞过 -> 取消点赞
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
      // 没赞过 -> 添加点赞
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

// 9. 获取当前视频的点赞信息 (是否已赞 + 总数)
export async function getVideoLikeStatus(videoId: number) {
  const user = await getSession();
  
  // 查总数 (也可以直接从 Video 表查 likesCount，但这里为了演示也可以分开)
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