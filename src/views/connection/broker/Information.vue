<template>
  <div>
    <el-descriptions title="Broker Information">
      <el-descriptions-item span="3" label="Address">{{ broker.host }}:{{ broker.port }}</el-descriptions-item>
      <el-descriptions-item span="3" label="Node ID">{{ broker.nodeId }}</el-descriptions-item>
      <el-descriptions-item span="3" label="Controller">{{ broker.isController ? 'Yes' : 'No' }}</el-descriptions-item>
    </el-descriptions>
  </div>
</template>

<script setup lang="ts">

const {broker} = defineProps({
  broker: {
    type: Object,
    required: true
  }
});

</script>

<style scoped lang="less">

</style>