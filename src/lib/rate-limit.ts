import { v4 as generateId } from 'uuid';

export class Token {
  public id: string;

  constructor (protected tokenMachine: TokenMachine) {
    this.id = generateId();
  }

  release () {
    this.tokenMachine.releaseToken(this);
  }
}

export abstract class TokenMachine {

  protected outstandingTokens: Token[] = [];

  protected tokenRequests: ((token: Token) => void)[] = [];

  public state () {
    return {
      requests: this.tokenRequests.length
    };
  }

  requestToken (): Promise<Token> {
    const promise = new Promise((resolve: (token: Token) => void) => this.tokenRequests.push(resolve));
    this.digest();
    return promise;
  }

  releaseToken (token: Token) {
    const index = this.outstandingTokens.indexOf(token);
    if (index > -1) {
      this.outstandingTokens.splice(index, 1);
    }
    this.digest();
  }

  yield () {
    const resolve = this.tokenRequests.shift();
    if (resolve) {
      const token = new Token(this);
      this.outstandingTokens.push(token);
      resolve(token);
    }
  }

  digest () {
    while (this.tokenRequests.length > 0) {
      this.yield();
    }
  }

  async execute <T extends any[], U> (fn: (...xs: T) => Promise<U>, ...xs: T): Promise<U> {
    const token = await this.requestToken();
    try {
      const result = await fn(...xs);
      this.releaseToken(token);
      return result;
    } catch (e) {
      this.releaseToken(token);
      return Promise.reject(e);
    }
  }

  throttle <T extends any[], U> (fn: (...xs: T) => Promise<U>): (...xs: T) => Promise<U> {
    return (...xs) => this.execute(fn, ...xs);
  }
}

export class SimultaneityMachine extends TokenMachine {
  constructor (protected maxOutstandingTokens: number = 1) {
    super();
  }

  digest () {
    while (this.tokenRequests.length > 0 && this.outstandingTokens.length < this.maxOutstandingTokens) {
      this.yield();
    }
  }
}

export const simultaneityMachine = (maxOutstandingTokens: number) => new SimultaneityMachine(maxOutstandingTokens);

export class RateMachine extends TokenMachine {

  protected count: number = 0;

  protected timer: NodeJS.Timeout | null = null;

  constructor (protected maxCount: number, protected interval: number) {
    super();
  }

  runTimer () {
    if (this.timer === null) {
      this.timer = setInterval(() => this.tick(), this.interval);
    }
  }

  stopTimer () {
    if (this.timer !== null) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  tick () {
    this.count = 0;
    this.digest();
    if (this.count === 0) {
      this.stopTimer();
    }
  }

  digest () {
    if (this.tokenRequests.length > 0) {
      this.runTimer();
    }
    while (this.tokenRequests.length > 0 && this.count < this.maxCount) {
      this.count++;
      this.yield();
    }
  }
}

export const rateMachine = (maxCount: number = 1, interval: number = 1000) => new RateMachine(maxCount, interval);
