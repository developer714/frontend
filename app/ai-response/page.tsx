'use client'

import React, { useState, useEffect } from 'react';
import { supabase } from '@/utils/supabase';

interface VoicePackage {
  id: string;
  name: string;
  description: string;
  preview_url: string;
  is_active: boolean;
}

interface Command {
  id: string;
  text: string;
  voice_package_id: string;
  created_at: string;
}

const DEFAULT_VOICE_PACKAGES: VoicePackage[] = [
  {
    id: 'intimidating',
    name: 'Intimidating',
    description: 'Deep, authoritative voice for warnings and threats',
    preview_url: '/audio/intimidating-preview.mp3',
    is_active: true
  },
  {
    id: 'friendly',
    name: 'Friendly',
    description: 'Warm, welcoming voice for greetings and notifications',
    preview_url: '/audio/friendly-preview.mp3',
    is_active: true
  },
  {
    id: 'professional',
    name: 'Professional',
    description: 'Clear, neutral voice for system announcements',
    preview_url: '/audio/professional-preview.mp3',
    is_active: true
  }
];

export default function AIResponsePage() {
  const [voicePackages, setVoicePackages] = useState<VoicePackage[]>(DEFAULT_VOICE_PACKAGES);
  const [commands, setCommands] = useState<Command[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [newCommand, setNewCommand] = useState<Partial<Command>>({
    text: '',
    voice_package_id: DEFAULT_VOICE_PACKAGES[0].id
  });
  const [playingAudio, setPlayingAudio] = useState<string | null>(null);

  useEffect(() => {
    fetchCommands();
  }, []);

  const fetchCommands = async () => {
    try {
      const { data, error } = await supabase
        .from('commands')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCommands(data || []);
    } catch (error) {
      console.error('Error fetching commands:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCommand = async () => {
    try {
      const { error } = await supabase
        .from('commands')
        .insert([newCommand]);

      if (error) throw error;

      await fetchCommands();
      setIsCreating(false);
      setNewCommand({
        text: '',
        voice_package_id: DEFAULT_VOICE_PACKAGES[0].id
      });
    } catch (error) {
      console.error('Error creating command:', error);
    }
  };

  const handleToggleVoicePackage = async (packageId: string, currentStatus: boolean) => {
    try {
      const updatedPackages = voicePackages.map(pkg =>
        pkg.id === packageId ? { ...pkg, is_active: !currentStatus } : pkg
      );
      setVoicePackages(updatedPackages);

      // In a real app, you would save this to the database
      // const { error } = await supabase
      //   .from('voice_packages')
      //   .update({ is_active: !currentStatus })
      //   .eq('id', packageId);
      // if (error) throw error;
    } catch (error) {
      console.error('Error toggling voice package:', error);
    }
  };

  const playPreview = (url: string) => {
    setPlayingAudio(url);
    const audio = new Audio(url);
    audio.onended = () => setPlayingAudio(null);
    audio.play();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-200 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-extrabold text-gray-900">AI Response System</h1>
          <button
            onClick={() => setIsCreating(true)}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            Create New Command
          </button>
        </div>

        {/* Voice Packages */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <h2 className="text-2xl font-bold mb-4">Voice Packages</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {voicePackages.map((pkg) => (
              <div
                key={pkg.id}
                className="border rounded-lg p-4 hover:shadow-md"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-lg">{pkg.name}</h3>
                    <p className="text-sm text-gray-600 mt-1">{pkg.description}</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={pkg.is_active}
                      onChange={() => handleToggleVoicePackage(pkg.id, pkg.is_active)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
                <button
                  onClick={() => playPreview(pkg.preview_url)}
                  className="mt-4 w-full px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 flex items-center justify-center gap-2"
                >
                  {playingAudio === pkg.preview_url ? (
                    <>
                      <span className="animate-pulse">Playing...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Preview Voice
                    </>
                  )}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Commands List */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-2xl font-bold mb-4">Voice Commands</h2>
          <div className="space-y-4">
            {loading ? (
              <div className="animate-pulse space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-20 bg-gray-200 rounded-lg"></div>
                ))}
              </div>
            ) : commands.length === 0 ? (
              <div className="text-center text-gray-500 py-8">No commands created yet</div>
            ) : (
              commands.map((command) => (
                <div
                  key={command.id}
                  className="border rounded-lg p-4 hover:shadow-md"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-lg">{command.text}</p>
                      <p className="text-sm text-gray-600 mt-1">
                        Voice: {voicePackages.find(pkg => pkg.id === command.voice_package_id)?.name}
                      </p>
                    </div>
                    <button
                      onClick={() => playPreview(`/audio/commands/${command.id}.mp3`)}
                      className="px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 flex items-center gap-2"
                    >
                      {playingAudio === `/audio/commands/${command.id}.mp3` ? (
                        <span className="animate-pulse">Playing...</span>
                      ) : (
                        <>
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Play
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Create Command Modal */}
        {isCreating && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl p-6 max-w-2xl w-full">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-2xl font-bold">Create New Command</h2>
                <button
                  onClick={() => setIsCreating(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Command Text</label>
                  <textarea
                    value={newCommand.text}
                    onChange={(e) => setNewCommand({ ...newCommand, text: e.target.value })}
                    rows={3}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    placeholder="Enter the text for the AI to speak..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Voice Package</label>
                  <select
                    value={newCommand.voice_package_id}
                    onChange={(e) => setNewCommand({ ...newCommand, voice_package_id: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  >
                    {voicePackages.map((pkg) => (
                      <option key={pkg.id} value={pkg.id}>{pkg.name}</option>
                    ))}
                  </select>
                </div>
                <div className="flex justify-end gap-4">
                  <button
                    className="px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200"
                    onClick={() => setIsCreating(false)}
                  >
                    Cancel
                  </button>
                  <button
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                    onClick={handleCreateCommand}
                  >
                    Create Command
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 