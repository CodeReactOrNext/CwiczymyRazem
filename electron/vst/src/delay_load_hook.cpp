// The addon links against an import library for "node.exe" (generated from
// node-api-headers' node_api.def). Inside Electron the Node-API symbols live in
// electron.exe instead, so resolve that DLL name to whatever executable loaded
// us — the same trick node-gyp's win_delay_load_hook.cc uses.
#include <windows.h>

#include <delayimp.h>
#include <string.h>

static FARPROC WINAPI loadExeHook (unsigned int event, DelayLoadInfo* info)
{
	if (event != dliNotePreLoadLibrary)
		return nullptr;
	if (_stricmp (info->szDll, "node.exe") != 0)
		return nullptr;
	return (FARPROC)GetModuleHandleW (nullptr);
}

extern "C" const PfnDliHook __pfnDliNotifyHook2 = loadExeHook;
