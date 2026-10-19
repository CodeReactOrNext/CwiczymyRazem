// Throwaway utilityProcess that loads plugin files to read what's inside them.
// Scanning means running every plugin's DllMain and factory, and plugins do
// anything in there: unlicensed Neural DSP Archetypes fail DllMain, some call
// exit() outright, some hang on a licence dialog nobody can see. None of that
// may touch the audio engine, so ./vstScanner runs this one path at a time with
// a timeout and simply respawns it after a casualty.
const { createRpcServer } = require("../workerRpc");
const { load } = require("./vstAddon");

const { addon, error } = load();

createRpcServer(process.parentPort, {
  listPaths() {
    if (!addon) throw new Error(error);
    return addon.getModulePaths();
  },
  scan(modulePath) {
    if (!addon) throw new Error(error);
    return addon.scanModule(modulePath);
  },
});
