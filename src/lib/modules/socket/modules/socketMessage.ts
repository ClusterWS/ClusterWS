import { Socket } from '../socket';

export function socketMessage(self: Socket) {
    self._socket.on('message', (msg: any) => {
        if (msg === '_1') {
            return self.missedPing = 0;
        }

        try {
            msg = JSON.parse(msg);
        } catch (e) {
            return self.disconnect(1007);
        }

        switch (msg.action) {
            case 'emit':
                self.eventsEmitter.emit(msg.event, msg.data);
                break;
            case 'publish':
                if (self.channelsEmitter.exist(msg.channel)) self.server.webSocketServer.publish(msg.channel, msg.data);
                break;
            case 'internal':
                if (msg.event === 'subscribe') {
                    self.channelsEmitter.on(msg.data, (data: any) => {
                        self.send(msg.data, data, 'publish');
                    });
                }
                if (msg.event === 'unsubscribe') {
                    self.channelsEmitter.removeEvent(msg.data);
                }
                break;
            default: break;
        }
    });
}