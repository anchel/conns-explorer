<template>
  <div class="header">
    <div>
      <House class="house" @click="handleGoHome" v-if="route.name !== 'Home'" />
    </div>
    <Darkmode />
  </div>
  <router-view v-slot="{ Component }">
    <refresh-loading v-if="refreshing"></refresh-loading>
    <component v-else :is="Component" />
  </router-view>
</template>

<script setup lang="ts">
import { House } from '@element-plus/icons-vue';
import { useGlobalStore } from '@/stores/global';
import RefreshLoading from '@/components/layout/refresh-loading.vue';
import Darkmode from '@/components/layout/darkmode.vue';
import { ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

const router = useRouter();
const route = useRoute();

const handleGoHome = () => {
  console.log('go home');
  router.push({
    name: 'Home',
  });
};

const globalStore = useGlobalStore();
const refreshing = ref(false);
watch(
  () => globalStore.refreshTrigger,
  () => {
    refreshing.value = true;
    setTimeout(() => {
      refreshing.value = false;
    }, 50);
  },
);
</script>

<style lang="less" scoped>
.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-left: 20px;
  padding-right: 20px;
  padding-top: 6px;

  .house {
    width: 18px;
    height: 18px;
    cursor: pointer;
  }
}
</style>
