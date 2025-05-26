import React, { useState, useRef, useEffect } from 'react';
import { useDeviceMonitoring } from '../utils/useDeviceMonitoring';
import * as tf from '@tensorflow/tfjs';
import * as faceDetection from '@tensorflow-models/face-detection';
import { supabase } from '../utils/supabase';
import { useSupabaseUser } from '../utils/useSupabaseUser';

export type FaceClass = 'Friend' | 'Unknown' | 'Foe';
export type BehaviorProfile = 'normal' | 'suspicious' | 'threatening' | 'custom';

export interface Face {
  id: string;
  name: string;
  class: FaceClass;
  behaviorProfile: BehaviorProfile;
  confidence: number;
  lastSeen: Date;
  history: {
    timestamp: Date;
    action: string;
    location: string;
  }[];
  notes?: string;
  triggers?: string[];
  image_url: string;
}

interface FaceCardProps {
  face: Face;
  onRemove: (id: string) => void;
  onEdit: (face: Face) => void;
}

const FaceCard: React.FC<FaceCardProps> = ({ face, onRemove, onEdit }) => (
  <div
    className={`p-4 rounded-lg ${
      face.class === 'Friend'
        ? 'bg-green-100 border border-green-300'
        : face.class === 'Foe'
        ? 'bg-red-100 border border-red-300'
        : 'bg-yellow-100 border border-yellow-300'
    }`}
  >
    <div className="flex justify-between items-start">
      <div>
        <p className="font-medium text-lg">{face.name}</p>
        <p className="text-sm text-gray-600">
          Class: {face.class}
        </p>
        <p className="text-sm text-gray-600">
          Behavior: {face.behaviorProfile}
        </p>
        <p className="text-sm text-gray-600">
          Confidence: {face.confidence}%
        </p>
        <p className="text-sm text-gray-600">
          Last Seen: {face.lastSeen.toLocaleString()}
        </p>
        {face.notes && (
          <p className="text-sm text-gray-600 mt-2">
            Notes: {face.notes}
          </p>
        )}
      </div>
      <div className="flex gap-2">
        <button
          onClick={() => onEdit(face)}
          className="text-blue-500 hover:text-blue-700"
        >
          Edit
        </button>
        <button
          onClick={() => onRemove(face.id)}
          className="text-red-500 hover:text-red-700"
        >
          Remove
        </button>
      </div>
    </div>
    {face.history.length > 0 && (
      <div className="mt-4">
        <h4 className="font-medium mb-2">Recent History</h4>
        <div className="space-y-2">
          {face.history.slice(0, 3).map((entry, index) => (
            <div key={index} className="text-sm text-gray-600">
              {entry.timestamp.toLocaleString()} - {entry.action} at {entry.location}
            </div>
          ))}
        </div>
      </div>
    )}
  </div>
);

interface VideoStreamProps {
  videoRef: React.RefObject<HTMLVideoElement>;
  canvasRef: React.RefObject<HTMLCanvasElement>;
  isStreaming: boolean;
}

const VideoStream: React.FC<VideoStreamProps> = ({ videoRef, canvasRef, isStreaming }) => (
  <div className="relative">
    <video
      ref={videoRef}
      autoPlay
      playsInline
      className="w-full rounded-lg"
    />
    <canvas
      ref={canvasRef}
      className="absolute top-0 left-0 w-full h-full"
    />
  </div>
);

const useFaceDetection = () => {
  const [detector, setDetector] = useState<faceDetection.FaceDetector | null>(null);
  const [unassignedFaces, setUnassignedFaces] = useState<Face[]>([]);
  const { addAlert } = useDeviceMonitoring();

  useEffect(() => {
    const loadModel = async () => {
      try {
        await tf.ready();
        const model = faceDetection.SupportedModels.MediaPipeFaceDetector;
        const detectorConfig = {
          runtime: 'tfjs',
          modelType: 'short'
        };
        const faceDetector = await faceDetection.createDetector(model, detectorConfig as faceDetection.MediaPipeFaceDetectorTfjsModelConfig);
        setDetector(faceDetector);
      } catch (error) {
        console.error('Error loading face detection model:', error);
        addAlert('camera', {
          type: 'unknown_face',
          severity: 'medium',
          message: 'Failed to load face detection model'
        });
      }
    };

    loadModel();
  }, [addAlert]);

  const checkDailyReview = async () => {
    try {
      const { data: settings } = await supabase
        .from('user_settings')
        .select('daily_review_time')
        .single();

      if (settings?.daily_review_time) {
        const now = new Date();
        const reviewTime = new Date(settings.daily_review_time);
        
        if (now.getHours() === reviewTime.getHours() && 
            now.getMinutes() === reviewTime.getMinutes()) {
          // Show review prompt
          addAlert('system', {
            type: 'unknown_face',
            severity: 'low',
            message: 'Time to review unassigned faces'
          });
        }
      }
    } catch (error) {
      console.error('Error checking daily review:', error);
    }
  };

  useEffect(() => {
    const interval = setInterval(checkDailyReview, 60000); // Check every minute
    return () => clearInterval(interval);
  }, []);

  return { detector, unassignedFaces, setUnassignedFaces };
};

const useVideoStream = (isStreaming: boolean, detector: faceDetection.FaceDetector | null) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [faces, setFaces] = useState<Face[]>([]);
  const { addAlert } = useDeviceMonitoring();

  const detectFaces = React.useCallback(async () => {
    if (
      !videoRef.current ||
      !canvasRef.current ||
      !detector ||
      videoRef.current.videoWidth === 0 ||
      videoRef.current.videoHeight === 0
    ) return;

    try {
      canvasRef.current.width = videoRef.current.videoWidth;
      canvasRef.current.height = videoRef.current.videoHeight;
      const detectedFaces = await detector.estimateFaces(videoRef.current);
      const ctx = canvasRef.current.getContext('2d');
      if (!ctx) return;

      // Clear canvas
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);

      // Draw face detections
      detectedFaces.forEach((face: any) => {
        const { box } = face;
        ctx.strokeStyle = '#00ff00';
        ctx.lineWidth = 2;
        ctx.strokeRect(box.xMin, box.yMin, box.width, box.height);

        // Add face to list if confidence is high enough
        if (face.score && face.score > 0.8) {
          const newFace: Face = {
            id: Math.random().toString(36).substr(2, 9),
            name: 'Unknown',
            class: 'Unknown',
            behaviorProfile: 'normal',
            confidence: Math.round(face.score * 100),
            lastSeen: new Date(),
            history: [],
            image_url: ''
          };
          setFaces(prev => {
            const exists = prev.some(f => f.id === newFace.id);
            return exists ? prev : [...prev, newFace];
          });
        }
      });
    } catch (error) {
      console.error('Error detecting faces:', error);
    }
  }, [detector]);

  const startVideoStream = React.useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      addAlert('camera', {
        type: 'unknown_face',
        severity: 'medium',
        message: 'Camera access error'
      });
    }
  }, [addAlert]);

  const stopVideoStream = React.useCallback(() => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
  }, []);

  useEffect(() => {
    if (isStreaming && detector) {
      startVideoStream();
      const detectionInterval = setInterval(detectFaces, 100);
      return () => {
        clearInterval(detectionInterval);
        stopVideoStream();
      };
    }
  }, [isStreaming, detector, startVideoStream, stopVideoStream, detectFaces]);

  return {
    videoRef,
    canvasRef,
    faces,
    setFaces
  };
};

export const FacialRecognition: React.FC = () => {
  const [isStreaming, setIsStreaming] = useState(false);
  const [faces, setFaces] = useState<Face[]>([]);
  const [selectedFace, setSelectedFace] = useState<Face | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showReviewPrompt, setShowReviewPrompt] = useState(false);
  const { detector, unassignedFaces, setUnassignedFaces } = useFaceDetection();
  const { videoRef, canvasRef, faces: detectedFaces, setFaces: setDetectedFaces } = useVideoStream(isStreaming, detector);

  const handleEditFace = (face: Face) => {
    setSelectedFace(face);
    setIsEditing(true);
  };

  const handleSaveFace = async (updatedFace: Face) => {
    try {
      const { error } = await supabase
        .from('faces')
        .update(updatedFace)
        .eq('id', updatedFace.id);

      if (error) throw error;

      setFaces(prev =>
        prev.map(face =>
          face.id === updatedFace.id ? updatedFace : face
        )
      );
      setIsEditing(false);
      setSelectedFace(null);
    } catch (error) {
      console.error('Error updating face:', error);
    }
  };

  const handleReviewPrompt = () => {
    setShowReviewPrompt(true);
  };

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Facial Recognition</h2>
        <button
          onClick={() => setIsStreaming(!isStreaming)}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
        >
          {isStreaming ? 'Stop Stream' : 'Start Stream'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <VideoStream
            videoRef={videoRef}
            canvasRef={canvasRef}
            isStreaming={isStreaming}
          />
        </div>
        <div>
          <h3 className="text-xl font-semibold mb-4">Detected Faces</h3>
          <div className="space-y-4">
            {faces.map(face => (
              <FaceCard
                key={face.id}
                face={face}
                onRemove={(id) => setFaces(prev => prev.filter(f => f.id !== id))}
                onEdit={handleEditFace}
              />
            ))}
          </div>
        </div>
      </div>

      {showReviewPrompt && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-6 max-w-2xl w-full">
            <h3 className="text-xl font-bold mb-4">Review Unassigned Faces</h3>
            <div className="space-y-4">
              {unassignedFaces.map(face => (
                <div key={face.id} className="border rounded-lg p-4">
                  <img
                    src={face.image_url}
                    alt="Unassigned face"
                    className="w-32 h-32 object-cover rounded-lg mb-2"
                  />
                  <div className="space-y-2">
                    <input
                      type="text"
                      placeholder="Name"
                      className="w-full rounded-lg border-gray-300"
                      onChange={(e) => {
                        setUnassignedFaces(prev =>
                          prev.map(f =>
                            f.id === face.id ? { ...f, name: e.target.value } : f
                          )
                        );
                      }}
                    />
                    <select
                      className="w-full rounded-lg border-gray-300"
                      onChange={(e) => {
                        setUnassignedFaces(prev =>
                          prev.map(f =>
                            f.id === face.id ? { ...f, class: e.target.value as FaceClass } : f
                          )
                        );
                      }}
                    >
                      <option value="Unknown">Unknown</option>
                      <option value="Friend">Friend</option>
                      <option value="Foe">Foe</option>
                    </select>
                    <select
                      className="w-full rounded-lg border-gray-300"
                      onChange={(e) => {
                        setUnassignedFaces(prev =>
                          prev.map(f =>
                            f.id === face.id ? { ...f, behaviorProfile: e.target.value as BehaviorProfile } : f
                          )
                        );
                      }}
                    >
                      <option value="normal">Normal</option>
                      <option value="suspicious">Suspicious</option>
                      <option value="threatening">Threatening</option>
                      <option value="custom">Custom</option>
                    </select>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex justify-end gap-4 mt-4">
              <button
                onClick={() => setShowReviewPrompt(false)}
                className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
              >
                Skip
              </button>
              <button
                onClick={() => {
                  // Save reviewed faces
                  setFaces(prev => [...prev, ...unassignedFaces]);
                  setUnassignedFaces([]);
                  setShowReviewPrompt(false);
                }}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {isEditing && selectedFace && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-6 max-w-2xl w-full">
            <h3 className="text-xl font-bold mb-4">Edit Face Profile</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Name</label>
                <input
                  type="text"
                  value={selectedFace.name}
                  onChange={(e) => setSelectedFace({ ...selectedFace, name: e.target.value })}
                  className="mt-1 block w-full rounded-lg border-gray-300"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Class</label>
                <select
                  value={selectedFace.class}
                  onChange={(e) => setSelectedFace({ ...selectedFace, class: e.target.value as FaceClass })}
                  className="mt-1 block w-full rounded-lg border-gray-300"
                >
                  <option value="Friend">Friend</option>
                  <option value="Unknown">Unknown</option>
                  <option value="Foe">Foe</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Behavior Profile</label>
                <select
                  value={selectedFace.behaviorProfile}
                  onChange={(e) => setSelectedFace({ ...selectedFace, behaviorProfile: e.target.value as BehaviorProfile })}
                  className="mt-1 block w-full rounded-lg border-gray-300"
                >
                  <option value="normal">Normal</option>
                  <option value="suspicious">Suspicious</option>
                  <option value="threatening">Threatening</option>
                  <option value="custom">Custom</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Notes</label>
                <textarea
                  value={selectedFace.notes || ''}
                  onChange={(e) => setSelectedFace({ ...selectedFace, notes: e.target.value })}
                  rows={3}
                  className="mt-1 block w-full rounded-lg border-gray-300"
                />
              </div>
            </div>
            <div className="flex justify-end gap-4 mt-4">
              <button
                onClick={() => {
                  setIsEditing(false);
                  setSelectedFace(null);
                }}
                className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={() => handleSaveFace(selectedFace)}
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