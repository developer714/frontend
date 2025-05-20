import React from 'react';
import { useDeviceMonitoring } from '../utils/useDeviceMonitoring';

export type RuleType = 'intrusion' | 'fire' | 'fall' | 'hazard' | 'inactivity' | 'unknown_face';
export type SensitivityLevel = 'low' | 'medium' | 'high';
export type NotificationType = 'alert' | 'emergency' | 'both';

export interface MonitoringRule {
  id: string;
  type: RuleType;
  enabled: boolean;
  sensitivity: SensitivityLevel;
  notificationType: NotificationType;
}

const DEFAULT_RULES: MonitoringRule[] = [
  {
    id: '1',
    type: 'intrusion',
    enabled: true,
    sensitivity: 'high',
    notificationType: 'both'
  },
  {
    id: '2',
    type: 'fire',
    enabled: true,
    sensitivity: 'high',
    notificationType: 'emergency'
  },
  {
    id: '3',
    type: 'fall',
    enabled: true,
    sensitivity: 'high',
    notificationType: 'both'
  },
  {
    id: '4',
    type: 'hazard',
    enabled: true,
    sensitivity: 'medium',
    notificationType: 'alert'
  },
  {
    id: '5',
    type: 'inactivity',
    enabled: true,
    sensitivity: 'medium',
    notificationType: 'alert'
  },
  {
    id: '6',
    type: 'unknown_face',
    enabled: true,
    sensitivity: 'high',
    notificationType: 'both'
  }
];

interface RuleCardProps {
  rule: MonitoringRule;
  onToggle: (id: string) => void;
  onSensitivityChange: (id: string, sensitivity: SensitivityLevel) => void;
  onNotificationTypeChange: (id: string, type: NotificationType) => void;
}

const RuleCard: React.FC<RuleCardProps> = ({
  rule,
  onToggle,
  onSensitivityChange,
  onNotificationTypeChange,
}) => (
  <div className="border p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow">
    <div className="flex justify-between items-center mb-2">
      <h3 className="text-lg font-semibold capitalize">
        {rule.type.replace('_', ' ')}
      </h3>
      <label className="flex items-center space-x-2">
        <input
          type="checkbox"
          checked={rule.enabled}
          onChange={() => onToggle(rule.id)}
          className="form-checkbox h-5 w-5 text-blue-600"
        />
        <span>Enabled</span>
      </label>
    </div>

    <div className="grid grid-cols-2 gap-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Sensitivity
        </label>
        <select
          value={rule.sensitivity}
          onChange={(e) => onSensitivityChange(rule.id, e.target.value as SensitivityLevel)}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        >
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Notification Type
        </label>
        <select
          value={rule.notificationType}
          onChange={(e) => onNotificationTypeChange(rule.id, e.target.value as NotificationType)}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        >
          <option value="alert">Alert Only</option>
          <option value="emergency">Emergency Only</option>
          <option value="both">Both</option>
        </select>
      </div>
    </div>
  </div>
);

const useMonitoringRules = () => {
  const [rules, setRules] = React.useState<MonitoringRule[]>(DEFAULT_RULES);
  const { addAlert } = useDeviceMonitoring();

  const toggleRule = React.useCallback((ruleId: string) => {
    setRules(prev =>
      prev.map(rule =>
        rule.id === ruleId
          ? { ...rule, enabled: !rule.enabled }
          : rule
      )
    );
  }, []);

  const updateRuleSensitivity = React.useCallback((ruleId: string, sensitivity: SensitivityLevel) => {
    setRules(prev =>
      prev.map(rule =>
        rule.id === ruleId
          ? { ...rule, sensitivity }
          : rule
      )
    );
  }, []);

  const updateNotificationType = React.useCallback((ruleId: string, type: NotificationType) => {
    setRules(prev =>
      prev.map(rule =>
        rule.id === ruleId
          ? { ...rule, notificationType: type }
          : rule
      )
    );
  }, []);

  return {
    rules,
    toggleRule,
    updateRuleSensitivity,
    updateNotificationType,
  };
};

export const AIMonitoring: React.FC = () => {
  const {
    rules,
    toggleRule,
    updateRuleSensitivity,
    updateNotificationType,
  } = useMonitoringRules();

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">AI Monitoring Rules</h2>
      
      <div className="space-y-4">
        {rules.map(rule => (
          <RuleCard
            key={rule.id}
            rule={rule}
            onToggle={toggleRule}
            onSensitivityChange={updateRuleSensitivity}
            onNotificationTypeChange={updateNotificationType}
          />
        ))}
      </div>
    </div>
  );
}; 