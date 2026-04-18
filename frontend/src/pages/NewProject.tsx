import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Loader2, Circle, GitBranch } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Toggle } from '../components/ui/Toggle';

const STEPS = ['Repository', 'Configure', 'Deploy'];

interface DeployStatus {
  step: number;
  message: string;
}

const SUGGESTED_REPOS = ['WMCNiko/radar'];

export function NewProject() {
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);
  const [selectedRepo, setSelectedRepo] = useState('');
  const [form, setForm] = useState({
    name: '',
    environment: 'production' as 'production' | 'development',
    gitBranch: 'main',
    buildCommand: 'npm run build',
    outputDir: 'dist',
    port: 3000,
    createSupabase: true,
  });
  const [deployStatuses, setDeployStatuses] = useState<DeployStatus[]>([]);
  const [deployDone, setDeployDone] = useState(false);
  const [deployError, setDeployError] = useState('');
  const [deploying, setDeploying] = useState(false);

  const handleImport = (repo: string) => {
    setSelectedRepo(repo);
    setForm(f => ({ ...f, name: repo.split('/')[1] || repo }));
    setActiveStep(1);
  };

  const handleDeploy = async () => {
    setActiveStep(2);
    setDeploying(true);
    setDeployError('');
    setDeployStatuses([]);

    const token = localStorage.getItem('vercelify_token');
    const res = await fetch('/api/projects', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ ...form, gitRepo: selectedRepo }),
    });

    const reader = res.body!.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data:')) {
          const data = JSON.parse(line.slice(5).trim());
          if (data.message) {
            setDeployStatuses(s => [...s.filter(x => x.step !== data.step), { step: data.step, message: data.message }]);
          }
        }
        if (line.startsWith('event: done')) {
          setDeployDone(true);
          setDeploying(false);
        }
        if (line.startsWith('event: error')) {
          // error data on next line
        }
        if (line.startsWith('data:') && buffer === '') {
          try {
            const d = JSON.parse(line.slice(5));
            if (d.message && !d.step) {
              setDeployError(d.message);
              setDeploying(false);
            }
          } catch { /* ignore */ }
        }
      }
    }
    setDeploying(false);
  };

  return (
    <div className="p-6 max-w-2xl space-y-8">
      {/* Step indicator */}
      <div className="flex items-center gap-2">
        {STEPS.map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <div className={`flex items-center justify-center w-5 h-5 rounded-full text-xs font-medium ${
              i < activeStep ? 'bg-white text-black' : i === activeStep ? 'bg-gray-800 text-white border border-[rgba(255,255,255,0.3)]' : 'bg-gray-900 text-gray-600'
            }`}>
              {i < activeStep ? <Check size={10} /> : i + 1}
            </div>
            <span className={`text-sm ${i === activeStep ? 'text-white' : 'text-gray-500'}`}>{s}</span>
            {i < STEPS.length - 1 && <span className="text-gray-800 mx-1">/</span>}
          </div>
        ))}
      </div>

      {/* Step 1: Repository */}
      {activeStep === 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold tracking-tight">Import Git Repository</h2>
          <Input placeholder="Search repositories..." />
          <div className="border border-[rgba(255,255,255,0.08)] rounded-[8px] divide-y divide-[rgba(255,255,255,0.04)]">
            {SUGGESTED_REPOS.map(repo => (
              <div key={repo} className="flex items-center gap-3 px-4 py-3">
                <GitBranch size={14} className="text-gray-500 flex-shrink-0" />
                <span className="text-sm flex-1">{repo}</span>
                <span className="text-xs text-gray-500">main</span>
                <Button variant="primary" size="sm" onClick={() => handleImport(repo)}>
                  Import
                </Button>
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-600">Or enter manually:</p>
          <div className="flex gap-2">
            <Input
              placeholder="owner/repo-name"
              value={selectedRepo}
              onChange={e => setSelectedRepo(e.target.value)}
              className="flex-1"
            />
            <Button variant="primary" size="sm" onClick={() => handleImport(selectedRepo)} disabled={!selectedRepo}>
              Import
            </Button>
          </div>
        </div>
      )}

      {/* Step 2: Configure */}
      {activeStep === 1 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold tracking-tight">Configure Project</h2>
          <Input
            label="Project Name"
            value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
          />
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-gray-400 font-medium">Environment</label>
            <select
              className="bg-gray-950 border border-[rgba(255,255,255,0.08)] rounded-[6px] px-3 py-2 text-sm text-white focus:outline-none focus:border-[rgba(255,255,255,0.3)]"
              value={form.environment}
              onChange={e => setForm(f => ({ ...f, environment: e.target.value as 'production' | 'development' }))}
            >
              <option value="production">Production</option>
              <option value="development">Development</option>
            </select>
          </div>
          <Input
            label="Branch"
            value={form.gitBranch}
            onChange={e => setForm(f => ({ ...f, gitBranch: e.target.value }))}
          />
          <Input
            label="Build Command"
            value={form.buildCommand}
            onChange={e => setForm(f => ({ ...f, buildCommand: e.target.value }))}
          />
          <Input
            label="Output Directory"
            value={form.outputDir}
            onChange={e => setForm(f => ({ ...f, outputDir: e.target.value }))}
          />
          <Input
            label="Port"
            type="number"
            value={form.port}
            onChange={e => setForm(f => ({ ...f, port: parseInt(e.target.value) || 3000 }))}
          />

          <div className="border-t border-[rgba(255,255,255,0.08)] pt-4 space-y-2">
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Supabase (automatic)</p>
            <Toggle
              checked={form.createSupabase}
              onChange={v => setForm(f => ({ ...f, createSupabase: v }))}
              label="Create Supabase instance automatically"
            />
            {form.createSupabase && (
              <p className="text-xs text-gray-600">
                Name: {form.name || 'project'}-supabase-{form.environment} · Server: infra-01
              </p>
            )}
          </div>

          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={() => setActiveStep(0)}>Back</Button>
            <Button variant="primary" size="sm" onClick={handleDeploy} disabled={!form.name}>
              Deploy
            </Button>
          </div>
        </div>
      )}

      {/* Step 3: Deploy progress */}
      {activeStep === 2 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold tracking-tight">Deploying {form.name}...</h2>
          <div className="border border-[rgba(255,255,255,0.08)] rounded-[8px] p-4 space-y-3">
            {[
              { step: 1, label: 'Creating Coolify project' },
              { step: 2, label: 'Connecting GitHub repository' },
              { step: 3, label: form.createSupabase ? 'Deploying Supabase instance' : 'Skipping Supabase' },
              { step: 4, label: 'Configuring environment variables' },
              { step: 5, label: 'Starting app deployment' },
            ].map(({ step, label }) => {
              const status = deployStatuses.find(s => s.step === step);
              const isActive = deployStatuses.some(s => s.step === step);
              const isDone = deployDone || deployStatuses.some(s => s.step > step);
              return (
                <div key={step} className="flex items-start gap-3">
                  <div className="mt-0.5">
                    {isDone && step <= 5
                      ? <Check size={14} className="text-green-500" />
                      : isActive
                      ? <Loader2 size={14} className="text-[#F5A623] animate-spin" />
                      : <Circle size={14} className="text-gray-700" />}
                  </div>
                  <div>
                    <p className={`text-sm ${isActive || isDone ? 'text-white' : 'text-gray-600'}`}>{label}</p>
                    {status && <p className="text-xs text-gray-500 mt-0.5">{status.message}</p>}
                  </div>
                </div>
              );
            })}
          </div>

          {deployError && (
            <p className="text-sm text-red-500 border border-red-900 bg-red-950 rounded-[6px] px-3 py-2">{deployError}</p>
          )}

          {deployDone && (
            <div className="space-y-2">
              <p className="text-sm text-green-400 flex items-center gap-2">
                <Check size={14} /> Deployment started successfully!
              </p>
              <Button variant="primary" size="sm" onClick={() => navigate('/projects')}>
                View Projects
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
