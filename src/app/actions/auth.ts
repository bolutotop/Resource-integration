'use server';

import { cookies } from 'next/headers';

export async function adminLogin(prevState: any, formData: FormData) {
  // 1. 获取表单数据
  const username = formData.get('username') as string;
  const password = formData.get('password') as string;

  // 2. 模拟数据库验证 (以后这里可以换成查 Prisma User 表)
  // 注意：这里是在服务端运行的，很安全
  if (username === 'admin' && password === 'admin888') {
    
    // 3. 验证通过：由服务端设置 Cookie
    // HttpOnly: true (前端JS无法读取/修改，防止XSS攻击)
    // Secure: true (只在HTTPS下传输，本地localhost例外)
    // MaxAge: 设置过期时间 (例如 1 天)
    const cookieStore = await cookies();
    
    cookieStore.set('kali_admin_token', 'secret_token_value', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24, // 1天
      path: '/',
    });

    return { success: true, message: '登录成功' };
  }

  // 4. 验证失败
  return { success: false, message: '账号或密码错误' };
}

// 退出登录 Action
export async function adminLogout() {
  const cookieStore = await cookies();
  cookieStore.delete('kali_admin_token');
}