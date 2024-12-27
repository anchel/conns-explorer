<template>
  <el-dialog title="Create Topic" v-model="dialogVisible" :close-on-click-modal="false" width="80%">
    <el-form :model="form" :rules="rules" ref="formRef" label-width="auto" label-position="left">
      <el-form-item label="Name" prop="name">
        <el-input v-model="form.name"></el-input>
      </el-form-item>
      <el-form-item prop="numPartitions">
        <template #label>
          <div style="display: flex; align-items: center">
            <span>NumPartitions</span>
            <el-tooltip content="default: -1 (uses broker `num.partitions` configuration)" placement="right">
              <QuestionFilled style="width: 16px; height: 16px; margin-left: 6px" />
            </el-tooltip>
          </div>
        </template>
        <el-input-number v-model="form.numPartitions" :min="-1"></el-input-number>
      </el-form-item>
      <el-form-item prop="replicationFactor">
        <template #label>
          <div style="display: flex; align-items: center">
            <span>Replication Factor</span>
            <el-tooltip
              content="default: -1 (uses broker `default.replication.factor` configuration)"
              placement="right"
            >
              <QuestionFilled style="width: 16px; height: 16px; margin-left: 6px" />
            </el-tooltip>
          </div>
        </template>
        <el-input-number v-model="form.replicationFactor" :min="-1"></el-input-number>
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="dialogVisible = false">Cancel</el-button>
      <el-button type="primary" :loading="status.loading" @click="onSubmit">Create</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue';
import { ElMessage, FormInstance } from 'element-plus';
import { QuestionFilled } from '@element-plus/icons-vue';
import { createTopic } from '@/utils/ipc.ts';
import { useRoute } from 'vue-router';

const route = useRoute();

const emit = defineEmits(['add-topic']);
const dialogVisible = defineModel('dialogVisible', { type: Boolean });

const form = reactive({
  name: '',
  numPartitions: -1,
  replicationFactor: -1,
});

// const formRef = useTemplateRef<FormInstance | undefined>('form')
const formRef = ref<FormInstance | null>(null);

const rules = {
  name: [{ required: true, message: 'Please input topic name', trigger: 'blur' }],
  numPartitions: [{ required: true, message: 'Please input numPartitions', trigger: 'blur' }],
  replicationFactor: [{ required: true, message: 'Please input replication factor', trigger: 'blur' }],
};

const status = reactive({
  loading: false,
});

const doSubmit = async () => {
  const cid = route.params.cid as string;
  status.loading = true;
  try {
    const ret = await createTopic(cid, form.name, form.numPartitions, form.replicationFactor);
    console.log('create topic', ret);
    if (ret === true) {
      ElMessage.success('Create topic success');
      dialogVisible.value = false;
      emit('add-topic', form.name);
    } else {
      ElMessage.error('Create topic failed');
    }
  } catch (e) {
    console.error(e);
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

<style scoped lang="less">
.dialog-footer {
  display: flex;
  justify-content: flex-end;
}
</style>
