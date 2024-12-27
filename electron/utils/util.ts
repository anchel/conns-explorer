function readInt16BE(buffer: Buffer, offset: number) {
    return buffer.readInt16BE(offset);
}

function readInt32BE(buffer: Buffer, offset: number) {
    return buffer.readInt32BE(offset);
}

function readString(buffer: Buffer, offset: number) {
    const length = readInt16BE(buffer, offset);
    if (length < 0) {
        // 空字符串或null可根据协议定义进行处理，通常 length = -1 表示 null 字符串
        return {value: null, bytesRead: 2};
    }
    const start = offset + 2;
    const end = start + length;
    const str = buffer.toString('utf8', start, end);
    return {value: str, bytesRead: 2 + length};
}

export function parseMemberMetadata(buffer: Buffer) {
    let offset = 0;

    // 1. 解析 Version (int16)
    const version = readInt16BE(buffer, offset);
    offset += 2;

    // 2. 解析 Subscription ([String])
    // 首先我们需要知道有多少字符串。根据 Kafka 的 ConsumerProtocol，
    // Subscription 是一组主题字符串列表，但协议中并未直接给出列表长度。
    // 实际情况：在 Kafka 的 ConsumerProtocol 中，Subscription 前面还有一个数组长度字段。
    // MemberMetadata 实际结构通常为:
    //
    // MemberMetadata => Version (int16)
    //                   SubscriptionCount (int32)
    //                   Subscription (SubscriptionCount 个 String)
    //                   UserDataLength (int32)
    //                   UserData (bytes)
    //
    // 若按 Kafka ConsumerProtocol 的定义:
    //   Subscription: 一个 int32 表示订阅数目，然后是对应数量的 String。
    //
    // 以下假设：Subscription部分在 MemberMetadata 内格式为：
    //   int32 SubscriptionCount
    //   SubscriptionCount 个 String
    //
    // 如有需要根据你的实际协议版本调整。

    const subscriptionCount = readInt32BE(buffer, offset);
    offset += 4;

    const subscriptions = [];
    for (let i = 0; i < subscriptionCount; i++) {
        const {value: topic, bytesRead} = readString(buffer, offset);
        offset += bytesRead;
        subscriptions.push(topic);
    }

    // 3. 解析 UserData (bytes)
    // UserData 前有一个 int32 表示字节长度，然后读取该长度的字节数据。
    const userDataLength = readInt32BE(buffer, offset);
    offset += 4;
    let userData = null;
    if (userDataLength > 0) {
        userData = buffer.slice(offset, offset + userDataLength);
        offset += userDataLength;
    } else if (userDataLength === 0) {
        userData = Buffer.alloc(0);
    } else {
        // userDataLength < 0 通常表示 null，具体根据协议约定
        userData = null;
    }

    return {
        version,
        subscriptions,
        userData
    };
}

export function parseMemberAssignment(buffer: Buffer) {
    let offset = 0;

    // 1. 解析 Version
    const version = readInt16BE(buffer, offset);
    offset += 2;

    // 2. 解析 Assignment
    // 首先读取一个 int32 表示有多少个 TopicAssignment
    const topicCount = readInt32BE(buffer, offset);
    offset += 4;

    const assignments = [];
    for (let i = 0; i < topicCount; i++) {
        // 2.1 解析 TopicName
        const {value: topicName, bytesRead: topicNameBytes} = readString(buffer, offset);
        offset += topicNameBytes;

        // 2.2 解析分区数量
        const partitionCount = readInt32BE(buffer, offset);
        offset += 4;

        const partitions = [];
        for (let j = 0; j < partitionCount; j++) {
            const partitionId = readInt32BE(buffer, offset);
            offset += 4;
            partitions.push(partitionId);
        }

        assignments.push({
            topic: topicName,
            partitions: partitions
        });
    }

    // 3. 解析 UserData
    const userDataLength = readInt32BE(buffer, offset);
    offset += 4;
    let userData = null;
    if (userDataLength > 0) {
        userData = buffer.slice(offset, offset + userDataLength);
        offset += userDataLength;
    } else if (userDataLength === 0) {
        userData = Buffer.alloc(0);
    } else {
        // 小于0一般表示null，具体根据协议实现而定
        userData = null;
    }

    return {
        version,
        assignments,
        userData
    };
}
