<template>
  <div>
    <!-- <div class="top">
      <el-button @click="handleFetch" :icon="Refresh" circle></el-button>
    </div> -->
    <div class="list" v-loading="listData.loading">
      <div class="header">
        <div class="flex-row-center">
          <el-input v-model="keyword" placeholder="Input keyword to filter" clearable style="width: 250px;" />
          <div class="filter-item">
            <el-text>isDefault:</el-text>
            <el-select v-model="defaultV" style="width: 120px;">
              <el-option label="All" value="a"></el-option>
              <el-option label="Yes" value="y"></el-option>
              <el-option label="No" value="n"></el-option>
            </el-select>
          </div>
        </div>

        <div>
          <el-button @click="handleFetch" :icon="Refresh" circle></el-button>
        </div>
      </div>
      <el-table :data="tableData" size="small" border style="width: 100%">
        <el-table-column prop="configName" label="configName"></el-table-column>
        <el-table-column prop="configValue" label="configValue"></el-table-column>
        <el-table-column prop="isDefault" label="isDefault">
          <template #default="{ row }">
            <el-text v-if="row.isDefault">Yes</el-text>
            <el-text type="primary" v-else>No</el-text>
          </template>
        </el-table-column>
      </el-table>
    </div>
  </div>
</template>

<script setup lang="ts">

import { computed, onMounted, reactive, ref } from "vue";
import { describeBrokerConfigs, } from "@/utils/ipc.ts";
import { useRoute } from "vue-router";
import { ElMessage } from "element-plus";
import { Refresh } from "@element-plus/icons-vue";

const route = useRoute();

const { broker } = defineProps({
  broker: {
    type: Object,
    required: true
  }
});

const listData = reactive({
  loading: false,
  list: []
})
const keyword = ref('')
const defaultV = ref('a')

const tableData = computed(() => {
  if (!keyword.value && defaultV.value === 'a') {
    return listData.list;
  }
  const isDefault = defaultV.value === 'y';
  return listData.list.filter((item: any) => {
    return (defaultV.value === 'a' || item.isDefault === isDefault) &&
      ((item.configName && item.configName.includes(keyword.value)) || (item.configValue && item.configValue.includes(keyword.value)));
  })
})

onMounted(() => {
  console.log('broker configs onMounted');
  fetchList();
})

const handleFetch = () => {
  console.log('fetch')
  fetchList();
}

const fetchList = async () => {
  listData.loading = true;
  try {
    const res = await describeBrokerConfigs(route.params.cid as string, broker.nodeId);
    console.log('fetch broker configs', res);
    if (res.resources && res.resources.length > 0) {
      const findResource = res.resources.find((r: any) => r.resourceType === 4 && r.resourceName === String(broker.nodeId));
      if (findResource) {
        listData.list = findResource.configEntries;
      }
    }

  } catch (e) {
    console.log('fetch broker configs error', e);
    ElMessage.error('Failed to fetch broker configs, please try again later');
  } finally {
    listData.loading = false;
  }
}

</script>


<style scoped lang="less">
.top {
  margin-bottom: 10px;
}

.list {
  .header {
    display: flex;
    gap: 6px;
    align-items: center;
    margin-bottom: 10px;
    justify-content: space-between;

    .filter-item {
      display: flex;
      align-items: center;
      gap: 6px;

      &:not(:first-child) {
        margin-left: 10px;
      }
    }
  }
}
</style>