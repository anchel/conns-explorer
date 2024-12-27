<template>
  <el-dialog title="Reset group offsets" v-model="dialogVisible" :close-on-click-modal="false">
    <el-form :model="form" :rules="rules" ref="formRef" label-width="auto" label-position="left" size="small">
      <el-form-item prop="group" label="Group">{{ group.groupId }}</el-form-item>
      <el-form-item prop="topic" label="Topic">{{ topic.name }}</el-form-item>
      <el-form-item prop="earliest" label="To">
        <!--        <el-switch v-model="form.earliest"></el-switch>-->
        <el-radio-group v-model="form.earliest">
          <el-radio-button label="latest" :value="false" />
          <el-radio-button label="earliest" :value="true" />
        </el-radio-group>
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
import { resetGroupTopicOffsets } from '@/utils/ipc.ts';
import { useRoute } from 'vue-router';

const route = useRoute();

const { group, topic } = defineProps({
  group: {
    type: Object,
    required: true,
  },
  topic: {
    type: Object,
    required: true,
  },
});
const dialogVisible = defineModel('dialogVisible', { type: Boolean });

const form = reactive({
  earliest: false,
});
const formRef = ref<FormInstance | null>(null);

const rules = {
  earliest: [{ required: false, message: 'Please select earliest', trigger: 'blur' }],
};

const status = reactive({
  loading: false,
});

const doSubmit = async () => {
  console.log('reset group topic offsets', topic.name);
  const msgIns = ElMessage({
    message: 'Resetting group topic offsets...',
    duration: 0,
  });
  status.loading = true;
  try {
    await resetGroupTopicOffsets(route.params.cid as string, group.groupId, topic.name, form.earliest);
    msgIns.close();
    dialogVisible.value = false;
    ElMessage.success('Reset group topic offsets successfully');
  } catch (e) {
    msgIns.close();
    console.log('reset group topic offsets error', e);
    ElMessage.error('Failed to reset group topic offsets, please try again later');
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
    await doSubmit();
  } catch (e) {
    console.error(e);
  }
};
</script>

<style scoped lang="less"></style>
