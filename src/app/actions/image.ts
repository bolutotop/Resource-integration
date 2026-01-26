'use server';

import { PrismaClient } from '@prisma/client';
import { unlink } from 'fs/promises';
import { join } from 'path';
import { revalidatePath } from 'next/cache';

const prisma = new PrismaClient();

// 获取所有图片
export async function getImages() {
  try {
    return await prisma.image.findMany({
      orderBy: { createdAt: 'desc' },
    });
  } catch (error) {
    return [];
  }
}

// 删除图片 (数据库 + 本地文件)
export async function deleteImage(id: number, filename: string) {
  try {
    // 1. 删除数据库记录
    await prisma.image.delete({
      where: { id },
    });

    // 2. 删除本地文件
    const filePath = join(process.cwd(), 'public', 'uploads', filename);
    await unlink(filePath).catch((err) => {
      console.error("文件删除失败(可能文件已不存在):", err);
    });

    revalidatePath('/admin/images');
    return { success: true };
  } catch (error) {
    console.error("删除失败:", error);
    return { success: false, message: "删除失败" };
  }
}