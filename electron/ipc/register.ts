import { app, BrowserWindow, dialog, IpcMain, nativeTheme } from 'electron';
import confins from '../config/config';
import { clusterManager } from '../kafka/kafka';
// import process from "node:process";
import path from 'node:path';
import fs from 'node:fs';

type Theme = 'light' | 'dark' | 'system';

let mainWindow: BrowserWindow;

export function ipc_register(ipcMain: IpcMain, win?: BrowserWindow) {
  if (win) {
    mainWindow = win;
  }

  ipcMain.handle('ping', (_: any, arg: any) => {
    console.log('ping', arg);
    return path.join(app.getPath('userData'), 'config.json');
  });

  // 文件选择
  ipcMain.handle('select-file', (_, args = {}) => {
    console.log('select-file', args);
    return new Promise((resolve, reject) => {
      console.log('select-file', { ...args, securityScopedBookmarks: true });
      dialog.showOpenDialog(mainWindow, { ...args, securityScopedBookmarks: true }).then((result) => {
        if (result.canceled) {
          resolve([]);
        } else {
          console.log('select-file', result.filePaths, result.bookmarks);
          for (let i = 0; i < result.filePaths.length; i++) {
            const p = result.filePaths[i];
            if (result.bookmarks) {
              confins.checkSsrBookmark(p, result.bookmarks[i]);
            }
          }
          resolve({ filePaths: result.filePaths, bookmarks: result.bookmarks });
        }
      }, reject);
    });
  });

  ipcMain.handle('save-file', (_, args = {}, fileData: string) => {
    console.log('save-file args:', args);
    return new Promise((resolve, reject) => {
      console.log('save-file options:', { ...args, securityScopedBookmarks: true });
      dialog.showSaveDialog(mainWindow, { ...args, securityScopedBookmarks: true }).then((result) => {
        if (result.canceled) {
          resolve({ status: false });
        } else {
          console.log('save-file', result.filePath, result.bookmark);
          if (result.bookmark) {
            const stopAccessingSecurityScopedResource = app.startAccessingSecurityScopedResource(result.bookmark);
            fs.writeFileSync(result.filePath, fileData);
            stopAccessingSecurityScopedResource();
          } else {
            fs.writeFileSync(result.filePath, fileData);
          }
          resolve({ status: true, filePath: result.filePath, bookmark: result.bookmark });
        }
      }, reject);
    });
  });

  ipcMain.handle('get-theme', () => {
    // console.log('get-theme');
    // return nativeTheme.shouldUseDarkColors ? 'dark' : 'light';
    return {
      theme: confins.config.theme,
      systemTheme: nativeTheme.shouldUseDarkColors ? 'dark' : 'light',
    };
  });

  ipcMain.handle('set-theme', (_: any, arg: Theme) => {
    console.log('set-theme', arg);
    confins.config.theme = arg;
    confins.save();

    nativeTheme.themeSource = arg;
  });

  // 获取所有连接配置
  ipcMain.handle('get-connection-configs', () => {
    return confins.config.connectionConfigs;
  });

  // 添加连接配置
  ipcMain.handle('add-connection-config', (_: any, arg: any) => {
    confins.config.connectionConfigs.push(arg);
    confins.save();
  });

  // 删除连接配置
  ipcMain.handle('delete-connection-config', (_: any, arg: any) => {
    const idx = confins.config.connectionConfigs.findIndex((item) => item.id === arg.id);
    if (idx !== -1) {
      confins.config.connectionConfigs.splice(idx, 1);
      confins.save();
    }
  });

  // 编辑连接配置
  ipcMain.handle('edit-connection-config', (_: any, arg: any) => {
    const idx = confins.config.connectionConfigs.findIndex((item) => item.id === arg.id);
    if (idx !== -1) {
      confins.config.connectionConfigs[idx] = arg;
      confins.save();
    }
  });

  // 获取 brokers
  ipcMain.handle('list-brokers', async (_: any, id: string) => {
    console.log('list-brokers', id);
    let cluster = await clusterManager.getCluster(id);
    return cluster.listBrokers();
  });

  // describe broker configs
  ipcMain.handle('describe-broker-configs', async (_: any, arg: any) => {
    console.log('describe-broker-configs', arg);
    let cluster = await clusterManager.getCluster(arg.id);
    return cluster.describeBrokerConfigs(arg.brokerId);
  });

  // 获取 topics
  ipcMain.handle('list-topics', async (_: any, id: string) => {
    console.log('list-topics', id);
    let cluster = await clusterManager.getCluster(id);
    return cluster.listTopics();
  });

  ipcMain.handle('describe-topic', async (_: any, arg: any) => {
    console.log('describe-topic', arg.id);
    let cluster = await clusterManager.getCluster(arg.id);
    return cluster.describeTopic(arg.topic);
  });

  // 创建 topic
  ipcMain.handle('create-topic', async (_: any, arg: any) => {
    console.log('create-topic', arg);
    let cluster = await clusterManager.getCluster(arg.id);
    return cluster.createTopic(arg.topic, arg.numPartitions, arg.replicationFactor);
  });

  // 删除 topic
  ipcMain.handle('delete-topic', async (_: any, arg: any) => {
    console.log('delete-topic', arg);
    let cluster = await clusterManager.getCluster(arg.id);
    return cluster.deleteTopic(arg.topic);
  });

  // 创建分区
  ipcMain.handle('create-partitions', async (_: any, arg: any) => {
    console.log('create-partitions', arg);
    let cluster = await clusterManager.getCluster(arg.id);
    return cluster.createPartitions(arg.topic, arg.count);
  });

  // 添加主题消息
  ipcMain.handle('add-topic-messages', async (_: any, arg: any) => {
    console.log('add-topic-messages', arg);
    let cluster = await clusterManager.getCluster(arg.id);
    return cluster.addTopicMessages(arg.topic, arg.messages);
  });

  // 获取主题的配置
  ipcMain.handle('describe-topic-configs', async (_: any, arg: any) => {
    console.log('describe-topic-configs', arg);
    let cluster = await clusterManager.getCluster(arg.id);
    return cluster.describeTopicConfigs(arg.topic);
  });

  // 获取主题最近的消息
  ipcMain.handle('fetch-topic-messages', async (_: any, arg: any) => {
    console.log('fetch-topic-messages', arg);
    let cluster = await clusterManager.getCluster(arg.id);
    return cluster.fetchLatestMessages(arg.topic, arg.count || 100);
  });

  // 获取消费者组 groups
  ipcMain.handle('list-groups', async (_: any, id: string) => {
    console.log('list-groups', id);
    let cluster = await clusterManager.getCluster(id);
    return cluster.listGroups();
  });

  // delete group
  ipcMain.handle('delete-group', async (_: any, arg: any) => {
    console.log('delete-group', arg);
    let cluster = await clusterManager.getCluster(arg.id);
    return cluster.deleteGroup(arg.groupId);
  });

  // 获取主题偏移量
  ipcMain.handle('fetch-topic-offsets', async (_: any, arg: any) => {
    console.log('fetch-topic-offsets', arg);
    let cluster = await clusterManager.getCluster(arg.id);
    return cluster.fetchTopicOffsets(arg.topic);
  });

  ipcMain.handle('fetch-group-offsets', async (_: any, arg: any) => {
    console.log('fetch-group-offsets', arg);
    let cluster = await clusterManager.getCluster(arg.id);
    return cluster.fetchOffsets(arg.groupId, arg.topics);
  });

  ipcMain.handle('reset-group-topic-offsets', async (_: any, arg: any) => {
    console.log('reset-group-topic-offsets', arg);
    let cluster = await clusterManager.getCluster(arg.id);
    return cluster.resetOffsets(arg.groupId, arg.topic, arg.earliest);
  });

  ipcMain.handle('set-group-topic-offsets', async (_: any, arg: any) => {
    console.log('set-group-topic-offsets', arg);
    let cluster = await clusterManager.getCluster(arg.id);
    return cluster.setOffsets(arg.groupId, arg.topic, arg.partitions);
  });

  ipcMain.handle('close-connection', async (_: any, arg: any) => {
    console.log('close-connection', arg);
    await clusterManager.removeCluster(arg.id);
  });
}
