# Contributing to AgentFlow Pro

First off, thank you for considering contributing to AgentFlow Pro! It's people like you that make AgentFlow Pro such a great tool.

## Code of Conduct

This project and everyone participating in it is governed by the [Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code.

## How Can I Contribute?

### Reporting Bugs

This section guides you through submitting a bug report for AgentFlow Pro. Following these guidelines helps maintainers and the community understand your report, reproduce the behavior, and find related reports.

**Before Submitting A Bug Report:**

* Check the [documentation](README.md) for a list of common questions and solutions.
* Check the [issues](https://github.com/your-org/agentflow-pro/issues) to see if the problem has already been reported.

**How Do I Submit A (Good) Bug Report?**

Bugs are tracked as [GitHub issues](https://github.com/your-org/agentflow-pro/issues). Create an issue and provide the following information:

* **Use a clear and descriptive title**
* **Describe the exact steps to reproduce the problem**
* **Provide specific examples to demonstrate the steps**
* **Describe the behavior you observed and what behavior you expected**
* **Include screenshots if possible**
* **Include environment details** (OS, Node version, etc.)

### Suggesting Enhancements

This section guides you through submitting an enhancement suggestion for AgentFlow Pro.

**Before Submitting An Enhancement Suggestion:**

* Check if the enhancement is already implemented in the latest version
* Check if the enhancement has already been suggested

**How Do I Submit A (Good) Enhancement Suggestion?**

Enhancement suggestions are tracked as [GitHub issues](https://github.com/your-org/agentflow-pro/issues). Create an issue and provide:

* **Use a clear and descriptive title**
* **Provide a detailed description of the suggested enhancement**
* **Explain why this enhancement would be useful**
* **List some examples of how this enhancement would be used**

### Pull Requests

The process described here has several goals:

* Maintain AgentFlow Pro's quality
* Fix problems that are important to users
* Engage the community in working toward the best possible AgentFlow Pro
* Enable a sustainable system for AgentFlow Pro's maintainers to review contributions

**Please follow these steps to have your contribution considered by the maintainers:**

1. Follow all instructions in [the template](PULL_REQUEST_TEMPLATE.md)
2. Follow the [styleguides](#styleguides)
3. After you submit your pull request, verify that all [status checks](https://help.github.com/articles/about-status-checks/) are passing

### Local Development

To develop locally, clone the repository and install dependencies:

```bash
git clone https://github.com/your-org/agentflow-pro.git
cd agentflow-pro
npm install
npm run dev
```

### Styleguides

#### Git Commit Messages

* Use the present tense ("Add feature" not "Added feature")
* Use the imperative mood ("Move cursor to..." not "Moves cursor to...")
* Limit the first line to 72 characters or less
* Reference issues and pull requests liberally after the first line

#### JavaScript/TypeScript Styleguide

* Use Prettier to format code
* Use ESLint to lint code
* All code must be TypeScript
* Follow the existing code style

```bash
# Format code
npm run format

# Lint code
npm run lint
```

#### Testing

* Write tests for all new features
* Ensure all tests pass before submitting PR
* Aim for >80% code coverage

```bash
# Run tests
npm test

# Run E2E tests
npm run test:e2e
```

### Additional Notes

#### Issue and Pull Request Labels

This project uses the following labels:

* `bug` - Something isn't working
* `enhancement` - New feature or request
* `documentation` - Documentation improvements
* `good first issue` - Good for newcomers
* `help wanted` - Extra attention is needed
* `question` - Further information is requested

## Attribution

This CONTRIBUTING.md is adapted from the [Atom contributing guide](https://github.com/atom/atom/blob/master/CONTRIBUTING.md) and the [GitHub Docs contributing guide](https://github.com/github/docs/blob/main/CONTRIBUTING.md).
