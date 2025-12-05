# Contributing to Secret Santa

Thank you for your interest in contributing to Secret Santa! This document provides guidelines and instructions for contributing to the project.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [How to Contribute](#how-to-contribute)
- [Code Style Guidelines](#code-style-guidelines)
- [Pull Request Process](#pull-request-process)
- [Reporting Bugs](#reporting-bugs)
- [Suggesting Features](#suggesting-features)

## Code of Conduct

This project adheres to a Code of Conduct. By participating, you are expected to uphold this code. Please read [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md) before contributing.

## Getting Started

1. **Fork the repository** on GitHub
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/YOUR_USERNAME/santa.git
   cd santa
   ```
3. **Add upstream remote**:
   ```bash
   git remote add upstream https://github.com/ORIGINAL_OWNER/santa.git
   ```

## Development Setup

### Prerequisites

- Node.js 18+ and npm
- MongoDB instance (local or cloud)
- AWS account with SES configured (for email functionality)

### Installation

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy the environment file:

   ```bash
   cp .env.example .env
   ```

3. Configure your `.env` file with required values:
   - `SESSION_SECRET`: Generate with `openssl rand -base64 32`
   - `WEBHOOK_SECRET`: Generate with `openssl rand -hex 32`
   - MongoDB connection string
   - AWS SES credentials

4. Run the development server:
   ```bash
   npm run dev
   ```

The application will be available at `http://localhost:3011`.

## How to Contribute

### Creating a Feature Branch

Always create a new branch for your work:

```bash
git checkout -b feature/your-feature-name
# or
git checkout -b fix/bug-description
```

Branch naming conventions:

- `feature/` - New features
- `fix/` - Bug fixes
- `docs/` - Documentation changes
- `refactor/` - Code refactoring
- `test/` - Adding or updating tests
- `chore/` - Maintenance tasks

### Making Changes

1. Write clean, readable code following our style guidelines
2. Add tests if applicable
3. Update documentation as needed
4. Ensure all tests pass:
   ```bash
   npm run check
   ```

### Committing Changes

Write clear, descriptive commit messages:

```bash
git commit -m "Add user profile editing feature"
# or
git commit -m "Fix email verification link expiration bug"
```

Good commit messages:

- Use present tense ("Add feature" not "Added feature")
- Be specific and descriptive
- Reference issues when applicable (#123)

## Code Style Guidelines

This project uses automated tools to maintain code quality:

### Linting

```bash
npm run lint
```

We use ESLint with Next.js recommended configuration.

### Formatting

```bash
npm run format
```

We use Prettier for consistent code formatting. The formatter runs automatically on `npm run check`.

### TypeScript

- Write type-safe code
- Avoid `any` types when possible
- Use Zod schemas for runtime validation
- Ensure no TypeScript errors:
  ```bash
  npx tsc --noEmit
  ```

### Code Style

- Use functional components with hooks (React)
- Prefer `const` over `let`
- Use descriptive variable names
- Keep functions small and focused
- Add comments for complex logic
- Follow the existing code structure and patterns

### File Structure

- Place React components in appropriate directories
- Use barrel exports (`index.ts`) where appropriate
- Keep API routes in `app/api/`
- Shared utilities in `lib/`
- Type definitions in appropriate `.ts` files

## Pull Request Process

1. **Update your branch** with latest upstream changes:

   ```bash
   git fetch upstream
   git rebase upstream/main
   ```

2. **Run all checks** before submitting:

   ```bash
   npm run check
   npm run build
   ```

3. **Push your branch** to your fork:

   ```bash
   git push origin feature/your-feature-name
   ```

4. **Create a Pull Request** on GitHub:
   - Use a clear, descriptive title
   - Reference any related issues
   - Provide a detailed description of changes
   - Include screenshots for UI changes
   - List any breaking changes

5. **Respond to feedback**:
   - Address review comments promptly
   - Push additional commits to the same branch
   - Request re-review when ready

6. **After approval**:
   - A maintainer will merge your PR
   - Delete your feature branch after merge

### Pull Request Checklist

Before submitting, ensure:

- [ ] Code follows style guidelines (`npm run check` passes)
- [ ] All tests pass
- [ ] TypeScript has no errors
- [ ] Documentation is updated if needed
- [ ] Commit messages are clear and descriptive
- [ ] PR description explains the changes
- [ ] No secrets or sensitive data in commits
- [ ] No console.log statements (except intentional logging)

## Reporting Bugs

### Before Submitting a Bug Report

- Check existing issues to avoid duplicates
- Verify the bug exists in the latest version
- Gather relevant information about your environment

### Submitting a Bug Report

Use the bug report template and include:

1. **Clear title** describing the issue
2. **Steps to reproduce**:
   - Step 1
   - Step 2
   - Step 3
3. **Expected behavior**: What should happen
4. **Actual behavior**: What actually happens
5. **Screenshots**: If applicable
6. **Environment details**:
   - OS and version
   - Node.js version
   - Browser (if frontend issue)
7. **Additional context**: Any other relevant information

**For security vulnerabilities**: Do NOT use public issues. See [SECURITY.md](SECURITY.md).

## Suggesting Features

### Before Suggesting a Feature

- Check if the feature already exists
- Search existing feature requests
- Consider if it fits the project's scope

### Submitting a Feature Request

Use the feature request template and include:

1. **Clear title** describing the feature
2. **Problem statement**: What problem does this solve?
3. **Proposed solution**: How should it work?
4. **Alternatives considered**: Other approaches you've thought of
5. **Use cases**: Who would benefit and how?
6. **Additional context**: Mockups, examples, etc.

## Questions?

- Open a discussion on GitHub Discussions
- Check existing documentation
- Review closed issues for similar questions

## Recognition

Contributors will be recognized in:

- GitHub contributors list
- Release notes (for significant contributions)
- Security hall of fame (for security researchers, with permission)

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

Thank you for contributing to Secret Santa! 🎅
