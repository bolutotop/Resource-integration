'use client';

import React, { useState, useEffect } from 'react';
import { getComments, postComment, deleteComment } from '@/app/actions/comment';
import { getSession } from '@/app/actions/user-auth';
import { useAuthModal } from '@/context/AuthModalContext';
import { ResourceType } from '@/app/actions/history';
import { Send, Trash2, MessageCircle, Loader2 } from 'lucide-react';

interface CommentSectionProps {
  targetId: number;
  targetType: ResourceType;
}

// 辅助：时间格式化
function timeAgo(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (seconds < 60) return '刚刚';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}分钟前`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}小时前`;
  return `${Math.floor(hours / 24)}天前`;
}

export default function CommentSection({ targetId, targetType }: CommentSectionProps) {
  const [comments, setComments] = useState<any[]>([]);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);

  const { openLoginModal } = useAuthModal();

  // 初始化加载
  useEffect(() => {
    const init = async () => {
      const [user, data] = await Promise.all([
        getSession(),
        getComments(targetId, targetType)
      ]);
      setCurrentUser(user);
      setComments(data);
      setLoading(false);
    };
    init();
  }, [targetId, targetType]);

  // 提交评论
  const handleSubmit = async () => {
    if (!currentUser) {
      openLoginModal();
      return;
    }
    if (!content.trim()) return;

    setSubmitting(true);
    const res = await postComment(targetId, targetType, content);
    setSubmitting(false);

    if (res.success) {
      setContent('');
      // 将新评论插入到最前面
      setComments([res.comment, ...comments]);
    } else {
      alert(res.message);
    }
  };

  // 删除评论
  const handleDelete = async (commentId: number) => {
    if (!confirm("确定删除这条评论吗？")) return;
    
    // 乐观更新
    setComments(prev => prev.filter(c => c.id !== commentId));
    
    const res = await deleteComment(commentId);
    if (!res.success) {
      alert("删除失败");
      // 实际项目中这里可能需要重新拉取列表回滚
    }
  };

  return (
    <div className="bg-[#161b22] border border-white/5 rounded-xl p-6 mt-8">
      
      {/* 标题 */}
      <div className="flex items-center gap-2 mb-6">
        <MessageCircle className="text-blue-500" size={24} />
        <h3 className="text-xl font-bold text-white">
          评论 <span className="text-gray-500 text-sm font-normal">({comments.length})</span>
        </h3>
      </div>

      {/* 输入框区域 */}
      <div className="flex gap-4 mb-8">
        {/* 当前用户头像 */}
        <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center shrink-0 overflow-hidden">
           {currentUser ? (
             <span className="text-white font-bold">{currentUser.name[0].toUpperCase()}</span>
           ) : (
             <div className="w-full h-full bg-gray-800" />
           )}
        </div>
        
        <div className="flex-1 relative">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={currentUser ? "发表你的看法..." : "登录后参与讨论..."}
            className="w-full bg-[#0d1117] border border-white/10 rounded-xl p-4 text-gray-200 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all min-h-[100px] resize-none"
            onClick={() => !currentUser && openLoginModal()}
          />
          <div className="absolute bottom-3 right-3">
             <button
               onClick={handleSubmit}
               disabled={submitting || !content.trim()}
               className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2"
             >
               {submitting ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
               发布
             </button>
          </div>
        </div>
      </div>

      {/* 评论列表 */}
      {loading ? (
        <div className="text-center py-10 text-gray-500">加载评论中...</div>
      ) : comments.length === 0 ? (
        <div className="text-center py-10 text-gray-600 border-t border-white/5 pt-10">
           暂无评论，快来抢沙发吧~
        </div>
      ) : (
        <div className="space-y-6">
          {comments.map((comment) => (
            <div key={comment.id} className="flex gap-4 group animate-in fade-in slide-in-from-bottom-2">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-700 to-gray-600 flex items-center justify-center shrink-0 text-white font-bold text-sm">
                {comment.user?.name?.[0].toUpperCase() || 'U'}
              </div>
              
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-gray-300 font-bold text-sm">
                    {comment.user?.name || '未知用户'}
                  </span>
                  <span className="text-xs text-gray-600">
                    {timeAgo(comment.createdAt)}
                  </span>
                </div>
                
                <p className="text-gray-400 text-sm leading-relaxed whitespace-pre-wrap">
                  {comment.content}
                </p>

                {/* 操作栏 (回复/删除) */}
                <div className="flex items-center gap-4 mt-2">
                  <button className="text-xs text-gray-600 hover:text-blue-400 transition-colors">回复</button>
                  
                  {/* 只有自己发的评论才能删除 */}
                  {currentUser && currentUser.id === comment.userId && (
                    <button 
                      onClick={() => handleDelete(comment.id)}
                      className="text-xs text-gray-600 hover:text-red-400 transition-colors flex items-center gap-1 opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 size={12} /> 删除
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}