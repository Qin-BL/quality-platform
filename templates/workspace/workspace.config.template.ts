import type { DevWorkspaceConfig } from '../../packages/devflow/workspace-config';

const config: DevWorkspaceConfig = {
  workspaceKey: '__WORKSPACE_KEY__',
  displayName: '__WORKSPACE_DISPLAY_NAME__',
  description: '__WORKSPACE_DESCRIPTION__',
  frameworkRepoKey: 'quality-platform',
  // Add repo entries with base branches, commands, qualityGates, and deployTargets.
  repos: [],
};

export default config;
