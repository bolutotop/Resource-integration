'use server';

import { PrismaClient } from '@prisma/client';
import { getSession } from './user-auth';
import { ResourceType } from './history'; // 复用之前的类型定义

const prisma = new PrismaClient();

interface FavoritePayload {
  targetId: number;
  targetType: ResourceType;
  title: string;
  coverUrl?: string;
  routeUrl: string;
}

// 1. 切换收藏 (Toggle: 有则删，无则加)
export async function toggleFavorite(payload: FavoritePayload) {
  const user = await getSession();
  if (!user) return { success: false, message: "请先登录" };

  try {
    const existing = await prisma.favorite.findUnique({
      where: {
        userId_targetId_targetType: {
          userId: user.id,
          targetId: payload.targetId,
          targetType: payload.targetType,
        },
      },
    });

    if (existing) {
      // 已收藏 -> 取消
      await prisma.favorite.delete({ where: { id: existing.id } });
      return { success: true, isFavorited: false, message: "已取消收藏" };
    } else {
      // 未收藏 -> 添加
      await prisma.favorite.create({
        data: {
          userId: user.id,
          targetId: payload.targetId,
          targetType: payload.targetType,
          title: payload.title,
          coverUrl: payload.coverUrl,
          routeUrl: payload.routeUrl,
        },
      });
      return { success: true, isFavorited: true, message: "收藏成功" };
    }
  } catch (error) {
    console.error("收藏操作失败:", error);
    return { success: false, message: "操作失败" };
  }
}

// 2. 查询是否已收藏 (用于详情页初始化)
export async function checkIsFavorited(targetId: number, targetType: ResourceType) {
  const user = await getSession();
  if (!user) return false;

  const count = await prisma.favorite.count({
    where: {
      userId: user.id,
      targetId,
      targetType,
    },
  });
  return count > 0;
}

// 3. 获取收藏列表
export async function getFavoriteList() {
  const user = await getSession();
  if (!user) return [];

  try {
    return await prisma.favorite.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' }, // 最新收藏在最前
    });
  } catch (error) {
    return [];
  }
}