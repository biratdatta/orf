"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Button,
  Typography,
  Box,
  Paper,
  Input,
  Modal,
  Backdrop,
  Fade,
  TextField,
} from "@mui/material";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import PauseIcon from "@mui/icons-material/Pause";
const SAMPLE_RATE = 44100;

const AudioRecorder: React.FC = () => {
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [audioChunks, setAudioChunks] = useState<Blob[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [progress, setProgress] = useState(0);
  const [audioData, setAudioData] = useState<Uint8Array[][]>([]);
  const [uploadedAudio, setUploadedAudio] = useState<string | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [extractedText, setExtractedText] = useState<string>("");  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [textInput, setTextInput] = useState<string>("");  
  const [comparisonResult, setComparisonResult] = useState<string>(""); 
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

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
    processAudioBlob(audioBlob);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const audioUrl = URL.createObjectURL(file);
      setUploadedAudio(audioUrl);
      setUploadedFileName(file.name);
      setIsModalOpen(true);
      processAudioBlob(file);
    }
  };

  const processAudioBlob = (audioBlob: Blob) => {
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

          const uint8Frames = frames.map(frame => {
            const uint8Array = new Uint8Array(frame.buffer);
            return uint8Array;
          });

          setAudioData(prev => [...prev, uint8Frames]);

          const transcribedText = await transcribeAudioToText(arrayBuffer);
          setExtractedText(transcribedText);
          compareText(textInput, transcribedText);  

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

  const handleModalClose = () => {
    setIsModalOpen(false);
    setUploadedAudio(null);
  };

  const handleTextInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const input = event.target.value;
    setTextInput(input);
    compareText(input, extractedText);  
  };

  const compareText = (input: string, extracted: string) => {
    if (!extracted) return;

    let result = "";
    const maxLength = Math.max(input.length, extracted.length);

    for (let i = 0; i < maxLength; i++) {
      const inputChar = input[i] || "";
      const extractedChar = extracted[i] || "";
      if (inputChar === extractedChar) {
        result += `<span style="color:green;">${inputChar}</span>`;
      } else {
        result += `<span style="color:red;">${extractedChar}</span>`;
      }
    }
    setComparisonResult(result);
  };

 /* TODO : Transcription Service needs to be done, otherwise error will throw */
  
  // Transcription API for the Modal 
  const transcribeAudioToText = async (arrayBuffer: ArrayBuffer): Promise<string> => {
    const response = await fetch('/transcribe', {
      method: 'POST',
      headers: {
        'Content-Type': 'audio/wav',
      },
      body: arrayBuffer,
    });

    if (!response.ok) {
      throw new Error('Failed to transcribe audio');
    }

    const data = await response.json();
    return data.transcribedText;
  };

  return (
    
    <Paper elevation={3} sx={{ padding: 2, textAlign: "center" }}>
      <Typography variant="h6" gutterBottom>
        Choose your Audio Source
      </Typography>

      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 2, marginBottom: 2 }}>
      <Button
  variant="outlined"
  color={isRecording ? "secondary" : "primary"}
  onClick={isRecording ? stopRecording : startRecording}
  startIcon={isRecording ? <PauseIcon /> : <PlayArrowIcon />}
  sx={{
    border: "1px solid",
    borderColor: isRecording ? "secondary.main" : "primary.main",
    backgroundColor: "transparent",
  }}
>
  {isRecording ? "Stop Recording" : "Start Recording"}
</Button>

        <Input
          type="file"
          onChange={handleFileUpload}
          sx={{ display: "none" }}
          id="upload-button"
        />
        <label htmlFor="upload-button">
          <Button 
            variant="outlined" 
            component="span" 
            startIcon={<UploadFileIcon />} 
            sx={{ border: "1px solid", backgroundColor: "transparent" }}
          >
            {uploadedFileName ? "Reupload Audio" : "Upload Audio"}
          </Button>
        </label>
      </Box>
      
      {uploadedFileName && (
        <Typography variant="body2" color="textSecondary" sx={{ marginBottom: 2 }}>
          Uploaded file: {uploadedFileName}
        </Typography>
      )}

      <Modal
        open={isModalOpen}
        onClose={handleModalClose}
        closeAfterTransition
        BackdropComponent={Backdrop}
        BackdropProps={{
          timeout: 500,
        }}
      >
        <Fade in={isModalOpen}>
          <Box
            sx={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              width: 400,
              bgcolor: "background.paper",
              boxShadow: 24,
              p: 4,
              textAlign: "center",
            }}
          >
            <Typography variant="h6" gutterBottom>
              Playback Uploaded Audio
            </Typography>
            <audio ref={audioRef} controls src={uploadedAudio ?? undefined} />
            
            <Button
              variant="contained"
              color="secondary"
              sx={{ marginTop: 2, marginLeft: 2 }}
              onClick={handleModalClose}
            >
              Close
            </Button>
          </Box>
        </Fade>
      </Modal>

      <Box sx={{ marginTop: 2 }}>
        <TextField
          label="Enter Text for Comparison"
          value={textInput}
          onChange={handleTextInputChange}
          fullWidth
          multiline
          rows={4}
          variant="outlined"
        />
      </Box>

      <Box sx={{ marginTop: 2 }}>
        <Typography variant="h6">Comparison Result:</Typography>
        <Typography
          variant="body1"
          dangerouslySetInnerHTML={{ __html: comparisonResult }}
        />
      </Box>
    </Paper>
  );
};

export default AudioRecorder;
