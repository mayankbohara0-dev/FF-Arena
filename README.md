# FF Arena

**FF Arena** is a mobile-first tournament-management platform for Free Fire community competitions. Players can discover and join Solo, Duo, and Squad tournaments, receive custom-room details, track results, and view leaderboards. Organizers can publish tournaments, manage rooms, review results, and coordinate payouts.

> FF Arena is an independent community project and is not affiliated with, endorsed by, or sponsored by Garena or Free Fire.

## Features

- Tournament discovery with maps, entry fees, capacity, start times, and rewards.
- Player registration, joined-tournament tracking, room credentials, receipts, and statistics.
- Organizer tools for tournament creation, occupancy, roster export, and match management.
- Result review, leaderboards, winner and kill-bounty payout queues, and dispute workflows.
- Wallet, payment, fair-play, anti-fraud, and role-aware administration areas.
- Web Progressive Web App experience with Android packaging through Capacitor.

## Technology stack

| Layer | Technology |
| --- | --- |
| Frontend | React 19, TypeScript, and Vite |
| Mobile packaging | Capacitor 8 and Android |
| Styling and UI | Tailwind CSS 4, Lucide React, and custom dark glassmorphic UI |
| Backend integrations | Firebase and Supabase |
| Database assets | SQL schema, policies, seed, and storage files under [`supabase/`](./supabase) |

## Getting started

```bash
git clone https://github.com/mayankbohara0-dev/FF-Arena.git
cd FF-Arena
npm install
npm run dev
```

Build the web application or synchronize it into the Android project with:

```bash
npm run build
npm run cap:build
```

Copy `.env.example` to `.env` where available and provide environment-specific Firebase or Supabase values. Never commit production credentials.

## Status and deployment notes

The repository contains the web application and native Android project. Tournament, wallet, payout, and administrator workflows should be tested with production-grade authentication, authorization, database policies, and jurisdiction-specific compliance review before public use.

## License

Released under the [MIT License](./LICENSE).

## Author

Maintained by [Mayank Bohara](https://github.com/mayankbohara0-dev).
