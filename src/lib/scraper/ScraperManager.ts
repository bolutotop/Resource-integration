// src/lib/scraper/ScraperManager.ts

import { AgeSource } from './sources/AgeSource';
import { YhmcSource } from './sources/YhmcSource'; // 1. 引入
import { IScraperSource } from './types';

export class ScraperManager {
  // 使用静态私有属性存储源，初始化的同时完成注册
  private static sources: Record<string, IScraperSource> = {
    'Age': new AgeSource(),
    'Yhmc': new YhmcSource(), // 2. 注册
  };

  /**
   * 注册源：如果后续需要动态添加源，可以调用此静态方法
   */
  static register(source: IScraperSource) {
    this.sources[source.name] = source;
  }

  /**
   * 获取源：直接通过 ScraperManager.getSource('Age') 调用
   */
  static getSource(name: string) {
    return this.sources[name];
  }
}