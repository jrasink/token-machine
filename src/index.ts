import Koa from 'koa';
import { RateMachine } from './lib/rate-limit';

const config = {
  port: 80,
  rate: 10,
  interval: 1000
};

const getId = (() => { let i = 0; return () => i++; })();
const getTime = (() => { const t0 = new Date().getTime(); return () => `${(new Date().getTime() - t0) / 1000}s`; })();

const limiter = new RateMachine(config.rate, config.interval);

const respond = async (ctx: any) => limiter.execute(async () => {
  ctx.status = 200;
  ctx.body = 'ok ok go';
});

const app = new Koa();

app.use(async (ctx) => {
  const id = getId();

  console.log(`${getTime()} >> Incoming request ${id} (already queued: ${limiter.state().requests})`);

  await respond(ctx);

  console.log(`${getTime()} >> Response sent for request ${id} (still queued: ${limiter.state().requests})`);
});

app.listen(config.port);

console.log(`${getTime()} >> Listening on port ${config.port}. Will send ${config.rate} responses per ${config.interval}ms.`);
