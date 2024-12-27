<template>
  <div class="page">
    <h1>Conns Explorer</h1>

    <el-card style="min-width: 400px">
      <div v-if="list.length <= 0">No connections</div>
      <div class="list">
        <div v-for="item in list" :key="item.id" class="list-item">
          <el-link type="primary" @click="handleRouteConnectionHome(item)">{{ item.name }}</el-link>
          <div class="operation">
            <el-icon @click="handleEdit(item)">
              <Edit />
            </el-icon>
            <el-icon @click="handleDelete(item)">
              <Delete />
            </el-icon>
          </div>
        </div>
      </div>

      <template #footer>
        <el-button type="primary" size="small" @click="handleAdd">+ New connection</el-button>
      </template>
    </el-card>

    <el-dialog
      v-model="dialogVisible"
      :title="!form.id ? 'Add Connection' : 'Edit Connection'"
      width="80%"
      :close-on-click-modal="false"
    >
      <el-form :model="form" label-width="auto" style="max-width: 600px">
        <el-form-item label="Name" required>
          <div style="width: 100%; display: flex; align-items: center; gap: 6px">
            <el-input v-model="form.name" tabindex="1" />
            <el-tooltip placement="right">
              <template #content>
                <div>Define the name of the connection, enter whatever you want</div>
              </template>
              <QuestionFilled style="width: 18px; height: 18px" />
            </el-tooltip>
          </div>
        </el-form-item>
        <el-form-item label="Brokers" required>
          <div style="width: 100%; display: flex; align-items: center; gap: 6px">
            <el-input placeholder="" v-model="form.brokers" tabindex="1" />
            <el-tooltip placement="right">
              <template #content>
                <div>Kafka cluster address. e.g. 192.168.1.100:9092,192.168.1.101:9092</div>
              </template>
              <QuestionFilled style="width: 18px; height: 18px" />
            </el-tooltip>
          </div>
        </el-form-item>
        <el-form-item label="Proxy">
          <div style="width: 100%; display: flex; align-items: center; gap: 6px">
            <el-input placeholder="" v-model="form.proxy" tabindex="1" />
            <el-tooltip placement="right">
              <template #content>
                <div>Proxy address. e.g. http://192.168.0.100:3128 Only support http</div>
              </template>
              <QuestionFilled style="width: 18px; height: 18px" />
            </el-tooltip>
          </div>
        </el-form-item>

        <el-form-item label="SSL">
          <el-switch v-model="form.ssl" tabindex="1" />
        </el-form-item>
        <el-form-item label="CA" v-if="form.ssl">
          <template v-if="form.ca">
            <el-text>{{ form.ca }}</el-text>
            <Close style="width: 18px; height: 18px; margin-left: 10px; cursor: pointer" @click="form.ca = ''" />
          </template>
          <el-button v-else :icon="MoreFilled" @click="handleSelectCa" />
        </el-form-item>
        <el-form-item label="Key" v-if="form.ssl">
          <template v-if="form.key">
            <el-text>{{ form.key }}</el-text>
            <Close style="width: 18px; height: 18px; margin-left: 10px; cursor: pointer" @click="form.key = ''" />
          </template>
          <el-button v-else :icon="MoreFilled" @click="handleSelectKey" />
        </el-form-item>
        <el-form-item label="Cert" v-if="form.ssl">
          <template v-if="form.cert">
            <el-text>{{ form.cert }}</el-text>
            <Close style="width: 18px; height: 18px; margin-left: 10px; cursor: pointer" @click="form.cert = ''" />
          </template>
          <el-button v-else :icon="MoreFilled" @click="handleSelectCert" />
        </el-form-item>

        <el-form-item label="Auth Mechanism">
          <el-select v-model="form.mechanism" tabindex="1">
            <el-option label="None" value=""></el-option>
            <el-option label="PLAIN" value="PLAIN"></el-option>
            <el-option label="SCRAM-SHA-256" value="SCRAM-SHA-256"></el-option>
            <el-option label="SCRAM-SHA-512" value="SCRAM-SHA-512"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="Username" v-if="form.mechanism">
          <el-input v-model="form.username" tabindex="1" />
        </el-form-item>
        <el-form-item label="Password" v-if="form.mechanism">
          <el-input type="password" v-model="form.password" tabindex="1" />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="dialogVisible = false">Cancel</el-button>
        <el-button type="primary" @click="handleConfirm">Confirm</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script lang="ts" setup>
import { Close, Delete, Edit, MoreFilled, QuestionFilled } from '@element-plus/icons-vue';
import { onMounted, provide, ref } from 'vue';
import { v4 as uuidv4 } from 'uuid';
import {
  selectFile,
  getConnectionConfigs,
  addConnectionConfig,
  editConnectionConfig,
  deleteConnectionConfig,
} from '@/utils/ipc';
import { ElMessage, ElMessageBox } from 'element-plus';
import { ConnectionConfig } from '@/types';
import { useRouter } from 'vue-router';

const router = useRouter();

const list = ref<Array<ConnectionConfig>>([]);

provide('connections', list);

const dialogVisible = ref(false);

const form = ref<ConnectionConfig>({
  id: '',
  name: '',
  brokers: '',
  proxy: '',

  ssl: false,
  ca: '',
  key: '',
  cert: '',

  mechanism: '',
  username: '',
  password: '',
});

const resetForm = () => {
  form.value = {
    id: '',
    name: '',
    brokers: '',
    proxy: '',

    ssl: false,
    ca: '',
    key: '',
    cert: '',

    mechanism: '',
    username: '',
    password: '',
  };
};

onMounted(() => {
  initConnectionConfigs();
});

const initConnectionConfigs = async () => {
  list.value = await getConnectionConfigs();
  console.log('list', JSON.stringify(list.value));
};

const handleAdd = () => {
  resetForm();
  dialogVisible.value = true;
};

const handleEdit = (item: ConnectionConfig) => {
  form.value = { ...item };
  dialogVisible.value = true;
};

const handleDelete = (item: ConnectionConfig) => {
  ElMessageBox.confirm('Are you sure to delete?', 'Warning', {
    confirmButtonText: 'OK',
    cancelButtonText: 'Cancel',
    type: 'warning',
  })
    .then(() => {
      deleteConnectionConfig({ ...item });
      initConnectionConfigs();
    })
    .catch(() => {});
};

const handleConfirm = () => {
  const keys: (keyof Pick<ConnectionConfig, 'name' | 'brokers'>)[] = ['name', 'brokers'];
  const keyLabelMap: Record<keyof Pick<ConnectionConfig, 'name' | 'brokers'>, string> = {
    name: 'Name',
    brokers: 'Brokers address',
  };
  for (let key of keys) {
    if (!form.value[key]) {
      ElMessage.warning(`${keyLabelMap[key]} required`);
      return;
    }
  }

  if (!form.value.ssl) {
    form.value.ca = '';
    form.value.key = '';
    form.value.cert = '';
  }

  if (form.value.id) {
    editConnectionConfig({ ...form.value });
  } else {
    addConnectionConfig({
      ...form.value,
      id: uuidv4(),
    });
  }
  initConnectionConfigs();
  dialogVisible.value = false;
};

const handleRouteConnectionHome = (item: ConnectionConfig) => {
  // console.log('item', item);
  router.push({
    name: 'ConnectionDetail',
    params: {
      cid: item.id,
    },
  });
};

const handleSelectCa = async () => {
  const ret = await selectFile({
    title: 'Select CA file',
    properties: ['openFile'],
    filters: [{ name: 'PEM', extensions: ['pem', 'cer', 'crt', 'der', 'txt'] }],
  });
  console.log('filePaths', ret);
  if (ret.filePaths && ret.filePaths.length > 0) {
    form.value.ca = ret.filePaths[0];
  }
};

const handleSelectKey = async () => {
  const ret = await selectFile({
    title: 'Select Key file',
    properties: ['openFile'],
    filters: [{ name: 'PEM', extensions: ['pem', 'cer', 'crt', 'der', 'txt'] }],
  });
  console.log('filePaths', ret);
  if (ret.filePaths && ret.filePaths.length > 0) {
    form.value.key = ret.filePaths[0];
  }
};

const handleSelectCert = async () => {
  const ret = await selectFile({
    title: 'Select Cert file',
    properties: ['openFile'],
    filters: [{ name: 'PEM', extensions: ['pem', 'cer', 'crt', 'der', 'txt'] }],
  });
  console.log('filePaths', ret);
  if (ret.filePaths && ret.filePaths.length > 0) {
    form.value.cert = ret.filePaths[0];
  }
};
</script>

<style lang="less" scoped>
.page {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;

  .list {
    display: flex;
    flex-direction: column;
    gap: 10px;

    .list-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 10px;
      //border: 1px solid #ebeef5;
      border-radius: 4px;
      transition: all 0.3s;

      .operation {
        display: flex;
        gap: 10px;

        .el-icon {
          cursor: pointer;
        }
      }
    }
  }
}
</style>
