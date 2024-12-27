import {defineStore} from 'pinia';
import {ref} from 'vue';

// 刷新页面等全局状态
export const useGlobalStore = defineStore('global', () => {
    const refreshTrigger = ref(0);
    const refreshTriggerMain = ref(0);

    const refreshTriggerBrokers = ref(0);
    const refreshTriggerTopics = ref(0);
    const refreshTriggerConsumerGroups = ref(0);

    function refreshPage() {
        console.log('refreshing page', refreshTrigger.value);
        refreshTrigger.value++;
    }

    function refreshPageMain() {
        console.log('refreshPageMain page', refreshTriggerMain.value);
        refreshTriggerMain.value++;
    }

    function refreshBrokers() {
        console.log('refreshBrokers page', refreshTriggerBrokers.value);
        refreshTriggerBrokers.value++;
    }

    function refreshTopics() {
        console.log('refreshTopics page', refreshTriggerTopics.value);
        refreshTriggerTopics.value++;
    }

    function refreshConsumerGroups() {
        console.log('refreshConsumers page', refreshTriggerConsumerGroups.value);
        refreshTriggerConsumerGroups.value++;
    }

    return {
        refreshTrigger,
        refreshPage,
        refreshTriggerMain,
        refreshPageMain,
        refreshTriggerBrokers,
        refreshBrokers,
        refreshTriggerTopics,
        refreshTopics,
        refreshTriggerConsumerGroups,
        refreshConsumerGroups
    };
});
