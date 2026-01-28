'use server';

import { PrismaClient } from '@prisma/client';
import { getSession } from './user-auth';
import { ResourceType } from './history'; // 复用类型定义

const prisma = new PrismaClient();

// 1. 获取评论列表 (目前做单层列表，按时间倒序)
export async function getComments(targetId: number, targetType: ResourceType) {
  try {
    const comments = await prisma.comment.findMany({
      where: {
        targetId,
        targetType,
        parentId: null, // 先只拿顶层评论 (如果要做楼中楼，这里逻辑要改)
      },
      include: {
        user: {
          select: { id: true, name: true, email: true } // 只取必要的用户信息
        },
        _count: {
          select: { children: true } // 获取回复数
        }
      },
      orderBy: { createdAt: 'desc' },
    });
    return comments;
  } catch (error) {
    return [];
  }
}

// 2. 发表评论
export async function postComment(
  targetId: number, 
  targetType: ResourceType, 
  content: string
) {
  const user = await getSession();
  if (!user) return { success: false, message: "请先登录" };

  if (!content.trim()) return { success: false, message: "评论内容不能为空" };

  try {
    const newComment = await prisma.comment.create({
      data: {
        content,
        userId: user.id,
        targetId,
        targetType,
      },
      include: {
        user: { select: { id: true, name: true } }
      }
    });
    return { success: true, comment: newComment };
  } catch (error) {
    console.error("评论失败:", error);
    return { success: false, message: "评论失败" };
  }
}

// 3. 删除评论 (只能删自己的，或者是管理员)
export async function deleteComment(commentId: number) {
  const user = await getSession();
  if (!user) return { success: false, message: "权限不足" };

  try {
    const comment = await prisma.comment.findUnique({ where: { id: commentId } });
    
    if (!comment) return { success: false, message: "评论不存在" };

    // 权限检查：必须是作者本人 (后续可加 || user.role === 'ADMIN')
    if (comment.userId !== user.id) {
      return { success: false, message: "无权删除此评论" };
    }

    await prisma.comment.delete({ where: { id: commentId } });
    return { success: true };
  } catch (error) {
    return { success: false, message: "删除失败" };
  }
}