import {createMemoryHistory, createRouter} from 'vue-router'

import HomeView from '@/views/HomeView.vue'
import AboutView from '@/views/AboutView.vue'
import ConnectionHome from "@/views/connection/ConnectionHome.vue";
import ConnectionDetail from "@/views/connection/ConnectionDetail.vue";
import BrokerHome from "@/views/connection/BrokerHomeView.vue";
import TopicHome from "@/views/connection/TopicHomeView.vue";
import ConsumerGroupHome from "@/views/connection/ConsumerGroupHomeView.vue";

const routes = [
    {
        name: 'Home',
        path: '/',
        meta: {title: 'Home'},
        component: HomeView
    },
    {
        name: 'About',
        path: '/about',
        meta: {title: 'About'},
        component: AboutView
    },
    {
        name: 'ConnectionHome',
        path: '/connection/:cid',
        meta: {title: 'Connection'},
        component: ConnectionHome,
        children: [
            {
                name: 'ConnectionDetail',
                path: '',
                index: true,
                component: ConnectionDetail,
            },
            {
                name: 'BrokerHome',
                path: 'broker/:bid',
                component: BrokerHome,
            },
            {
                name: 'TopicHome',
                path: 'topic/:tid',
                component: TopicHome,
            },
            {
                name: 'ConsumerGroupHome',
                path: 'consumer-group/:cgid',
                component: ConsumerGroupHome,
            }
        ]
    }
]

const router = createRouter({
    history: createMemoryHistory(),
    routes,
})

export default router