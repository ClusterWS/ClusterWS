import { Socket } from '../socket';

export function socketClose(self: any) {
    self._socket.on('close', (code?: number, msg?: any) => {
        self.eventsEmitter.emit('disconnect', code, msg);

        clearInterval(self.pingPongInterval);
        self.server.removeListener('publish', self.publishListener);

        self.eventsEmitter.removeAllEvents();
        self.channelsEmitter.removeAllEvents();

        for(let key in self){
            if(self.hasOwnProperty(key)){
                self[key] = null;
                delete self[key];
            }
        }
    });
}