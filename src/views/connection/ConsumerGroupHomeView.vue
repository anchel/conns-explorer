<template>
  <div class="content">
    <div class="header">
      <h3>{{ group.groupId }}</h3>
      <Delete @click="handleDelete" title="Delete consumer group" class="delete" />
    </div>
    <el-tabs v-model="activeName" class="demo-tabs" @tab-click="handleTabClick">
      <el-tab-pane label="Information" name="info" :lazy="true">
        <ConsumerGroupInformation :group="group" />
      </el-tab-pane>
      <el-tab-pane label="Offsets" name="offset" :lazy="true">
        <ConsumerGroupOffsets :group="group" />
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup lang="ts">
import { inject, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useGlobalStore } from '@/stores/global';
import ConsumerGroupInformation from '@/views/connection/consumer-group/Information.vue';
import ConsumerGroupOffsets from '@/views/connection/consumer-group/Offsets.vue';
import { Delete } from '@element-plus/icons-vue';
import { deleteGroup } from '@/utils/ipc.ts';
import { ElMessage, ElMessageBox } from 'element-plus';

const { refreshPageMain, refreshConsumerGroups } = useGlobalStore();

const router = useRouter();
const route = useRoute();

const activeName = ref('info');

const consumerGroups = inject<any>('consumerGroups');

const group = ref<any>({
  members: [],
});

onMounted(() => {
  const cgid = route.params.cgid;
  console.log('onMounted', cgid);

  assignConsumerGroup();

  const { query } = route;
  if (query.tab && ['info', 'offset'].includes(query.tab as string)) {
    activeName.value = query.tab as string;
  }
});

watch(
  () => consumerGroups,
  () => {
    assignConsumerGroup();
  },
);

const assignConsumerGroup = () => {
  const cgid = route.params.cgid;

  group.value = consumerGroups.value.find((item: any) => item.groupId === cgid);
  if (group.value.members) {
    group.value.members.sort((a: any, b: any) => a.memberId - b.memberId);
  }
};

watch(
  () => route.params.cgid,
  () => {
    refreshPageMain();
  },
);

const handleTabClick = (tab: any) => {
  // console.log('tab', tab)
  router.push({ query: { tab: tab.paneName } });
};

const doDeleteConsumerGroup = async () => {
  try {
    const cid = route.params.cid as string;
    const ret = await deleteGroup(cid, group.value.groupId);
    console.log('delete group', ret);
    ElMessage.success('Delete group success');
    refreshConsumerGroups(); // update consumer groups

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
  console.log('delete group', group.value.groupId);
  ElMessageBox.confirm(`Delete group: ${group.value.groupId}. Continue?`, 'Warning', {
    confirmButtonText: 'Confirm',
    cancelButtonText: 'Cancel',
    type: 'warning',
  })
    .then(() => {
      doDeleteConsumerGroup();
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