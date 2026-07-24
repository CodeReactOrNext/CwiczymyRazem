// Native application menu — gives the wrapped web app the chrome a desktop
// user expects (reload, zoom, fullscreen, devtools in dev, About), instead of
// Electron's bare default menu.
const { app, Menu } = require("electron");

function buildMenu({ isDev, shell, dialog, getMainWindow }) {
  const isMac = process.platform === "darwin";

  const template = [
    ...(isMac
      ? [{
          label: "riff.quest",
          submenu: [
            { role: "about" },
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
      label: "Edytuj",
      submenu: [
        { role: "undo", label: "Cofnij" },
        { role: "redo", label: "Ponów" },
        { type: "separator" },
        { role: "cut", label: "Wytnij" },
        { role: "copy", label: "Kopiuj" },
        { role: "paste", label: "Wklej" },
        { role: "selectAll", label: "Zaznacz wszystko" },
      ],
    },
    {
      label: "Widok",
      submenu: [
        { role: "reload", label: "Odśwież" },
        { role: "forceReload", label: "Wymuś odświeżenie" },
        ...(isDev ? [{ role: "toggleDevTools", label: "Narzędzia deweloperskie" }] : []),
        { type: "separator" },
        { role: "resetZoom", label: "Domyślny rozmiar" },
        { role: "zoomIn", label: "Powiększ" },
        { role: "zoomOut", label: "Pomniejsz" },
        { type: "separator" },
        { role: "togglefullscreen", label: "Pełny ekran" },
      ],
    },
    {
      label: "Okno",
      submenu: [
        { role: "minimize", label: "Minimalizuj" },
        { role: "close", label: "Zamknij" },
      ],
    },
    {
      label: "Pomoc",
      submenu: [
        {
          label: "Strona riff.quest",
          click: () => shell.openExternal("https://riff.quest"),
        },
        {
          label: "Zgłoś problem",
          click: () => shell.openExternal("https://github.com/CodeReactOrNext/CwiczymyRazem/issues"),
        },
        ...(isMac
          ? []
          : [
              { type: "separator" },
              {
                label: "O aplikacji",
                click: () => {
                  dialog.showMessageBox(getMainWindow(), {
                    type: "info",
                    title: "riff.quest",
                    message: "riff.quest",
                    detail: `Wersja ${app.getVersion()}`,
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
