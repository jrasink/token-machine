import Koa from 'koa';
import { RateMachine } from './lib/rate-limit';

const getId = (() => { let i = 0; return () => i++; })();
const getTime = (() => { const t0 = new Date().getTime(); return () => `${(new Date().getTime() - t0) / 1000}s`; })();

const limiter = new RateMachine(3, 1000);

const respond = async (ctx: any) => limiter.execute(async () => {
  ctx.status = 200;
  ctx.body = 'ok ok go';
});

const app = new Koa();

app.use(async (ctx) => {
  const id = getId();

  console.log(`${getTime()} >> Incoming request ${id} (${limiter.state().requests} requests are currently queued)`);

  await respond(ctx);

  console.log(`${getTime()} >> Response sent for ${id} (${limiter.state().requests} requests are currently queued)`);
});

app.listen(80);

console.log(`${getTime()} >> Listening on port 80`);
