import * as cheerio from 'cheerio';
import axios from 'axios';
import { IScraperSource, ScrapedItem, ScraperFullDetail, ScraperVideoSource, ScraperPlaylist } from '../types';

export class AgeSource implements IScraperSource {
  name = "Age";
  private baseUrl = "https://www.agedm.io";
  private commonHeaders = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Referer': this.baseUrl
  };

  // ----------------------------------------------------------------
  // 1. 抓取首页 (推荐与最近更新) - 已修改
  // ----------------------------------------------------------------
  async scrapeHome(): Promise<{ recommended: ScrapedItem[], recent: ScrapedItem[] }> {
    const url = this.baseUrl; // https://www.agedm.io
    console.log(`[AgeScraper] 正在抓取首页: ${url}`);

    try {
      const { data } = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        },
        timeout: 10000
      });
      const $ = cheerio.load(data);
      
      const recommended: ScrapedItem[] = [];
      const recent: ScrapedItem[] = [];

      // 辅助函数：解析单个 video_item
      const parseItem = (element: any): ScrapedItem | null => {
        const $el = $(element);
        const link = $el.find('.video_item-title a');
        const href = link.attr('href') || "";
        const idMatch = href.match(/\/detail\/(\d+)/);
        
        if (!idMatch) return null;

        return {
          sourceId: idMatch[1],
          title: link.text().trim(),
          coverUrl: $el.find('img.video_thumbs').attr('data-original') || $el.find('img.video_thumbs').attr('src') || "",
          status: $el.find('.video_item--info').text().trim(), // 如 "第04集"
          type: "动漫", // 首页没写类型，默认为动漫
          rating: 0
        };
      };

      // 1. 解析 "最近更新" (.recent_update)
      $('.video_list_box.recent_update .video_item').each((_, el) => {
        const item = parseItem(el);
        if (item) recent.push(item);
      });

      // 2. 解析 "今日推荐" (.recommend_list)
      $('.video_list_box.recommend_list .video_item').each((_, el) => {
        const item = parseItem(el);
        if (item) recommended.push(item);
      });

      console.log(`[AgeScraper] 首页抓取完成: 推荐 ${recommended.length} 条, 更新 ${recent.length} 条`);
      return { recommended, recent };

    } catch (error: any) {
      console.error(`[AgeScraper] 首页抓取失败: ${error.message}`);
      return { recommended: [], recent: [] };
    }
  }

  // ----------------------------------------------------------------
  // 2. 抓取目录 (文本切割解析法)
  // ----------------------------------------------------------------
  async scrapeCatalog(page: number): Promise<ScrapedItem[]> {
    const url = `${this.baseUrl}/catalog/all-all-all-all-all-time-${page}`;
    console.log(`[${this.name}] 正在抓取第 ${page} 页: ${url}`);

    try {
      const { data } = await axios.get(url, {
        headers: this.commonHeaders,
        timeout: 10000
      });

      const $ = cheerio.load(data);
      const list: ScrapedItem[] = [];

      $('.cata_video_item').each((_, element) => {
        const $el = $(element);
        const titleLink = $el.find('h5.card-title a');
        const title = titleLink.text().trim();
        const href = titleLink.attr('href') || "";
        const idMatch = href.match(/\/detail\/(\d+)/);
        if (!idMatch) return;

        const sourceId = idMatch[1];
        const coverUrl = $el.find('img.video_thumbs').attr('data-original') || $el.find('img.video_thumbs').attr('src') || "";

        let type = "动漫";
        let status = "连载";
        let year = "";
        let studio = "";
        let tags: string[] = [];
        let description = "";

        $el.find('.video_detail_info').each((_, info) => {
          const rawText = $(info).text().trim();
          let value = "";
          if (rawText.includes("：")) value = rawText.split("：")[1];
          else if (rawText.includes(":")) value = rawText.split(":")[1];

          if (!value) return; 
          value = value.trim();

          if (rawText.includes("动画种类")) type = value;
          if (rawText.includes("播放状态")) status = value;
          if (rawText.includes("制作公司")) studio = value;
          if (rawText.includes("首播时间")) year = value.split('-')[0];
          if (rawText.includes("剧情类型")) tags = value.split(/\s+/).filter(t => t);

          if ($(info).hasClass('desc')) description = value;
        });

        const coverStatus = $el.find('.video_play_status').text().trim();
        if (coverStatus) status = coverStatus;

        list.push({
          sourceId, title, coverUrl, type, status,
          desc: description, year, studio, tags, rating: 0
        });
      });

      return list;
    } catch (error: any) {
      console.error(`[${this.name}] 目录抓取失败: ${error.message}`);
      return [];
    }
  }

  // ----------------------------------------------------------------
  // 3. 解析详情页
  // ----------------------------------------------------------------
  async scrapeDetail(sourceId: string): Promise<ScraperFullDetail> {
    const url = `${this.baseUrl}/detail/${sourceId}`;
    try {
      const { data } = await axios.get(url, {
        headers: this.commonHeaders,
        timeout: 10000
      });
      const $ = cheerio.load(data);
      
      const playlists: ScraperPlaylist[] = [];
      $('.nav-pills button').each((_, btn) => {
        const sourceName = $(btn).text().trim().replace('VIP', '').trim();
        const targetId = $(btn).attr('data-bs-target');
        if (!targetId) return;

        const episodes: { name: string; url: string }[] = [];
        $(targetId).find('ul.video_detail_episode li a').each((__, a) => {
          episodes.push({ name: $(a).text().trim(), url: $(a).attr('href') || "" });
        });

        if (episodes.length > 0) playlists.push({ sourceName, episodes });
      });

      let year = "未知", status = "未知", tags: string[] = [];
      let description = $('.video_detail_desc').text().replace('简介：', '').trim() || "";

      $('.detail_imform_list li').each((_, li) => {
        const text = $(li).text();
        const value = $(li).find('.detail_imform_value').text().trim();
        if (text.includes("首播时间")) year = value.split('-')[0]; 
        if (text.includes("播放状态")) status = value;
        if (text.includes("剧情类型")) tags = value.split(/\s+/).filter(t => t); 
      });

      return { playlists, metadata: { year, tags, status, description } };
    } catch (error: any) {
      return { playlists: [], metadata: { year: '未知', tags: [], status: '未知', description: '' } };
    }
  }

  // ----------------------------------------------------------------
  // 4. 解析视频流地址
  // ----------------------------------------------------------------
  async scrapeVideo(playUrl: string): Promise<ScraperVideoSource | null> {
    const targetUrl = playUrl.startsWith('http') ? playUrl : `${this.baseUrl}${playUrl}`;
    try {
      const { data: html } = await axios.get(targetUrl, {
        headers: this.commonHeaders,
        timeout: 10000
      });

      let videoUrl = '';
      let type: 'native' | 'iframe' = 'iframe';

      const vurlMatch = html.match(/var\s+Vurl\s*=\s*['"](.*?)['"]/);
      if (vurlMatch && vurlMatch[1]) videoUrl = decodeURIComponent(vurlMatch[1]);

      if (!videoUrl) {
        const $ = cheerio.load(html);
        videoUrl = $('iframe#iframe_player').attr('src') || $('iframe').first().attr('src') || "";
      }

      if (videoUrl) {
        if (videoUrl.startsWith('//')) videoUrl = `https:${videoUrl}`;
        const isDirect = /\.(m3u8|mp4)|toutiao|tos-|aliyun/.test(videoUrl);

        if (isDirect) {
          type = 'native';
        } else {
          try {
            const urlObj = new URL(videoUrl);
            const subUrl = urlObj.searchParams.get('url') || urlObj.searchParams.get('v');
            if (subUrl && /\.(m3u8|mp4)/.test(subUrl)) {
              videoUrl = subUrl;
              type = 'native';
            }
          } catch {}
        }
        return { url: videoUrl, type, headers: { 'Referer': targetUrl } };
      }
      return null;
    } catch {
      return null;
    }
  }
}