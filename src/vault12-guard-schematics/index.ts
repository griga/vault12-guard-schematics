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
  const updatedContent = content.replace(
    /(defaults\s*:\s*{\s*version\s*:\s*)\d+/,
    `$1${version}`
  );
  
  tree.overwrite(statePath, updatedContent);
}

function updateRestoreFileMigrationsIndex(tree: Tree, nextVersion: number, migrationName: string): void {
  const indexPath = './src/app/migrations/restore-file/index.ts';
  if (!tree.exists(indexPath)) {
    // Create index file if it doesn't exist
    tree.create(indexPath, `import { Migration } from '../migrator/migrator';
import { RestoreFile } from '../../features/restore/owner/restore-file/restore-file.model';

export const RestoreFileMigrations: Migration<RestoreFile>[] = [];
`);
  }

  const content = tree.read(indexPath)?.toString() || '';
  
  // Add import statement at the top
  const importStatement = `import { ${migrationName}Migration } from './${nextVersion}.${migrationName}';\n`;
  
  // Split content to insert import before exports
  const [imports = '', rest = ''] = content.split(/^export/m);
  
  // Add migration to array
  const updatedContent = imports + importStatement + 'export' + rest.replace(
    /(RestoreFileMigrations\s*:\s*Migration<RestoreFile>\[\]\s*=\s*\[[\s\S]*?)(\];)/,
    `$1  ${migrationName}Migration,\n$2`
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

export function createMigration(options: MigrationOptions): Rule {
  return (tree: Tree, _context: SchematicContext) => {
    const currentVersion = getStateVersion(tree);
    const nextVersion = currentVersion + 1;
    const fileName = `${nextVersion}.${options.migrationName}.ts`;

    const restoreFileMigraition = makeRestoreFileMigrationContent(currentVersion, nextVersion, options.migrationName);
    tree.create(`./src/app/migrations/restore-file/${fileName}`, restoreFileMigraition);

    const appMigrationContent = makeAppMigrationContent(currentVersion, nextVersion, options.migrationName);
    tree.create(`./src/app/migrations/state/app/${fileName}`, appMigrationContent);

    // Update the version in app.state.ts
    updateStateVersion(tree, nextVersion);

    // Update restore file migrations index
    updateRestoreFileMigrationsIndex(tree, nextVersion, options.migrationName);

    return tree;
  };
}
