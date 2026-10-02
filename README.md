# Fliporama's 8-Bit Roulette

A browser-only European roulette game for free play. It uses virtual chips with no cash value, payments, accounts, or cashout. The chip balance resets when the page is reloaded or the session is reset.

## Run locally

```powershell
npm install
npm run dev
```

## Checks

```powershell
npm run lint
npm test
npm run build
```

GitHub Actions runs these checks on pull requests and pushes to `main`.

## Contribution flow

Track each scoped change in a GitHub issue, create one feature branch for that issue, and link the issue in its pull request. Use Conventional Commit messages. Merge through a pull request with squash merging after the required checks pass; do not push directly to `main`.

See [CONTRIBUTING.md](CONTRIBUTING.md) for branch and commit conventions.
