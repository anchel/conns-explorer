import { app } from 'electron';
import path from 'node:path';
import fs from 'node:fs';
import { ConnectionConfig } from '../types';

interface SsrBookmark {
  filePath: string;
  bookmark: string;
}

class Config {
  private configPath: string;
  public config: {
    theme: 'light' | 'dark' | 'system';
    connectionConfigs: Array<ConnectionConfig>;
    ssrBookmarks: Array<SsrBookmark>;
  };

  constructor() {
    this.configPath = 'config.json';
    this.config = {
      theme: 'system',
      connectionConfigs: [],
      ssrBookmarks: [],
    };
  }

  init() {
    this.configPath = path.join(app.getPath('userData'), this.configPath);
    console.log('configPath', this.configPath);
    if (fs.existsSync(this.configPath)) {
      const content = fs.readFileSync(this.configPath, 'utf8');

      Object.assign(this.config, JSON.parse(content));
    } else {
      this.save();
    }
  }

  save() {
    fs.writeFileSync(this.configPath, JSON.stringify(this.config));
  }

  checkSsrBookmark(filePath: string, bookmark: string) {
    let findIndex = this.config.ssrBookmarks.findIndex((item) => item.filePath === filePath);
    if (findIndex >= 0) {
      this.config.ssrBookmarks.splice(findIndex, 1);
    }
    this.config.ssrBookmarks.push({ filePath: filePath, bookmark: bookmark });
    this.save();
  }
}

export default new Config();
