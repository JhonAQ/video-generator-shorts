"use client";

import React, { useCallback, useState, useRef, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, Upload, Play, Pause, Volume2, X, Clock } from "lucide-react";
import useVideoStore from "@/store/useVideoStore";

interface AudioUploaderProps {
  className?: string;
}

export default function AudioUploader({ className = "" }: AudioUploaderProps) {
  const { currentProject, setAudioNarration } = useVideoStore();
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    if (currentProject.audioNarration) {
      const url = URL.createObjectURL(currentProject.audioNarration);
      setAudioUrl(url);

      return () => {
        URL.revokeObjectURL(url);
      };
    } else {
      setAudioUrl(null);
      setCurrentTime(0);
      setDuration(0);
      setIsPlaying(false);
    }
  }, [currentProject.audioNarration]);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const audioFile = acceptedFiles[0];
      if (audioFile && audioFile.type.startsWith("audio/")) {
        setAudioNarration(audioFile);
      }
    },
    [setAudioNarration]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "audio/*": [".mp3", ".wav", ".ogg", ".m4a", ".aac"],
    },
    maxFiles: 1,
  });

  const removeAudio = () => {
    setAudioNarration(undefined);
  };

  const togglePlayPause = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!audioRef.current) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = x / rect.width;
    const newTime = percentage * duration;

    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  const hasAudio = !!currentProject.audioNarration;
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Audio de Narración</h2>
          <p className="text-gray-400 mt-1">
            Sube el archivo de audio que narrará tu video
          </p>
        </div>
      </div>

      {/* Upload Area or Audio Player */}
      <AnimatePresence mode="wait">
        {!hasAudio ? (
          <div
            key="upload"
            {...getRootProps()}
            className={`
              relative border-2 border-dashed rounded-xl p-8 transition-all cursor-pointer
              ${
                isDragActive
                  ? "border-purple-500 bg-purple-500/10"
                  : "border-gray-700 hover:border-gray-600 bg-gray-900/50"
              }
            `}
          >
            <input {...getInputProps()} />
            <div className="text-center">
              <motion.div
                animate={{
                  y: isDragActive ? -5 : 0,
                  scale: isDragActive ? 1.1 : 1,
                }}
                transition={{ duration: 0.2 }}
              >
                <div className="flex justify-center mb-4">
                  <div className="relative">
                    <Mic className="h-12 w-12 text-gray-400" />
                    <Upload className="absolute -top-1 -right-1 h-6 w-6 text-purple-500" />
                  </div>
                </div>
              </motion.div>
              <h3 className="text-lg font-semibold text-white mb-2">
                {isDragActive
                  ? "Suelta el audio aquí"
                  : "Arrastra o selecciona un archivo de audio"}
              </h3>
              <p className="text-gray-400 mb-2">
                Formatos soportados: MP3, WAV, OGG, M4A, AAC
              </p>
              <p className="text-sm text-gray-500">
                Este será el audio principal que se escuchará durante todo el
                video
              </p>
            </div>
          </div>
        ) : (
          <div
            key="player"
            className="bg-gray-900/50 border border-gray-700 rounded-xl p-6"
          >
            {audioUrl && (
              <audio
                ref={audioRef}
                src={audioUrl}
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={handleLoadedMetadata}
                onEnded={() => setIsPlaying(false)}
              />
            )}

            <div className="space-y-4">
              {/* File Info */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center">
                    <Volume2 className="w-6 h-6 text-purple-400" />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold">
                      {currentProject.audioNarration?.name}
                    </h3>
                    <p className="text-gray-400 text-sm">
                      {(
                        currentProject.audioNarration?.size! /
                        (1024 * 1024)
                      ).toFixed(2)}{" "}
                      MB
                      {duration > 0 && ` • ${formatTime(duration)}`}
                    </p>
                  </div>
                </div>
                <button
                  onClick={removeAudio}
                  className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Progress Bar */}
              <div className="space-y-2">
                <div
                  className="relative h-2 bg-gray-700 rounded-full cursor-pointer"
                  onClick={handleSeek}
                >
                  <motion.div
                    className="h-full bg-purple-500 rounded-full"
                    style={{ width: `${progress}%` }}
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.1 }}
                  />
                  <div
                    className="absolute w-4 h-4 bg-purple-500 rounded-full -top-1 shadow-lg"
                    style={{ left: `calc(${progress}% - 8px)` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-gray-400">
                  <span>{formatTime(currentTime)}</span>
                  <span>{formatTime(duration)}</span>
                </div>
              </div>

              {/* Controls */}
              <div className="flex items-center justify-center">
                <button
                  onClick={togglePlayPause}
                  disabled={!audioUrl}
                  className="flex items-center justify-center w-12 h-12 bg-purple-500 hover:bg-purple-600 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-full transition-colors"
                >
                  {isPlaying ? (
                    <Pause className="w-6 h-6 text-white" />
                  ) : (
                    <Play className="w-6 h-6 text-white ml-1" />
                  )}
                </button>
              </div>

              {/* Duration Warning */}
              {duration > 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className={`
                    flex items-center gap-2 p-3 rounded-lg
                    ${
                      duration > 65
                        ? "bg-orange-500/10 border border-orange-500/30"
                        : "bg-green-500/10 border border-green-500/30"
                    }
                  `}
                >
                  <Clock
                    className={`w-4 h-4 ${
                      duration > 65 ? "text-orange-400" : "text-green-400"
                    }`}
                  />
                  <span
                    className={`text-sm ${
                      duration > 65 ? "text-orange-300" : "text-green-300"
                    }`}
                  >
                    {duration > 65
                      ? `Tu audio dura ${formatTime(
                          duration
                        )}. Se recomienda máximo 65 segundos para videos de 60s + fade-out.`
                      : `Perfecto: ${formatTime(
                          duration
                        )} de duración para un video de 60 segundos.`}
                  </span>
                </motion.div>
              )}
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
