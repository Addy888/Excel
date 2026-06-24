import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Plus, Edit, Trash2, ToggleLeft, ToggleRight } from 'lucide-react';
import api from '@/services/api';
import { useNavigate } from 'react-router-dom';

export const RulesPage: React.FC = () => {
  const navigate = useNavigate();
  const [rules, setRules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const isAdmin = user.role === 'admin';

  useEffect(() => {
    fetchRules();
  }, []);

  const fetchRules = async () => {
    try {
      const response = await api.get('/rules');
      setRules(response.data.rules);
    } catch (error) {
      console.error('Failed to fetch rules', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (id: string) => {
    try {
      await api.patch(`/rules/${id}/toggle`);
      fetchRules();
    } catch (error) {
      console.error('Failed to toggle rule', error);
      alert('Failed to toggle rule');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this rule?')) return;

    try {
      await api.delete(`/rules/${id}`);
      fetchRules();
    } catch (error) {
      console.error('Failed to delete rule', error);
      alert('Failed to delete rule');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Rules Management</h1>
          <p className="text-muted-foreground mt-1">Configure dynamic processing rules</p>
        </div>
        {isAdmin && (
          <Button onClick={() => navigate('/admin/rules/create')}>
            <Plus className="h-4 w-4 mr-2" />
            Create Rule
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {rules.map((rule) => (
          <div key={rule._id} className="bg-card rounded-lg border p-6 space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="font-semibold text-lg">{rule.name}</h3>
                <p className="text-sm text-muted-foreground mt-1">{rule.description}</p>
              </div>
              <div className="flex items-center gap-2">
                {rule.isActive ? (
                  <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                    Active
                  </span>
                ) : (
                  <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full">
                    Inactive
                  </span>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <div>
                <p className="text-xs font-medium text-muted-foreground">Conditions</p>
                <div className="mt-1 space-y-1">
                  {rule.conditions.map((condition: any, index: number) => (
                    <div key={index} className="text-sm bg-muted p-2 rounded">
                      <code>
                        {condition.field} {condition.operator} "{condition.value}"
                      </code>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-xs font-medium text-muted-foreground">Actions</p>
                <div className="mt-1 space-y-1">
                  {rule.actions.map((action: any, index: number) => (
                    <div key={index} className="text-sm bg-muted p-2 rounded">
                      <code>
                        {action.type} {action.target}
                        {action.value && ` = ${action.value}`}
                      </code>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {isAdmin && (
              <div className="flex items-center gap-2 pt-4 border-t">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleToggle(rule._id)}
                  className="flex-1"
                >
                  {rule.isActive ? (
                    <>
                      <ToggleLeft className="h-4 w-4 mr-2" />
                      Deactivate
                    </>
                  ) : (
                    <>
                      <ToggleRight className="h-4 w-4 mr-2" />
                      Activate
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate(`/admin/rules/${rule._id}/edit`)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDelete(rule._id)}
                >
                  <Trash2 className="h-4 w-4 text-red-500" />
                </Button>
              </div>
            )}
          </div>
        ))}
      </div>

      {rules.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No rules configured yet</p>
          {isAdmin && (
            <Button onClick={() => navigate('/admin/rules/create')} className="mt-4">
              Create Your First Rule
            </Button>
          )}
        </div>
      )}
    </div>
  );
};
