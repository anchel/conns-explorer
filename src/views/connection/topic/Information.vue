<template>
  <el-descriptions title="" size="small" border label-width="120">
    <el-descriptions-item span="3" label="Partitions">{{ topic.partitions.length }}</el-descriptions-item>
    <el-descriptions-item span="3" label="Replicas">{{ replicas }}</el-descriptions-item>
    <el-descriptions-item span="3" label="In-sync Replicas">{{ isrs }}</el-descriptions-item>
    <el-descriptions-item span="3" label="Offline Replicas">{{ offlineReplicas }}</el-descriptions-item>
  </el-descriptions>
  <div>
    <div class="flex-row-center">
      <h5>Partitions</h5>
      <Edit
        title="Modify partitions"
        @click="handleAddPartition"
        style="width: 18px; height: 18px; cursor: pointer; margin-left: 10px"
      />
    </div>
    <el-table :data="topic.partitions" style="width: 100%">
      <el-table-column prop="partitionId" label="Partition" width="100"></el-table-column>
      <el-table-column prop="leader" label="Leader" width="100">
        <template v-slot="{ row }">
          <el-tag type="primary">{{ row.leader }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="replicas" label="Replicas" width="150">
        <template v-slot="{ row }">
          <div class="subitem-list">
            <el-tag v-for="replica in row.replicas" :key="replica" type="info">{{ replica }}</el-tag>
          </div>
        </template>
      </el-table-column>
      <el-table-column prop="isr" label="In-sync Replicas" width="150">
        <template v-slot="{ row }">
          <div class="subitem-list">
            <el-tag v-for="isr in row.isr" :key="isr" type="success">{{ isr }}</el-tag>
          </div>
        </template>
      </el-table-column>
      <el-table-column prop="offlineReplicas" label="Offline Replicas" width="150">
        <template v-slot="{ row }">
          <div class="subitem-list">
            <el-tag v-for="offlineReplica in row.offlineReplicas" :key="offlineReplica" type="danger"
              >{{ offlineReplica }}
            </el-tag>
          </div>
        </template>
      </el-table-column>
    </el-table>

    <AddPartitions
      :topic="topic"
      v-if="status.dialogVisibleModifyPartitions"
      v-model:dialog-visible="status.dialogVisibleModifyPartitions"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, reactive } from 'vue';
import { Edit } from '@element-plus/icons-vue';
import AddPartitions from '@/views/connection/topic/components/AddPartitions.vue';

const { topic } = defineProps({
  topic: {
    type: Object,
    required: true,
  },
});

const replicas = computed(() => {
  return topic.partitions.reduce((acc: any, item: any) => {
    acc += item.replicas.length;
    return acc;
  }, 0);
});

const isrs = computed(() => {
  return topic.partitions.reduce((acc: any, item: any) => {
    acc += item.isr.length;
    return acc;
  }, 0);
});

const offlineReplicas = computed(() => {
  return topic.partitions.reduce((acc: any, item: any) => {
    acc += item.offlineReplicas.length;
    return acc;
  }, 0);
});

const status = reactive({
  loading: false,
  dialogVisibleModifyPartitions: false,
});

const handleAddPartition = () => {
  console.log('add partition');
  status.dialogVisibleModifyPartitions = true;
};
</script>

<style scoped lang="less">
.subitem-list {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
}
</style>
