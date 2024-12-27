export interface ConnectionConfig {
    id: string; // uuid
    name: string;

    brokers: string; // host:port,host:port

    proxy: string; // e.g. http://192.168.0.100:3126

    ssl: boolean;
    ca?: string;
    key?: string;
    cert?: string;

    mechanism: string; // plain, scram-sha-256, scram-sha-512
    username: string;
    password: string;
}