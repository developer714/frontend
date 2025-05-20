import React, { useState, useRef, useEffect } from 'react';
import { useDeviceMonitoring } from '../utils/useDeviceMonitoring';
import * as tf from '@tensorflow/tfjs';
import * as faceDetection from '@tensorflow-models/face-detection';
import { supabase } from '../utils/supabase';
import { useSupabaseUser } from '../utils/useSupabaseUser';

export type FaceType = 'friendly' | 'unfriendly';

export interface Face {
  id: string;
  name: string;
  type: FaceType;
  confidence: number;
  lastSeen: Date;
}

interface FaceCardProps {
  face: Face;
  onRemove: (id: string) => void;
}

const FaceCard: React.FC<FaceCardProps> = ({ face, onRemove }) => (
  <div
    className={`p-3 rounded-lg ${
      face.type === 'friendly'
        ? 'bg-green-100 border border-green-300'
        : 'bg-red-100 border border-red-300'
    }`}
  >
    <div className="flex justify-between items-center">
      <div>
        <p className="font-medium">{face.name}</p>
        <p className="text-sm text-gray-600">
          Type: {face.type}
        </p>
        <p className="text-sm text-gray-600">
          Confidence: {face.confidence}%
        </p>
      </div>
      <button
        onClick={() => onRemove(face.id)}
        className="text-red-500 hover:text-red-700"
      >
        Remove
      </button>
    </div>
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

  return detector;
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
            type: 'unfriendly',
            confidence: Math.round(face.score * 100),
            lastSeen: new Date()
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
  const [labelModal, setLabelModal] = useState<{embedding: number[], image: string} | null>(null);
  const user = useSupabaseUser();
  
  const detector = useFaceDetection();
  const {
    videoRef,
    canvasRef,
    faces,
    setFaces
  } = useVideoStream(isStreaming, detector);

  const toggleStreaming = () => {
    setIsStreaming(!isStreaming);
  };

  const handleLabelFace = async (label: FaceType, name: string) => {
    if (!labelModal || !user) return;
    await supabase.from('faces').insert({
      embedding: labelModal.embedding,
      label,
      name,
      image_url: labelModal.image,
      owner_id: user.id
    });
    setLabelModal(null);
  };

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Your Live Feed</h2>
      
      <div className="mb-4">
        <button
          onClick={toggleStreaming}
          className={`px-4 py-2 rounded ${
            isStreaming
              ? 'bg-red-500 hover:bg-red-600'
              : 'bg-green-500 hover:bg-green-600'
          } text-white`}
        >
          {isStreaming ? 'Stop Monitoring' : 'Start Monitoring'}
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <VideoStream
          videoRef={videoRef}
          canvasRef={canvasRef}
          isStreaming={isStreaming}
        />

        <div>
          <h3 className="text-xl font-semibold mb-3">Detected Faces</h3>
          <div className="space-y-2">
            {faces.map(face => (
              <FaceCard
                key={face.id}
                face={face}
                onRemove={(id) => setFaces(prev => prev.filter(f => f.id !== id))}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}; 