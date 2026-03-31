import type { Bot, Context } from 'grammy';
import { InlineKeyboard } from 'grammy';
import { CONSTANTS } from '../constants';

const KV_SUBSCRIBERS = 'subscribers';

function toSubscriberKey(userId: number): string {
	return `${KV_SUBSCRIBERS}:${userId}`;
}

async function setSubscribed(kv: KVNamespace, userId: number, subscribed: boolean): Promise<void> {
	await kv.put(toSubscriberKey(userId), subscribed ? '1' : '0');
}

async function isSubscribed(kv: KVNamespace, userId: number): Promise<boolean> {
	const v = await kv.get(toSubscriberKey(userId));
	return v === '1';
}

export function agentNotificationKeyboard(): InlineKeyboard {
	return new InlineKeyboard()
		.text(CONSTANTS.AGENT.UNSUBSCRIBED_MESSAGE, 'agent_notify:no')
		.text(CONSTANTS.AGENT.SUBSCRIBED_MESSAGE, 'agent_notify:yes');
}

export async function promptAgentNotifications(ctx: Context): Promise<void> {
	await ctx.reply(CONSTANTS.AGENT.NOTIFICATIONS_MESSAGE, {
		reply_markup: agentNotificationKeyboard(),
	});
}

export function installAgentCommands(
	bot: Bot,
	env: {
		BUS_AGENT_KV: KVNamespace;
	},
): void {
	const kv = env.BUS_AGENT_KV;

	bot.callbackQuery('agent_notify:yes', async (ctx) => {
		const userId = ctx.from?.id;
		if (!userId) return;
		await setSubscribed(kv, userId, true);
		await ctx.answerCallbackQuery({ text: CONSTANTS.AGENT.SUBSCRIBED_STATUS_MESSAGE });
		await ctx.editMessageText(CONSTANTS.AGENT.SUBSCRIBED_STATUS_MESSAGE);
	});

	bot.callbackQuery('agent_notify:no', async (ctx) => {
		const userId = ctx.from?.id;
		if (!userId) return;
		await setSubscribed(kv, userId, false);
		await ctx.answerCallbackQuery({ text: CONSTANTS.AGENT.UNSUBSCRIBED_STATUS_MESSAGE });
		await ctx.editMessageText(CONSTANTS.AGENT.UNSUBSCRIBED_STATUS_MESSAGE);
	});

	// Optional: allow user to check status
	bot.command('agent_status', async (ctx) => {
		const userId = ctx.from?.id;
		if (!userId) return;
		const subscribed = await isSubscribed(kv, userId);
		await ctx.reply(subscribed ? '✅ You are subscribed to agent notifications.' : '⛔ You are not subscribed.');
	});
}
