<template>
  <el-dialog title="Modify partitions" v-model="dialogVisible" :close-on-click-modal="false">
    <el-form :model="form" :rules="rules" ref="formRef" label-width="auto" label-position="left" size="small">
      <el-form-item prop="topic" label="Topic">{{ topic.name }}</el-form-item>
      <el-form-item prop="count" label="NumPartitions">
        <el-input-number v-model="form.count" :min="topic.partitions.length + 1"></el-input-number>
        <!--        <el-text style="margin-left: 10px">minimum: {{ topic.partitions.length }}</el-text>-->
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button :loading="status.loading" @click="dialogVisible = false">Cancel</el-button>
      <el-button type="primary" :loading="status.loading" @click="onSubmit">Confirm</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
// import { QuestionFilled } from '@element-plus/icons-vue';
import { reactive, ref } from 'vue';
import { ElMessage, FormInstance } from 'element-plus';
import { createPartitions } from '@/utils/ipc.ts';
import { useRoute } from 'vue-router';
import { useGlobalStore } from '@/stores/global.ts';

const route = useRoute();
const { refreshPageMain, refreshTopics } = useGlobalStore();

const { topic } = defineProps({
  topic: {
    type: Object,
    required: true,
  },
});
const dialogVisible = defineModel('dialogVisible', { type: Boolean });

const form = reactive({
  count: 0,
});
const formRef = ref<FormInstance | null>(null);

const rules = {
  count: [{ required: true, message: 'Please input count', trigger: 'blur' }],
};

const status = reactive({
  loading: false,
});

const doSubmit = async () => {
  console.log('modify partitions', topic.name);
  const msgIns = ElMessage({
    message: 'Modifying partitions...',
    duration: 0,
  });
  status.loading = true;
  try {
    await createPartitions(route.params.cid as string, topic.name, form.count);
    msgIns.close();
    dialogVisible.value = false;
    ElMessage.success('Modify partitions successfully');
    // refreshPageMain();
    refreshTopics();
  } catch (e) {
    msgIns.close();
    console.log('modify partitions error', e);
    ElMessage.error('Failed to modify partitions, please try again later');
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
