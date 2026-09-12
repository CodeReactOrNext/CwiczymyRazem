#!/usr/bin/env bash
#
# worktree-init.sh
#
# Run automatically by AutoMaker's InitScriptService after it creates a new
# git worktree for this project. It is executed via Git Bash (see
# apps/server/src/services/init-script-service.ts in the AutoMaker repo) with
# the following environment variables provided by AutoMaker:
#
#   AUTOMAKER_PROJECT_PATH  - absolute path to the main project checkout
#   AUTOMAKER_WORKTREE_PATH - absolute path to the newly created worktree
#   AUTOMAKER_BRANCH        - branch name for the worktree
#
# Purpose: copy untracked-but-required local files (env files, credentials)
# from the main checkout into the new worktree, then install dependencies.
#
# This script is purely a setup/init step - it does not run or orchestrate
# any pipeline/agent logic. Pipeline execution for this project is handled by
# a separate orchestrator process.

set -euo pipefail

SRC="${AUTOMAKER_PROJECT_PATH:?AUTOMAKER_PROJECT_PATH not set}"
DEST="${AUTOMAKER_WORKTREE_PATH:?AUTOMAKER_WORKTREE_PATH not set}"

# Untracked-but-required files identified from this repo's .gitignore
# (`.env*.local`, `.env.sentry-build-plugin`) plus a check of process.env
# usage for out-of-band credential files. Firebase Admin credentials are
# read from the FIREBASE_SERVICE_ACCOUNT_JSON env var (see
# src/utils/firebase/api/firebase.config.ts), which lives inline in
# .env.development.local - there is no separate service-account JSON file
# on disk, so only env files need to be copied.
FILES_TO_COPY=(
  ".env.local"
  ".env.development.local"
  ".env.production.local"
  ".env.test.local"
  ".env.sentry-build-plugin"
)

copy_if_exists() {
  local rel="$1"
  local src_file="$SRC/$rel"
  local dest_file="$DEST/$rel"

  if [ -f "$src_file" ]; then
    mkdir -p "$(dirname "$dest_file")"
    cp "$src_file" "$dest_file"
    echo "[worktree-init] Copied $rel"
  else
    echo "[worktree-init] Skipping $rel (not found in source project)"
  fi
}

echo "[worktree-init] Copying untracked local files from $SRC to $DEST ..."
for rel in "${FILES_TO_COPY[@]}"; do
  copy_if_exists "$rel"
done

echo "[worktree-init] Installing dependencies in worktree ($DEST) ..."
cd "$DEST"
npm install

echo "[worktree-init] Done."
