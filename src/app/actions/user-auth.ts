// src/app/actions/user-auth.ts
'use server';

import { PrismaClient } from '@prisma/client';
import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// 1. 用户注册
export async function registerUser(formData: FormData) {
  const name = formData.get('name') as string;
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  if (!email || !password) {
    return { success: false, message: '邮箱和密码不能为空' };
  }

  if (password.length <= 8) {
    return { success: false, message: '密码长度不能少于 8 位' };
  }

  try {
    // 检查邮箱是否已被注册
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return { success: false, message: '该邮箱已被注册' };
    }

    // 加密密码
    const hashedPassword = await bcrypt.hash(password, 10);

    // 创建用户
    await prisma.user.create({
      data: {
        name: name || '新用户',
        email,
        password: hashedPassword,
      },
    });

    return { success: true, message: '注册成功！请登录' };
  } catch (error) {
    console.error("注册失败:", error);
    return { success: false, message: '注册服务暂时不可用' };
  }
}

// 2. 用户登录
export async function loginUser(formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  try {
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      return { success: false, message: '账号不存在' };
    }

    // 比对密码
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return { success: false, message: '密码错误' };
    }

    // 设置 Cookie
    const cookieStore = await cookies();
    // 注意：这里为了简单使用纯字符串，生产环境建议用 JWT 库签名
    const token = JSON.stringify({ id: user.id, email: user.email, name: user.name });
    
    cookieStore.set('kali_user_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 7, // 7天
      path: '/',
    });

    return { success: true, message: '登录成功' };
  } catch (error) {
    console.error("登录失败:", error);
    return { success: false, message: '登录服务暂时不可用' };
  }
}

// 3. 退出登录
export async function logoutUser() {
  const cookieStore = await cookies();
  cookieStore.delete('kali_user_token');
}

export async function getSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get('kali_user_token')?.value;

  if (!token) return null;

  try {
    // 因为我们在 loginUser 里是用 JSON.stringify 存的，所以这里直接 parse
    // 如果你以后用了 JWT，这里需要 jwt.verify
    const user = JSON.parse(token);
    return user; 
  } catch (error) {
    return null;
  }
}