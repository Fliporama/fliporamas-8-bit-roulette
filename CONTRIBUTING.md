# Contributing

## Work tracking

- Create or claim an issue before starting a change; keep each pull request focused on one issue.
- Use one branch per issue so parallel work stays separate.
- Link the issue from the pull request with `Closes #<issue-number>`.
- Keep pull requests small enough to review, and include the checks you ran.

## Branch names

Use a type and a short kebab-case description:

- `feat/add-bet-history`
- `fix/zero-payout`
- `docs/update-setup`

## Commit messages

Use Conventional Commits, for example `feat: add six-line betting` or `fix: return chips when clearing bets`.

## Before opening a pull request

Run all three checks from the repository root:

```powershell
npm run lint
npm test
npm run build
```

Pull requests target `main` and are squash-merged after GitHub Actions passes. Never force-push to `main`.