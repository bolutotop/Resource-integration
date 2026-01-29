// src/lib/scraper/ScraperManager.ts
import { AgeSource } from './sources/AgeSource';
import { IScraperSource } from './types';

class Manager {
  private sources: Record<string, IScraperSource> = {};

  constructor() {
    // 注册源：以后加软件源就在这里加一行
    this.register(new AgeSource());
    // this.register(new SoftwareSource());
  }

  register(source: IScraperSource) {
    this.sources[source.name] = source;
  }

  getSource(name: string) {
    return this.sources[name];
  }
}

export const ScraperManager = new Manager();