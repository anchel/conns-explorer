<template>
  <div>
    <el-tabs v-model="activeName" class="demo-tabs" @tab-click="handleTabClick">
      <el-tab-pane label="Information" name="info" :lazy="true">
        <BrokerInformation :broker="broker"/>
      </el-tab-pane>
      <el-tab-pane label="Configs" name="config" :lazy="true">
        <BrokerConfigs :broker="broker"/>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup lang="ts">
import {inject, onMounted, ref, watch} from "vue";
import {useRoute, useRouter} from 'vue-router'


import {useGlobalStore} from '@/stores/global'
import BrokerInformation from "@/views/connection/broker/Information.vue";
import BrokerConfigs from "@/views/connection/broker/BrokerConfigs.vue";

const {refreshPageMain} = useGlobalStore()

const router = useRouter()
const route = useRoute();

const activeName = ref('info');
const brokers = inject<any>('brokers');

const broker = ref<any>({})

onMounted(() => {
  const brokerId = route.params.bid;
  console.log('onMounted brokerId', brokerId)

  broker.value = brokers.value.find((item: any) => item.nodeId === parseInt(brokerId as string));

  const {query} = route
  console.log('tab', query.tab)
  if (query.tab && ['info', 'config'].includes(query.tab as string)) {
    activeName.value = query.tab as string
  }
})

watch(() => route.params.bid, () => {
  refreshPageMain();
})

const handleTabClick = (tab: any) => {
  // console.log('tab', tab)
  router.push({query: {tab: tab.paneName}})
}
</script>

<style scoped lang="less">

</style>