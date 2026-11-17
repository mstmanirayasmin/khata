# Contributing

Thanks for your interest in improving khata. This is a small, framework-free project, so contributions are easiest when they stay small and focused.

## Ground rules

- Keep the **no-build-step** setup. Don't introduce a package manager, bundler, or framework.
- Keep the design language intact: restrained palette, editorial type, hairline borders, no gradients or emoji icons.
- All theme values belong in `css/tokens.css`. Avoid hard-coded colors in components.
- User-supplied text must be escaped before being inserted into the DOM.

## Workflow

1. Fork the repository.
2. Create a branch: `git checkout -b feature/short-name`.
3. Make your change and test it in a browser (and at mobile width).
4. Commit with a clear message: `git commit -m "Add monthly budget progress"`.
5. Push and open a pull request describing **what** changed and **why**.

## Good first contributions

- JSON export / import alongside CSV
- Budget goals with progress bars
- A theme toggle built on the existing tokens
- More chart range options or a category trend view
- Accessibility polish (screen-reader announcements, keyboard shortcuts)

## Reporting bugs

Open an issue with:
- what you expected, what happened
- your browser and screen size
- steps to reproduce (and the browser console output, if any)

---

By contributing, you agree that your contributions are licensed under the [MIT License](LICENSE).
