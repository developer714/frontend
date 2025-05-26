'use client';

import React, { useState, useEffect } from 'react';
import { useDeviceMonitoring } from '../utils/useDeviceMonitoring';
import { supabase } from '../utils/supabase';

export type ResponseType = 'voice' | 'text' | 'action';
export type VoiceCommand = {
  id: string;
  trigger: string;
  response: string;
  type: ResponseType;
  enabled: boolean;
  lastUsed?: Date;
};

const DEFAULT_COMMANDS: VoiceCommand[] = [
  {
    id: '1',
    trigger: 'intruder detected',
    response: 'Warning: Intruder detected. Authorities have been notified.',
    type: 'voice',
    enabled: true
  },
  {
    id: '2',
    trigger: 'fire detected',
    response: 'Emergency: Fire detected. Evacuate immediately.',
    type: 'voice',
    enabled: true
  },
  {
    id: '3',
    trigger: 'unknown face',
    response: 'Alert: Unknown face detected. Please verify identity.',
    type: 'voice',
    enabled: true
  },
  {
    id: '4',
    trigger: 'motion detected',
    response: 'Motion detected in protected area. Checking cameras.',
    type: 'voice',
    enabled: true
  }
];

interface CommandCardProps {
  command: VoiceCommand;
  onEdit: (command: VoiceCommand) => void;
  onRemove: (id: string) => void;
}

const CommandCard: React.FC<CommandCardProps> = ({
  command,
  onEdit,
  onRemove,
}) => (
  <div className="border p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow">
    <div className="flex justify-between items-start">
      <div>
        <h3 className="text-lg font-semibold">{command.trigger}</h3>
        <p className="text-sm text-gray-600">Response: {command.response}</p>
        <p className="text-sm text-gray-600">Type: {command.type}</p>
        {command.lastUsed && (
          <p className="text-sm text-gray-600">
            Last Used: {command.lastUsed.toLocaleString()}
          </p>
        )}
      </div>
      <div className="flex gap-2">
        <button
          onClick={() => onEdit(command)}
          className="text-blue-500 hover:text-blue-700"
        >
          Edit
        </button>
        <button
          onClick={() => onRemove(command.id)}
          className="text-red-500 hover:text-red-700"
        >
          Remove
        </button>
      </div>
    </div>
  </div>
);

const useAIResponse = () => {
  const [commands, setCommands] = useState<VoiceCommand[]>(DEFAULT_COMMANDS);
  const [selectedCommand, setSelectedCommand] = useState<VoiceCommand | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const { addAlert } = useDeviceMonitoring();

  useEffect(() => {
    loadCommands();
  }, []);

  const loadCommands = async () => {
    try {
      const { data, error } = await supabase
        .from('voice_commands')
        .select('*');

      if (error) throw error;

      setCommands(data.map(cmd => ({
        ...cmd,
        lastUsed: cmd.last_used ? new Date(cmd.last_used) : undefined
      })));
    } catch (error) {
      console.error('Error loading voice commands:', error);
      addAlert('system', {
        type: 'intrusion',
        severity: 'medium',
        message: 'Failed to load voice commands'
      });
    }
  };

  const saveCommand = async (command: VoiceCommand) => {
    try {
      const { error } = await supabase
        .from('voice_commands')
        .upsert({
          ...command,
          last_used: command.lastUsed?.toISOString()
        });

      if (error) throw error;

      setCommands(prev =>
        prev.map(cmd =>
          cmd.id === command.id ? command : cmd
        )
      );
    } catch (error) {
      console.error('Error saving voice command:', error);
      addAlert('system', {
        type: 'intrusion',
        severity: 'medium',
        message: 'Failed to save voice command'
      });
    }
  };

  const removeCommand = async (id: string) => {
    try {
      const { error } = await supabase
        .from('voice_commands')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setCommands(prev =>
        prev.filter(cmd => cmd.id !== id)
      );
    } catch (error) {
      console.error('Error removing voice command:', error);
      addAlert('system', {
        type: 'intrusion',
        severity: 'medium',
        message: 'Failed to remove voice command'
      });
    }
  };

  const toggleListening = () => {
    setIsListening(!isListening);
    // Here you would implement the actual voice recognition logic
  };

  return {
    commands,
    selectedCommand,
    isEditing,
    isListening,
    setSelectedCommand,
    setIsEditing,
    saveCommand,
    removeCommand,
    toggleListening
  };
};

export const AIResponse: React.FC = () => {
  const {
    commands,
    selectedCommand,
    isEditing,
    isListening,
    setSelectedCommand,
    setIsEditing,
    saveCommand,
    removeCommand,
    toggleListening
  } = useAIResponse();

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <button
          onClick={toggleListening}
          className={`px-4 py-2 rounded-lg ${
            isListening
              ? 'bg-red-500 hover:bg-red-600'
              : 'bg-blue-500 hover:bg-blue-600'
          } text-white`}
        >
          {isListening ? 'Stop Listening' : 'Start Listening'}
        </button>
        <button
          onClick={() => {
            setSelectedCommand({
              id: Math.random().toString(36).substr(2, 9),
              trigger: '',
              response: '',
              type: 'voice',
              enabled: true
            });
            setIsEditing(true);
          }}
          className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
        >
          Add Command
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {commands.map(command => (
          <CommandCard
            key={command.id}
            command={command}
            onEdit={(command) => {
              setSelectedCommand(command);
              setIsEditing(true);
            }}
            onRemove={removeCommand}
          />
        ))}
      </div>

      {isEditing && selectedCommand && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-6 max-w-2xl w-full">
            <h3 className="text-xl font-bold mb-4">
              {selectedCommand.id ? 'Edit Voice Command' : 'Add Voice Command'}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Trigger Phrase</label>
                <input
                  type="text"
                  value={selectedCommand.trigger}
                  onChange={(e) => setSelectedCommand({ ...selectedCommand, trigger: e.target.value })}
                  className="mt-1 block w-full rounded-lg border-gray-300"
                  placeholder="Enter trigger phrase"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Response</label>
                <input
                  type="text"
                  value={selectedCommand.response}
                  onChange={(e) => setSelectedCommand({ ...selectedCommand, response: e.target.value })}
                  className="mt-1 block w-full rounded-lg border-gray-300"
                  placeholder="Enter response"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Response Type</label>
                <select
                  value={selectedCommand.type}
                  onChange={(e) => setSelectedCommand({ ...selectedCommand, type: e.target.value as ResponseType })}
                  className="mt-1 block w-full rounded-lg border-gray-300"
                >
                  <option value="voice">Voice</option>
                  <option value="text">Text</option>
                  <option value="action">Action</option>
                </select>
              </div>
              <div>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={selectedCommand.enabled}
                    onChange={(e) => setSelectedCommand({ ...selectedCommand, enabled: e.target.checked })}
                    className="form-checkbox h-5 w-5 text-blue-600"
                  />
                  <span>Enable Command</span>
                </label>
              </div>
            </div>
            <div className="flex justify-end gap-4 mt-4">
              <button
                onClick={() => {
                  setIsEditing(false);
                  setSelectedCommand(null);
                }}
                className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  saveCommand(selectedCommand);
                  setIsEditing(false);
                  setSelectedCommand(null);
                }}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}; 