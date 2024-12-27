<template>
  <div>
    <el-descriptions title="" size="small" border label-width="120">
      <el-descriptions-item span="3" label="Group ID">{{ group.groupId }}</el-descriptions-item>
      <el-descriptions-item span="3" label="Members">{{ group.members.length }}</el-descriptions-item>
      <el-descriptions-item span="3" label="State">
        <el-tag v-if="group.state === 'Stable'" type="success">{{ group.state }}</el-tag>
        <el-tag v-else-if="group.state === 'PreparingRebalance'" type="warning">{{ group.state }}</el-tag>
        <el-tag v-else>{{ group.state }}</el-tag>
      </el-descriptions-item>
    </el-descriptions>

    <div class="body">
      <h5>Members</h5>
      <el-table :data="group.members" size="small" style="width: 100%">
        <el-table-column prop="clientHost" label="address" width="150"></el-table-column>
        <el-table-column prop="memberId" label="memberId"></el-table-column>
        <el-table-column prop="clientId" label="clientId"></el-table-column>
      </el-table>
    </div>
  </div>
</template>

<script setup lang="ts">

const {group} = defineProps({
  group: {
    type: Object,
    required: true
  }
});

</script>

<style scoped lang="less">
.body {
  margin-top: 10px;
}
</style>