<template>
  <div class="content">
    <div class="header">
      <h3>{{ topic.name }}</h3>
      <Delete @click="handleDelete" v-if="topic.name !== '__consumer_offsets'" title="Delete topic" class="delete" />
    </div>
    <el-tabs v-model="activeName" class="demo-tabs" @tab-click="handleTabClick">
      <el-tab-pane label="Information" name="info" :lazy="true">
        <TopicInformation :topic="topic" />
      </el-tab-pane>
      <el-tab-pane label="Offsets" name="offset" :lazy="true">
        <TopicOffsets :topic="topic" />
      </el-tab-pane>
      <el-tab-pane label="Messages" name="msg" :lazy="true">
        <TopicMessages :topic="topic" />
      </el-tab-pane>
      <el-tab-pane label="Configs" name="config" :lazy="true">
        <TopicConfigs :topic="topic" />
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup lang="ts">
import { inject, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { Delete } from '@element-plus/icons-vue';
import { useGlobalStore } from '@/stores/global';
import TopicInformation from '@/views/connection/topic/Information.vue';
import TopicOffsets from '@/views/connection/topic/Offsets.vue';
import TopicMessages from '@/views/connection/topic/Messages.vue';
import TopicConfigs from '@/views/connection/topic/TopicConfigs.vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { deleteTopic } from '@/utils/ipc.ts';

const { refreshPageMain, refreshTopics } = useGlobalStore();

const router = useRouter();
const route = useRoute();

const activeName = ref('info');

const topics = inject<any>('topics');
const alldata = inject<any>('alldata');

const topic = ref<any>({
  partitions: [],
});

onMounted(() => {
  const topicName = route.params.tid;
  console.log('topic home onMounted', topicName);

  assignTopic();

  const { query } = route;
  if (query.tab && ['info', 'offset', 'msg', 'config'].includes(query.tab as string)) {
    activeName.value = query.tab as string;
  }
});

watch(
  () => alldata.topics,
  () => {
    console.log('watch alldata.topics');
    assignTopic();
  },
  { deep: true },
);

const assignTopic = () => {
  const topicName = route.params.tid;
  console.log('assignTopic', topicName);

  let findTopic = topics.value.find((item: any) => item.name === topicName);
  if (findTopic) {
    topic.value = JSON.parse(JSON.stringify(findTopic));
    if (topic.value.partitions) {
      topic.value.partitions.sort((a: any, b: any) => a.partitionId - b.partitionId);
    }
  }
};

watch(
  () => route.params.tid,
  () => {
    refreshPageMain();
  },
);

const handleTabClick = (tab: any) => {
  // console.log('tab', tab)
  router.push({ query: { tab: tab.paneName } });
};

const doDeleteTopic = async () => {
  try {
    const cid = route.params.cid as string;
    const ret = await deleteTopic(cid, topic.value.name);
    console.log('delete topic', ret);
    ElMessage.success('Delete topic success');
    refreshTopics(); // update topics

    await router.push({
      name: 'ConnectionDetail',
      params: {
        cid: cid,
      },
    });
  } catch (e) {
    console.error(e);
  }
};

const handleDelete = () => {
  console.log('delete topic', topic.value.name);
  ElMessageBox.confirm(`Delete topic: ${topic.value.name}. Continue?`, 'Warning', {
    confirmButtonText: 'Confirm',
    cancelButtonText: 'Cancel',
    type: 'warning',
  })
    .then(() => {
      doDeleteTopic();
    })
    .catch(() => {});
};
</script>

<style scoped lang="less">
.content {
  .header {
    display: flex;
    align-items: center;
    justify-content: flex-start;
    gap: 10px;

    .delete {
      cursor: pointer;
      width: 18px;
      height: 18px;
    }
  }

  .subitem-list {
    display: flex;
    flex-wrap: wrap;
    gap: 5px;
  }
}
</style>
