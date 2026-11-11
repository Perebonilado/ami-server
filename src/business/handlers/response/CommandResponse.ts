export class CommandResponse<T> {
  constructor(public readonly data: T) {}

  static of<T>(data: T): CommandResponse<T> {
    return new CommandResponse(data);
  }

  static empty(): CommandResponse<void> {
    return new CommandResponse(undefined) as CommandResponse<void>;
  }
}
