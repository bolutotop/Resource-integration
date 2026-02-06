import * as cheerio from 'cheerio';
import axios from 'axios';
import { IScraperSource, ScrapedItem, ScrapedHomeSection, ScraperFullDetail, ScraperVideoSource } from '../types';

export class YhmcSource implements IScraperSource {
  name = "Yhmc";
  private baseUrl = "https://www.yhmc.cc";
  
  // --- 1. Category Mapping Definition ---
  private categoryMap: Record<string, string> = {
    '日韩动漫': '229',
    '国产动漫': '228',
    '欧美动漫': '231',
    '港台动漫': '230',
    '动画片': '272',   // e.g. Zootopia
    '电影': '77',
    '电视剧': '78',
    '综艺': '79',
    '短剧': '233',
    '有声动漫': '232'
  };

  // --- 2. Year Mapping (New) ---
  // Mapped based on URL pattern: https://www.yhmc.cc/vod/1/229/0/30/0/0/0/0 (2025)
  private yearMap: Record<string, string> = {
    '2026': '40', // Reserved
    '2025': '30',
    '2024': '31',
    '2023': '32',
    '2022': '33',
    '2021': '34',
    '2020': '35',
    '10年代': '36',
    '00年代': '37',
    '老片': '38'
  };
  
  private headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Referer': 'https://www.yhmc.cc/'
  };

  // --- 3. Home Scraping ---
  async scrapeHome(): Promise<{ sections: ScrapedHomeSection[] }> {
    console.log(`[YhmcScraper] 正在动态抓取首页...`);
    try {
      const { data } = await axios.get(this.baseUrl, { headers: this.headers, timeout: 15000 });
      const $ = cheerio.load(data);
      const sections: ScrapedHomeSection[] = [];

      // 1.1 Slider/Carousel
      const sliderItems: ScrapedItem[] = [];
      $('.slide-time-list .swiper-slide').each((_, slide) => {
        const $slide = $(slide);
        const linkEl = $slide.find('a');
        const href = linkEl.attr('href') || "";
        const idMatch = href.match(/\/[vp]\/(.+)/); 
        if (!idMatch) return;
        
        let sourceId = idMatch[1]; 
        if (href.includes('/p/')) {
            const parts = sourceId.split('/');
            if (parts.length >= 3) sourceId = `${parts[0]}/${parts[1]}`;
        }

        let coverUrl = "";
        const style = $slide.find('.slide-time-img3').attr('style');
        if (style && style.includes('url(')) coverUrl = style.match(/url\((.*?)\)/)?.[1] || "";
        if (!coverUrl) coverUrl = $slide.find('img').attr('src') || "";

        sliderItems.push({
          sourceId: sourceId,
          title: $slide.find('.slide-info-title').text().trim() || $slide.find('.time-title').text().trim(),
          coverUrl,
          status: $slide.find('.slide-info-remarks').last().text().trim() || "热播中",
          type: "轮播推荐",
          rating: 0
        });
      });
      if (sliderItems.length > 0) sections.push({ title: "轮播推荐", items: sliderItems });

      // 1.2 Regular Sections
      $('.box-width').each((_, section) => {
        const $section = $(section);
        const rawTitle = $section.find('.title-h').text().trim();
        if (!rawTitle) return;

        let cleanType = rawTitle.replace("最新", "").replace("热门", "").trim();
        if (rawTitle.includes("正在热映")) cleanType = "正在热映";

        const items: ScrapedItem[] = [];
        $section.find('.public-list-box').each((__, item) => {
          const $item = $(item);
          const href = $item.find('.public-list-exp').attr('href') || "";
          const idMatch = href.match(/\/v\/(.+)/);
          if (!idMatch) return;
          const sourceId = idMatch[1]; 

          const imgEl = $item.find('img.gen-movie-img');
          let coverUrl = imgEl.attr('data-src') || imgEl.attr('src') || "";
          if (coverUrl && !coverUrl.startsWith('http')) {
             if(coverUrl.startsWith('//')) coverUrl = `https:${coverUrl}`;
             else coverUrl = `https://www.yhmc.cc${coverUrl.startsWith('/') ? '' : '/'}${coverUrl}`;
          }

          items.push({
            sourceId, 
            title: $item.find('.time-title').text().trim(),
            coverUrl,
            status: $item.find('.public-list-prb').text().trim() || "更新中",
            desc: $item.find('.public-list-subtitle').text().trim(),
            type: cleanType,
            rating: 0
          });
        });

        if (items.length > 0) sections.push({ title: rawTitle, items });
      });
      return { sections };
    } catch (error: any) {
      console.error(`[YhmcScraper] 首页错误: ${error.message}`);
      return { sections: [] };
    }
  }

  // --- 4. Detail Page (Playlist Parsing) ---
  async scrapeDetail(sourceId: string): Promise<ScraperFullDetail> {
    const detailUrl = `${this.baseUrl}/v/${sourceId}`;
    console.log(`[YhmcScraper] 抓取详情: ${detailUrl}`);

    try {
      const { data } = await axios.get(detailUrl, { headers: this.headers });
      const $ = cheerio.load(data);
      
      const metadata: any = {};
      const imgEl = $('.detail-pic img');
      metadata.coverUrl = imgEl.attr('data-src') || imgEl.attr('src') || "";
      if (metadata.coverUrl && !metadata.coverUrl.startsWith('http')) metadata.coverUrl = `https:${metadata.coverUrl}`;
      metadata.description = $('#height_limit').text().trim();
      $('.deployment span').each((_, el) => {
        const text = $(el).text().trim();
        if (/^\d{4}$/.test(text)) metadata.year = text;
        else if ($(el).hasClass('hl-ma0')) metadata.category = text;
      });

      const playlists: any[] = [];
      const sourceNames: string[] = [];
      $('.anthology-tab .swiper-slide').each((_, el) => {
        sourceNames.push($(el).text().trim() || `线路${_ + 1}`);
      });

      $('.anthology-list .anthology-list-box').each((index, box) => {
        const episodes: any[] = [];
        $(box).find('ul.playEpisodes li a').each((__, link) => {
          const $link = $(link);
          const epTitle = $link.text().trim();
          const epHref = $link.attr('href');
          
          if (epHref) {
            episodes.push({
              name: epTitle,
              url: epHref.startsWith('http') ? epHref : `${this.baseUrl}${epHref}`
            });
          }
        });
        if (episodes.length > 0) {
          playlists.push({
            sourceName: sourceNames[index] || `线路${index + 1}`,
            episodes: episodes
          });
        }
      });

      return { playlists, metadata };
    } catch (error: any) {
      console.error(`[YhmcScraper] 详情失败: ${error.message}`);
      return { playlists: [], metadata: {} };
    }
  }

  // --- 5. Catalog Scraping (Modified with Year Support) ---
  async scrapeCatalog(page: number, category?: string, year?: string): Promise<ScrapedItem[]> {
    // Get Category ID (Default to '229' Japanese/Korean Anime)
    const catId = category && this.categoryMap[category] ? this.categoryMap[category] : '229';
    const catName = category || '日韩动漫';

    // Get Year ID (Default to '0' All)
    const yearId = year && this.yearMap[year] ? this.yearMap[year] : '0';

    // Construct URL: /vod/{page}/{catId}/0/{yearId}/0/0/0/0
    const catalogUrl = `${this.baseUrl}/vod/${page}/${catId}/0/${yearId}/0/0/0/0`;
    
    console.log(`[YhmcScraper] 抓取目录: [${catName}] [${year || '全部年份'}] 第${page}页 -> ${catalogUrl}`);

    try {
      const { data } = await axios.get(catalogUrl, { headers: this.headers, timeout: 15000 });
      const $ = cheerio.load(data);
      
      const items: ScrapedItem[] = [];

      $('.public-list-box').each((_, element) => {
        const $item = $(element);
        
        const linkEl = $item.find('.public-list-exp');
        const href = linkEl.attr('href') || "";
        
        // Extract xxxxx/xxx from /v/xxxxx/xxx
        const idMatch = href.match(/\/v\/(.+)/); 
        
        if (!idMatch) return;
        const sourceId = idMatch[1];

        const imgEl = $item.find('img.gen-movie-img');
        let coverUrl = imgEl.attr('data-src') || imgEl.attr('src') || "";
        if (coverUrl && !coverUrl.startsWith('http')) {
             if(coverUrl.startsWith('//')) coverUrl = `https:${coverUrl}`;
             else coverUrl = `https://www.yhmc.cc${coverUrl.startsWith('/') ? '' : '/'}${coverUrl}`;
        }

        const title = $item.find('.time-title').text().trim();
        const status = $item.find('.public-list-prb').text().trim();
        const desc = $item.find('.public-list-subtitle').text().trim();

        items.push({
          sourceId,
          title,
          coverUrl,
          status,
          desc,
          type: catName, // Store currently scraped category
          year: year || undefined, // Store year if we are filtering by it
          rating: 0
        });
      });

      console.log(`[YhmcScraper] 本页抓取成功: ${items.length} 条`);
      return items;

    } catch (error: any) {
      console.error(`[YhmcScraper] 目录失败: ${error.message}`);
      return [];
    }
  }

  // --- 6. Video Decoding (Core Logic) ---
  async scrapeVideo(playUrl: string): Promise<ScraperVideoSource | null> {
    console.log(`[YhmcScraper] 正在解析加密地址: ${playUrl}`);
    try {
      const { data } = await axios.get(playUrl, { headers: this.headers });
      
      // 1. Extract the temLineList variable from the script tags
      const jsonMatch = data.match(/var temLineList = (\[.*?\]);/);
      if (!jsonMatch) {
        console.error("[YhmcScraper] 未找到视频数据 temLineList");
        return null;
      }

      const lineList = JSON.parse(jsonMatch[1]);
      
      // 2. Identify current episode ID from URL (e.g., .../22247079)
      const currentIdMatch = playUrl.match(/\/(\d+)$/);
      const currentId = currentIdMatch ? parseInt(currentIdMatch[1]) : 0;
      
      // 3. Match the item in the list
      const targetVideo = lineList.find((v: any) => v.id === currentId) || lineList[0];

      if (targetVideo && targetVideo.file) {
        // --- DECRYPTION LOGIC ---
        // Step 1: Remove first 3 chars
        const rawFile = targetVideo.file;
        const subStr = rawFile.substring(3);
        
        // Step 2: Base64 Decode
        const base64Decoded = Buffer.from(subStr, 'base64').toString('binary');
        
        // Step 3: URL Decode (URIComponent)
        const finalUrl = decodeURIComponent(base64Decoded);

        console.log(`[YhmcScraper] 解密成功 (直链): ${finalUrl}`);
        
        return {
          url: finalUrl,
          type: 'native', 
          headers: {
            'User-Agent': this.headers['User-Agent'],
            'Origin': this.baseUrl, 
            'Referer': this.baseUrl
          }
        };
      }

      return null;
    } catch (e: any) {
      console.error(`[YhmcScraper] 解析错误: ${e.message}`);
      return null;
    }
  }
}