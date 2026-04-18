import fs from 'fs';
import path from 'path';
import { VercelifyProject } from '../types';

function getDataPath(): string {
  return path.resolve(process.env.DATA_PATH || './data/projects.json');
}

function ensureDataDir(): void {
  const dir = path.dirname(getDataPath());
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

export function readProjects(): VercelifyProject[] {
  ensureDataDir();
  const p = getDataPath();
  if (!fs.existsSync(p)) return [];
  return JSON.parse(fs.readFileSync(p, 'utf-8'));
}

export function writeProjects(projects: VercelifyProject[]): void {
  ensureDataDir();
  fs.writeFileSync(getDataPath(), JSON.stringify(projects, null, 2));
}

export function findProject(id: string): VercelifyProject | undefined {
  return readProjects().find(p => p.id === id);
}

export function saveProject(project: VercelifyProject): void {
  const projects = readProjects();
  const idx = projects.findIndex(p => p.id === project.id);
  if (idx >= 0) {
    projects[idx] = project;
  } else {
    projects.push(project);
  }
  writeProjects(projects);
}

export function deleteProject(id: string): boolean {
  const projects = readProjects();
  const idx = projects.findIndex(p => p.id === id);
  if (idx < 0) return false;
  projects.splice(idx, 1);
  writeProjects(projects);
  return true;
}
