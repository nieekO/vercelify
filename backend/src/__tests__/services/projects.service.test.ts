import fs from 'fs';
import path from 'path';

jest.mock('fs');

const mockedFs = jest.mocked(fs);

import {
  readProjects, writeProjects, findProject, saveProject, deleteProject,
} from '../../services/projects.service';
import { VercelifyProject } from '../../types';

const DATA_PATH = process.env.DATA_PATH!;
const DATA_DIR = path.dirname(DATA_PATH);

const PROJECT_A: VercelifyProject = {
  id: 'uuid-a', name: 'alpha', environment: 'production', createdAt: '2024-01-01T00:00:00Z',
  coolifyProjectUuid: 'cp-a', appServiceUuid: 'as-a', supabaseServiceUuid: 'ss-a',
  appUrl: 'http://a.test', supabaseStudioUrl: 'http://studio-a.test', supabaseAnonKey: 'anon-a',
  gitRepo: 'user/alpha', gitBranch: 'main', buildCommand: 'npm run build',
  outputDir: 'dist', port: 3000, supabaseSchemas: ['alpha'],
};

const PROJECT_B: VercelifyProject = {
  ...PROJECT_A, id: 'uuid-b', name: 'beta', appServiceUuid: 'as-b',
};

beforeEach(() => {
  mockedFs.existsSync.mockReturnValue(true);
  mockedFs.mkdirSync.mockImplementation(() => undefined);
  mockedFs.readFileSync.mockReturnValue(JSON.stringify([PROJECT_A, PROJECT_B]) as never);
  mockedFs.writeFileSync.mockImplementation(() => undefined);
});

describe('projects.service', () => {
  describe('readProjects', () => {
    it('returns empty array when data file does not exist', () => {
      mockedFs.existsSync
        .mockReturnValueOnce(true)   // dir exists
        .mockReturnValueOnce(false); // file does not exist
      const result = readProjects();
      expect(result).toEqual([]);
    });

    it('returns parsed projects when file exists', () => {
      const result = readProjects();
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('uuid-a');
    });

    it('creates data directory if it does not exist', () => {
      mockedFs.existsSync.mockReturnValueOnce(false); // dir does not exist
      readProjects();
      expect(mockedFs.mkdirSync).toHaveBeenCalledWith(DATA_DIR, { recursive: true });
    });
  });

  describe('writeProjects', () => {
    it('writes projects as formatted JSON', () => {
      writeProjects([PROJECT_A]);
      expect(mockedFs.writeFileSync).toHaveBeenCalledWith(
        DATA_PATH,
        JSON.stringify([PROJECT_A], null, 2),
      );
    });
  });

  describe('findProject', () => {
    it('returns the project with matching id', () => {
      const result = findProject('uuid-a');
      expect(result).toEqual(PROJECT_A);
    });

    it('returns undefined when id does not match', () => {
      const result = findProject('nonexistent');
      expect(result).toBeUndefined();
    });
  });

  describe('saveProject', () => {
    it('appends a new project to the list', () => {
      const newProject = { ...PROJECT_A, id: 'uuid-c', name: 'gamma' };
      saveProject(newProject);
      const written = JSON.parse((mockedFs.writeFileSync as jest.Mock).mock.calls[0][1]);
      expect(written).toHaveLength(3);
      expect(written[2].id).toBe('uuid-c');
    });

    it('updates an existing project in the list', () => {
      const updated = { ...PROJECT_A, name: 'alpha-updated' };
      saveProject(updated);
      const written = JSON.parse((mockedFs.writeFileSync as jest.Mock).mock.calls[0][1]);
      expect(written[0].name).toBe('alpha-updated');
      expect(written).toHaveLength(2);
    });
  });

  describe('deleteProject', () => {
    it('removes the project with matching id and returns true', () => {
      const result = deleteProject('uuid-a');
      expect(result).toBe(true);
      const written = JSON.parse((mockedFs.writeFileSync as jest.Mock).mock.calls[0][1]);
      expect(written).toHaveLength(1);
      expect(written[0].id).toBe('uuid-b');
    });

    it('returns false when project id not found', () => {
      const result = deleteProject('nonexistent');
      expect(result).toBe(false);
      expect(mockedFs.writeFileSync).not.toHaveBeenCalled();
    });
  });

  describe('DATA_PATH env variable', () => {
    it('uses DATA_PATH env variable when set', () => {
      const original = process.env.DATA_PATH;
      process.env.DATA_PATH = '/custom/path/data.json';
      mockedFs.existsSync.mockReturnValue(false);
      readProjects();
      expect(mockedFs.mkdirSync).toHaveBeenCalledWith('/custom/path', { recursive: true });
      process.env.DATA_PATH = original;
    });
  });
});
