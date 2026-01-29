import * as cheerio from 'cheerio';
import axios from 'axios';
import { IScraperSource, ScrapedItem, ScraperFullDetail, ScraperVideoSource, ScraperPlaylist } from '../types';

export class AgeSource implements IScraperSource {
  name = "Age";
  private baseUrl = "https://www.agedm.io";

  /**
   * 抓取目录页
   */
  async scrapeCatalog(page: number): Promise<ScrapedItem[]> {
    const url = `${this.baseUrl}/catalog/all-all-all-all-all-time-${page}`;
    console.log(`[${this.name}] 正在抓取第 ${page} 页: ${url}`);

    try {
      const { data } = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Referer': this.baseUrl
        },
        timeout: 10000
      });

      const $ = cheerio.load(data);
      const list: ScrapedItem[] = [];

      $('.cata_video_item').each((_, element) => {
        const $el = $(element);
        const detailUrl = $el.find('h5.card-title a').attr('href') || "";
        const idMatch = detailUrl.match(/\/detail\/(\d+)/);
        const sourceId = idMatch ? idMatch[1] : "";

        if (!sourceId) return;

        let type = "动漫";
        let status = "未知";
        let desc = "";

        $el.find('.video_detail_info').each((_, info) => {
          const text = $(info).text();
          if (text.includes("动画种类：")) type = text.replace("动画种类：", "").trim();
          if (text.includes("播放状态：")) status = text.replace("播放状态：", "").trim();
          if ($(info).hasClass('desc')) desc = $(info).find('span').remove().end().text().trim();
        });

        list.push({
          sourceId,
          title: $el.find('h5.card-title a').text().trim(),
          coverUrl: $el.find('img.video_thumbs').attr('data-original') || "",
          type,
          status,
          desc,
          rating: 0
        });
      });

      return list;
    } catch (error: any) {
      console.error(`[${this.name}] 第 ${page} 页失败: ${error.message}`);
      return [];
    }
  }

  /**
   * 解析详情页 (抓取播放列表 + 元数据)
   */
  async scrapeDetail(sourceId: string): Promise<ScraperFullDetail> {
    const url = `${this.baseUrl}/detail/${sourceId}`;
    console.log(`[${this.name}] 正在抓取详情: ${url}`);

    try {
      const { data } = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Referer': this.baseUrl
        },
        timeout: 10000
      });

      const $ = cheerio.load(data);
      
      // 1. 解析播放列表
      const playlists: ScraperPlaylist[] = [];
      $('.nav-pills button').each((_, btn) => {
        const $btn = $(btn);
        const sourceName = $btn.text().trim().replace('VIP', '').trim();
        const targetId = $btn.attr('data-bs-target');
        if (!targetId) return;

        const $pane = $(targetId);
        const episodes: { name: string; url: string }[] = [];
        $pane.find('ul.video_detail_episode li a').each((__, a) => {
          const $a = $(a);
          episodes.push({ 
            name: $a.text().trim(), 
            url: $a.attr('href') || "" 
          });
        });

        if (episodes.length > 0) playlists.push({ sourceName, episodes });
      });

      // 2. 解析元数据
      let year = "未知";
      let status = "未知";
      let tags: string[] = [];
      let description = $('.video_detail_desc').text().replace('简介：', '').trim() || "";

      $('.detail_imform_list li').each((_, li) => {
        const text = $(li).text();
        const value = $(li).find('.detail_imform_value').text().trim();
        
        if (text.includes("首播时间")) year = value.split('-')[0]; 
        if (text.includes("播放状态")) status = value;
        if (text.includes("剧情类型")) tags = value.split(/\s+/).filter(t => t); 
      });

      return {
        playlists,
        metadata: { year, tags, status, description }
      };

    } catch (error: any) {
      console.error(`[${this.name}] 详情抓取失败: ${error.message}`);
      return { 
        playlists: [], 
        metadata: { year: '未知', tags: [], status: '未知', description: '' } 
      };
    }
  }

  /**
   * 解析视频流地址
   */
  async scrapeVideo(playUrl: string): Promise<ScraperVideoSource | null> {
    const targetUrl = playUrl.startsWith('http') ? playUrl : `${this.baseUrl}${playUrl}`;
    console.log(`[${this.name}] 正在解析视频: ${targetUrl}`);

    try {
      const { data: html } = await axios.get(targetUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Referer': this.baseUrl
        },
        timeout: 10000
      });

      let videoUrl = '';
      let type: 'native' | 'iframe' = 'iframe';

      // 尝试匹配页面中的 Vurl 变量
      const vurlMatch = html.match(/var\s+Vurl\s*=\s*['"](.*?)['"]/);
      if (vurlMatch && vurlMatch[1]) {
        videoUrl = decodeURIComponent(vurlMatch[1]);
      }

      // 如果没有 Vurl，尝试找 iframe
      if (!videoUrl) {
        const $ = cheerio.load(html);
        videoUrl = $('iframe#iframe_player').attr('src') || $('iframe').first().attr('src') || "";
      }

      if (videoUrl) {
        if (videoUrl.startsWith('//')) videoUrl = `https:${videoUrl}`;

        // --- 核心逻辑：智能判断直链 ---
        const isDirectStream = 
             videoUrl.includes('.m3u8') 
          || videoUrl.includes('.mp4')
          || videoUrl.includes('toutiao') // 适配字节系
          || videoUrl.includes('tos-')     // 适配字节存储
          || videoUrl.includes('aliyun');  // 适配阿里云

        if (isDirectStream) {
          type = 'native';
        } else {
          try {
            const urlObj = new URL(videoUrl);
            const subUrl = urlObj.searchParams.get('url') || urlObj.searchParams.get('v');
            if (subUrl && (subUrl.includes('.m3u8') || subUrl.includes('.mp4'))) {
              videoUrl = subUrl; 
              type = 'native';
            }
          } catch (e) {
            // URL 解析失败，维持现状
          }
        }

        console.log(`[${this.name}] 解析成功 [${type}]: ${videoUrl}`);
        
        return {
          url: videoUrl,
          type: type,
          headers: { 'Referer': targetUrl } 
        };
      }

      return null;
    } catch (error: any) {
      console.error(`[${this.name}] 视频解析失败: ${error.message}`);
      return null;
    }
  }
}