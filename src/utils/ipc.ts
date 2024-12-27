import { ConnectionConfig } from '@/types';

function invoke(channel: string, ...args: any[]) {
  return window.ipcRenderer.invoke(channel, ...args);
}

export function ping() {
  return invoke('ping');
}

export function selectFile(options: any = {}) {
  return invoke('select-file', options);
}

export function saveFile(options: any = {}, fileData: any) {
  return invoke('save-file', options, fileData);
}

export function getTheme() {
  return invoke('get-theme');
}

export function setTheme(theme: string) {
  return invoke('set-theme', theme);
}

export function closeConnection(cid: string) {
  return invoke('close-connection', { id: cid });
}

// 获取所有连接配置
export function getConnectionConfigs() {
  return invoke('get-connection-configs');
}

// 添加连接配置
export function addConnectionConfig(config: ConnectionConfig) {
  return invoke('add-connection-config', config);
}

// 删除连接配置
export function deleteConnectionConfig(config: ConnectionConfig) {
  console.log('deleteConnectionConfig', config);
  return invoke('delete-connection-config', config);
}

// 编辑连接配置
export function editConnectionConfig(config: ConnectionConfig) {
  return invoke('edit-connection-config', config);
}

// 获取 brokers
export function listBrokers(id: string) {
  return invoke('list-brokers', id);
}

// describe broker configs
export function describeBrokerConfigs(id: string, brokerId: number) {
  return invoke('describe-broker-configs', { id, brokerId });
}

// 获取 topics
export function listTopics(id: string) {
  return invoke('list-topics', id);
}

// create topic
export function createTopic(id: string, topic: string, numPartitions: number, replicationFactor: number) {
  return invoke('create-topic', { id, topic, numPartitions, replicationFactor });
}

// delete topic
export function deleteTopic(id: string, topic: string) {
  return invoke('delete-topic', { id, topic });
}

// describe topic
export function describeTopic(id: string, topic: string) {
  return invoke('describe-topic', { id, topic });
}

// create topic partitions
export function createPartitions(id: string, topic: string, count: number) {
  return invoke('create-partitions', { id, topic, count });
}

// describe topic configs
export function describeTopicConfigs(id: string, topic: string) {
  return invoke('describe-topic-configs', { id, topic });
}

export function fetchTopicMessages(id: string, topic: string, count: number) {
  return invoke('fetch-topic-messages', { id, topic, count });
}

// 获取消费者组 groups
export function listGroups(id: string) {
  return invoke('list-groups', id);
}

// delete group
export function deleteGroup(id: string, groupId: string) {
  return invoke('delete-group', { id, groupId });
}

export function fetchTopicOffsets(id: string, topic: string) {
  return invoke('fetch-topic-offsets', { id, topic });
}

export function fetchGroupOffsets(id: string, groupId: string, topics: string[]) {
  return invoke('fetch-group-offsets', { id, groupId, topics });
}

export function resetGroupTopicOffsets(id: string, groupId: string, topic: string, earliest: boolean) {
  return invoke('reset-group-topic-offsets', { id, groupId, topic, earliest });
}

export function setGroupTopicOffsets(
  id: string,
  groupId: string,
  topic: string,
  partitions: Array<{
    partition: number;
    offset: string;
  }>,
) {
  return invoke('set-group-topic-offsets', { id, groupId, topic, partitions });
}
