<template>
  <el-dialog title="Set offset" v-model="dialogVisible" :close-on-click-modal="false">
    <el-form :model="form" :rules="rules" ref="formRef" label-width="auto" label-position="left" size="small">
      <el-form-item prop="group" label="Group">{{ group.groupId }}</el-form-item>
      <el-form-item prop="topic" label="Topic">{{ topic.name }}</el-form-item>
      <el-form-item prop="partition" label="Partition">{{ partition.partition }}</el-form-item>
      <el-form-item prop="curOffset" label="Current Offset">{{ partition.offset }}</el-form-item>
      <el-form-item prop="offset" label="Offset">
        <el-input v-model.number="form.offset" placeholder="minimum value: -1"></el-input>
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button :loading="status.loading" @click="dialogVisible = false">Cancel</el-button>
      <el-button type="primary" :loading="status.loading" @click="onSubmit">Confirm</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { QuestionFilled } from '@element-plus/icons-vue';
import { reactive, ref } from 'vue';
import { ElMessage, FormInstance } from 'element-plus';
import { setGroupTopicOffsets } from '@/utils/ipc.ts';
import { useRoute } from 'vue-router';

const route = useRoute();

const { group, topic, partition } = defineProps({
  group: {
    type: Object,
    required: true,
  },
  topic: {
    type: Object,
    required: true,
  },
  partition: {
    type: Object,
    required: true,
  },
});
const dialogVisible = defineModel('dialogVisible', { type: Boolean });

const form = reactive({
  offset: '',
});
const formRef = ref<FormInstance | null>(null);

const rules = {
  offset: [{ required: true, message: 'Please input offset', trigger: 'blur' }],
};

const status = reactive({
  loading: false,
});

const doSubmit = async () => {
  console.log('set group topic partition offset', topic.name);
  const msgIns = ElMessage({
    message: 'Setting group topic partition offset...',
    duration: 0,
  });
  status.loading = true;
  try {
    await setGroupTopicOffsets(route.params.cid as string, group.groupId, topic.name, [
      {
        partition: partition.partition,
        offset: String(form.offset),
      },
    ]);
    msgIns.close();
    dialogVisible.value = false;
    ElMessage.success('Reset group topic partition offset successfully');
  } catch (e) {
    msgIns.close();
    console.log('set group topic offsets error', e);
    ElMessage.error('Failed to set group topic partition offset, please try again later');
  } finally {
    status.loading = false;
  }
};

const onSubmit = async () => {
  if (!formRef.value) return;

  try {
    const valid = await formRef.value.validate();
    console.log('submit valid', valid);
    if (!valid) return;
    if (!isInteger(form.offset)) {
      ElMessage.error('Offset must be an integer');
      return;
    }
    await doSubmit();
  } catch (e) {
    console.log(e);
  }
};

function isInteger(str: string) {
  const num = Number(str);
  return Number.isInteger(num);
}
</script>

<style scoped lang="less"></style>
