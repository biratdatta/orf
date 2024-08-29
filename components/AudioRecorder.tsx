"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Button,
  Typography,
  Box,
  LinearProgress,
  IconButton,
  Paper,
} from "@mui/material";
import StopIcon from "@mui/icons-material/Stop";
import FiberManualRecordIcon from "@mui/icons-material/FiberManualRecord";

const SAMPLE_RATE = 44100; 

const AudioRecorder: React.FC = () => {
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [audioChunks, setAudioChunks] = useState<Blob[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [progress, setProgress] = useState(0);
  const [audioData, setAudioData] = useState<Uint8Array[]>([]);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (mediaRecorder) {
      mediaRecorder.ondataavailable = (event) => {
        setAudioChunks((prev) => [...prev, event.data]);
        console.log("Data available:", event.data);
      };

      mediaRecorder.onstart = () => {
        console.log("Recording started");
        intervalRef.current = setInterval(() => {
          setProgress((prev) => (prev >= 100 ? 100 : prev + 2));
        }, 100);
      };

      mediaRecorder.onstop = () => {
        console.log("Recording stopped");
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
        setProgress(0);
        processAudioChunks();
      };
    }
  }, [mediaRecorder]);

  const startRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const recorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
    setMediaRecorder(recorder);
    setAudioChunks([]);  
    recorder.start();
    setIsRecording(true);
  };

  const stopRecording = () => {
    mediaRecorder?.stop();
    setIsRecording(false);
  };

  const processAudioChunks = () => {
    const audioBlob = new Blob(audioChunks, { type: "audio/webm" });

  

    const reader = new FileReader();

    reader.onload = async (event) => {
      const arrayBuffer = event.target?.result as ArrayBuffer;

      if (arrayBuffer.byteLength > 0) {
        console.log("ArrayBuffer length:", arrayBuffer.byteLength);
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();

       try {
  const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
  const channelData = audioBuffer.getChannelData(0);
  const frames = createOverlappingFrames(new Float32Array(channelData));

  // Convert each Float32Array to Uint8Array
  const uint8Frames = frames.map(frame => {
    const uint8Array = new Uint8Array(frame.buffer);
    return uint8Array;
  });

  setAudioData(uint8Frames);
} catch (error) {
  console.error("Error decoding audio data:", error);
}

      } 
    };

    reader.readAsArrayBuffer(audioBlob);
  };

const createOverlappingFrames = (audioBuffer: Float32Array): Float32Array[] => {
  const bufferSize = SAMPLE_RATE * 2; // 2 seconds buffer
  const frameSize = SAMPLE_RATE * 0.4; // 0.4 seconds frame
  const stride = SAMPLE_RATE * 0.3; // 0.3 seconds stride

  const bufferedAudio = audioBuffer.slice(-bufferSize);
  const frames: Float32Array[] = [];

  for (let i = 0; i < bufferedAudio.length - frameSize; i += stride) {
    frames.push(bufferedAudio.slice(i, i + frameSize));
  }

  return frames;
};

  return (
    <Paper elevation={3} sx={{ padding: 2, textAlign: "center" }}>
      <Typography variant="h6" gutterBottom>
        Audio Input 
      </Typography>
      
      
      <IconButton
        color={isRecording ? "secondary" : "primary"}
        onClick={isRecording ? stopRecording : startRecording}
        sx={{ margin: 1 }}
      >
        {isRecording ? (
          <StopIcon sx={{ fontSize: 50 }} />
        ) : (
          <FiberManualRecordIcon sx={{ fontSize: 50 }} />
        )}
      </IconButton>
      <Typography variant="body2" color="textSecondary">
        {isRecording ? "Recording in progress..." : "Click to start recording"}
      </Typography>
    </Paper>
  );
};

export default AudioRecorder;
