<template>
  <el-dialog title="Add Message" v-model="dialogVisible" :close-on-click-modal="false">
    <el-form :model="form" :rules="rules" ref="formRef" label-width="auto" label-position="left" size="small">
      <el-form-item prop="topic" label="Topic">{{ topic.name }}</el-form-item>
      <el-form-item prop="key" label="Key">
        <el-input v-model="form.key" placeholder="Key"></el-input>
      </el-form-item>
      <el-form-item prop="value" label="Value">
        <el-input v-model="form.value" placeholder="Value" type="textarea"></el-input>
      </el-form-item>
      <el-form-item prop="partition" label="Partition">
        <el-select v-model="form.partition" placeholder="Select partition">
          <el-option label="auto" value=""></el-option>
          <el-option
            v-for="partition in topic.partitions"
            :key="partition.partitionId"
            :label="partition.partitionId"
            :value="partition.partitionId"
          ></el-option>
        </el-select>
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
import { addTopicMessages, createPartitions } from '@/utils/ipc.ts';
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
  key: '',
  value: '',
  partition: '',
});
const formRef = ref<FormInstance | null>(null);

const rules = {
  value: [{ required: true, message: 'Please input value', trigger: 'blur' }],
};

const status = reactive({
  loading: false,
});

const doSubmit = async () => {
  console.log('add messages', topic.name);
  const msgIns = ElMessage({
    message: 'Adding messages...',
    duration: 0,
  });
  status.loading = true;
  try {
    const message: any = {
      key: form.key,
      value: form.value,
    };
    if (form.partition !== '') {
      message.partition = form.partition;
    }
    const messages = [message];
    await addTopicMessages(route.params.cid as string, topic.name, messages);
    msgIns.close();
    dialogVisible.value = false;
    ElMessage.success('Add messages successfully');
    // refreshPageMain();
    refreshTopics();
  } catch (e) {
    msgIns.close();
    console.log('Add messages error', e);
    ElMessage.error('Failed to Add messages, please try again later');
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
