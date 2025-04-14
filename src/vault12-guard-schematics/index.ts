import { Rule, SchematicContext, Tree } from '@angular-devkit/schematics';

interface MigrationOptions {
  migrationName: string;
}

function getStateVersion(tree: Tree): number {
  const statePath = './src/app/state/app/app.state.ts';
  if (!tree.exists(statePath)) {
    throw new Error('App state file not found at: ' + statePath);
  }

  const content = tree.read(statePath)?.toString() || '';
  const versionMatch = content.match(/@State[^{]*{[^}]*defaults\s*:\s*{[^}]*version\s*:\s*(\d+)/);

  if (!versionMatch) {
    throw new Error('Could not find version in app.state.ts');
  }

  return parseInt(versionMatch[1], 10);
}

function updateStateVersion(tree: Tree, version: number): void {
  const statePath = './src/app/state/app/app.state.ts';
  const content = tree.read(statePath)?.toString() || '';

  // Replace the version number while preserving whitespace
  const updatedContent = content.replace(/(defaults\s*:\s*{\s*version\s*:\s*)\d+/, `$1${version}`);

  tree.overwrite(statePath, updatedContent);
}

function updateRestoreFileMigrationsIndex(tree: Tree, camelCaseName: string, fileName: string): void {
  const indexPath = './src/app/migrations/restore-file/index.ts';

  const content = tree.read(indexPath)!.toString();

  const importStatement = `import { ${camelCaseName}Migration } from './${fileName}';\n`;

  // Split content after the last import statement
  const lastImportMatch = content.match(/^import.*?\n/gm);
  const lastImportIndex = lastImportMatch
    ? content.lastIndexOf(lastImportMatch[lastImportMatch.length - 1]) +
      lastImportMatch[lastImportMatch.length - 1].length
    : 0;

  const imports = content.substring(0, lastImportIndex);
  const rest = content.substring(lastImportIndex);

  // Add migration to array
  const updatedContent =
    imports +
    importStatement +
    rest.replace(
      /(RestoreFileMigrations\s*:\s*Migration<RestoreFile>\[\]\s*=\s*\[[\s\S]*?)(\];)/,
      `$1  ${camelCaseName}Migration,\n$2`
    );

  tree.overwrite(indexPath, updatedContent);
}

function updateAppStateMigrationsIndex(tree: Tree, camelCaseName: string, fileName: string): void {
  const indexPath = './src/app/migrations/state/app/index.ts';
  const content = tree.read(indexPath)!.toString();

  const importStatement = `import { ${camelCaseName}Migration } from './${fileName}';\n`;

  // Split content after the last import statement
  const lastImportMatch = content.match(/^import.*?\n/gm);
  const lastImportIndex = lastImportMatch
    ? content.lastIndexOf(lastImportMatch[lastImportMatch.length - 1]) +
      lastImportMatch[lastImportMatch.length - 1].length
    : 0;

  const imports = content.substring(0, lastImportIndex);
  const rest = content.substring(lastImportIndex);

  // Add migration to array
  const updatedContent =
    imports +
    importStatement +
    rest.replace(
      /(appStateMigrations\s*:\s*AppMigration\[\]\s*=\s*\[[\s\S]*?)(\];)/,
      `$1  ${camelCaseName}Migration,\n$2`
    );

  tree.overwrite(indexPath, updatedContent);
}

function makeAppMigrationContent(version: number, nextVersion: number, name: string) {
  return `import { AppStateModel } from '@app/state/app/app-state.model';
import { AppMigration } from './app-migration.model';

export const ${name}Migration = {
  version: ${version},
  nextVersion: ${nextVersion},
  migrate: (state: AppStateModel) => {
    // TODO: Implement migration logic
    return state;
  }
} as AppMigration;
`;
}

function makeRestoreFileMigrationContent(version: number, nextVersion: number, name: string) {
  return `import { Migration } from '../migrator/migrator';
import { RestoreFile } from '../../features/restore/owner/restore-file/restore-file.model';

export const ${name}Migration: Migration<RestoreFile> = {
  version: ${version},
  nextVersion: ${nextVersion},
  migrate: (data) => {
    // TODO: Implement migration logic
    return data;
  }
};
`;
}

function kebabToCamelCase(str: string): string {
  return str.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
}

export function createMigration(options: MigrationOptions): Rule {
  return (tree: Tree, _context: SchematicContext) => {
    const currentVersion = getStateVersion(tree);
    const nextVersion = currentVersion + 1;
    const camelCaseName = kebabToCamelCase(options.migrationName);
    const fileName = `${nextVersion}.${options.migrationName}`;

    const restoreFileMigraition = makeRestoreFileMigrationContent(currentVersion, nextVersion, camelCaseName);
    tree.create(`./src/app/migrations/restore-file/${fileName}.ts`, restoreFileMigraition);

    const appMigrationContent = makeAppMigrationContent(currentVersion, nextVersion, camelCaseName);
    tree.create(`./src/app/migrations/state/app/${fileName}.ts`, appMigrationContent);

    // Update the version in app.state.ts
    updateStateVersion(tree, nextVersion);

    // Update migration indices
    updateRestoreFileMigrationsIndex(tree, camelCaseName, fileName);
    updateAppStateMigrationsIndex(tree, camelCaseName, fileName);

    return tree;
  };
}
