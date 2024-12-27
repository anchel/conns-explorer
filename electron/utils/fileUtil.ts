import confins from '../config/config.ts';
import { app } from 'electron';
import fs from 'node:fs';

export function readFileSync(filePath: string): string {
  let findItem = confins.config.ssrBookmarks.find((item) => item.filePath === filePath);
  let content;
  if (findItem) {
    const stopAccessingSecurityScopedResource = app.startAccessingSecurityScopedResource(findItem.bookmark);
    content = fs.readFileSync(filePath, 'utf8');
    stopAccessingSecurityScopedResource();
  } else {
    content = fs.readFileSync(filePath, 'utf8');
  }
  return content;
}
