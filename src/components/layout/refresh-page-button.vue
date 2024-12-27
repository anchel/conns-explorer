<template>
  <div>
    <!-- <el-button @click="handleClick" :icon="Refresh" circle></el-button> -->
    <Refresh @click="handleClick" title="Refresh" style="width: 20px; height: 20px; cursor: pointer;" />
  </div>
</template>

<script setup lang="ts">

import { Refresh } from "@element-plus/icons-vue";
import { useGlobalStore } from "@/stores/global.ts";

const { refreshPage } = useGlobalStore()

const handleClick = () => {
  refreshPage();
};
</script>

<style scoped lang="less"></style>