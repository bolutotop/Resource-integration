import * as cheerio from 'cheerio';
import axios from 'axios';
import { IScraperSource, ScrapedItem, ScraperFullDetail, ScraperVideoSource, ScraperPlaylist } from '../types';

export class AgeSource implements IScraperSource {
  name = "Age";
  private baseUrl = "https://www.agedm.io";

  // ----------------------------------------------------------------
  // 1. 抓取目录 (采用新代码：更稳健的文本切割解析)
  // ----------------------------------------------------------------
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

        // ID & 标题
        const titleLink = $el.find('h5.card-title a');
        const title = titleLink.text().trim();
        const href = titleLink.attr('href') || "";
        const idMatch = href.match(/\/detail\/(\d+)/);
        if (!idMatch) return;

        const sourceId = idMatch[1];
        // 兼容 data-original 懒加载和 src
        const coverUrl = $el.find('img.video_thumbs').attr('data-original') || $el.find('img.video_thumbs').attr('src') || "";

        // 初始化字段
        let type = "动漫";
        let status = "连载";
        let year = "";
        let studio = "";
        let tags: string[] = [];
        let description = "";

        // --- 核心逻辑：使用文本切割法解析详情 ---
        $el.find('.video_detail_info').each((_, info) => {
          const rawText = $(info).text().trim(); // 例如 "首播时间：2026-01-03"

          // 提取冒号后的内容 (兼容中文冒号和英文冒号)
          let value = "";
          if (rawText.includes("：")) {
            value = rawText.split("：")[1];
          } else if (rawText.includes(":")) {
            value = rawText.split(":")[1];
          }

          if (!value) return; 
          value = value.trim();

          // 关键词匹配
          if (rawText.includes("动画种类")) type = value;
          if (rawText.includes("播放状态")) status = value;
          if (rawText.includes("制作公司")) studio = value;
          if (rawText.includes("首播时间")) year = value.split('-')[0]; // 只取年份
          if (rawText.includes("剧情类型")) tags = value.split(/\s+/).filter(t => t); // 按空格切分标签

          // 简介特殊处理 (它有一个 .desc 类)
          if ($(info).hasClass('desc')) {
            description = value;
          }
        });

        // 封面上的状态优先级更高 (例如 "第05集")
        const coverStatus = $el.find('.video_play_status').text().trim();
        if (coverStatus) status = coverStatus;

        list.push({
          sourceId,
          title,
          coverUrl,
          type,
          status,
          desc: description,
          year,
          studio,
          tags,
          rating: 0
        });
      });

      console.log(`[${this.name}] 解析完成，本页 ${list.length} 条`);
      return list;
    } catch (error: any) {
      console.error(`[${this.name}] 目录抓取失败: ${error.message}`);
      return [];
    }
  }

  // ----------------------------------------------------------------
  // 2. 解析详情页 (保留旧代码逻辑：因为新代码此处返回空Metadata，旧代码更完整)
  // ----------------------------------------------------------------
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

      // 2. 解析元数据 (保留此部分以确保详情页信息的完整性)
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

  // ----------------------------------------------------------------
  // 3. 解析视频流地址 (保留旧代码：重要的 Vurl 提取和直链判断)
  // ----------------------------------------------------------------
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

      // 尝试匹配页面中的 Vurl 变量 (Age 核心逻辑)
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
            // 尝试提取嵌套的 url 参数
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