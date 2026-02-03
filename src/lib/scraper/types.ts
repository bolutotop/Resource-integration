// src/lib/scraper/types.ts

/**
 * 1. 爬取下来的通用数据结构（目录页简要信息）
 */
export interface ScrapedItem {
  sourceId: string;   // 源站的唯一ID (如 "20260043")
  title: string;
  coverUrl: string;
  type: string;       // "动漫", "软件", "游戏"
  status?: string;    // "连载", "完结", "v1.0"
  desc?: string;
  rating?: number;

  year?: string;
  studio?: string;
  tags?: string[];
}

/**
 * 2. 剧集信息
 */
export interface ScraperEpisode {
  name: string; // "第01集", "1080P国语版"
  url: string;  // 原始跳转链接
}

/**
 * 3. 播放列表（支持多线路）
 */
export interface ScraperPlaylist {
  sourceName: string; // 线路名称，如 "极速云"
  episodes: ScraperEpisode[];
}

/**
 * 4. 详情页完整数据包 (Updated)
 * 包含播放列表以及更丰富的元数据
 */
export interface ScraperFullDetail {
  playlists: ScraperPlaylist[]; 
  metadata: {                    
    year: string;
    tags: string[];
    status: string;
    description: string;
  };
}

/**
 * 5. 视频播放源定义
 */
export interface ScraperVideoSource {
  url: string;                    // 真实的播放地址 (mp4, m3u8, or iframe src)
  type: 'native' | 'iframe';      // native=直接播放, iframe=嵌入网页
  headers?: Record<string, string>; // 特定请求头
}

/**
 * 6. 源的接口标准 (Updated)
 */
export interface IScraperSource {
  name: string; 
  
  /** 爬取目录页 */
  scrapeCatalog(page: number): Promise<ScrapedItem[]>;
  
  /** * 获取详情页完整信息
   * 修改点：现在返回 ScraperFullDetail 而不仅仅是 ScraperPlaylist[]
   */
  scrapeDetail(sourceId: string): Promise<ScraperFullDetail>;

  /** 解析具体的播放地址 */
  scrapeVideo(playUrl: string): Promise<ScraperVideoSource | null>;

  /**
   * 新增：抓取首页数据 (可选)
   * 返回 recommended (推荐) 和 recent (最近更新) 两个数组
   */
  scrapeHome?(): Promise<{ recommended: ScrapedItem[]; recent: ScrapedItem[] }>;
}