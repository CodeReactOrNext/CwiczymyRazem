// Native application menu — gives the wrapped web app the chrome a desktop
// user expects (reload, zoom, fullscreen, devtools in dev, About), instead of
// Electron's bare default menu.
const { app, Menu } = require("electron");

function buildMenu({ isDev, shell, dialog, getMainWindow, getUpdater }) {
  const isMac = process.platform === "darwin";
  // Null in dev — the items stay, they just explain there's nothing to update.
  const checkForUpdates = {
    label: "Check for Updates…",
    click: () => {
      const updater = getUpdater();
      if (updater) updater.checkInteractive();
      else dialog.showMessageBox({ type: "info", message: "Updates are disabled in development builds." });
    },
  };

  const template = [
    ...(isMac
      ? [{
          label: "riff.quest",
          submenu: [
            { role: "about" },
            checkForUpdates,
            { type: "separator" },
            { role: "services" },
            { type: "separator" },
            { role: "hide" },
            { role: "hideOthers" },
            { role: "unhide" },
            { type: "separator" },
            { role: "quit" },
          ],
        }]
      : []),
    {
      label: "Edit",
      submenu: [
        { role: "undo", label: "Undo" },
        { role: "redo", label: "Redo" },
        { type: "separator" },
        { role: "cut", label: "Cut" },
        { role: "copy", label: "Copy" },
        { role: "paste", label: "Paste" },
        { role: "selectAll", label: "Select All" },
      ],
    },
    {
      label: "View",
      submenu: [
        { role: "reload", label: "Reload" },
        { role: "forceReload", label: "Force Reload" },
        ...(isDev ? [{ role: "toggleDevTools", label: "Toggle Developer Tools" }] : []),
        { type: "separator" },
        { role: "resetZoom", label: "Actual Size" },
        { role: "zoomIn", label: "Zoom In" },
        { role: "zoomOut", label: "Zoom Out" },
        { type: "separator" },
        { role: "togglefullscreen", label: "Toggle Full Screen" },
      ],
    },
    {
      label: "Window",
      submenu: [
        { role: "minimize", label: "Minimize" },
        { role: "close", label: "Close" },
      ],
    },
    {
      label: "Help",
      submenu: [
        {
          label: "riff.quest Website",
          click: () => shell.openExternal("https://riff.quest"),
        },
        {
          label: "Report an Issue",
          click: () => shell.openExternal("https://github.com/CodeReactOrNext/CwiczymyRazem/issues"),
        },
        {
          // What support asks for when an update misbehaves.
          label: "Show Update Log",
          click: () => {
            const updater = getUpdater();
            if (updater) shell.showItemInFolder(updater.logPath);
          },
        },
        ...(isMac ? [] : [checkForUpdates]),
        ...(isMac
          ? []
          : [
              { type: "separator" },
              {
                label: "About",
                click: () => {
                  dialog.showMessageBox(getMainWindow(), {
                    type: "info",
                    title: "riff.quest",
                    message: "riff.quest",
                    detail: `Version ${app.getVersion()}`,
                  });
                },
              },
            ]),
      ],
    },
  ];

  return Menu.buildFromTemplate(template);
}

module.exports = buildMenu;
