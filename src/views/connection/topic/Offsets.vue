<template>
  <div>
    <div class="top">
      <RefreshInterval @refresh="handleFetch" />
    </div>
    <div class="list" v-loading="listData.loading">
      <el-table :data="listData.list" size="small" border style="width: 100%">
        <el-table-column prop="partition" label="Partition"></el-table-column>
        <el-table-column prop="offset" label="Offset" align="right">
          <template #default="{ row }">
            <el-text>{{ new Intl.NumberFormat('en-US').format(row.offset) }}</el-text>
          </template>
        </el-table-column>
        <el-table-column prop="high" label="High" align="right">
          <template #default="{ row }">
            <el-text>{{ new Intl.NumberFormat('en-US').format(row.high) }}</el-text>
          </template>
        </el-table-column>
        <el-table-column prop="low" label="Low" align="right">
          <template #default="{ row }">
            <el-text>{{ new Intl.NumberFormat('en-US').format(row.low) }}</el-text>
          </template>
        </el-table-column>
      </el-table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, watch } from 'vue';
import { fetchTopicOffsets } from '@/utils/ipc.ts';
import { useRoute } from 'vue-router';
import { ElMessage } from 'element-plus';

import RefreshInterval from '@/components/common/RefreshInterval.vue';

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
  fetchList();
});

watch(
  () => topic,
  () => {
    console.log('topic/Offsets topic changed');
    fetchList();
  },
  { deep: true },
);

const handleFetch = () => {
  console.log('fetch');
  fetchList();
};

const fetchList = async () => {
  listData.loading = true;
  try {
    const res = await fetchTopicOffsets(route.params.cid as string, topic.name);
    res.sort((a: any, b: any) => a.partition - b.partition);
    console.log('fetch topic offsets', res);
    listData.list = res;
  } catch (e) {
    console.log('fetch topic offsets error', e);
    ElMessage.error('Failed to fetch topic offsets, please try again later');
  } finally {
    listData.loading = false;
  }
};
</script>

<style scoped lang="less">
.top {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 10px;
}
</style>
