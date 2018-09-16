// experementatl logic (!00% will be changed)
export class Room {
  private users: any; // need to think about this
  private batch: any[] = [];

  constructor(private roomName: string) { }

  public publish(userId: string, message: string): void {
    this.batch.push({
      userId,
      message
    });
  }

  public subscribe(user: any): void {
    this.users.push(user);
  }

  public unsubscribe(): void {
    /// remove user from object
  }

  public broadcast(): void {
    for (let i: number = 0, len: number = this.users.length; i < len; i++) {
      const user: any = this.users[i];
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