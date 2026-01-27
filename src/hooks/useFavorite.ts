'use client';

import { useState, useEffect } from 'react';
import { toggleFavorite, checkIsFavorited } from '@/app/actions/favorite';
import { ResourceType } from '@/app/actions/history';
import { useAuthModal } from '@/context/AuthModalContext';

interface UseFavoriteProps {
  id: number;
  type: ResourceType;
  title: string;
  coverUrl?: string;
  routeUrl: string;
}

export function useFavorite({ id, type, title, coverUrl, routeUrl }: UseFavoriteProps) {
  const [isFavorited, setIsFavorited] = useState(false);
  const [loading, setLoading] = useState(false);
  const { openLoginModal } = useAuthModal();

  // 初始化检查状态
  useEffect(() => {
    if (id) {
      checkIsFavorited(id, type).then(setIsFavorited);
    }
  }, [id, type]);

  const handleToggleFavorite = async () => {
    setLoading(true);
    
    // 乐观更新 (UI 先变)
    const prevState = isFavorited;
    setIsFavorited(!isFavorited);

    const res = await toggleFavorite({
      targetId: id,
      targetType: type,
      title,
      coverUrl,
      routeUrl
    });

    if (!res.success) {
      // 失败回滚
      setIsFavorited(prevState);
      if (res.message === "请先登录") {
        openLoginModal(); // 自动弹窗
      }
    }
    
    setLoading(false);
  };

  return { isFavorited, handleToggleFavorite, loading };
}