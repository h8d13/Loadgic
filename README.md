<div align="center">

# Loadgic

## An Open-Source Visualizer for Code Logic and Runtime Execution

[![Project Page](https://img.shields.io/badge/Project-Page-blue?logo=microsoft)](https://github.com/Umbraw/Loadgic?tab=readme-ov-file)

</div>

---

## 📰 News

* **06-01-2026**: Start of the Loadgic visualizer project 🚀

---

## 📖Overview

**Loadgic** is an open-source desktop application that visualizes code logic and execution flow.
It helps developers better understand, analyze, and debug their programs by transforming complex code structures into intuitive visual representations.

This project is built with:

* Vite
* React
* TypeScript
* Electron

---

## 📦 Requirements (for development)

To work on the project locally, you need:

* Node.js **18+** (recommended)
* npm (included with Node.js)

---

## 🚀 Installation (for developers)

From the project root:

```bash
cd app
npm install
```

This installs all dependencies required for development.

---

## 🧪 Run in development mode

This launches the app with hot-reload (recommended while coding):

```bash
npm run dev
```

Changes in the code will automatically refresh the application.

---

## 🏗️ Build the application (create a real program)

To generate a production version of the application:

```bash
npm run build
```

This command will:

1. Compile TypeScript (`tsc`)
2. Build the frontend with Vite (`vite build`)
3. Package the app using Electron Builder (`electron-builder`)

After the build, the generated application can be found here:

```
app/release/<version>/
```

Example:

```
app/release/0.0.1/
```

On Linux, you will typically get:

* An **AppImage** (portable executable)
* A `linux-unpacked/` folder containing the raw executable

---

## ▶️ Run the built application (Linux)

### Option 1 — AppImage (recommended)

Make the file executable and launch it:

```bash
chmod +x Loadgic-Linux-0.0.1.AppImage
./Loadgic-Linux-0.0.1.AppImage
```

Or via file manager:

* Right-click the AppImage → Properties → Allow executing → Double click

### Option 2 — Unpacked version

```bash
cd app/release/0.0.1/linux-unpacked
./Loadgic
```

---

## 🧹 Clean build files (after testing)

To remove all generated build artifacts and clean the project:

```bash
npm run clean
```

This removes:

* `dist/`
* `dist-electron/`
* `release/`
* `builder-debug.yml`
* `builder-effective-config.yaml`

This does **not** delete your source code or dependencies.

---

## 📂 Project Scripts Summary

| Command           | Description                          |
| ----------------- | ------------------------------------ |
| `npm run dev`     | Launch app in development mode       |
| `npm run build`   | Build and package the app            |
| `npm run clean`   | Remove all build artifacts           |
| `npm run preview` | Preview Vite frontend only (browser) |
| `npm run lint`    | Run ESLint checks                    |

---

## 📜 License

This project is open-source. License information will be added soon.

---

## 🤝 Contributing

Contributions, ideas, and feedback are welcome!
Feel free to open issues or pull requests on the GitHub repository.
