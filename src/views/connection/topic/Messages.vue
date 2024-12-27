<template>
  <div>
    <div class="top">
      <el-button type="primary" :loading="listData.loading" @click="handleFetchMessages">Fetch Messages</el-button>

      <div>
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
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive } from 'vue';
import { Download } from '@element-plus/icons-vue';
import { fetchTopicMessages, saveFile } from '@/utils/ipc.ts';
import { ElMessage } from 'element-plus';
import { useRoute } from 'vue-router';

const route = useRoute();

const { topic } = defineProps({
  topic: {
    type: Object,
    required: true,
  },
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
