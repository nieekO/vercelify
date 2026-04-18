import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import api from '../services/api';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { useToast } from '../components/ui/Toast';

export function Settings() {
  const { toast } = useToast();
  const [showToken, setShowToken] = useState(false);
  const [testing, setTesting] = useState(false);
  const [connectionResult, setConnectionResult] = useState('');

  const testConnection = async () => {
    setTesting(true);
    try {
      const res = await api.post('/config/test-connection');
      setConnectionResult(res.data.success ? `✓ Connected — ${JSON.stringify(res.data.version)}` : 'Connection failed');
      toast('Connection successful');
    } catch {
      setConnectionResult('✗ Connection failed');
      toast('Connection failed', 'error');
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="p-6 max-w-2xl space-y-8">
      <h1 className="text-xl font-semibold tracking-tight">Settings</h1>

      {/* Coolify Connection */}
      <section className="space-y-4">
        <h2 className="text-sm font-medium">Coolify Connection</h2>
        <div className="border border-[rgba(255,255,255,0.08)] rounded-[8px] divide-y divide-[rgba(255,255,255,0.08)]">
          <div className="px-4 py-3 flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">API URL</p>
              <p className="text-sm font-mono text-gray-300">http://138.199.209.224:8000/api/v1</p>
            </div>
          </div>
          <div className="px-4 py-3 flex items-center justify-between">
            <div className="flex-1">
              <p className="text-xs text-gray-500">API Token</p>
              <p className="text-sm font-mono text-gray-300">
                {showToken ? '1|KILal2qZr9baFZGzDYBesIt...' : '••••••••••••••••'}
              </p>
            </div>
            <button onClick={() => setShowToken(!showToken)} className="text-gray-600 hover:text-white ml-2">
              {showToken ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="secondary" size="sm" loading={testing} onClick={testConnection}>
            Test Connection
          </Button>
          {connectionResult && <p className="text-xs text-gray-500">{connectionResult}</p>}
        </div>
      </section>

      {/* Default Servers */}
      <section className="space-y-4">
        <h2 className="text-sm font-medium">Default Server Targets</h2>
        <div className="border border-[rgba(255,255,255,0.08)] rounded-[8px] divide-y divide-[rgba(255,255,255,0.08)]">
          <div className="px-4 py-3 flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">Infra Server (Supabase)</p>
              <p className="text-sm text-gray-300">infra-01 (138.199.209.224)</p>
            </div>
          </div>
          <div className="px-4 py-3 flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">Apps Server (Deployments)</p>
              <p className="text-sm text-gray-300">apps-01 (178.104.195.24)</p>
            </div>
          </div>
        </div>
      </section>

      {/* Danger Zone */}
      <section className="space-y-4">
        <h2 className="text-sm font-medium text-red-500">Danger Zone</h2>
        <div className="border border-red-900 rounded-[8px] p-4 flex items-center justify-between">
          <div>
            <p className="text-sm">Reset all project links</p>
            <p className="text-xs text-gray-500">Deletes projects.json — does NOT delete Coolify resources</p>
          </div>
          <Button
            variant="danger"
            size="sm"
            onClick={() => {
              if (confirm('Are you sure? This will remove all Vercelify project links.')) {
                api.put('/config', { resetProjects: true })
                  .then(() => toast('Project links reset'))
                  .catch(() => toast('Failed', 'error'));
              }
            }}
          >
            Reset
          </Button>
        </div>
      </section>
    </div>
  );
}
