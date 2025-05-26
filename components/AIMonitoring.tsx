import React from 'react';
import { useDeviceMonitoring } from '../utils/useDeviceMonitoring';

export type RuleType = 'intrusion' | 'fire' | 'fall' | 'hazard' | 'inactivity' | 'unknown_face' | 'behavior';
export type SensitivityLevel = 'low' | 'medium' | 'high';
export type NotificationType = 'alert' | 'emergency' | 'both';
export type BehaviorProfile = 'normal' | 'suspicious' | 'threatening' | 'custom';
export type ActionType = 'notification' | 'light' | 'speaker' | 'alarm' | 'police';

export interface Action {
  type: ActionType;
  value: string;
}

export interface MonitoringRule {
  id: string;
  type: RuleType;
  enabled: boolean;
  sensitivity: SensitivityLevel;
  notificationType: NotificationType;
  behaviorProfile?: BehaviorProfile;
  actions: Action[];
}

const TRIGGER_TEMPLATES: {
  name: string;
  condition: {
    type: RuleType;
    value: string;
    behaviorProfile?: BehaviorProfile;
  };
  actions: Action[];
}[] = [
  {
    name: 'VEXOR Warning',
    condition: {
      type: 'behavior',
      value: 'Foe',
      behaviorProfile: 'threatening'
    },
    actions: [
      { type: 'speaker' as ActionType, value: 'Leave the property now.' },
      { type: 'light' as ActionType, value: 'red_flash' },
      { type: 'notification' as ActionType, value: 'Intruder detected' }
    ]
  },
  {
    name: 'Silent Alert',
    condition: {
      type: 'behavior',
      value: 'Unknown',
      behaviorProfile: 'suspicious'
    },
    actions: [
      { type: 'notification' as ActionType, value: 'Unknown person detected' },
      { type: 'light' as ActionType, value: 'yellow_flash' }
    ]
  },
  {
    name: 'Auto Police Contact',
    condition: {
      type: 'behavior',
      value: 'theft',
      behaviorProfile: 'threatening'
    },
    actions: [
      { type: 'police' as ActionType, value: 'emergency' },
      { type: 'notification' as ActionType, value: 'Police contacted' },
      { type: 'light' as ActionType, value: 'red_flash' }
    ]
  }
];

const DEFAULT_RULES: MonitoringRule[] = [
  {
    id: '1',
    type: 'intrusion',
    enabled: true,
    sensitivity: 'high',
    notificationType: 'both',
    actions: [
      { type: 'notification', value: 'Intrusion detected' },
      { type: 'light', value: 'red_flash' }
    ]
  },
  {
    id: '2',
    type: 'fire',
    enabled: true,
    sensitivity: 'high',
    notificationType: 'emergency',
    actions: [
      { type: 'notification', value: 'Fire detected' },
      { type: 'speaker', value: 'Fire alert! Evacuate immediately!' }
    ]
  },
  {
    id: '3',
    type: 'fall',
    enabled: true,
    sensitivity: 'high',
    notificationType: 'both',
    actions: [
      { type: 'notification', value: 'Fall detected' },
      { type: 'speaker', value: 'Help needed! Fall detected!' }
    ]
  },
  {
    id: '4',
    type: 'hazard',
    enabled: true,
    sensitivity: 'medium',
    notificationType: 'alert',
    actions: [
      { type: 'notification', value: 'Hazard detected' }
    ]
  },
  {
    id: '5',
    type: 'inactivity',
    enabled: true,
    sensitivity: 'medium',
    notificationType: 'alert',
    actions: [
      { type: 'notification', value: 'Unusual inactivity detected' }
    ]
  },
  {
    id: '6',
    type: 'unknown_face',
    enabled: true,
    sensitivity: 'high',
    notificationType: 'both',
    actions: [
      { type: 'notification', value: 'Unknown face detected' },
      { type: 'light', value: 'yellow_flash' }
    ]
  },
  {
    id: '7',
    type: 'behavior',
    enabled: true,
    sensitivity: 'high',
    notificationType: 'both',
    behaviorProfile: 'threatening',
    actions: [
      { type: 'notification', value: 'Threatening behavior detected' },
      { type: 'light', value: 'red_flash' },
      { type: 'speaker', value: 'Warning: Threatening behavior detected' }
    ]
  }
];

interface RuleCardProps {
  rule: MonitoringRule;
  onToggle: (id: string) => void;
  onSensitivityChange: (id: string, sensitivity: SensitivityLevel) => void;
  onNotificationTypeChange: (id: string, type: NotificationType) => void;
  onActionChange: (id: string, actions: Action[]) => void;
}

const RuleCard: React.FC<RuleCardProps> = ({
  rule,
  onToggle,
  onSensitivityChange,
  onNotificationTypeChange,
  onActionChange,
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

    {rule.type === 'behavior' && (
      <div className="mt-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Behavior Profile
        </label>
        <select
          value={rule.behaviorProfile}
          onChange={(e) => {
            const updatedRule = {
              ...rule,
              behaviorProfile: e.target.value as BehaviorProfile
            };
            onActionChange(rule.id, updatedRule.actions);
          }}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        >
          <option value="normal">Normal</option>
          <option value="suspicious">Suspicious</option>
          <option value="threatening">Threatening</option>
          <option value="custom">Custom</option>
        </select>
      </div>
    )}

    <div className="mt-4">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Actions
      </label>
      <div className="space-y-2">
        {rule.actions.map((action, index) => (
          <div key={index} className="flex gap-2">
            <select
              value={action.type}
              onChange={(e) => {
                const updatedActions = [...rule.actions];
                updatedActions[index] = {
                  ...action,
                  type: e.target.value as ActionType
                };
                onActionChange(rule.id, updatedActions);
              }}
              className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="notification">Notification</option>
              <option value="light">Light</option>
              <option value="speaker">Speaker</option>
              <option value="alarm">Alarm</option>
              <option value="police">Police</option>
            </select>
            <input
              type="text"
              value={action.value}
              onChange={(e) => {
                const updatedActions = [...rule.actions];
                updatedActions[index] = {
                  ...action,
                  value: e.target.value
                };
                onActionChange(rule.id, updatedActions);
              }}
              className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              placeholder="Action value"
            />
            <button
              onClick={() => {
                const updatedActions = rule.actions.filter((_, i) => i !== index);
                onActionChange(rule.id, updatedActions);
              }}
              className="text-red-500 hover:text-red-700"
            >
              Remove
            </button>
          </div>
        ))}
        <button
          onClick={() => {
            const updatedActions = [
              ...rule.actions,
              { type: 'notification' as ActionType, value: '' }
            ];
            onActionChange(rule.id, updatedActions);
          }}
          className="text-blue-500 hover:text-blue-700"
        >
          Add Action
        </button>
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

  const updateActions = React.useCallback((ruleId: string, actions: Action[]) => {
    setRules(prev =>
      prev.map(rule =>
        rule.id === ruleId
          ? { ...rule, actions }
          : rule
      )
    );
  }, []);

  const applyTemplate = React.useCallback((template: typeof TRIGGER_TEMPLATES[0]) => {
    const newRule: MonitoringRule = {
      id: Math.random().toString(36).substr(2, 9),
      type: template.condition.type,
      enabled: true,
      sensitivity: 'high',
      notificationType: 'both',
      behaviorProfile: template.condition.behaviorProfile,
      actions: template.actions.map(action => ({
        type: action.type as ActionType,
        value: action.value
      }))
    };
    setRules(prev => [...prev, newRule]);
  }, []);

  return {
    rules,
    toggleRule,
    updateRuleSensitivity,
    updateNotificationType,
    updateActions,
    applyTemplate
  };
};

export const AIMonitoring: React.FC = () => {
  const {
    rules,
    toggleRule,
    updateRuleSensitivity,
    updateNotificationType,
    updateActions,
    applyTemplate
  } = useMonitoringRules();

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">AI Monitoring Rules</h2>
      
      {/* Trigger Templates */}
      <div className="mb-8">
        <h3 className="text-xl font-semibold mb-4">Trigger Templates</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {TRIGGER_TEMPLATES.map((template, index) => (
            <div
              key={index}
              className="border rounded-lg p-4 hover:shadow-md cursor-pointer"
              onClick={() => applyTemplate(template)}
            >
              <h4 className="font-semibold text-lg mb-2">{template.name}</h4>
              <p className="text-sm text-gray-600">
                If {template.condition.type} {template.condition.value}
                {template.condition.behaviorProfile && ` (${template.condition.behaviorProfile})`}
              </p>
              <p className="text-sm text-gray-600 mt-2">
                Actions: {template.actions.map(a => a.type).join(', ')}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Monitoring Rules */}
      <div className="space-y-4">
        {rules.map(rule => (
          <RuleCard
            key={rule.id}
            rule={rule}
            onToggle={toggleRule}
            onSensitivityChange={updateRuleSensitivity}
            onNotificationTypeChange={updateNotificationType}
            onActionChange={updateActions}
          />
        ))}
      </div>
    </div>
  );
}; 