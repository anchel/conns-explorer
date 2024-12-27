<template>
  <div>
    <div class="top">
      <RefreshInterval @refresh="handleFetch" />
    </div>
    <div class="list" v-loading="listData.loading">
      <el-table
        :data="listData.list"
        v-loading="listData.loading"
        row-key="tp"
        default-expand-all
        border
        size="small"
        style="width: 100%"
      >
        <el-table-column prop="tp" label="Topic/Partition">
          <template #default="{ row }">
            <el-text v-if="row.isTopic" type="primary">{{ row.tp }}</el-text>
            <el-text v-if="row.isPartition">{{ row.tp }}</el-text>
          </template>
        </el-table-column>
        <el-table-column prop="offset" label="Offset" align="right" width="100">
          <template #default="{ row }">
            <el-text v-if="row.offset">{{ new Intl.NumberFormat('en-US').format(row.offset) }}</el-text>
          </template>
        </el-table-column>
        <el-table-column prop="lag" label="Lag" align="right" width="100">
          <template #default="{ row }">
            <el-text v-if="row.lag">{{ new Intl.NumberFormat('en-US').format(row.lag) }}</el-text>
          </template>
        </el-table-column>
        <el-table-column prop="high" label="Partition High" align="right" width="100">
          <template #default="{ row }">
            <el-text v-if="row.high">{{ new Intl.NumberFormat('en-US').format(row.high) }}</el-text>
          </template>
        </el-table-column>
        <el-table-column prop="clientId" label="ClientId" show-overflow-tooltip></el-table-column>
        <el-table-column prop="address" label="Address" width="116"></el-table-column>
        <el-table-column prop="operations" label="Ops" align="right" width="60">
          <template #default="{ row }">
            <el-dropdown trigger="click">
              <el-button :type="row.isTopic ? '' : ''" :icon="Operation" circle></el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item v-if="row.isTopic" @click="handleResetGroupTopicOffsets(row)"
                    >Reset offsets
                  </el-dropdown-item>
                  <el-dropdown-item v-if="row.isPartition" @click="handleSetGroupTopicPartitionOffset(row)"
                    >Set offset
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <ResetOffsets
      v-if="status.dialogVisibleResetOffsets"
      v-model:dialog-visible="status.dialogVisibleResetOffsets"
      :topic="selectedTopic"
      :group="group"
    />

    <SetTopicPartitionOffset
      v-if="status.dialogVisibleSetPartitionOffset"
      v-model:dialog-visible="status.dialogVisibleSetPartitionOffset"
      :topic="selectedTopic"
      :group="group"
      :partition="selectedPartition"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { useRoute } from 'vue-router';
import { fetchGroupOffsets, fetchTopicOffsets, resetGroupTopicOffsets } from '@/utils/ipc.ts';
import { ElMessage, ElMessageBox } from 'element-plus';
import RefreshInterval from '@/components/common/RefreshInterval.vue';
import { Operation } from '@element-plus/icons-vue';
import ResetOffsets from '@/views/connection/consumer-group/components/ResetOffsets.vue';
import SetTopicPartitionOffset from '@/views/connection/consumer-group/components/SetTopicPartitionOffset.vue';

const route = useRoute();

const { group } = defineProps({
  group: {
    type: Object,
    required: true,
  },
});

const topics = computed<Array<string>>(() => {
  let arr: Array<string> = [];
  group.members.forEach((member: any) => {
    if (member.memberMetadata && member.memberMetadata.subscriptions) {
      member.memberMetadata.subscriptions.forEach((sub: any) => {
        arr.push(sub);
      });
    }
  });
  return arr;
});

const status = reactive({
  loading: false,
  dialogVisibleResetOffsets: false,
  dialogVisibleSetPartitionOffset: false,
});
const selectedTopic = ref({});
const selectedPartition = ref({});

const listData = reactive({
  loading: false,
  list: [],
});

const handleFetch = () => {
  // console.log('fetch');
  fetchList();
};

onMounted(() => {
  fetchList();
});

const fetchList = async () => {
  listData.loading = true;
  try {
    // const topicOffsetsArray = await Promise.all(
    //   topics.value.map((topic) => {
    //     return new Promise((resolve, reject) => {
    //       fetchTopicOffsets(route.params.cid as string, topic).then((ret) => {
    //         resolve({
    //           topic,
    //           offsets: ret,
    //         });
    //       }, reject);
    //     });
    //   }),
    // );
    // console.log('topicOffsetsArray', topicOffsetsArray);

    const res = await fetchGroupOffsets(route.params.cid as string, group.groupId, []); // 空数组表示获取所有topic的offset
    console.log('res', res);

    const topics = res.map((item: any) => item.topic);
    const topicOffsetsArray = await Promise.all(
      topics.map((topic: string) => {
        return new Promise((resolve, reject) => {
          fetchTopicOffsets(route.params.cid as string, topic).then((ret) => {
            resolve({
              topic,
              offsets: ret,
            });
          }, reject);
        });
      }),
    );

    res.forEach((item: any) => {
      item.isTopic = true;
      item.tp = item.topic;
      const findTopicOffsets: any = topicOffsetsArray.find((t: any) => t.topic === item.topic);
      if (item.partitions) {
        // 排序
        item.partitions.sort((a: any, b: any) => a.partition - b.partition);

        item.children = item.partitions.map((p: any) => {
          let member: any = findMemberByPartition(item.topic, p.partition) || {};
          let partitionOffsets = findTopicOffsets?.offsets.find((o: any) => o.partition === p.partition);
          return {
            isPartition: true,
            topic: item.topic,
            partition: p.partition,
            tp: `${p.partition}`,
            offset: p.offset,
            lag: partitionOffsets ? Number(partitionOffsets.high) - Number(p.offset) : undefined,
            high: partitionOffsets ? Number(partitionOffsets.high) : undefined,
            clientId: member.clientId,
            address: member.clientHost,
          };
        });
      }
    });
    listData.list = res;
  } catch (e) {
    console.log('fetch group offsets error', e);
    ElMessage.error('Failed to fetch group offsets, please try again later');
  } finally {
    listData.loading = false;
  }
};

const findMemberByPartition = (topic: string, partition: number) => {
  let member = null;
  group.members.forEach((m: any) => {
    if (m.memberAssignment && m.memberAssignment.assignments) {
      m.memberAssignment.assignments.forEach((sub: any) => {
        if (sub.topic === topic && sub.partitions.includes(partition)) {
          member = m;
        }
      });
    }
  });
  return member;
};

const handleSetGroupTopicPartitionOffset = async (row: any) => {
  console.log('reset group topic offsets', row);
  selectedTopic.value = { name: row.topic };
  selectedPartition.value = { partition: row.partition, offset: row.offset };
  status.dialogVisibleSetPartitionOffset = true;
};
const handleResetGroupTopicOffsets = async (row: any) => {
  console.log('reset group topic offsets', row);
  selectedTopic.value = { name: row.topic };
  status.dialogVisibleResetOffsets = true;

  // ElMessageBox.confirm(`Reset group offsets in topic: ${row.topic}. Continue?`, 'Warning', {
  //   confirmButtonText: 'Confirm',
  //   cancelButtonText: 'Cancel',
  //   type: 'warning',
  // })
  //   .then(() => {
  //     doResetGroupTopicOffsets(row);
  //   })
  //   .catch(() => {
  //     // do nothing
  //   });
};

// const doResetGroupTopicOffsets = async (row: any) => {
//   console.log('reset group topic offsets', row.topic);
//   const msgIns = ElMessage({
//     message: 'Resetting group topic offsets...',
//     duration: 0,
//   });
//   try {
//     await resetGroupTopicOffsets(route.params.cid as string, group.groupId, row.topic, false);
//     msgIns.close();
//     ElMessage.success('Reset group topic offsets successfully');
//   } catch (e) {
//     msgIns.close();
//     console.log('reset group topic offsets error', e);
//     ElMessage.error('Failed to reset group topic offsets, please try again later');
//   }
// };
</script>

<style scoped lang="less">
.top {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 10px;
}
</style>
