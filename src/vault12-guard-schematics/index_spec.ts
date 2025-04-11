import { Tree } from '@angular-devkit/schematics';
import { SchematicTestRunner } from '@angular-devkit/schematics/testing';
import * as path from 'path';

const collectionPath = path.join(__dirname, '../collection.json');

describe('vault12-guard-schematics', () => {
  it('works', async () => {
    const runner = new SchematicTestRunner('schematics', collectionPath);
    const tree = await runner.runSchematic('vault12-guard-schematics', {}, Tree.empty());

    expect(tree.files).toEqual([]);
  });
});

describe('migration schematic', () => {
  it('should create migration files with correct version', async () => {
    const runner = new SchematicTestRunner('schematics', collectionPath);
    const tree = Tree.empty();
    
    // Create mock app state file with exact format matching the regex
    tree.create('./src/app/state/app/app.state.ts', `
      import { State } from '@ngxs/store';
      
      @State<AppStateModel>({
        name: 'app',
        defaults: { version: 5 }
      })
      export class AppState {}
    `);

    const resultTree = await runner.runSchematic('migration', { migrationName: 'test' }, tree);
    
    // Should create both migration files
    expect(resultTree.exists('./src/app/migrations/restore-file/6.test.ts')).toBe(true);
    expect(resultTree.exists('./src/app/migrations/state/app/6.test.ts')).toBe(true);

    // Check content of the files
    const restoreContent = resultTree.readText('./src/app/migrations/restore-file/6.test.ts');
    expect(restoreContent).toContain('export function testMigration');
    expect(restoreContent).toContain('version: 6');

    const stateContent = resultTree.readText('./src/app/migrations/state/app/6.test.ts');
    expect(stateContent).toContain('export function testMigration');
    expect(stateContent).toContain('version: 6');
  });
});
