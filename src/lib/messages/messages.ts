// Create Process Messages
// TODO: Move Process Message to Message factory
export class ProcessMessages {
    constructor(public type: string, public data?: any) {
    }
}

// Create Emit Messages
class EmitMessage {
    action: string = 'emit';

    constructor(public event: string, public data?: any) {}
}

// Create Publish Messages
class PublishMessage {
    action: string = 'publish';

    constructor(public channel: string, public data?: any) {
    }
}

class InternalMessage {
    action: string = 'internal';

    constructor(public event: string, public data?: any){}
}


class BrokerMessage {
    constructor(public channel: string, public data?: any) {}
}


export class MessageFactory {
    // Bind emitMessage event with Emit Messages class
    static emitMessage(event: string, data?: any) {
        return JSON.stringify(new EmitMessage(event, data));
    }

    // Bind publishMessage event with Publish Messages class
   static publishMessage(channel: string, data?: any) {
        return JSON.stringify(new PublishMessage(channel, data));
    }
    // Bind brokerMessage event with Broker Messages class
    static brokerMessage(channel: string, data?: any){
        return JSON.stringify(new BrokerMessage(channel, data));
    }

    static internalMessage(event: string, data?: any){
        return JSON.stringify(new InternalMessage(event, data));
    }
}
