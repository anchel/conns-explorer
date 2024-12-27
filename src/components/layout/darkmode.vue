<template>
  <div class="darkmode-header">
    <Sunny v-if="isDark" @click="handleClick" style="width: 20px; height: 20px;"/>
    <Moon v-else @click="handleClick" style="width: 20px; height: 20px;"/>
  </div>
</template>

<script lang="ts" setup>
import {useDark, useToggle} from '@vueuse/core';
import {getTheme, setTheme} from "@/utils/ipc";
import {onMounted} from "vue";
import {Sunny, Moon} from "@element-plus/icons-vue";

const isDark = useDark();
const toggleDark = useToggle(isDark);

onMounted(async () => {
  const {theme, systemTheme} = await getTheme();
  console.log('getTheme', theme, systemTheme);
  if (theme === 'system') { // Following system theme
    toggleDark(systemTheme === 'dark');
  } else {
    toggleDark(theme === 'dark');
  }
});

const handleClick = () => {
  let n = toggleDark();
  // console.log('n', n);
  setTheme(n ? 'dark' : 'light');
};
</script>

<style scoped lang="less">
.darkmode-header {
  display: flex;
  justify-content: flex-end;
  cursor: pointer;
  // margin: 6px 0;
}
</style>
