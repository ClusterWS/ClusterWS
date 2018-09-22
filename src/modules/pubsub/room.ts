import { Listener, Message } from '../../utils/types';

// experementatl logic
// need to check if client exist and connected
export class Room {
  public usersIds: string[] = [];
  public usersListeners: { [key: string]: Listener } = {};
  private messagesBatch: Message[] = [];

  constructor(public roomName: string, userId: string, listener: Listener) {
    this.subscribe(userId, listener);
  }

  public publish(id: string, message: Message): void {
    this.messagesBatch.push({ id, message });
  }

  public subscribe(userId: string, listener: Listener): void {
    this.usersIds.push(userId);
    this.usersListeners[userId] = listener;
  }

  public unsusbcribe(userId: string): void {
    delete this.usersListeners[userId];
    // need to rethink remove logic
    this.usersIds.splice(this.usersIds.indexOf(userId), 1);

    // may need to subscribe to 2 channels
    if (!this.usersIds.length) {
      this.destroy();
      this.action(this.roomName);
      // call destroy to propogate to wsserver
    }
  }

  // instead of recraeting array i can use gap to replace data for that use
  public flush(): void {
    for (let i: number = 0, len: number = this.usersIds.length; i < len; i++) {
      const userId: string = this.usersIds[i];
      const sendMessage: Message = [];
      for (let j: number = 0, msgLen: number = this.messagesBatch.length; j < msgLen; j++) {
        if (this.messagesBatch[j].id !== userId) {
          sendMessage.push(this.messagesBatch[j].message);
        }
      }

      this.usersListeners[userId](sendMessage);
    }

    this.messagesBatch = [];
  }

  public unfilteredFlush(message: Message): void {
    for (let i: number = 0, len: number = this.usersIds.length; i < len; i++) {
      const userId: string = this.usersIds[i];
      this.usersListeners[userId](message);
    }
  }

  public destroy(): void {
    this.usersIds = [];
    this.messagesBatch = [];
    this.usersListeners = {};
  }

  public action(channel: string): void { /** To overwrite by user */ }
}

// // experementatl logic (100% will be changed)
// export class Room {
//   private userIds: any[]; // need to think about this
//   private batch: any[] = [];

//   constructor(private users: any) { }

//   public publish(userId: string, message: string): void {
//     this.batch.push({
//       userId,
//       message
//     });
//   }

//   public subscribe(userId: any): void {
//     this.userIds.push(userId);
//   }

//   public unsubscribe(userId: any): void {
//     this.userIds.splice(this.userIds.indexOf(userId), 1);
//     /// remove user from object
//   }

//   public broadcast(): void {
//     for (let i: number = 0, len: number = this.userIds.length; i < len; i++) {
//       const user: any = this.users[this.userIds[i]];

//       if (!user) {
//         continue;
//       }

//       const messagesToSend: any[] = [];

//       for (let j: number = 0, msgLen: number = this.batch.length; j < msgLen; j++) {
//         const msg: any = this.batch[j];
//         if (msg.userId !== user.id) {
//           messagesToSend.push(msg.message);
//         }
//       }

//       user.send(Buffer.from(messagesToSend));
//     }

//     // reset batch
//     this.batch = [];
//   }
// }