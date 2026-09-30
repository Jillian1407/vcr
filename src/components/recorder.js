
import React, { useRef, useState } from 'react';
import { FaCircleStop, FaMicrophone } from 'react-icons/fa6';

export default function Recorder() {
  const [isRecording, setIsRecording] = useState(false);
  const [recordedURL, setRecordedURL] = useState('');
  const [seconds, setSeconds] = useState(0);
  const [error, setError] = useState('');

  const mediaStream = useRef(null);
  const mediaRecorder = useRef(null);
  const chunks = useRef([]);
  const timer = useRef(null);

  const startRecording = async () => {
    try {
      setError('');
      setSeconds(0);
      chunks.current = [];

//permission kineme
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true
      });

      mediaStream.current = stream;

//check if supported lang yung ano
      if (!window.MediaRecorder) {
        setError('MediaRecorder is not supported by this browser.');
        return;
      }


      let options = {};

      if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
        options = { mimeType: 'audio/webm;codecs=opus' };
      } else if (MediaRecorder.isTypeSupported('audio/webm')) {
        options = { mimeType: 'audio/webm' };
      }

      mediaRecorder.current = new MediaRecorder(stream, options);

//receive audio
      mediaRecorder.current.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          chunks.current.push(event.data);
        }
      };

//pag stop na recording
      mediaRecorder.current.onstop = () => {
        const mimeType =
          mediaRecorder.current?.mimeType || 'audio/webm';

        const recordedBlob = new Blob(chunks.current, {
          type: mimeType
        });

        const url = URL.createObjectURL(recordedBlob);

        setRecordedURL(url);

        chunks.current = [];

//stop timer
        if (timer.current) {
          clearInterval(timer.current);
          timer.current = null;
        }
      };

      mediaRecorder.current.onerror = (event) => {
        console.error('MediaRecorder error:', event);
        setError('An error occurred while recording.');
      };

//start rec
      mediaRecorder.current.start();

      setIsRecording(true);

//start timer
      timer.current = setInterval(() => {
        setSeconds((prev) => prev + 1);
      }, 1000);

    } catch (error) {
      console.error('Microphone error:', error);

      setIsRecording(false);

      if (error.name === 'NotAllowedError') {
        setError('Microphone permission was denied.');
      } else if (error.name === 'NotFoundError') {
        setError('No microphone was found.');
      } else {
        setError('Could not access the microphone.');
      }
    }
  };

  const stopRecording = () => {
    if (mediaRecorder.current) {
      if (mediaRecorder.current.state !== 'inactive') {
        mediaRecorder.current.stop();
      }
    }

    if (mediaStream.current) {
      mediaStream.current.getTracks().forEach((track) => {
        track.stop();
      });
    }

    setIsRecording(false);

    if (timer.current) {
      clearInterval(timer.current);
      timer.current = null;
    }
  };

    const formatTime = (totalSeconds) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;

    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(
      2,
      '0'
    )}:${String(secs).padStart(2, '0')}`;
  };

  return (
    <div className="w-full h-screen flex flex-col items-center justify-center bg-gradient-to-r from-[#ff69b4] to-[#ffb6d9] gap-4">

      <h1 className="text-[#4A2633] text-[60px] font-black">
        Voice Recorder 
        </h1>
        
        <h2 className="text-[#4A2633] text-[100px] bg-white p-4 rounded-lg mx-4">
            {formatTime(seconds)} </h2>

      {isRecording ? (
        <button
          onClick={stopRecording}
          className="flex items-center justify-center text-[60px] bg-red-500 rounded-full p-4 text-white w-[100px] h-[100px]"
        >
          <FaCircleStop />
        </button>
      ) : (
        <button
        onClick={startRecording}
        className="flex items-center justify-center text-[60px] bg-[#e4007c] rounded-full p-4 text-white w-[100px] h-[100px]">
            <FaMicrophone />
            </button>
      )}

      {error && (
        <p className="text-white bg-red-600 px-4 py-2 rounded-lg">
          {error}
        </p>
      )}

      {recordedURL && (
        <audio controls src={recordedURL} />
      )}

    </div>
  );
}

