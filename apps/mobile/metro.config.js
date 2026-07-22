// Metro config ajustado para monorepo pnpm.
// Observa a raiz do repositório e resolve node_modules da raiz + do app.
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// 1. Observar toda a árvore do monorepo (para hot-reload de @irts/shared).
config.watchFolders = [workspaceRoot];

// 2. Resolver módulos primeiro no app, depois na raiz do workspace.
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];

// 3. Impedir que dependências duplicadas quebrem o bundling (pnpm hoisted).
config.resolver.disableHierarchicalLookup = true;

module.exports = config;
