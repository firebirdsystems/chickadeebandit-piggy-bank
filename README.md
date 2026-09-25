# Piggy Bank

A [Chickadee Bandit](https://chickadeebandit.com/app-library/piggy-bank) app.

Per-member piggy banks for money and screen time. Adults manage everyone's banks; kids see only their own. Automatically receives weekly allowance deposits from the Chores app.

## Features

- Separate money and screen-time balances per member
- Adults can deposit, withdraw, and add notes to any bank
- Kids see only their own balance
- Deposits the weekly allowance from the Chores app automatically: the hub runs two automations (money and screen time) the moment Chores publishes `allowance.earned`. They are on by default; an admin can switch them off in **Settings → Automations**
- Full transaction history

## Install

In your hub, go to **Apps → Install from URL** and paste:

```
https://github.com/firebirdsystems/chickadeebandit-piggy-bank/releases/latest/download/bundle.json
```

> **Note:** Install the [Chores & Allowance](https://github.com/firebirdsystems/chickadeebandit-chores) app to enable automatic allowance deposits.

## Development

See the [app-template](https://github.com/firebirdsystems/chickadeebandit-app-template) for build instructions and the full manifest field reference.
