<template>
  <h1>about</h1>
  <RouterLink to="/">Home</RouterLink>
  <el-table :data="tableData" style="width: 100%">
    <el-table-column prop="date" label="Date" width="180"/>
    <el-table-column prop="name" label="Name" width="180"/>
    <el-table-column prop="address" label="Address"/>
  </el-table>
  <el-button type="primary" @click="handleAdd">ipc ping</el-button>
</template>

<script lang="ts" setup>
import {ping} from '@/utils/ipc'

const tableData = [
  {
    date: '2016-05-03',
    name: 'Tom',
    address: 'No. 189, Grove St, Los Angeles',
  },
  {
    date: '2016-05-02',
    name: 'Tom',
    address: 'No. 189, Grove St, Los Angeles',
  },
  {
    date: '2016-05-04',
    name: 'Tom',
    address: 'No. 189, Grove St, Los Angeles',
  },
  {
    date: '2016-05-01',
    name: 'Tom',
    address: 'No. 189, Grove St, Los Angeles',
  },
]

const handleAdd = async () => {
  const ret = await ping();
  console.log('handleClick ipc', ret)
}
</script>

<style lang="less" scoped></style>