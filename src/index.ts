/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `npm run dev` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `npm run deploy` to publish your worker
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */

import { Bot, Context, Keyboard, webhookCallback } from 'grammy';
import { CONSTANTS } from './constants';
import { installAgentCommands, promptAgentNotifications } from './commands/agent';

export interface Env {
	// Example binding to KV. Learn more at https://developers.cloudflare.com/workers/runtime-apis/kv/
	// MY_KV_NAMESPACE: KVNamespace;
	//
	// Example binding to Durable Object. Learn more at https://developers.cloudflare.com/workers/runtime-apis/durable-objects/
	// MY_DURABLE_OBJECT: DurableObjectNamespace;
	//
	// Example binding to R2. Learn more at https://developers.cloudflare.com/workers/runtime-apis/r2/
	// MY_BUCKET: R2Bucket;
	//
	// Example binding to a Service. Learn more at https://developers.cloudflare.com/workers/runtime-apis/service-bindings/
	// MY_SERVICE: Fetcher;
	//
	// Example binding to a Queue. Learn more at https://developers.cloudflare.com/queues/javascript-apis/
	// MY_QUEUE: Queue;
	BOT_INFO: string;
	BOT_TOKEN: string;
	BUS_AGENT_KV: KVNamespace;
}

export default {
	async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
		const bot = new Bot(env.BOT_TOKEN);

		installAgentCommands(bot, env);

		const mainKeyboard = new Keyboard().text('کمک').text('👮🏻‍♂️ اطلاع رسانی مامور').row().text('Open website').resized().persistent();

		bot.command('start', async (ctx: Context) => {
			await ctx.reply(CONSTANTS.START_MESSAGE, { reply_markup: mainKeyboard });
		});

		bot.hears('👮🏻‍♂️ اطلاع رسانی مامور', async (ctx: Context) => {
			await promptAgentNotifications(ctx);
		});

		bot.hears('کمک', async (ctx: Context) => {
			await ctx.reply('Help: try /start or /menu');
		});

		bot.hears('About', async (ctx: Context) => {
			await ctx.reply('About: this bot runs on Cloudflare Workers + grammY.');
		});

		bot.hears('Open website', async (ctx: Context) => {
			await ctx.reply('https://example.com');
		});

		return webhookCallback(bot, 'cloudflare-mod')(request);
	},
};
