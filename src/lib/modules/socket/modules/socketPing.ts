import { Socket } from '../socket';

export function socketPing(self: Socket) {
    self.send('config', { pingInterval: self.server.options.pingInterval }, 'internal');

    self.pingPongInterval = setInterval(() => {
        if (self.missedPing >= 2) {
            return self.disconnect(3001, 'No pongs');
        }
        self.send('_0', null, 'ping');
        self.missedPing++;
    }, self.server.options.pingInterval);
}