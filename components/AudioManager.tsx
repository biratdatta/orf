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
import { AudioVisualizer } from "react-audio-visualize";

const SAMPLE_RATE = 44100;
const CHUNK_DURATION = 400;
const STRIDE_DURATION = 30;
 const AudioRecorder: React.FC = () => {
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [audioChunks, setAudioChunks] = useState<Float32Array[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [progress, setProgress] = useState(0);
  const [audioData, setAudioData] = useState<Uint8Array[][]>([]);
  const [uploadedAudio, setUploadedAudio] = useState<string | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [extractedText, setExtractedText] = useState<string>("");  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [textInput, setTextInput] = useState<string>("");  
  const [comparisonResult, setComparisonResult] = useState<string>(""); 
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const sourceNodeRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const processorNodeRef = useRef<ScriptProcessorNode | null>(null);
  const audioBufferRef = useRef<Float32Array>(new Float32Array(0));
  

  useEffect(() => {
    return () => {
      if (mediaRecorder) {
        mediaRecorder.stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);



 const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      sourceNodeRef.current = audioContextRef.current.createMediaStreamSource(stream);
      processorNodeRef.current = audioContextRef.current.createScriptProcessor(4096, 1, 1);

      sourceNodeRef.current.connect(processorNodeRef.current);
      processorNodeRef.current.connect(audioContextRef.current.destination);

      processorNodeRef.current.onaudioprocess = (e) => {
        const inputData = e.inputBuffer.getChannelData(0);
        const newBuffer = new Float32Array(audioBufferRef.current.length + inputData.length);
        newBuffer.set(audioBufferRef.current);
        newBuffer.set(inputData, audioBufferRef.current.length);
        audioBufferRef.current = newBuffer;

        while (audioBufferRef.current.length >= SAMPLE_RATE * (CHUNK_DURATION / 1000)) {
          const chunkSize = SAMPLE_RATE * (CHUNK_DURATION / 1000);
          const chunk = audioBufferRef.current.slice(0, chunkSize);
          setAudioChunks(prevChunks => [...prevChunks, chunk]);
          audioBufferRef.current = audioBufferRef.current.slice(SAMPLE_RATE * (STRIDE_DURATION / 1000));
        }
      };

      setIsRecording(true);
      setProgress(0);
      setAudioChunks([]);

      const progressInterval = setInterval(() => {
        setProgress(prev => (prev >= 100 ? 100 : prev + 1));
      }, 100);

      return () => {
        clearInterval(progressInterval);
        if (sourceNodeRef.current && processorNodeRef.current) {
          sourceNodeRef.current.disconnect();
          processorNodeRef.current.disconnect();
        }
        stream.getTracks().forEach(track => track.stop());
      };
    } catch (error) {
      console.error("Error starting recording:", error);
    }
  };

 
  const stopRecording = () => {
    if (isRecording) {
      setIsRecording(false);
      if (sourceNodeRef.current && processorNodeRef.current) {
        sourceNodeRef.current.disconnect();
        processorNodeRef.current.disconnect();
      }
      processAudioChunks();
    }
  };
 const processAudioChunks = () => {
    console.log("Processing audio chunks");
    console.log("Number of chunks:", audioChunks.length);

    if (audioChunks.length > 0) {
      const combinedChunks = new Float32Array(audioChunks.reduce((acc, chunk) => acc + chunk.length, 0));
      let offset = 0;
      audioChunks.forEach(chunk => {
        combinedChunks.set(chunk, offset);
        offset += chunk.length;
      });

      const audioBuffer = audioContextRef.current!.createBuffer(1, combinedChunks.length, SAMPLE_RATE);
      audioBuffer.getChannelData(0).set(combinedChunks);

      const audioBlob = audioBufferToWav(audioBuffer);
      console.log("Created audio blob, size:", audioBlob.size);
      processAudioBlob(audioBlob);
    } else {
      console.error("No audio data available");
    }
  };

  const audioBufferToWav = (buffer: AudioBuffer): Blob => {
    const numOfChan = buffer.numberOfChannels;
    const length = buffer.length * numOfChan * 2 + 44;
    const data = new ArrayBuffer(length);
    const view = new DataView(data);

    // Write WAV header
    writeString(view, 0, 'RIFF');
    view.setUint32(4, length - 8, true);
    writeString(view, 8, 'WAVE');
    writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, numOfChan, true);
    view.setUint32(24, buffer.sampleRate, true);
    view.setUint32(28, buffer.sampleRate * 2 * numOfChan, true);
    view.setUint16(32, numOfChan * 2, true);
    view.setUint16(34, 16, true);
    writeString(view, 36, 'data');
    view.setUint32(40, length - 44, true);

    // Write PCM audio data
    const floatTo16BitPCM = (output: DataView, offset: number, input: Float32Array) => {
      for (let i = 0; i < input.length; i++, offset += 2) {
        const s = Math.max(-1, Math.min(1, input[i]));
        output.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
      }
    };

    floatTo16BitPCM(view, 44, buffer.getChannelData(0));

    return new Blob([data], { type: 'audio/wav' });
  };

  const writeString = (view: DataView, offset: number, string: string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
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
    console.log("Processing audio blob, size:", audioBlob.size);
    const reader = new FileReader();

    reader.onload = async (event) => {
      const arrayBuffer = event.target?.result as ArrayBuffer;

      if (arrayBuffer.byteLength > 0) {
        console.log("ArrayBuffer length:", arrayBuffer.byteLength);
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();

        try {
          const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
          console.log("Audio decoded successfully, duration:", audioBuffer.duration);
          const channelData = audioBuffer.getChannelData(0);
          const frames = createOverlappingFrames(new Float32Array(channelData));

          const uint8Frames = frames.map(frame => {
            const uint8Array = new Uint8Array(frame.buffer);
            return uint8Array;
          });

          setAudioData(prev => [...prev, uint8Frames]);


            /* TODO: Comparison 
          
          setExtractedText(transcribedText);
          compareText(textInput, transcribedText);   */

        } catch (error) {
          console.error("Error decoding audio data:", error);
        }
      } else {
        console.error("Empty ArrayBuffer");
      }
    };

    reader.onerror = (error) => {
      console.error("FileReader error:", error);
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
