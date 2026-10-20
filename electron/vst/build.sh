#!/bin/sh
# Builds electron/vst/bin/darwin-arm64/vsthost.node — the macOS twin of build.bat
# (Node-API, works in any Electron version without a rebuild). The binary is
# committed like the Windows one, so release CI never needs a C++ toolchain;
# rerun this after editing src/.
#
# Needs: Xcode command line tools (clang), git, and
# node_modules/node-api-headers (npm i --no-save node-api-headers@1.9.0).
set -e
HERE=$(cd "$(dirname "$0")" && pwd)
SDK="$HERE/third_party/vst3sdk"
SDK_COMMIT=3cdf9ca5d1f5b1b21e0a86832aa4abe55607bd96
NAPI="$HERE/../../node_modules/node-api-headers"

if [ ! -d "$SDK/pluginterfaces/base" ]; then
  echo "Fetching VST3 SDK (MIT) at $SDK_COMMIT..."
  rm -rf "$SDK"
  git clone https://github.com/steinbergmedia/vst3sdk.git "$SDK"
  git -C "$SDK" checkout "$SDK_COMMIT"
  git -C "$SDK" submodule update --init --depth 1 base pluginterfaces public.sdk
fi

if [ ! -f "$NAPI/include/node_api.h" ]; then
  echo "node-api-headers missing: npm i --no-save node-api-headers@1.9.0"
  exit 1
fi

OBJ="$HERE/build/obj-darwin-arm64"
OUT="$HERE/bin/darwin-arm64"
mkdir -p "$OBJ" "$OUT"

# Electron 42 needs macOS 12+. arm64 only, like the app (electron-builder.yml).
FLAGS="-arch arm64 -mmacosx-version-min=12.0 -O2 -DRELEASE=1 -DNDEBUG \
  -DNODE_GYP_MODULE_NAME=vsthost -DNAPI_VERSION=8 -I$SDK -I$NAPI/include"

CPP_SRC="
  $SDK/pluginterfaces/base/conststringtable.cpp
  $SDK/pluginterfaces/base/coreiids.cpp
  $SDK/pluginterfaces/base/funknown.cpp
  $SDK/pluginterfaces/base/ustring.cpp
  $SDK/base/source/baseiids.cpp
  $SDK/base/source/fbuffer.cpp
  $SDK/base/source/fdebug.cpp
  $SDK/base/source/fdynlib.cpp
  $SDK/base/source/fobject.cpp
  $SDK/base/source/fstreamer.cpp
  $SDK/base/source/fstring.cpp
  $SDK/base/source/timer.cpp
  $SDK/base/source/updatehandler.cpp
  $SDK/base/thread/source/fcondition.cpp
  $SDK/base/thread/source/flock.cpp
  $SDK/public.sdk/source/common/commoniids.cpp
  $SDK/public.sdk/source/common/commonstringconvert.cpp
  $SDK/public.sdk/source/common/memorystream.cpp
  $SDK/public.sdk/source/vst/vstinitiids.cpp
  $SDK/public.sdk/source/vst/utility/stringconvert.cpp
  $SDK/public.sdk/source/vst/hosting/connectionproxy.cpp
  $SDK/public.sdk/source/vst/hosting/eventlist.cpp
  $SDK/public.sdk/source/vst/hosting/hostclasses.cpp
  $SDK/public.sdk/source/vst/hosting/module.cpp
  $SDK/public.sdk/source/vst/hosting/parameterchanges.cpp
  $SDK/public.sdk/source/vst/hosting/pluginterfacesupport.cpp
  $SDK/public.sdk/source/vst/hosting/plugprovider.cpp
  $SDK/public.sdk/source/vst/hosting/processdata.cpp"

# Objective-C++ with ARC: the SDK's mac files require it, and vsthost.cpp holds
# the Cocoa editor windows + main-queue dispatch behind #ifdef __APPLE__.
OBJC_SRC="
  $HERE/src/vsthost.cpp
  $SDK/public.sdk/source/common/threadchecker_mac.mm
  $SDK/public.sdk/source/vst/hosting/module_mac.mm"

OBJS=""
for f in $CPP_SRC; do
  o="$OBJ/$(basename "$f").o"
  clang++ -std=c++17 $FLAGS -w -c "$f" -o "$o" &
  OBJS="$OBJS $o"
done
for f in $OBJC_SRC; do
  o="$OBJ/$(basename "$f").o"
  clang++ -std=c++17 -x objective-c++ -fobjc-arc $FLAGS -c "$f" -o "$o" &
  OBJS="$OBJS $o"
done
wait
for o in $OBJS; do [ -f "$o" ] || { echo "compile failed: $o"; exit 1; }; done

# -undefined dynamic_lookup: the napi_* symbols come from the Electron binary
# that loads the addon (the standard way Node addons link on macOS).
clang++ -arch arm64 -mmacosx-version-min=12.0 -bundle -undefined dynamic_lookup \
  -framework Cocoa -framework CoreFoundation \
  $OBJS -o "$OUT/vsthost.node"
strip -x "$OUT/vsthost.node"
# Ad-hoc: Apple Silicon refuses to load an unsigned binary at all.
# electron-builder re-signs it with the app at packaging time.
codesign --force --sign - "$OUT/vsthost.node"
echo "Built $OUT/vsthost.node"
