import { Socket } from '../socket';

export function socketError(self: Socket) {
    self._socket.on('error', (err?: any) => {
        self.eventsEmitter.emit('error', err);
    });
}