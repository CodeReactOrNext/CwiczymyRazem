@echo off
rem Builds electron\vst\bin\win32-x64\vsthost.node (Node-API, works in any Electron
rem version without a rebuild). The binary is committed like electron\nam\nam.wasm,
rem so release CI never needs a C++ toolchain; rerun this after editing src\.
rem
rem Needs: MSVC (VS 2017+ "Desktop development with C++"), git, and
rem node_modules\node-api-headers (npm i --no-save node-api-headers@1.9.0).
setlocal
set HERE=%~dp0
set SDK=%HERE%third_party\vst3sdk
set SDK_COMMIT=3cdf9ca5d1f5b1b21e0a86832aa4abe55607bd96
set NAPI=%HERE%..\..\node_modules\node-api-headers

if exist "%SDK%\pluginterfaces\base" goto :haveSdk
echo Fetching VST3 SDK (MIT) at %SDK_COMMIT%...
git clone https://github.com/steinbergmedia/vst3sdk.git "%SDK%" || exit /b 1
git -C "%SDK%" checkout %SDK_COMMIT% || exit /b 1
git -C "%SDK%" submodule update --init --depth 1 base pluginterfaces public.sdk || exit /b 1
:haveSdk

if exist "%NAPI%\include\node_api.h" goto :haveNapi
echo node-api-headers missing: npm i --no-save node-api-headers@1.9.0
exit /b 1
:haveNapi

if not "%VCToolsInstallDir%"=="" goto :haveVc
set "VSWHERE=%ProgramFiles(x86)%\Microsoft Visual Studio\Installer\vswhere.exe"
for /f "usebackq tokens=*" %%i in (`"%VSWHERE%" -latest -products * -requires Microsoft.VisualStudio.Component.VC.Tools.x86.x64 -property installationPath`) do set "VSPATH=%%i"
call "%VSPATH%\VC\Auxiliary\Build\vcvars64.bat" >nul || exit /b 1
:haveVc

set OBJ=%HERE%build\obj
set OUT=%HERE%bin\win32-x64
if not exist "%OBJ%" mkdir "%OBJ%"
if not exist "%OUT%" mkdir "%OUT%"

lib /nologo /def:"%NAPI%\def\node_api.def" /out:"%OBJ%\node.lib" /machine:x64 || exit /b 1

set SRC=^
 "%HERE%src\vsthost.cpp"^
 "%HERE%src\delay_load_hook.cpp"^
 "%SDK%\pluginterfaces\base\conststringtable.cpp"^
 "%SDK%\pluginterfaces\base\coreiids.cpp"^
 "%SDK%\pluginterfaces\base\funknown.cpp"^
 "%SDK%\pluginterfaces\base\ustring.cpp"^
 "%SDK%\base\source\baseiids.cpp"^
 "%SDK%\base\source\fbuffer.cpp"^
 "%SDK%\base\source\fdebug.cpp"^
 "%SDK%\base\source\fdynlib.cpp"^
 "%SDK%\base\source\fobject.cpp"^
 "%SDK%\base\source\fstreamer.cpp"^
 "%SDK%\base\source\fstring.cpp"^
 "%SDK%\base\source\timer.cpp"^
 "%SDK%\base\source\updatehandler.cpp"^
 "%SDK%\base\thread\source\fcondition.cpp"^
 "%SDK%\base\thread\source\flock.cpp"^
 "%SDK%\public.sdk\source\common\commoniids.cpp"^
 "%SDK%\public.sdk\source\common\commonstringconvert.cpp"^
 "%SDK%\public.sdk\source\common\memorystream.cpp"^
 "%SDK%\public.sdk\source\common\threadchecker_win32.cpp"^
 "%SDK%\public.sdk\source\vst\vstinitiids.cpp"^
 "%SDK%\public.sdk\source\vst\utility\stringconvert.cpp"^
 "%SDK%\public.sdk\source\vst\hosting\connectionproxy.cpp"^
 "%SDK%\public.sdk\source\vst\hosting\eventlist.cpp"^
 "%SDK%\public.sdk\source\vst\hosting\hostclasses.cpp"^
 "%SDK%\public.sdk\source\vst\hosting\module.cpp"^
 "%SDK%\public.sdk\source\vst\hosting\module_win32.cpp"^
 "%SDK%\public.sdk\source\vst\hosting\parameterchanges.cpp"^
 "%SDK%\public.sdk\source\vst\hosting\pluginterfacesupport.cpp"^
 "%SDK%\public.sdk\source\vst\hosting\plugprovider.cpp"^
 "%SDK%\public.sdk\source\vst\hosting\processdata.cpp"

rem /MT: static CRT, so the .node has no VC++ redistributable dependency.
cl /nologo /std:c++17 /EHsc /O2 /MT /W1 /MP /LD ^
  /DRELEASE=1 /DNDEBUG /DUNICODE /D_UNICODE /DNOMINMAX /D_WIN32_WINNT=0x0A00 ^
  /DNODE_GYP_MODULE_NAME=vsthost /DNAPI_VERSION=8 ^
  /I"%SDK%" /I"%NAPI%\include" /Fo"%OBJ%\\" /Fe"%OUT%\vsthost.node" ^
  %SRC% ^
  /link /DLL /DELAYLOAD:node.exe "%OBJ%\node.lib" delayimp.lib ^
  ole32.lib shell32.lib user32.lib gdi32.lib || exit /b 1

del "%OUT%\vsthost.exp" "%OUT%\vsthost.lib" 2>nul
echo Built %OUT%\vsthost.node
