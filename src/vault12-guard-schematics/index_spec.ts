import { Tree } from '@angular-devkit/schematics';
import { SchematicTestRunner } from '@angular-devkit/schematics/testing';
import * as path from 'path';

const collectionPath = path.join(__dirname, '../collection.json');

describe('ngxs-migration schematic', () => {
  it('should create migration files, update state version, and update index', async () => {
    const runner = new SchematicTestRunner('schematics', collectionPath);
    const tree = Tree.empty();
    
    // Create mock app state file
    const initialState = `
      import { State } from '@ngxs/store';
      
      @State<AppStateModel>({
        name: 'app',
        defaults: { version: 5 }
      })
      export class AppState {}
    `;
    tree.create('./src/app/state/app/app.state.ts', initialState);

    // Create initial restore file migrations index
    const restoreFileIndex = `import { Migration } from '../migrator/migrator';
import { RestoreFile } from '../../features/restore/owner/restore-file/restore-file.model';

export const RestoreFileMigrations: Migration<RestoreFile>[] = [
  // existing migrations
];`;
    tree.create('./src/app/migrations/restore-file/index.ts', restoreFileIndex);

    const appStateFileIndex = `import { AppMigration } from './app-migration.model';

export const appStateMigrations: AppMigration[] = [
  // existing migrations
];`;
    tree.create('./src/app/migrations/state/app/index.ts', appStateFileIndex);

    const resultTree = await runner.runSchematic('ngxs-migration', { migrationName: 'test-migration' }, tree);
    
    // Should create both migration files
    expect(resultTree.exists('./src/app/migrations/restore-file/6.test-migration.ts')).toBe(true);
    expect(resultTree.exists('./src/app/migrations/state/app/6.test-migration.ts')).toBe(true);

    // Check migration file contents
    const restoreContent = resultTree.readText('./src/app/migrations/restore-file/6.test-migration.ts');
    expect(restoreContent).toContain('version: 5');
    expect(restoreContent).toContain('nextVersion: 6');

    const stateContent = resultTree.readText('./src/app/migrations/state/app/6.test-migration.ts');
    expect(stateContent).toContain('version: 5');
    expect(stateContent).toContain('nextVersion: 6');

    // Verify state version was updated
    const updatedStateContent = resultTree.readText('./src/app/state/app/app.state.ts');
    expect(updatedStateContent).toContain('defaults: { version: 6 }');

    // Verify restore file migrations index was updated
    const updatedIndex = resultTree.readText('./src/app/migrations/restore-file/index.ts');
    expect(updatedIndex).toContain("import { TestMigration } from './6.test-migration';");
    expect(updatedIndex).toContain('RestoreFileMigrations: Migration<RestoreFile>[] = [');
    expect(updatedIndex).toContain('TestMigration');

    // Verify app state migrations index was updated
    const updatedAppStateIndex = resultTree.readText('./src/app/migrations/state/app/index.ts');
    expect(updatedAppStateIndex).toContain("import { TestMigration } from './6.test-migration';");
    expect(updatedAppStateIndex).toContain('appStateMigrations: AppMigration[] = [');
    expect(updatedAppStateIndex).toContain('TestMigration');
  });
});
