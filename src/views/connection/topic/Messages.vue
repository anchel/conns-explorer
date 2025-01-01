<template>
  <div>
    <div class="top">
      <div class="flex-row-center" style="gap: 15px">
        <el-button type="primary" :loading="listData.loading" @click="handleFetchMessages" :icon="Refresh"></el-button>
        <Plus @click="handleAddMessages" style="width: 20px; height: 20px; cursor: pointer" />
      </div>

      <div class="flex-row-center">
        <Download @click="handleDownload" style="width: 20px; height: 20px; cursor: pointer" />
      </div>
    </div>
    <div class="list" v-loading="listData.loading">
      <el-table :data="listData.list" size="small" border style="width: 100%">
        <el-table-column prop="partition" label="Partition" width="80"></el-table-column>
        <el-table-column prop="offset" label="Offset" width="120"></el-table-column>
        <el-table-column prop="timestamp" label="Timestamp" width="120"></el-table-column>
        <el-table-column prop="key" label="Key" width="180"></el-table-column>
        <el-table-column prop="value" label="Value" show-overflow-tooltip></el-table-column>
      </el-table>
    </div>

    <AddMessages
      :topic="topic"
      v-if="status.dialogVisibleAddMessages"
      v-model:dialog-visible="status.dialogVisibleAddMessages"
    />
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive } from 'vue';
import { Download, Plus, Refresh } from '@element-plus/icons-vue';
import { fetchTopicMessages, saveFile } from '@/utils/ipc.ts';
import { ElMessage } from 'element-plus';
import { useRoute } from 'vue-router';

import AddMessages from '@/views/connection/topic/components/AddMessages.vue';

const route = useRoute();

const { topic } = defineProps({
  topic: {
    type: Object,
    required: true,
  },
});

const status = reactive({
  dialogVisibleAddMessages: false,
});

const listData = reactive({
  loading: false,
  list: [],
});

onMounted(() => {
  // fetchList();
});

const handleFetchMessages = () => {
  console.log('fetch messages');
  fetchList();
};

const fetchList = async () => {
  console.log('fetch list');
  listData.loading = true;
  try {
    const res = await fetchTopicMessages(route.params.cid as string, topic.name, 1000);
    // console.log('fetch topic messages', res);
    listData.list = res;
  } catch (e) {
    console.log('fetch topic messages error', e);
    ElMessage.error('Failed to fetch topic messages, please try again later');
  } finally {
    listData.loading = false;
  }
};

const handleAddMessages = () => {
  console.log('add messages');
  status.dialogVisibleAddMessages = true;
};

const handleDownload = async () => {
  console.log('download');
  if (!listData.list.length) {
    ElMessage.warning('No messages to download');
    return;
  }
  const result = await saveFile(
    {
      properties: ['createDirectory'],
    },
    JSON.stringify(listData.list, null, 2),
  );
  console.log('save file result', result);
  if (result && result.status) {
    ElMessage.success('Messages downloaded successfully. File saved at ' + result.filePath);
  }
};
</script>

<style scoped lang="less">
.top {
  margin-bottom: 10px;
  display: flex;
  justify-content: space-between;
}
</style>
