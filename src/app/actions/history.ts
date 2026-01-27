'use server';

import { PrismaClient } from '@prisma/client';
import { getSession } from './user-auth';

const prisma = new PrismaClient();

// 定义支持的资源类型 (方便类型提示)
export type ResourceType = 'MOVIE' | 'SOFTWARE' | 'GAME' | 'MUSIC';

interface HistoryPayload {
  targetId: number;
  targetType: ResourceType;
  title: string;
  coverUrl?: string;
  routeUrl: string;
}

// 1. 记录历史 (Upsert: 有则更新时间，无则新增)
export async function recordHistory(payload: HistoryPayload) {
  const user = await getSession();
  if (!user) return { success: false }; // 未登录不记录，或者你可以存本地 localStorage

  try {
    await prisma.history.upsert({
      where: {
        userId_targetId_targetType: {
          userId: user.id,
          targetId: payload.targetId,
          targetType: payload.targetType,
        },
      },
      // 如果存在，更新访问时间和可能变动的标题/封面
      update: {
        visitedAt: new Date(),
        title: payload.title,
        coverUrl: payload.coverUrl,
        routeUrl: payload.routeUrl,
      },
      // 如果不存在，创建新记录
      create: {
        userId: user.id,
        targetId: payload.targetId,
        targetType: payload.targetType,
        title: payload.title,
        coverUrl: payload.coverUrl,
        routeUrl: payload.routeUrl,
      },
    });
    return { success: true };
  } catch (error) {
    console.error("记录历史失败:", error);
    return { success: false };
  }
}

// 2. 获取历史记录 (支持分页)
export async function getHistoryList(page: number = 1, pageSize: number = 20) {
  const user = await getSession();
  if (!user) return [];

  try {
    return await prisma.history.findMany({
      where: { userId: user.id },
      orderBy: { visitedAt: 'desc' }, // 按时间倒序
      take: pageSize,
      skip: (page - 1) * pageSize,
    });
  } catch (error) {
    return [];
  }
}

// 3. 清空历史
export async function clearHistory() {
  const user = await getSession();
  if (!user) return { success: false };

  await prisma.history.deleteMany({
    where: { userId: user.id },
  });
  return { success: true };
}