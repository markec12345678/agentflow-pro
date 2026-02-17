# Release process

## Cutting a release

1. Ensure `main` is up to date.
2. Create and push a tag:

   ```bash
   git tag v1.0.0
   git push origin v1.0.0
   ```

3. The release workflow runs automatically and creates a GitHub Release with generated notes.

## Changelog

Releases use GitHub’s generated release notes. For more control, use [Conventional Commits](https://www.conventionalcommits.org/) in your commit messages:

- `feat:` – New feature
- `fix:` – Bug fix
- `docs:` – Documentation
- `chore:` – Maintenance
