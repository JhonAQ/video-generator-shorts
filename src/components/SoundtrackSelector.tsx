"use client";

import React, { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Music, Play, Pause, Volume2, Check } from "lucide-react";
import useVideoStore from "@/store/useVideoStore";

interface SoundtrackSelectorProps {
  className?: string;
}

export default function SoundtrackSelector({
  className = "",
}: SoundtrackSelectorProps) {
  const { currentProject, soundtracks, selectSoundtrack, loadSoundtracks } =
    useVideoStore();

  const [playingId, setPlayingId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    loadSoundtracks();
  }, [loadSoundtracks]);

  const handlePlay = (soundtrackId: string, audioUrl: string) => {
    if (playingId === soundtrackId) {
      // Pause current audio
      if (audioRef.current) {
        audioRef.current.pause();
      }
      setPlayingId(null);
    } else {
      // Play new audio
      if (audioRef.current) {
        audioRef.current.src = audioUrl;
        audioRef.current.play();
      }
      setPlayingId(soundtrackId);
    }
  };

  const handleAudioEnded = () => {
    setPlayingId(null);
  };

  const handleSelect = (soundtrackId: string) => {
    selectSoundtrack(soundtrackId);
  };

  const getGenreColor = (genre: string) => {
    const colors: { [key: string]: string } = {
      Epic: "text-red-400 bg-red-500/20",
      Mystery: "text-purple-400 bg-purple-500/20",
      Electronic: "text-cyan-400 bg-cyan-500/20",
      Dramatic: "text-orange-400 bg-orange-500/20",
      Ambient: "text-green-400 bg-green-500/20",
      Action: "text-yellow-400 bg-yellow-500/20",
    };
    return colors[genre] || "text-gray-400 bg-gray-500/20";
  };

  const formatDuration = (duration: number) => {
    const minutes = Math.floor(duration / 60);
    const seconds = duration % 60;
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Hidden audio element for playback */}
      <audio ref={audioRef} onEnded={handleAudioEnded} className="hidden" />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Soundtrack de Fondo</h2>
          <p className="text-gray-400 mt-1">
            Selecciona la música que acompañará tu video
          </p>
        </div>
      </div>

      {/* Soundtracks Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {soundtracks.map((soundtrack) => {
          const isSelected =
            currentProject.selectedSoundtrack === soundtrack.id;
          const isPlaying = playingId === soundtrack.id;

          return (
            <motion.div
              key={soundtrack.id}
              layout
              className={`
                relative group border-2 rounded-xl p-4 transition-all cursor-pointer
                ${
                  isSelected
                    ? "border-blue-500 bg-blue-500/10"
                    : "border-gray-700 hover:border-gray-600 bg-gray-900/50"
                }
              `}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleSelect(soundtrack.id)}
            >
              {/* Selection indicator */}
              <AnimatePresence>
                {isSelected && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.5 }}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center z-10"
                  >
                    <Check className="w-4 h-4 text-white" />
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="flex items-center gap-4">
                {/* Album Art / Icon */}
                <div
                  className={`
                  relative w-16 h-16 rounded-lg flex items-center justify-center
                  ${isSelected ? "bg-blue-500/20" : "bg-gray-800"}
                `}
                >
                  <Music
                    className={`w-8 h-8 ${
                      isSelected ? "text-blue-400" : "text-gray-400"
                    }`}
                  />

                  {/* Play button overlay */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePlay(soundtrack.id, soundtrack.file);
                    }}
                    className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    {isPlaying ? (
                      <Pause className="w-6 h-6 text-white" />
                    ) : (
                      <Play className="w-6 h-6 text-white ml-1" />
                    )}
                  </button>
                </div>

                {/* Track Info */}
                <div className="flex-1 min-w-0">
                  <h3
                    className={`font-semibold truncate ${
                      isSelected ? "text-blue-300" : "text-white"
                    }`}
                  >
                    {soundtrack.name}
                  </h3>

                  <div className="flex items-center gap-2 mt-1">
                    {soundtrack.genre && (
                      <span
                        className={`
                        px-2 py-1 text-xs font-medium rounded-full
                        ${getGenreColor(soundtrack.genre)}
                      `}
                      >
                        {soundtrack.genre}
                      </span>
                    )}

                    {soundtrack.duration && (
                      <span className="text-sm text-gray-400">
                        {formatDuration(soundtrack.duration)}
                      </span>
                    )}
                  </div>

                  {/* Playing indicator */}
                  {isPlaying && (
                    <div className="flex items-center gap-2 mt-2">
                      <Volume2 className="w-4 h-4 text-blue-400" />
                      <div className="flex gap-1">
                        {[0, 1, 2].map((i) => (
                          <motion.div
                            key={i}
                            className="w-1 bg-blue-400 rounded-full"
                            animate={{
                              height: [4, 12, 4],
                            }}
                            transition={{
                              duration: 0.8,
                              repeat: Infinity,
                              delay: i * 0.2,
                            }}
                          />
                        ))}
                      </div>
                      <span className="text-xs text-blue-400">
                        Reproduciendo...
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Selection overlay */}
              {isSelected && (
                <div className="absolute inset-0 bg-blue-500/5 rounded-xl pointer-events-none" />
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Selected Soundtrack Info */}
      {currentProject.selectedSoundtrack && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center">
              <Music className="w-4 h-4 text-blue-400" />
            </div>
            <div>
              <p className="text-blue-300 font-medium">
                Soundtrack Seleccionado
              </p>
              <p className="text-blue-200/80 text-sm">
                {
                  soundtracks.find(
                    (s) => s.id === currentProject.selectedSoundtrack
                  )?.name
                }
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Instructions */}
      {!currentProject.selectedSoundtrack && (
        <div className="text-center py-8">
          <Music className="w-12 h-12 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400">
            Selecciona un soundtrack para darle ambiente a tu video
          </p>
          <p className="text-gray-500 text-sm mt-1">
            El volumen se ajustará automáticamente para no interferir con la
            narración
          </p>
        </div>
      )}
    </div>
  );
}
