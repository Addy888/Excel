import React from 'react';
import { RuleBuilder } from '@/components/RuleBuilder';
import api from '@/services/api';
import { useNavigate } from 'react-router-dom';

export const CreateRulePage: React.FC = () => {
  const navigate = useNavigate();

  const handleSave = async (ruleData: any) => {
    try {
      await api.post('/rules', ruleData);
      alert('Rule created successfully!');
      navigate('/admin/rules');
    } catch (error: any) {
      console.error('Failed to create rule', error);
      alert(error.response?.data?.message || 'Failed to create rule');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Create New Rule</h1>
        <p className="text-muted-foreground mt-1">
          Define conditions and actions for automated report processing
        </p>
      </div>

      <RuleBuilder onSave={handleSave} />
    </div>
  );
};
