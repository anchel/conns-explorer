<template>
  <div class="refresh-interval">
    <el-button-group>
      <el-button type="primary" :icon="Refresh" @click="handleClick">Refresh</el-button>
      <el-dropdown split-button type="primary" @command="handleCommand">
        {{ selectedInterval.label }}
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item v-for="item in intervals" :key="item.value" :command="item">
              {{ item.label }}
            </el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </el-button-group>
  </div>
</template>

<script lang="ts" setup>
import { onMounted, onUnmounted, ref, watch } from 'vue';
import { Refresh } from '@element-plus/icons-vue';

const emit = defineEmits(['refresh']);

// 定义可选的时间间隔
const intervals = [
  { label: 'Off', value: 0 },
  { label: '5s', value: 5 },
  // { label: '10s', value: 10 },
  { label: '15s', value: 15 },
  { label: '30s', value: 30 },
  { label: '1m', value: 60 },
  { label: '5m', value: 300 },
  { label: '15m', value: 900 },
  { label: '30m', value: 1800 },
  { label: '1h', value: 3600 },
  { label: '2h', value: 7200 },
  { label: '1d', value: 86400 },
];

const timer = ref<any>(null);

// 当前选中的时间间隔
const selectedInterval = ref<any>(intervals[3]); // 默认选中10s

// 处理选中项
const handleCommand = (item: any) => {
  selectedInterval.value = item;
  console.log(`Selected interval: ${item.label} (${item.value}s)`);
  // 你可以在这里添加逻辑，比如触发定时刷新
};

const checkSelectedInterval = () => {
  clearInterval(timer.value);
  if (selectedInterval.value.value > 0) {
    timer.value = setInterval(() => {
      emit('refresh');
    }, selectedInterval.value.value * 1000);
  }
};

watch(selectedInterval, () => {
  console.log('selectedInterval changed');
  checkSelectedInterval();
});

onMounted(() => {
  checkSelectedInterval();
});

onUnmounted(() => {
  clearInterval(timer.value);
});

const handleClick = () => {
  emit('refresh');
};
</script>

<style lang="less" scoped>
.refresh-interval {
  display: flex;
  align-items: center;
}

//.el-button {
//  width: 100px;
//  justify-content: space-between;
//}
</style>
