'use client';

import React, { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';
import { 
  Play, Pause, Volume2, VolumeX, Settings, 
  Maximize, Minimize, PictureInPicture2, ToggleLeft, ToggleRight,
  ChevronRight, ChevronLeft, Check, Gauge, SlidersHorizontal,
  Loader2
} from 'lucide-react';

interface UIPlayerProps {
  url?: string;
}

export default function UIPlayer({ url = "https://play.xluuss.com/play/dwp9lyMe/index.m3u8" }: UIPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const hideTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const overlayTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // --- 状态管理 ---
  const [isPlaying, setIsPlaying] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [autoPlayNext, setAutoPlayNext] = useState(true);

  // --- 瞬时图标状态 ---
  const [overlayIcon, setOverlayIcon] = useState<{ type: 'play' | 'pause', id: number } | null>(null);

  // --- 设置菜单状态 ---
  const [showSettings, setShowSettings] = useState(false);
  const [menuView, setMenuView] = useState<'main' | 'speed' | 'quality'>('main');
  const [playbackRate, setPlaybackRate] = useState(1.0);
  const [currentQuality, setCurrentQuality] = useState('Auto');

  const speedOptions = [0.5, 0.75, 1.0, 1.25, 1.5, 2.0];
  const qualityOptions = ['Auto', '1080p', '720p', '480p'];

  // --- HLS 初始化 ---
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    setIsBuffering(true);

    if (Hls.isSupported()) {
      const hls = new Hls();
      hlsRef.current = hls;
      hls.loadSource(url);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
         setIsBuffering(false);
      });
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = url;
    }
    return () => hlsRef.current?.destroy();
  }, [url]);

  // --- 核心控制逻辑 ---
  const togglePlay = () => {
    if (!videoRef.current) return;
    
    // 瞬时图标逻辑
    const type = isPlaying ? 'pause' : 'play';
    setOverlayIcon({ type, id: Date.now() });
    
    if (overlayTimeoutRef.current) clearTimeout(overlayTimeoutRef.current);
    overlayTimeoutRef.current = setTimeout(() => {
      setOverlayIcon(null);
    }, 600);

    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
    
    setIsPlaying(!isPlaying);
    setShowSettings(false);
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) setCurrentTime(videoRef.current.currentTime);
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
      setIsBuffering(false);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = Number(e.target.value);
    if (videoRef.current) {
      setIsBuffering(true);
      videoRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const handleWaiting = () => setIsBuffering(true);
  const handleCanPlay = () => setIsBuffering(false);
  const handlePlaying = () => {
    setIsBuffering(false);
    setIsPlaying(true);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const vol = Number(e.target.value);
    setVolume(vol);
    if (videoRef.current) {
      videoRef.current.volume = vol;
      setIsMuted(vol === 0);
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    if (isMuted) {
      videoRef.current.volume = volume || 1;
      setIsMuted(false);
    } else {
      videoRef.current.volume = 0;
      setIsMuted(true);
    }
  };

  const togglePiP = async () => {
    if (!videoRef.current) return;
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else if (document.pictureInPictureEnabled) {
        await videoRef.current.requestPictureInPicture();
      }
    } catch (error) {
      console.error("PiP error:", error);
    }
  };

  const toggleFullscreen = async () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      await containerRef.current.requestFullscreen();
      setIsFullscreen(true);
    } else {
      await document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const handleMouseMove = () => {
    setShowControls(true);
    if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
    if (!showSettings) {
      hideTimeoutRef.current = setTimeout(() => setShowControls(false), 3000);
    }
  };

  // --- 菜单逻辑 ---
  const handleSpeedChange = (rate: number) => {
    if (videoRef.current) {
      videoRef.current.playbackRate = rate;
      setPlaybackRate(rate);
    }
  };

  const handleQualityChange = (quality: string) => {
    setCurrentQuality(quality);
  };

  const toggleSettings = () => {
    if (showSettings) {
      setShowSettings(false);
      setTimeout(() => setMenuView('main'), 300); 
    } else {
      setShowSettings(true);
      setMenuView('main');
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  const pillClass = "bg-black/30 backdrop-blur-md border border-white/5 rounded-full flex items-center justify-center text-white transition-all hover:bg-black/50";
  const menuItemClass = "flex items-center justify-between w-full px-4 py-3 hover:bg-white/10 transition-colors cursor-pointer text-sm text-white/90";

  return (
    <div 
      ref={containerRef}
      className={`relative w-full max-w-4xl mx-auto group select-none font-sans bg-black rounded-xl overflow-hidden shadow-2xl ring-1 ring-white/10 
        ${showControls ? 'cursor-auto' : 'cursor-none'} 
      `}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => {
        setShowControls(false);
        setShowSettings(false);
      }}
    >
      <style jsx>{`
        @keyframes youtube-ping {
          0% { transform: scale(0.8); opacity: 1; }
          50% { transform: scale(1.1); opacity: 1; }
          100% { transform: scale(1.5); opacity: 0; }
        }
        .animate-icon {
          animation: youtube-ping 0.6s ease-out forwards;
        }
        /* 强制 GPU 加速辅助类 */
        .force-gpu {
          will-change: opacity, transform;
          transform: translateZ(0);
        }
      `}</style>

      {/* 视频主体 */}
      <div className="relative aspect-video w-full h-full bg-black" onClick={togglePlay}>
        <video
          ref={videoRef}
          className="w-full h-full object-contain"
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onWaiting={handleWaiting}
          onPlaying={handlePlaying}
          onCanPlay={handleCanPlay}
          onEnded={() => {
            setIsPlaying(false);
            setIsBuffering(false);
          }}
        />

        {/* 缓冲动画 */}
        {isBuffering && (
          <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
            <div className="animate-in fade-in zoom-in duration-300">
              <Loader2 size={56} className="text-white animate-spin drop-shadow-lg" />
            </div>
          </div>
        )}

        {/* 瞬时图标 */}
        {overlayIcon && (
          <div key={overlayIcon.id} className="absolute inset-0 flex items-center justify-center z-30 pointer-events-none">
            <div className="flex items-center justify-center animate-icon">
              {overlayIcon.type === 'play' ? (
                <Play size={64} fill="white" className="text-white ml-1 drop-shadow-lg" />
              ) : (
                <Pause size={64} fill="white" className="text-white drop-shadow-lg" />
              )}
            </div>
          </div>
        )}
      </div>

      {/* 设置弹窗 */}
      <div 
        className={`absolute bottom-20 right-4 w-72 bg-black/60 backdrop-blur-2xl rounded-2xl overflow-hidden shadow-2xl border border-white/10 z-50 
          transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] origin-bottom-right force-gpu
          ${showSettings 
            ? 'opacity-100 scale-100 translate-y-0 pointer-events-auto' 
            : 'opacity-0 scale-90 translate-y-4 pointer-events-none'
          }
        `}
      >
        {menuView === 'main' && (
          <div className="py-2 animate-in fade-in slide-in-from-left-2 duration-200">
            <div onClick={() => setMenuView('speed')} className={menuItemClass}>
              <div className="flex items-center gap-3">
                <Gauge size={18} />
                <span>播放速度</span>
              </div>
              <div className="flex items-center gap-1 text-white/50 text-xs">
                <span>{playbackRate === 1 ? '正常' : `${playbackRate}x`}</span>
                <ChevronRight size={16} />
              </div>
            </div>
            <div onClick={() => setMenuView('quality')} className={menuItemClass}>
              <div className="flex items-center gap-3">
                <SlidersHorizontal size={18} />
                <span>视频质量</span>
              </div>
              <div className="flex items-center gap-1 text-white/50 text-xs">
                <span>{currentQuality}</span>
                <ChevronRight size={16} />
              </div>
            </div>
          </div>
        )}

        {menuView === 'speed' && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-200">
            <div className="flex items-center gap-2 px-3 py-3 border-b border-white/5 cursor-pointer hover:bg-white/5" onClick={() => setMenuView('main')}>
              <ChevronLeft size={18} className="text-white/70" />
              <span className="text-sm font-medium">播放速度</span>
            </div>
            <div className="py-2 max-h-60 overflow-y-auto custom-scrollbar">
              {speedOptions.map((rate) => (
                <div key={rate} onClick={() => handleSpeedChange(rate)} className={`${menuItemClass} justify-start gap-3`}>
                  {playbackRate === rate ? <Check size={16} className="text-blue-500"/> : <div className="w-4" />}
                  <span>{rate === 1.0 ? '正常' : rate}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {menuView === 'quality' && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-200">
            <div className="flex items-center gap-2 px-3 py-3 border-b border-white/5 cursor-pointer hover:bg-white/5" onClick={() => setMenuView('main')}>
              <ChevronLeft size={18} className="text-white/70" />
              <span className="text-sm font-medium">视频质量</span>
            </div>
            <div className="py-2">
              {qualityOptions.map((q) => (
                <div key={q} onClick={() => handleQualityChange(q)} className={`${menuItemClass} justify-start gap-3`}>
                    {currentQuality === q ? <Check size={16} className="text-blue-500"/> : <div className="w-4" />}
                    <div className="flex flex-col">
                      <span>{q}</span>
                      {q === '1080p' && <span className="text-[10px] text-blue-400">增强比特率</span>}
                    </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 底部控制栏 */}
      <div 
        // --- 核心修复点 ---
        // 1. 添加 will-change-[opacity,transform] 强制 GPU 预热
        // 2. 添加 duration-300 ease-out 优化曲线
        className={`absolute bottom-0 left-0 right-0 px-4 pb-4 pt-10 flex flex-col gap-3
          transition-all duration-300 ease-out will-change-[opacity,transform] 
          ${showControls ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
        `}
        style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.5) 0%, transparent 100%)' }}
      >
        {/* 进度条 */}
        <div className="group/progress relative w-full h-1 bg-white/20 rounded-full cursor-pointer hover:h-1.5 transition-all duration-200 backdrop-blur-sm">
           <input
            type="range"
            min={0}
            max={duration || 100}
            value={currentTime}
            onChange={handleSeek}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
          />
          <div 
            className="h-full bg-blue-500 rounded-full pointer-events-none z-10 relative" 
            style={{ width: `${(currentTime / (duration || 1)) * 100}%` }}
          >
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full opacity-0 group-hover/progress:opacity-100 shadow-lg scale-0 group-hover/progress:scale-100 transition-all"></div>
          </div>
        </div>

        {/* 按钮行 */}
        <div className="flex items-center gap-2 sm:gap-3 w-full">
          <button onClick={togglePlay} className={`${pillClass} w-10 h-10 shrink-0`}>
            {isPlaying ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" className="ml-0.5"/>}
          </button>

          <div className={`${pillClass} px-3 h-10 gap-2 shrink-0 group/vol`}>
            <button onClick={toggleMute} className="hover:text-blue-400 transition-colors">
              {isMuted || volume === 0 ? <VolumeX size={20} /> : <Volume2 size={20} />}
            </button>
            <div className="w-0 overflow-hidden group-hover/vol:w-20 transition-all duration-300 flex items-center">
              <div className="w-16 h-1 bg-white/30 rounded-full relative ml-1">
                 <input 
                  type="range" min={0} max={1} step={0.01}
                  value={isMuted ? 0 : volume}
                  onChange={handleVolumeChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                />
                <div className="h-full bg-white rounded-full pointer-events-none" style={{ width: `${(isMuted ? 0 : volume) * 100}%` }}></div>
              </div>
            </div>
          </div>

          <div className={`${pillClass} px-4 h-10 text-xs font-mono font-medium tracking-wide shrink-0`}>
            <span>{formatTime(currentTime)}</span>
            <span className="mx-1 opacity-50">/</span>
            <span className="opacity-70">{formatTime(duration)}</span>
          </div>

          <div className="flex-1"></div>

          <div className={`${pillClass} px-4 h-10 gap-4 shrink-0`}>
            <button onClick={() => setAutoPlayNext(!autoPlayNext)} className="hidden sm:flex items-center gap-1 hover:text-blue-400 transition-colors">
              {autoPlayNext ? <ToggleRight size={22} className="text-blue-500" /> : <ToggleLeft size={22} className="text-gray-400" />}
            </button>

            <button 
              onClick={toggleSettings} 
              className={`hover:text-white transition-all duration-300 ${showSettings ? 'rotate-90 text-white scale-110' : 'text-white/80'}`} 
            >
              <Settings size={20} strokeWidth={1.5} />
            </button>

            <button onClick={togglePiP} className="hover:text-white/80 transition-colors hidden sm:block">
              <PictureInPicture2 size={20} strokeWidth={1.5} />
            </button>

            <button onClick={toggleFullscreen} className="hover:text-white/80 transition-colors ml-1">
              {isFullscreen ? <Minimize size={20} strokeWidth={1.5} /> : <Maximize size={20} strokeWidth={1.5} />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}