# Admin panel and sample data

## Who is an admin
Accounts with `isAdmin: true` (the five starter accounts: ashkan, adel, bardia, mohammad and **kamran**, all `admin` / `admin`).
The panel is opened from the account menu ("پنل ادمین"). `lib/admin.js` checks `isAdmin` itself (`updateSettings` returns `forbidden` otherwise); the screen only hides what the logic refuses.

## What it shows (all computed from the state on the device)
- Overview: users, trainers, athletes, featured trainers, active coaching subscriptions, waiting requests, programs, average rating.
- Money: 30-day and total volume (what athletes paid trainers), Featured income (monthly now / total) and an **estimated** commission (`settings.commissionRate`, nothing is charged yet).
- Monthly volume bars (30-day windows), provinces table (trainers, athletes, featured places used / total), top trainers (score, athletes, income, rating), active Featured subscriptions, latest payments.

## Settings (`db.settings`)
| key | meaning | limits |
| --- | --- | --- |
| `premiumSlots` | featured places per province (default 6) | 1–50 |
| `commissionRate` | percent used for the estimate | 0–50 |

Lowering `premiumSlots` below what a province already uses removes nobody; it only stops new subscriptions there until a place frees up. There is no waiting list.

## Sample data (all `demo`, none of it can sign in except the five accounts)
- Gilan (19) plus Tehran, Alborz, Isfahan, Razavi Khorasan, Fars, East Azerbaijan, Mazandaran, Khuzestan, Kerman (78): generated from fixed numbers (`data/sampleKit.js`, `data/regions.js`); 2–5 featured per province.
- **kamran** (`data/proTrainer.js`): Tehran, featured (about 24 days left), 62 coaching requests (38 active, 16 ended, 4 waiting, 2 waiting to pay, 2 declined), custom programs, chats, ~470 million toman of income over six months (coaching, renewals, six general programs with sales), ~47 reviews, likes and ~420 views.
- Orders of the sample business carry `demo: true`; ids start with `seed-`. Older saves get all of it once, by id (`SEED_RELEASE = 4`), without touching anything of their own.

## Featured expiry
`reconcilePremium` runs when the app opens and every ten minutes: one heads-up in the last 7 days and one note when it ends (flags on `user.premium`; a renewal writes a new object so they start over). Ended trainers drop out of the featured group by themselves (`isPremium` is derived from `premium.until`).
