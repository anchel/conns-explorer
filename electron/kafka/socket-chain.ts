import { EventEmitter } from "events";
import net from "net";

// 普通的 socket
export class NetSocket extends EventEmitter {
  host: string;
  port: number;
  connectOptions: any;
  rawSocket: net.Socket | null;

  constructor(options: any) {
    const { host, port, connectOptions } = options;
    super();

    this.host = host;
    this.port = port;
    this.connectOptions = connectOptions;

    this.rawSocket = null;

    this.init();
  }

  init() {
    this.rawSocket = net.connect(
      {
        host: this.host,
        port: this.port,
        ...this.connectOptions,
      },
      () => {
        this.emit("my-connect");
      }
    );
  }

  write(...data: any[]) {
    // console.log("NetSocket write", data.length);
    // @ts-ignore
    return this.rawSocket?.write(...data);
  }

  // @ts-ignore
  on(event: string, callback: (...args: any[]) => void) {
    // console.log("NetSocket addListener", event);
    if (event === "my-connect") {
      this.addListener("my-connect", callback);
    } else {
      return this.rawSocket?.on(event, callback);
    }
  }

  // @ts-ignore
  off(event: string, callback: (...args: any[]) => void) {
    // console.log("NetSocket removeListener", event);
    if (event === "my-connect") {
      this.removeListener("my-connect", callback);
    } else {
      return this.rawSocket?.off(event, callback);
    }
  }

  // @ts-ignore
  emit(event: string, ...args: any[]) {
    // console.log("NetSocket emit", event);
    if (event === "my-connect") {
      this._emit("my-connect", ...args);
    } else {
      // @ts-ignore
      return this.rawSocket.emit(event, ...args);
    }
  }

  _emit(event: string, ...args: any[]) {
    const listeners = this.listeners(event);
    for (const listener of listeners) {
      listener(...args);
    }
  }

  pause() {
    return this.rawSocket?.pause();
  }

  resume() {
    return this.rawSocket?.resume();
  }

  cork() {
    return this.rawSocket?.cork();
  }

  uncork() {
    return this.rawSocket?.uncork();
  }

  destroy() {
    return this.rawSocket?.destroy();
  }

  end() {
    return this.rawSocket?.end();
  }
}

// 走 http connect 代理的 socket
export class HttpProxyOnNetSocket extends EventEmitter {
  targetHost: string;
  targetPort: number;

  proxyHost: string;
  proxyPort: number;
  connectOptions: any;

  writedMeta: boolean;
  rawSocket: net.Socket | null;

  constructor(options: {
    targetHost: string;
    targetPort: number;
    proxyHost: string;
    proxyPort: number;
    connectOptions: any;
  }) {
    const { targetHost, targetPort, proxyHost, proxyPort, connectOptions } =
      options;
    super();

    this.writedMeta = false;

    this.targetHost = targetHost;
    this.targetPort = targetPort;
    this.proxyHost = proxyHost;
    this.proxyPort = proxyPort;
    this.connectOptions = connectOptions;

    this.rawSocket = null;

    this.init();
  }

  init() {
    this.rawSocket = net.connect(
      {
        host: this.proxyHost,
        port: this.proxyPort,
        ...this.connectOptions,
      },
      () => {
        this.writeMeta();
      }
    );

    const onData = (buf: Buffer) => {
      // console.log("HttpProxyOnNetSocket onData", buf.length);
      const response = buf.toString();
      if (response.includes("200 Connection established")) {
        // console.log(
        //   "HttpProxyOnNetSocket Proxy connection established. Now sending custom protocol data."
        // );

        // 移除原来的监听 data
        // console.log("HttpProxyOnNetSocket remove old data listener");
        this.rawSocket?.off("data", onData);

        this.rawSocket?.on("data", (buf) => {
          this.emit("my-data", buf); // 触发 my-data 事件
        });

        this.emit("my-connect"); // 触发 my-connect 事件
      } else {
        console.error(
          "HttpProxyOnNetSocket Failed to establish proxy connection:",
          response
        );
        this.rawSocket?.end();
      }
    };
    this.rawSocket.on("data", onData);
  }

  writeMeta() {
    // console.log("HttpProxyOnNetSocket writeMeta");
    const { targetHost, targetPort } = this;
    const connectRequest =
      `CONNECT ${targetHost}:${targetPort} HTTP/1.1\r\n` +
      `Host: ${targetHost}:${targetPort}\r\n` +
      `Connection: keep-alive\r\n\r\n`;
    this.rawSocket?.write(connectRequest);
    this.writedMeta = true;
  }

  write(...data: any[]) {
    // console.log("HttpProxyOnNetSocket write", this.writedMeta, data.length);
    if (!this.writedMeta) {
      this.writeMeta();
    }
    // @ts-ignore
    this.rawSocket?.write(...data);
  }

  // @ts-ignore
  on(event: string, callback: (...args: any[]) => void) {
    // console.log("HttpProxyOnNetSocket addListener", event);
    switch (event) {
      case "data":
        this.addListener("my-data", callback);
        break;
      case "my-data":
        this.addListener("my-data", callback);
        break;
      case "connect":
        this.addListener("my-connect", callback);
        break;
      case "my-connect":
        this.addListener("my-connect", callback);
        break;
      default:
        this.rawSocket?.on(event, callback);
    }
  }

  // @ts-ignore
  off(event: string, callback: (...args: any[]) => void) {
    // console.log("HttpProxyOnNetSocket removeListener", event);
    switch (event) {
      case "data":
        this.removeListener("my-data", callback);
        break;
      case "my-data":
        this.removeListener("my-data", callback);
        break;
      case "connect":
        this.removeListener("my-connect", callback);
        break;
      // @ts-ignore
      case "my-connect":
        this.removeListener("my-connect", callback);
        break;
      default:
        this.rawSocket?.off(event, callback);
    }
  }

  // @ts-ignore
  emit(event: string, ...args: any[]) {
    switch (event) {
      case "my-data":
        this._emit("my-data", ...args);
        break;
      case "my-connect":
        this._emit("my-connect", ...args);
        break;
      default:
        this.rawSocket?.emit(event, ...args);
    }
  }

  _emit(event: string, ...args: any[]) {
    const listeners = this.listeners(event);
    for (const listener of listeners) {
      listener(...args);
    }
  }

  unref() {
    return this.rawSocket?.unref();
  }

  end() {
    this.rawSocket?.end();
  }
}

// // 走 https connect 代理的 socket
// export class HttpsProxyOnNetSocket extends EventEmitter {
//   writedMeta: boolean;
//   targetHost: string;
//   targetPort: number;
//   rawSocket: net.Socket;
//   tlsSocket: tls.TLSSocket | null;
//   tlsConnected: boolean;
//   dataBuffer: any[];
//   socket: NetSocket;

//   constructor(options: any) {
//     const { socket, targetHost, targetPort } = options;
//     super();

//     this.writedMeta = false;

//     this.targetHost = targetHost;
//     this.targetPort = targetPort;
//     this.socket = socket;
//     this.rawSocket = socket.rawSocket || socket;

//     this.tlsSocket = null;
//     this.tlsConnected = false;
//     this.dataBuffer = [];

//     this.init();
//   }

//   init() {
//     this.tlsSocket = tls.connect(
//       {
//         socket: this.rawSocket, // 这里要用底层的 rawSocket // 这个地方是个坑，如果用 socket，会导致 tls 连接异常。好在应该没有提供https形式的代理服务器吧
//         ca: fs.readFileSync("./data/stunnel.crt"),
//         // servername: "proxy.anchel.cn", // 这里不指定域名，就需要外面填写代理地址时是域名的形式
//         rejectUnauthorized: true,
//       },
//       () => {}
//     );

//     this.tlsSocket.on("secureConnect", () => {
//       // console.log("HttpsProxyOnNetSocket tlsSocket secureConnect");
//       this.tlsConnected = true;
//       this.writeMeta();
//       this.flushDataBuffer();
//     });

//     const onData = (buf: Buffer) => {
//       // console.log("HttpsProxyOnNetSocket tlsSocket onData", buf.length);
//       const response = buf.toString();
//       if (response.includes("200 Connection established")) {
//         console.log(
//           "HttpsProxyOnNetSocket Proxy connection established. Now sending custom protocol data."
//         );

//         // 移除原来的监听 data
//         // console.log("HttpsProxyOnNetSocket remove old data listener");
//         this.tlsSocket?.off("data", onData);

//         this.tlsSocket?.on("data", (buf) => {
//           this.emit("my-data", buf); // 触发 my-data 事件
//         });

//         this.emit("my-connect"); // 触发 my-connect 事件
//       } else {
//         console.error(
//           "HttpsProxyOnNetSocket Failed to establish proxy connection:",
//           response
//         );
//         this.tlsSocket?.end();
//       }
//     };
//     this.tlsSocket.on("data", onData);
//   }

//   writeMeta() {
//     // console.log(
//     //   "HttpsProxyOnNetSocket writeMeta",
//     //   this.tlsConnected,
//     //   this.targetHost,
//     //   this.targetPort
//     // );
//     const { targetHost, targetPort } = this;
//     const connectRequest =
//       `CONNECT ${targetHost}:${targetPort} HTTP/1.1\r\n` +
//       `Host: ${targetHost}:${targetPort}\r\n` +
//       `Connection: keep-alive\r\n\r\n`;

//     this._write(connectRequest);
//     this.writedMeta = true;
//   }

//   write(...data: any[]) {
//     // console.log("HttpsProxyOnNetSocket write", this.tlsConnected, data.length);
//     this._write(...data);
//   }

//   _write(...data: any[]) {
//     // console.log("HttpsProxyOnNetSocket _write", this.tlsConnected, data.length);
//     if (this.tlsConnected) {
//       // @ts-ignore
//       this.tlsSocket?.write(...data); // todo 这里应该是 this.tlsSocket还是 this.socket 还是 this.rawSocket
//     } else {
//       this.dataBuffer.push(...data);
//     }
//   }

//   flushDataBuffer() {
//     // console.log(
//     //   "HttpsProxyOnNetSocket flushDataBuffer",
//     //   this.dataBuffer.length
//     // );
//     for (const buf of this.dataBuffer) {
//       this.tlsSocket?.write(buf); // todo 这里应该是 this.tlsSocket还是 this.socket 还是 this.rawSocket
//     }
//     this.dataBuffer = [];
//   }

//   // @ts-ignore
//   on(event: string, callback: (...args: any[]) => void) {
//     // console.log("HttpsProxyOnNetSocket addListener", event);
//     switch (event) {
//       case "data":
//         this.addListener("my-data", callback);
//         break;
//       case "my-data":
//         this.addListener("my-data", callback);
//         break;
//       case "connect":
//         this.addListener("my-connect", callback);
//         break;
//       case "my-connect":
//         this.addListener("my-connect", callback);
//         break;
//       default:
//         this.tlsSocket?.on(event, callback);
//     }
//   }

//   // @ts-ignore
//   off(event: string, callback: (...args: any[]) => void) {
//     // console.log("HttpsProxyOnNetSocket removeListener", event);
//     switch (event) {
//       case "data":
//         this.removeListener("my-data", callback);
//         break;
//       case "my-data":
//         this.removeListener("my-data", callback);
//         break;
//       case "connect":
//         this.removeListener("my-connect", callback);
//         break;
//         // @ts-ignore
//       case "my-connect":
//         this.removeListener("my-connect", callback);
//       default:
//         this.tlsSocket?.off(event, callback);
//     }
//   }

//   // @ts-ignore
//   emit(event: string, ...args: any[]) {
//     // console.log("HttpsProxyOnNetSocket emit", event);
//     switch (event) {
//       case "my-data":
//         this._emit("my-data", ...args);
//         break;
//       case "my-connect":
//         this._emit("my-connect", ...args);
//         break;
//       default:
//         this.tlsSocket?.emit(event, ...args);
//     }
//   }

//   _emit(event: string, ...args: any[]) {
//     const listeners = this.listeners(event);
//     for (const listener of listeners) {
//       listener(...args);
//     }
//   }

//   end() {
//     this.tlsSocket?.end();
//   }
// }
