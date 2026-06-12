#!/bin/bash
set -e

BRANCH_NAME=$1

if [ -z "$BRANCH_NAME" ]; then
    echo "Error: Please provide a branch name."
    echo "Usage: ./dev/delete-worktree.sh feat-xyz"
    exit 1
fi

MAIN_DIR="$PWD"
REPO_NAME=$(basename "$PWD")
TARGET_DIR="../${REPO_NAME}_${BRANCH_NAME}"

if [ ! -d "$TARGET_DIR" ]; then
    echo "Error: Worktree directory $TARGET_DIR does not exist."
    exit 1
fi

echo "Stopping docker compose services in $TARGET_DIR"
cd "$TARGET_DIR"
docker compose --profile dev down

if [ -d dev/data ]; then
    # containers write into the dev/data bind mounts as root/911, the host user
    # cannot delete those files, so delete them from inside a container
    echo "Removing container-owned data in dev/data"
    docker run --rm -v "$(realpath dev/data):/data" alpine sh -c 'rm -rf /data/* /data/..?* /data/.[!.]*'
fi

echo "Removing git worktree at $TARGET_DIR"
cd "$MAIN_DIR"
# --force because dev worktrees always contain untracked files (.env, node_modules, logs)
git worktree remove --force "$TARGET_DIR"

echo "-----------------------------------------------"
echo "✅ Worktree $BRANCH_NAME deleted!"
echo "-----------------------------------------------"
