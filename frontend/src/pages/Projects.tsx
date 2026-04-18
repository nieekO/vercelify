import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { useProjects } from '../hooks/useProjects';
import { ProjectCard } from '../components/projects/ProjectCard';
import { Button } from '../components/ui/Button';
import { SkeletonCard } from '../components/ui/Skeleton';

export function Projects() {
  const { data: projects, isLoading } = useProjects();

  return (
    <div className="p-6 max-w-5xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold tracking-tight">Projects</h1>
        <Link to="/projects/new">
          <Button variant="primary" size="sm">
            <Plus size={14} /> New Project
          </Button>
        </Link>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1,2,3].map(i => <SkeletonCard key={i} />)}
        </div>
      ) : !projects?.length ? (
        <div className="text-center py-16 border border-[rgba(255,255,255,0.08)] rounded-[8px]">
          <p className="text-gray-500 text-sm mb-4">No projects yet</p>
          <Link to="/projects/new">
            <Button variant="primary" size="sm">
              <Plus size={14} /> Create your first project
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map(p => <ProjectCard key={p.id} project={p} />)}
        </div>
      )}
    </div>
  );
}
