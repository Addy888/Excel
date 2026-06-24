import React, { useState } from 'react';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import { Plus, Trash2 } from 'lucide-react';

interface Condition {
  field: string;
  operator: string;
  value: string;
  logicalOperator?: 'AND' | 'OR';
}

interface Action {
  type: string;
  target: string;
  value?: string;
}

interface RuleBuilderProps {
  onSave: (rule: { name: string; description: string; conditions: Condition[]; actions: Action[] }) => void;
  initialData?: any;
}

export const RuleBuilder: React.FC<RuleBuilderProps> = ({ onSave, initialData }) => {
  const [name, setName] = useState(initialData?.name || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [conditions, setConditions] = useState<Condition[]>(initialData?.conditions || []);
  const [actions, setActions] = useState<Action[]>(initialData?.actions || []);

  const addCondition = () => {
    setConditions([...conditions, { field: '', operator: 'equals', value: '' }]);
  };

  const removeCondition = (index: number) => {
    setConditions(conditions.filter((_, i) => i !== index));
  };

  const updateCondition = (index: number, field: keyof Condition, value: any) => {
    const updated = [...conditions];
    updated[index] = { ...updated[index], [field]: value };
    setConditions(updated);
  };

  const addAction = () => {
    setActions([...actions, { type: 'increment', target: '' }]);
  };

  const removeAction = (index: number) => {
    setActions(actions.filter((_, i) => i !== index));
  };

  const updateAction = (index: number, field: keyof Action, value: any) => {
    const updated = [...actions];
    updated[index] = { ...updated[index], [field]: value };
    setActions(updated);
  };

  const handleSave = () => {
    if (!name || conditions.length === 0 || actions.length === 0) {
      alert('Please fill in all required fields');
      return;
    }
    onSave({ name, description, conditions, actions });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Rule Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Rule Name *</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Count Connected Calls"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Description</label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what this rule does"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Conditions
            <Button onClick={addCondition} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Condition
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {conditions.map((condition, index) => (
            <div key={index} className="flex gap-2 items-start">
              <select
                value={condition.field}
                onChange={(e) => updateCondition(index, 'field', e.target.value)}
                className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="">Select Field</option>
                <option value="Status">Status</option>
                <option value="Agent">Agent</option>
                <option value="Mobile">Mobile</option>
                <option value="Date">Date</option>
              </select>

              <select
                value={condition.operator}
                onChange={(e) => updateCondition(index, 'operator', e.target.value)}
                className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="equals">Equals</option>
                <option value="contains">Contains</option>
                <option value="startsWith">Starts With</option>
                <option value="endsWith">Ends With</option>
                <option value="greaterThan">Greater Than</option>
                <option value="lessThan">Less Than</option>
              </select>

              <Input
                value={condition.value}
                onChange={(e) => updateCondition(index, 'value', e.target.value)}
                placeholder="Value"
              />

              <Button variant="ghost" size="icon" onClick={() => removeCondition(index)}>
                <Trash2 className="h-4 w-4 text-red-500" />
              </Button>
            </div>
          ))}
          {conditions.length === 0 && (
            <p className="text-sm text-muted-foreground">No conditions added yet</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Actions
            <Button onClick={addAction} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Action
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {actions.map((action, index) => (
            <div key={index} className="flex gap-2 items-start">
              <select
                value={action.type}
                onChange={(e) => updateAction(index, 'type', e.target.value)}
                className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="increment">Increment</option>
                <option value="set">Set Value</option>
              </select>

              <Input
                value={action.target}
                onChange={(e) => updateAction(index, 'target', e.target.value)}
                placeholder="Target Counter (e.g., connectedCalls)"
              />

              {action.type === 'set' && (
                <Input
                  value={action.value || ''}
                  onChange={(e) => updateAction(index, 'value', e.target.value)}
                  placeholder="Value"
                />
              )}

              <Button variant="ghost" size="icon" onClick={() => removeAction(index)}>
                <Trash2 className="h-4 w-4 text-red-500" />
              </Button>
            </div>
          ))}
          {actions.length === 0 && (
            <p className="text-sm text-muted-foreground">No actions added yet</p>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-end gap-4">
        <Button variant="outline" onClick={() => window.history.back()}>
          Cancel
        </Button>
        <Button onClick={handleSave}>Save Rule</Button>
      </div>
    </div>
  );
};
