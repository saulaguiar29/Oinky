# Oinky Backend API – Week 4

Node.js + Express + MongoDB backend for the Oinky savings app.

## Project Structure

```
src/
├── server.js          # Entry point, middleware, route mounting
├── config/
│   └── database.js    # MongoDB connection
├── middleware/
│   └── auth.js        # Firebase token verification
├── models/
│   ├── User.js
│   ├── SavingsGoal.js
│   └── Transaction.js
└── routes/
    ├── auth.js
    ├── users.js
    ├── goals.js
    └── transactions.js
```

---

## Authentication

All protected routes require a Firebase ID token in the header:

```
Authorization: Bearer <firebase_id_token>
```

The auth middleware automatically creates a MongoDB user document on first login.

---

## API Endpoints

### Auth

| Method | Endpoint         | Description                            |
| ------ | ---------------- | -------------------------------------- |
| POST   | `/api/auth/sync` | Sync Firebase user to MongoDB on login |
| GET    | `/api/auth/me`   | Get current user info                  |

### Users

| Method | Endpoint             | Description      |
| ------ | -------------------- | ---------------- |
| GET    | `/api/users/profile` | Get user profile |
| PATCH  | `/api/users/profile` | Update user name |

### Goals

| Method | Endpoint                          | Description                                    |
| ------ | --------------------------------- | ---------------------------------------------- |
| GET    | `/api/goals`                      | Get all goals + totalSaved across active goals |
| GET    | `/api/goals?status=completed`     | Filter by status                               |
| GET    | `/api/goals/:id`                  | Get goal + its transaction history             |
| POST   | `/api/goals`                      | Create a new goal                              |
| PATCH  | `/api/goals/:id`                  | Edit a goal                                    |
| DELETE | `/api/goals/:id`                  | Delete a goal (also deletes its transactions)  |
| POST   | `/api/goals/summary/savings-plan` | Calculate amount to save per period            |

#### Create Goal – Body

```json
{
  "title": "PS5",
  "targetAmount": 500,
  "deadline": "2025-12-01",
  "savingPlan": "monthly",
  "productUrl": "https://bestbuy.com/ps5"
}
```

#### Savings Plan Calculator – Body

```json
{
  "targetAmount": 500,
  "currentAmount": 50,
  "deadline": "2025-12-01",
  "savingPlan": "monthly"
}
```

Response:

```json
{
  "remaining": 450,
  "periodsLeft": 8,
  "amountPerPeriod": 56.25
}
```

### Transactions

| Method | Endpoint                        | Description                |
| ------ | ------------------------------- | -------------------------- |
| GET    | `/api/transactions`             | Get all transactions       |
| GET    | `/api/transactions?goalId=<id>` | Filter by goal             |
| POST   | `/api/transactions/deposit`     | Add money to a goal        |
| POST   | `/api/transactions/withdraw`    | Withdraw money from a goal |
| POST   | `/api/transactions/transfer`    | Move money between goals   |

#### Deposit – Body

```json
{
  "goalId": "664abc...",
  "amount": 50,
  "source": "Manual",
  "note": "Birthday money"
}
```

#### Transfer – Body

```json
{
  "fromGoalId": "664abc...",
  "toGoalId": "664xyz...",
  "amount": 100,
  "note": "Switching priorities"
}
```

---
