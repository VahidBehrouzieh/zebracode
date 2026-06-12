# Contributing to ZebraCode

First off, thank you for considering contributing to ZebraCode! 🦓

## How Can I Contribute?

### Reporting Bugs
- Check if the bug is already reported in [Issues](https://github.com/VahidBehrouzieh/zebracode/issues).
- If not, create a new issue using the **Bug Report** template. Include steps to reproduce, expected behavior, and screenshots if possible.

### Suggesting Enhancements or New Tools
- Use the **Feature Request** template to propose a new converter or improvement.
- Explain why the tool would be useful and, if you have a suggestion, how it might work.

### Pull Requests

1. **Fork** the repository and create your branch from `main`.
2. **Branch naming:** Use a descriptive name like `feat/json-to-avro` or `fix/css-worker-syntax`.
3. **Commit messages:** We follow [Conventional Commits](https://www.conventionalcommits.org/). Keep commits small and focused.
   - `feat(tool): add JSON to Avro converter`
   - `fix(scss): resolve invalid output for nested selectors`
   - `docs: update README with new tools`
4. **Testing:** Ensure all existing functionality works and add tests if applicable (we use Vitest).
5. **Build:** The project should build without errors (`npm run build`).
6. Open a **pull request** against the `main` branch. Describe your changes clearly and reference any related issue.

### Development Workflow
- The project uses Next.js with TypeScript and Tailwind CSS.
- All tools are located under `src/app/(converters)` with shared components in `src/components`.
- Tool logic is typically in dedicated worker files inside `public/workers/`.
- To add a new tool, you'll need to:
  1. Create the converter page and logic.
  2. Register the tool in the tools registry (`src/lib/registry/tools.ts`).
  3. Run `npm run postbuild` to regenerate `scripts/tools.json` and the sitemap.

## Code of Conduct
Please note we have a [Code of Conduct](./CODE_OF_CONDUCT.md). By participating, you agree to uphold it.

Thank you! 🙌