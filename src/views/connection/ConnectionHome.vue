<template>
  <el-container class="container" v-loading="status.loading">
    <el-aside class="left">
      <div class="operation">
        <el-dropdown trigger="click">
          <Plus title="Add" style="width: 20px; height: 20px; cursor: pointer" />
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item @click="handleClickAddTopic">Topic</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
        <refresh-page-button></refresh-page-button>
      </div>
      <div class="panel">
        <h3>Brokers</h3>
        <div class="list brokers">
          <div class="item" :class="{ selected: !!broker.selected }" v-for="broker in brokers" :key="broker.nodeId">
            <el-link type="primary" @click="handleClickBroker(broker)"> {{ broker.host }}:{{ broker.port }}</el-link>

            <el-text :type="broker.isController ? 'primary' : 'info'" round>id: {{ broker.nodeId }}</el-text>
          </div>
        </div>
      </div>

      <div class="panel topics">
        <div class="header">
          <h3>Topics</h3>
          <Plus
            @click="handleClickAddTopic"
            class="toggle-hidden"
            title="Add topic"
            style="width: 20px; height: 20px"
          />
        </div>
        <div class="list">
          <div class="item" :class="{ selected: !!topic.selected }" v-for="topic in topics" :key="topic.name">
            <el-link type="primary" @click="handleClickTopic(topic)">{{ topic.name }}</el-link>

            <el-text size="small">{{ topic.partitions.length }}</el-text>
          </div>
        </div>
      </div>

      <div class="panel consumer-groups">
        <h3>Consumer Groups</h3>
        <div class="list">
          <div class="item" :class="{ selected: !!cg.selected }" v-for="cg in consumerGroups" :key="cg.groupId">
            <el-link type="primary" @click="handleClickConsumerGroup(cg)">
              {{ cg.groupId }}
            </el-link>
          </div>
        </div>
      </div>
    </el-aside>
    <el-divider direction="vertical" style="height: 100%" />
    <el-main>
      <router-view v-slot="{ Component }">
        <refresh-loading v-if="refreshing"></refresh-loading>
        <component v-else-if="status.loaded" :is="Component" />
        <div v-else>Loading</div>
      </router-view>
    </el-main>

    <topic-add
      v-if="status.dialogVisibleAddTopic"
      v-model:dialog-visible="status.dialogVisibleAddTopic"
      @add-topic="onAddTopic"
    ></topic-add>
  </el-container>
</template>

<script setup lang="ts">
import { inject, onBeforeUnmount, onMounted, onUnmounted, provide, reactive, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { Plus } from '@element-plus/icons-vue';
// import {ConnectionConfig} from "@/types";

import { useGlobalStore } from '@/stores/global';

import { listBrokers, listTopics, listGroups, closeConnection } from '@/utils/ipc.ts';
import RefreshLoading from '@/components/layout/refresh-loading.vue';
import RefreshPageButton from '@/components/layout/refresh-page-button.vue';
import TopicAdd from '@/views/connection/topic/TopicAdd.vue';
import { ElMessage } from 'element-plus';

const router = useRouter();
const route = useRoute();

const connection = ref<any>({});

const assignConnection = () => {
  const cid = route.params.cid;
  connection.value = { cid };
};

const status = reactive<any>({
  loading: false,
  loaded: false,
  dialogVisibleAddTopic: false,
});

const brokers = ref<any>([]);
const topics = ref<any>([]);
const consumerGroups = ref<any>([]);

provide('brokers', brokers);
provide('topics', topics);
provide('consumerGroups', consumerGroups);
provide('alldata', { brokers, topics, consumerGroups });

onMounted(() => {
  assignConnection();

  status.loading = true;
  initData()
    .catch((e) => {
      console.log('init data error', e);
      ElMessage.error({
        message: 'Failed to load data, please try again later - ' + e.message,
        duration: 5000,
      });
    })
    .finally(() => {
      status.loading = false;
      status.loaded = true;
    });
});

const initData = async () => {
  console.log('route params', route.params, route.params.cid);

  await fetchBrokers();
  await fetchTopics();
  await fetchConsumerGroups();
};

const fetchBrokers = async () => {
  const { cid, bid } = route.params;
  let ret = await listBrokers(cid as string);
  console.log('fetch brokers', ret);
  brokers.value = ret.brokers;
  brokers.value.sort((a: any, b: any) => a.nodeId - b.nodeId);
  brokers.value.forEach((item: any) => {
    item.selected = item.nodeId === Number(bid);
  });
};

const fetchTopics = async () => {
  const { cid, tid } = route.params;
  let ret = await listTopics(cid as string);
  console.log('fetch topics', ret);
  topics.value = ret.topics;
  topics.value.sort((a: any, b: any) => a.name.localeCompare(b.name));
  topics.value.forEach((item: any) => {
    item.selected = item.name === tid;
  });
};

const fetchConsumerGroups = async () => {
  const { cid, cgid } = route.params;
  let ret = await listGroups(cid as string);
  console.log('fetch consumer groups', ret);
  consumerGroups.value = ret.groups;
  consumerGroups.value.sort((a: any, b: any) => a.groupId.localeCompare(b.groupId));
  consumerGroups.value.forEach((item: any) => {
    item.selected = item.groupId === cgid;
  });
};

const handleClickAddTopic = () => {
  status.dialogVisibleAddTopic = true;
};

const handleClickBroker = (broker: any) => {
  handleSelect(broker);
  router.push({
    name: 'BrokerHome',
    params: { cid: route.params.cid, bid: broker.nodeId },
    query: { tab: route.query.tab },
  });
};

const handleClickTopic = (topic: any) => {
  handleSelect(topic);
  router.push({
    name: 'TopicHome',
    params: { cid: route.params.cid, tid: topic.name },
    query: { tab: route.query.tab },
  });
};

const handleClickConsumerGroup = (consumerGroup: any) => {
  handleSelect(consumerGroup);
  router.push({
    name: 'ConsumerGroupHome',
    params: { cid: route.params.cid, cgid: consumerGroup.groupId },
    query: { tab: route.query.tab },
  });
};

const handleSelect = (item: any) => {
  brokers.value.forEach((item: any) => (item.selected = false));
  topics.value.forEach((item: any) => (item.selected = false));
  consumerGroups.value.forEach((item: any) => (item.selected = false));

  item.selected = true;
};

const globalStore = useGlobalStore();
const refreshing = ref(false);
watch(
  () => globalStore.refreshTriggerMain,
  () => {
    refreshing.value = true;
    setTimeout(() => {
      refreshing.value = false;
    }, 50);
  },
);

const onAddTopic = async (topicName: string) => {
  await fetchTopics();
  const topic = topics.value.find((item: any) => item.name === topicName);
  if (topic) {
    handleClickTopic(topic);
  }
};

watch(
  () => globalStore.refreshTriggerBrokers,
  () => {
    fetchBrokers();
  },
);

watch(
  () => globalStore.refreshTriggerTopics,
  () => {
    fetchTopics();
  },
);

watch(
  () => globalStore.refreshTriggerConsumerGroups,
  () => {
    fetchConsumerGroups();
  },
);

onBeforeUnmount(() => {
  console.log('connectionHome unmounted', connection.value.cid);
  closeConnection(connection.value.cid);
});
</script>

<style scoped lang="less">
.container {
  display: flex;
  justify-content: space-between;
  height: calc(100vh - 80px);

  .left {
    height: 100%;
    padding-left: 20px;
    padding-right: 20px;

    // /* 定义滚动条样式 */
    // ::-webkit-scrollbar {
    //   width: 50px;
    //   /* 滚动条宽度 */
    // }

    // /* 自定义滚动条滑块 */
    // ::-webkit-scrollbar-thumb {
    //   background: #888;
    //   /* 滑块颜色 */
    //   border-radius: 6px;
    //   /* 滑块圆角 */
    // }

    // /* 自定义滚动条轨道 */
    // ::-webkit-scrollbar-track {
    //   background: #f1f1f1;
    //   /* 轨道颜色 */
    // }

    /* 设置滚动条宽度 */
    scrollbar-width: thin;
    /* 或 auto */

    /* 设置滚动条颜色 */
    // scrollbar-color: #242424 #888;
    /* 滑块颜色 轨道颜色 */

    .operation {
      display: flex;
      justify-content: flex-end;
      gap: 8px;
    }
  }

  .panel {
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;

      .toggle-hidden {
        cursor: pointer;
        display: none;
      }

      &:hover {
        .toggle-hidden {
          display: block;
        }
      }
    }

    .list {
      display: flex;
      flex-direction: column;
      align-items: start;
      gap: 6px;

      .item {
        width: 100%;
        display: flex;
        align-items: center;
        justify-content: space-between;
        //line-height: 16px;
        padding: 6px;

        .el-link {
          font-size: 16px;
          gap: 8px;
        }

        &.selected {
          //background-color: var(--el-menu-bg-color);
          //background-color: #35443b;
          background-color: var(--el-bg-color-active);
          border-radius: 4px;

          .el-link {
            color: white;
          }

          .el-text {
            color: white;
          }
        }
      }
    }
  }
}
</style>
