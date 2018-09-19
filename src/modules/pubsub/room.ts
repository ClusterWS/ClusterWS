// experementatl logic (100% will be changed)
export class Room {
  private userIds: any[]; // need to think about this
  private batch: any[] = [];

  constructor(private users: any) { }

  public publish(userId: string, message: string): void {
    this.batch.push({
      userId,
      message
    });
  }

  public subscribe(userId: any): void {
    this.userIds.push(userId);
  }

  public unsubscribe(userId: any): void {
    this.userIds.splice(this.userIds.indexOf(userId), 1);
    /// remove user from object
  }

  public broadcast(): void {
    for (let i: number = 0, len: number = this.userIds.length; i < len; i++) {
      const user: any = this.users[this.userIds[i]];

      if (!user) {
        continue;
      }

      const messagesToSend: any[] = [];

      for (let j: number = 0, msgLen: number = this.batch.length; j < msgLen; j++) {
        const msg: any = this.batch[j];
        if (msg.userId !== user.id) {
          messagesToSend.push(msg.message);
        }
      }

      user.send(Buffer.from(messagesToSend));
    }

    // reset batch
    this.batch = [];
  }
}