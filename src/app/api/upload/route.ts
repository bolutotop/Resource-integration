import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
import { PrismaClient } from '@prisma/client'; // 引入 Prisma

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: '没有上传文件' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const uploadDir = join(process.cwd(), 'public', 'uploads');
    
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
    // 处理文件名，防止中文乱码等问题
    const originalName = file.name.replace(/\s/g, '-');
    const extension = originalName.split('.').pop();
    const filename = `img-${uniqueSuffix}.${extension}`;
    
    const filePath = join(uploadDir, filename);
    await writeFile(filePath, buffer);

    const url = `/uploads/${filename}`;

    // --- 新增：写入数据库 ---
    await prisma.image.create({
      data: {
        filename: filename,
        url: url,
      }
    });

    return NextResponse.json({ url });

  } catch (error) {
    console.error('上传失败:', error);
    return NextResponse.json({ error: '服务器内部错误' }, { status: 500 });
  }
}