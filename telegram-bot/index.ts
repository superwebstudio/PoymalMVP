import { Bot, webhookCallback } from 'grammy';
import { config } from 'dotenv';

// Load environment variables
config();

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';
const WEB_APP_URL = process.env.WEB_APP_URL || 'http://localhost:3000';
const USE_WEBHOOK = process.env.USE_WEBHOOK === 'true';

if (!BOT_TOKEN) {
    console.error('TELEGRAM_BOT_TOKEN is required in .env file');
    process.exit(1);
}

// Create bot instance
const bot = new Bot(BOT_TOKEN);

// Start command
bot.command('start', async (ctx) => {
    const isHttps = WEB_APP_URL.startsWith('https://');

    if (isHttps) {
        const keyboard = {
            inline_keyboard: [
                [
                    {
                        text: '🚣 Open Ulov App',
                        web_app: { url: WEB_APP_URL },
                    },
                ],
            ],
        };

        await ctx.reply(
            '🎣 Welcome to Ulov!\n\n' +
            'A fishing logbook app for anglers.\n\n' +
            'Click the button below to launch the app:',
            {
                reply_markup: keyboard,
            }
        );
    } else {
        await ctx.reply(
            '🎣 Welcome to Ulov!\n\n' +
            'A fishing logbook app for anglers.\n\n' +
            `⚠️ Web App URL must use HTTPS.\n` +
            `Current URL: ${WEB_APP_URL}\n\n` +
            `For local development, use ngrok or similar:\n` +
            `1. Install ngrok: https://ngrok.com\n` +
            `2. Run: ngrok http 3000\n` +
            `3. Update WEB_APP_URL in .env with the HTTPS URL\n\n` +
            `Or visit: ${WEB_APP_URL}`
        );
    }
});

// Help command
bot.command('help', async (ctx) => {
    await ctx.reply(
        '📖 Ulov Bot Commands:\n\n' +
        '/start - Launch the Ulov app\n' +
        '/help - Show this help message\n' +
        '/test - Test the app connection\n\n' +
        'The app allows you to:\n' +
        '• Log your catches\n' +
        '• Track fishing statistics\n' +
        '• Discover other anglers\n' +
        '• View leaderboards\n' +
        '• And much more!'
    );
});

// Test command
bot.command('test', async (ctx) => {
    await ctx.reply(
        `✅ Bot is working!\n\n` +
        `Web App URL: ${WEB_APP_URL}\n` +
        `Bot Token: ${BOT_TOKEN.substring(0, 10)}...`
    );
});

// Handle web app data
bot.on('message', async (ctx) => {
    const message = ctx.message;

    // Handle web app data
    if (message && 'web_app' in message) {
        const webApp = (message as any).web_app;
        if (webApp?.data) {
            try {
                const data = JSON.parse(webApp.data);
                await ctx.reply(`📊 Received data from app:\n\`\`\`json\n${JSON.stringify(data, null, 2)}\n\`\`\``, {
                    parse_mode: 'Markdown',
                });
            } catch (error) {
                await ctx.reply('❌ Error parsing web app data');
            }
        }
    }

    // Handle photos (for testing)
    if (message?.photo) {
        const photo = message.photo[message.photo.length - 1];
        await ctx.reply(
            `📸 Photo received!\n\n` +
            `File ID: ${photo.file_id}\n` +
            `Size: ${photo.width}x${photo.height}\n` +
            `File Size: ${photo.file_size ? `${(photo.file_size / 1024).toFixed(2)} KB` : 'Unknown'}`
        );
    }
});

// Error handling
bot.catch((err) => {
    console.error('Bot error:', err);
});

// For local development (long polling)
if (require.main === module && !USE_WEBHOOK) {
    console.log('🤖 Starting Telegram bot in polling mode...');
    console.log(`🌐 Web App URL: ${WEB_APP_URL}`);
    // Drop pending updates when starting in polling mode
    bot.api.deleteWebhook({ drop_pending_updates: true }).catch(() => {
        // Ignore errors if webhook doesn't exist
    });
    bot.start();
}

// For Vercel/serverless deployment (webhook)
// Only create webhook handler if not running in polling mode
if (USE_WEBHOOK || require.main !== module) {
    // Drop pending updates when webhook is set up
    bot.api.deleteWebhook({ drop_pending_updates: true }).catch(() => {
        // Ignore errors if webhook doesn't exist yet
    });
}

export default USE_WEBHOOK || require.main !== module
    ? webhookCallback(bot, 'std/http')
    : undefined;

