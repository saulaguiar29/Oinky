# Oinky

Oinky is a personal savings app built with React Native and Expo. It helps users set savings goals, track their progress, and stay on top of their finances by optionally linking their bank account.

## The Idea

A lot of people struggle with saving because their money sits in the same account they spend from — it's too easy to dip into it. Oinky is built around the idea of using digital wallets like **Venmo** or **PayPal** as a simple, low-friction way to keep savings separate.

Instead of opening a separate bank account, you can just transfer your savings amount into your Venmo or PayPal balance. It's out of your main account, a little harder to spend impulsively, but still easy to access when you actually reach your goal. Oinky helps you track those transfers, set targets, and stay consistent — so your savings feel intentional instead of accidental.

## What it does

- **Savings Goals** — Create goals with a target amount, deadline, and saving plan (daily, biweekly, or monthly). Oinky calculates how much you need to save each period to hit your goal on time.
- **Deposits & Withdrawals** — Add or remove money from any goal and track every transaction in the Activity tab.
- **Goal Progress** — See a visual progress bar and percentage for each goal, plus a savings breakdown chart on the dashboard.
- **Bank Linking** — Connect your bank account via Plaid to view your real account balance directly in the app.
- **Notifications** — Get reminders to stay on track with your savings.
- **Dark Mode** — Full dark mode support.

## Tech Stack

- **Frontend:** React Native, Expo, Expo Router
- **Backend:** Node.js, Express, MongoDB
- **Auth:** Firebase Authentication
- **Bank Integration:** Plaid API

## Running the app locally

### Backend
```bash
cd backend
npm install
npm run dev
```

### Mobile app
```bash
cd Oinky
npm install
npx expo run:ios
```

> The app requires a custom dev build (not Expo Go) because it uses native modules.

## Environment Variables

The backend requires a `.env` file with the following:

```
PORT=5001
MONGO_URI=your_mongodb_connection_string
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_CLIENT_EMAIL=your_client_email
FIREBASE_PRIVATE_KEY=your_private_key
FIREBASE_STORAGE_BUCKET=your_storage_bucket
PLAID_CLIENT_ID=your_plaid_client_id
PLAID_SECRET=your_plaid_secret
PLAID_ENV=sandbox
```
