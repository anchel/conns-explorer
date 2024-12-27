import tls from 'tls';
import pkg, { Admin, Kafka as KafkaType } from 'kafkajs';
import { ConnectionConfig } from '../types';
import confins from '../config/config';
import { parseMemberAssignment, parseMemberMetadata } from '../utils/util';
import { HttpProxyOnNetSocket } from './socket-chain';
import { readFileSync } from '../utils/fileUtil.ts';

const { Kafka, ConfigResourceTypes } = pkg;

class Cluster {
  public kafkaInstance: KafkaType;
  public adminClient: Admin;

  private connected: boolean;

  constructor(kafkaInstance: KafkaType) {
    this.connected = false;
    this.kafkaInstance = kafkaInstance;
    this.adminClient = kafkaInstance.admin();

    this.adminClient.on(this.adminClient.events.CONNECT, () => {
      console.log('admin.connect');
    });
    this.adminClient.on(this.adminClient.events.DISCONNECT, () => {
      console.log('admin.disconnect');
      this.connected = false;
    });
  }

  async connect() {
    if (this.connected) {
      return;
    }
    await this.adminClient.connect();
    this.connected = true;
  }

  async close() {
    await this.adminClient.disconnect();
  }

  async listBrokers() {
    await this.connect();
    const data = await this.adminClient.describeCluster();

    data.brokers = data.brokers.map((item) => {
      return {
        ...item,
        isController: item.nodeId === data.controller,
      };
    });
    // this.brokers = data.brokers;
    return data;
  }

  async describeBrokerConfigs(id: number) {
    await this.connect();
    const data = await this.adminClient.describeConfigs({
      includeSynonyms: false,
      resources: [
        {
          type: ConfigResourceTypes.BROKER,
          name: String(id),
        },
      ],
    });

    return data;
  }

  async listTopics() {
    await this.connect();
    const topics = await this.adminClient.listTopics();
    const data = await this.adminClient.fetchTopicMetadata({ topics });

    return data;
  }

  async createTopic(topic: string, numPartitions: number, replicationFactor: number) {
    console.log('createTopic', {
      topic,
      numPartitions,
      replicationFactor,
    });
    await this.connect();
    const data = await this.adminClient.createTopics({
      topics: [
        {
          topic,
          numPartitions,
          replicationFactor,
        },
      ],
    });

    return data;
  }

  async deleteTopic(topic: string) {
    await this.connect();
    const data = await this.adminClient.deleteTopics({
      topics: [topic],
    });

    return data;
  }

  async describeTopic(topic: string) {
    await this.connect();
    const data = await this.adminClient.fetchTopicMetadata({
      topics: [topic],
    });

    return data;
  }

  async describeTopicConfigs(topic: string) {
    await this.connect();
    const data = await this.adminClient.describeConfigs({
      includeSynonyms: false,
      resources: [
        {
          type: ConfigResourceTypes.TOPIC,
          name: topic,
        },
      ],
    });

    return data;
  }

  async createPartitions(topic: string, count: number) {
    await this.connect();
    return await this.adminClient.createPartitions({
      topicPartitions: [
        {
          topic,
          count,
        },
      ],
    });
  }

  async listGroups() {
    await this.connect();
    const groups = await this.adminClient.listGroups();
    const data = await this.adminClient.describeGroups(groups.groups.map((item) => item.groupId));
    data.groups.forEach((group) => {
      // console.log('listGroups', group);
      group.members.forEach((member) => {
        // console.log('listGroups', member.memberAssignment, member.memberMetadata);
        if (member.memberAssignment && member.memberAssignment.length > 0) {
          // @ts-ignore 忽略下一行的错误检查
          member.memberAssignment = parseMemberAssignment(member.memberAssignment);
        }

        if (member.memberMetadata && member.memberMetadata.length > 0) {
          // @ts-ignore 忽略下一行的错误检查
          member.memberMetadata = parseMemberMetadata(member.memberMetadata);
        }
      });
    });
    return data;
  }

  async deleteGroup(groupId: string) {
    await this.connect();
    const data = await this.adminClient.deleteGroups([groupId]);

    return data;
  }

  async fetchTopicOffsets(topic: string) {
    await this.connect();
    const data = await this.adminClient.fetchTopicOffsets(topic);
    return data;
  }

  async fetchOffsets(groupId: string, topics: string[]) {
    await this.connect();
    const data = await this.adminClient.fetchOffsets({ groupId, topics });
    return data;
  }

  async resetOffsets(groupId: string, topic: string, earliest: boolean) {
    await this.connect();
    return await this.adminClient.resetOffsets({ groupId, topic, earliest });
  }

  async setOffsets(groupId: string, topic: string, partitions: Array<{ partition: number; offset: string }>) {
    await this.connect();
    return await this.adminClient.setOffsets({ groupId, topic, partitions });
  }

  async fetchLatestMessages(topic: string, numberOfMessages = 1000) {
    await this.connect();

    const partitions = await this.adminClient.fetchTopicOffsets(topic);

    // partitions 类似于 [{ partition: 0, offset: '12345' }, ...]
    // 把 offset 转成数字类型处理
    const partitionOffsets = partitions.map((p) => ({
      partition: p.partition,
      earliest: Number(p.low),
      latest: Number(p.high), // high通常是下一个待写入偏移，即最后一条消息的offset是 high - 1
    }));

    // 为每个分区计算起始偏移量
    // 注意：latestOffset 实际消息最后一条为 latest - 1，因为 high offset 指向的是下一条可写入位置。
    // 所以最新的消息offset 为 latest - 1
    const startPositions = partitionOffsets.map(({ partition, earliest, latest }) => {
      const available = latest - earliest;
      // 如果可用消息总数小于需要拉取的数目，则从earliest开始
      const startOffset = available > numberOfMessages ? latest - numberOfMessages : earliest;
      return { partition, offset: startOffset };
    });

    const messages: any[] = [];
    const MAX_MESSAGES = numberOfMessages;

    const groupId = `fl-${topic}-${Date.now()}`;

    try {
      const consumer = this.kafkaInstance.consumer({ groupId: groupId });
      await consumer.connect();

      await consumer.subscribe({ topic, fromBeginning: false });

      // 创建一个promise用于在获取指定条数后结束
      let resolveDone: (value: unknown) => void;
      const done = new Promise((resolve) => (resolveDone = resolve));

      await consumer.run({
        eachMessage: async ({ message, partition, pause }) => {
          // console.log('eachMessage', partition, message.offset, message.timestamp);

          messages.push({
            partition,
            timestamp: message.timestamp,
            offset: Number(message.offset),
            key: message.key?.toString(),
            value: message.value?.toString(),
          });

          if (messages.length >= MAX_MESSAGES) {
            console.log('messages.length >= MAX_MESSAGES', messages.length, MAX_MESSAGES);
            // 达到数量后停止消费
            pause();
            resolveDone(true);
          }
        },
      });

      // 使用 seek 来指定消费起点
      for (const { partition, offset } of startPositions) {
        consumer.seek({ topic, partition, offset: String(offset) });
      }

      // 等待获取到足够的消息, 或者超时
      await Promise.race([done, new Promise((resolve) => setTimeout(resolve, 6000))]);

      console.log('done starting disconnect');
      // 停止消费
      await consumer.disconnect();
    } catch (e) {
      console.error('fetchLatestMessages error', e);
    }

    try {
      // 删除临时消费者组
      await this.deleteGroup(groupId);
    } catch (e) {
      console.error('deleteGroup error', e);
    }

    console.log('messages', messages.length);

    messages.sort((a, b) => a.partition - b.partition);

    return messages;
  }
}

class ClusterManager {
  private clusters: Map<string, Cluster>;

  constructor() {
    this.clusters = new Map();
  }

  async createCluster(connectionconfig: ConnectionConfig) {
    console.log('createCluster connectionconfig', connectionconfig);
    let ssl: boolean | any = undefined; // default undefined

    let sasl: any; // default undefined
    if (connectionconfig.mechanism) {
      sasl = {
        mechanism: connectionconfig.mechanism,
        username: connectionconfig.username,
        password: connectionconfig.password,
      };
    }

    if (connectionconfig.ssl) {
      ssl = true;
      if (connectionconfig.ca || connectionconfig.cert || connectionconfig.key) {
        ssl = {
          rejectUnauthorized: true,
        };
        if (connectionconfig.ca) {
          ssl.ca = readFileSync(connectionconfig.ca);
        }
        if (connectionconfig.cert) {
          ssl.cert = readFileSync(connectionconfig.cert);
        }
        if (connectionconfig.key) {
          ssl.key = readFileSync(connectionconfig.key);
        }
      }
    }

    const options: pkg.KafkaConfig = {
      clientId: connectionconfig.id,
      brokers: connectionconfig.brokers.split(','),
      ssl: ssl,
      sasl: sasl,
      retry: {
        // initialRetryTime: 100,
        retries: 2,
      },
    };

    // 判断是否走代理。目前只支持 http connect 方式的代理
    if (connectionconfig.proxy) {
      console.log('connectionconfig.proxy', connectionconfig.proxy);
      const urlIns = new URL(connectionconfig.proxy);
      if (urlIns.protocol !== 'http:') {
        throw new Error('Only support http proxy');
      }

      options.socketFactory = ({ host, port, ssl, onConnect }) => {
        console.log('socketFactory', {
          ssl,
          targetHost: host,
          targetPort: port,
          proxyHost: urlIns.hostname,
          proxyPort: Number(urlIns.port || 80),
          connectOptions: {},
        });
        const overlaySocket = new HttpProxyOnNetSocket({
          targetHost: host,
          targetPort: port,
          proxyHost: urlIns.hostname,
          proxyPort: Number(urlIns.port || 80),
          connectOptions: {},
        });
        overlaySocket.on('connect', () => {
          console.log('overlaySocket on connect');
          onConnect();
        });
        if (ssl) {
          // @ts-ignore
          let sslOptions = ssl === true ? {} : ssl;
          return tls.connect(
            {
              socket: overlaySocket.rawSocket as any,
              ...sslOptions,
            },
            () => {
              console.log('tls connect');
              onConnect();
            },
          );
        } else {
          return overlaySocket as any;
        }
      };
    }

    console.log('createCluster options', options);

    const kafka = new Kafka(options);
    return new Cluster(kafka);
  }

  async getCluster(id: string) {
    let cluster = this.clusters.get(id);
    if (!cluster) {
      let conf = this.getConnectionConfig(id);
      if (!conf) {
        throw new Error('ConnectionConfig not found: ' + id);
      }
      cluster = await this.createCluster(conf);
      await cluster.connect();
      this.clusters.set(id, cluster);
    }
    return cluster;
  }

  async removeCluster(id: string) {
    let cluster = this.clusters.get(id);
    if (cluster) {
      console.log('removeCluster', id);
      try {
        await cluster.close();
      } catch (e) {
        console.error('removeCluster error', e);
      }
      this.clusters.delete(id);
    }
  }

  getConnectionConfig(id: string) {
    return confins.config.connectionConfigs.find((item) => item.id === id);
  }
}

const clusterManager = new ClusterManager();

export { ClusterManager, Cluster, clusterManager };
