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
  // Updated regex to be more lenient with whitespace and other content
  const versionMatch = content.match(/@State[^{]*{[^}]*defaults\s*:\s*{[^}]*version\s*:\s*(\d+)/);
  
  if (!versionMatch) {
    throw new Error('Could not find version in app.state.ts');
  }

  return parseInt(versionMatch[1], 10);
}

function createMigrationFile(tree: Tree, path: string, version: number, name: string) {
  const content = `import { StateContext } from '@ngxs/store';
import { AppStateModel } from '../../state/app/app.state';

export function ${name}Migration(ctx: StateContext<AppStateModel>) {
  const state = ctx.getState();
  
  // TODO: Implement migration logic
  
  ctx.setState({
    ...state,
    version: ${version}
  });
}`;

  tree.create(path, content);
}

export function createMigration(options: MigrationOptions): Rule {
  return (tree: Tree, _context: SchematicContext) => {
    const currentVersion = getStateVersion(tree);
    const nextVersion = currentVersion + 1;
    const fileName = `${nextVersion}.${options.migrationName}.ts`;

    // Create restore-file migration
    createMigrationFile(
      tree,
      `./src/app/migrations/restore-file/${fileName}`,
      nextVersion,
      options.migrationName
    );

    // Create state/app migration
    createMigrationFile(
      tree,
      `./src/app/migrations/state/app/${fileName}`,
      nextVersion,
      options.migrationName
    );

    return tree;
  };
}

export function vault12GuardSchematics(_options: any): Rule {
  return (tree: Tree, _context: SchematicContext) => {
    return tree;
  };
}
