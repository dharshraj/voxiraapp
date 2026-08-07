const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Exclude the .claude worktrees folder entirely.
// Without this, Metro watches the worktree's duplicate source files
// and may resolve imports from the old cached copies there instead
// of the actual src/ files.
config.watchFolders = [__dirname];

config.resolver.blockList = [
  // Block everything inside .claude/worktrees
  new RegExp(
    path.resolve(__dirname, '.claude').replace(/\\/g, '\\\\') + '.*'
  ),
];

module.exports = config;
