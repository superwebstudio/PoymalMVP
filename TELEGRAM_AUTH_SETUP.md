# Telegram Web App Authentication Setup

## Prerequisites

1. **Telegram Bot Token**: Get it from [@BotFather](https://t.me/BotFather)
2. **HTTPS URL**: For local testing, use ngrok or similar

## Environment Variables

Add to your `.env` file in the root directory:

```env
TELEGRAM_BOT_TOKEN=your_bot_token_here
```

This is the same token used for the Telegram bot.

## How It Works

1. **User launches app via Telegram**: When user clicks the Web App button in Telegram
2. **Telegram provides initData**: Contains user info and signature
3. **Client sends to backend**: `/api/auth/telegram` endpoint
4. **Backend verifies signature**: Using HMAC-SHA256 with bot token
5. **User created/updated**: Stored in database with Telegram ID, name, photo, etc.

## Testing Locally

1. **Start your Next.js app**:
   ```bash
   npm run dev
   ```

2. **Expose with ngrok** (for HTTPS):
   ```bash
   ngrok http 3000
   ```

3. **Update bot's WEB_APP_URL**:
   - Copy the ngrok HTTPS URL
   - Update `telegram-bot/.env` with the HTTPS URL

4. **Launch from Telegram**:
   - Open your bot in Telegram
   - Send `/start`
   - Click "Open Poymal App" button
   - The app will authenticate automatically

## What Gets Stored

- `telegramId` (BigInt, unique)
- `firstName`
- `username` (Telegram handle)
- `photoUrl` (profile photo)
- `language` (from Telegram, defaults to 'ru')

## Security

- All initData is cryptographically verified
- Only valid Telegram-signed data is accepted
- User data is stored securely in your database


