import router from '../router';

function on(channel: string, listener: (event: any, ...args: any[]) => void) {
  return window.ipcRenderer.on(channel, listener);
}

export function registerInit() {
  on('route-page', async (_, url: string) => {
    console.log('route-page', url);
    await router.push(url);
  });
}
