# Ulov Telegram Bot

A TypeScript Telegram bot for testing the Ulov fishing app.

## Setup

1. **Create a bot with BotFather:**
   - Open Telegram and search for `@BotFather`
   - Send `/newbot` and follow the instructions
   - Copy the bot token

2. **Install dependencies:**
   ```bash
   cd telegram-bot
   npm install
   ```

3. **Configure environment:**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and add your bot token:
   ```
   TELEGRAM_BOT_TOKEN=your_bot_token_here
   WEB_APP_URL=http://localhost:3000
   ```

4. **For local development with web app:**
   - Use ngrok or similar to expose your local server:
     ```bash
     ngrok http 3000
     ```
   - Update `WEB_APP_URL` in `.env` with the ngrok URL

5. **Run the bot:**
   ```bash
   npm run dev
   ```

## Commands

- `/start` - Launch the Ulov app via Web App button
- `/help` - Show help message
- `/test` - Test bot connection

## Features

- Web App integration for launching the Ulov app
- Photo handling for testing
- Web app data reception

## Deployment

For serverless deployment (Vercel, etc.), the bot exports a webhook handler.

For long polling (local development), run `npm start`.


