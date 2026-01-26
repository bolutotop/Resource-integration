import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // --- 定义路径规则 ---
  // 1. 是否是后台管理路径 (以 /admin 开头)
  const isAdminPath = path.startsWith('/admin');
  
  // 2. 是否正是管理员登录页本身 (防止死循环重定向)
  const isAdminLoginPage = path === '/admin/login';

  // --- 获取 Cookie (凭证) ---
  // 这里检查我们在 AdminLoginPage 设置的那个 cookie 名: 'kali_admin_token'
  const adminToken = request.cookies.get('kali_admin_token')?.value;

  // --- 逻辑判断 ---

  // 场景 1: 游客想进后台 (访问 /admin... 但没有 token，且当前不在登录页)
  // 动作: 踢到 /admin/login
  if (isAdminPath && !isAdminLoginPage && !adminToken) {
    return NextResponse.redirect(new URL('/admin/login', request.url));
  }

  // 场景 2: 已登录管理员想再次访问登录页 (访问 /admin/login 且有 token)
  // 动作: 直接送回 /admin 仪表盘 (不用再登录了)
  if (isAdminLoginPage && adminToken) {
    return NextResponse.redirect(new URL('/admin', request.url));
  }

  // 其他情况: 放行
  return NextResponse.next();
}

// --- 配置匹配范围 ---
// 仅对 /admin 开头的路由生效，避免影响前台用户访问
export const config = {
  matcher: ['/admin/:path*'],
};