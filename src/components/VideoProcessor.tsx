"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Play,
  Loader,
  CheckCircle,
  XCircle,
  Download,
  Eye,
  Clock,
  Layers,
  Volume2,
  Image as ImageIcon,
} from "lucide-react";
import useVideoStore from "@/store/useVideoStore";
import {
  useFFmpeg,
  ProcessingProgress as FFmpegProgress,
} from "@/hooks/useFFmpeg";

interface VideoProcessorProps {
  className?: string;
}

interface ProcessingStep {
  id: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  progress: number;
  status: "pending" | "active" | "completed" | "error";
}

const VideoProcessor: React.FC<VideoProcessorProps> = ({ className = "" }) => {
  const {
    currentProject,
    isProcessing,
    processingProgress,
    startProcessing,
    updateProgress,
    completeProcessing,
    failProcessing,
    soundtracks,
  } = useVideoStore();

  const { load, createVideo, isLoaded, isLoading, error } = useFFmpeg();
  const [videoBlob, setVideoBlob] = useState<Blob | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);

  const [currentStep, setCurrentStep] = useState(0);
  const [steps, setSteps] = useState<ProcessingStep[]>([
    {
      id: "loading",
      label: "Inicializando procesador",
      description: "Cargando FFmpeg en el navegador",
      icon: <Loader className="w-5 h-5" />,
      progress: 0,
      status: "pending",
    },
    {
      id: "validation",
      label: "Validando archivos",
      description: "Verificando que todos los archivos estén listos",
      icon: <CheckCircle className="w-5 h-5" />,
      progress: 0,
      status: "pending",
    },
    {
      id: "images",
      label: "Procesando imágenes",
      description: "Ordenando y redimensionando las 30 imágenes",
      icon: <ImageIcon className="w-5 h-5" />,
      progress: 0,
      status: "pending",
    },
    {
      id: "audio",
      label: "Sincronizando audio",
      description: "Mezclando narración y soundtrack",
      icon: <Volume2 className="w-5 h-5" />,
      progress: 0,
      status: "pending",
    },
    {
      id: "effects",
      label: "Aplicando efectos",
      description: "Agregando filtros y transiciones",
      icon: <Layers className="w-5 h-5" />,
      progress: 0,
      status: "pending",
    },
    {
      id: "rendering",
      label: "Renderizando video",
      description: "Generando el archivo final",
      icon: <Play className="w-5 h-5" />,
      progress: 0,
      status: "pending",
    },
  ]);

  // Auto-load FFmpeg when component mounts
  useEffect(() => {
    if (!isLoaded && !isLoading) {
      load();
    }
  }, [isLoaded, isLoading, load]);

  const canProcess = () => {
    return (
      isLoaded &&
      currentProject.images &&
      currentProject.images.length === 30 &&
      currentProject.audioNarration
    );
  };

  const updateStepProgress = (
    stepId: string,
    progress: number,
    status: ProcessingStep["status"]
  ) => {
    setSteps((prev) =>
      prev.map((step) =>
        step.id === stepId ? { ...step, progress, status } : step
      )
    );
  };

  const handleStartProcessing = async () => {
    if (!canProcess()) return;

    startProcessing();
    setVideoBlob(null);
    setVideoUrl(null);

    try {
      // Get soundtrack URL if selected
      let soundtrackUrl: string | undefined;
      if (currentProject.selectedSoundtrack) {
        const selectedTrack = soundtracks.find(
          (s) => s.id === currentProject.selectedSoundtrack
        );
        soundtrackUrl = selectedTrack?.file;
      }

      const videoConfig = {
        images: currentProject.images || [],
        audioNarration: currentProject.audioNarration!,
        selectedSoundtrack: soundtrackUrl,
        selectedFilter: currentProject.selectedFilter,
        thumbnail: currentProject.thumbnail,
      };

      const blob = await createVideo(
        videoConfig,
        (progress: FFmpegProgress) => {
          // Map FFmpeg phases to our steps
          const stepMapping: Record<string, number> = {
            loading: 0,
            preparing: 1,
            processing: 3,
            finalizing: 5,
            completed: 5,
            error: -1,
          };

          const stepIndex = stepMapping[progress.phase] || 0;
          setCurrentStep(stepIndex);

          // Update current step
          if (stepIndex >= 0) {
            updateStepProgress(
              steps[stepIndex].id,
              progress.progress,
              "active"
            );

            // Mark previous steps as completed
            for (let i = 0; i < stepIndex; i++) {
              updateStepProgress(steps[i].id, 100, "completed");
            }
          }

          // Update global progress
          const globalProgress = stepIndex * 16.67 + progress.progress * 0.1667;
          updateProgress(Math.min(globalProgress, 100));

          if (progress.phase === "completed") {
            // Mark all steps as completed
            steps.forEach((step) => {
              updateStepProgress(step.id, 100, "completed");
            });
          }
        }
      );

      if (blob) {
        setVideoBlob(blob);
        const url = URL.createObjectURL(blob);
        setVideoUrl(url);
        completeProcessing(url);
      } else {
        throw new Error("No se pudo generar el video");
      }
    } catch (err) {
      console.error("Error processing video:", err);
      failProcessing(err instanceof Error ? err.message : "Error desconocido");

      // Mark current step as error
      if (currentStep < steps.length) {
        updateStepProgress(steps[currentStep].id, 0, "error");
      }
    }
  };

  const handleDownload = () => {
    if (videoUrl) {
      const link = document.createElement("a");
      link.href = videoUrl;
      link.download = `${currentProject.name || "video"}.mp4`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handlePreview = () => {
    if (videoUrl) {
      window.open(videoUrl, "_blank");
    }
  };

  const getStepColor = (status: string) => {
    switch (status) {
      case "completed":
        return "text-green-400 bg-green-500/20 border-green-500/30";
      case "active":
        return "text-blue-400 bg-blue-500/20 border-blue-500/30";
      case "error":
        return "text-red-400 bg-red-500/20 border-red-500/30";
      default:
        return "text-gray-400 bg-gray-500/10 border-gray-700";
    }
  };

  const getStepIcon = (step: ProcessingStep) => {
    if (step.status === "completed") {
      return <CheckCircle className="w-5 h-5 text-green-400" />;
    } else if (step.status === "active") {
      return <Loader className="w-5 h-5 text-blue-400 animate-spin" />;
    } else if (step.status === "error") {
      return <XCircle className="w-5 h-5 text-red-400" />;
    }
    return step.icon;
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Generar Video</h2>
          <p className="text-gray-400 mt-1">
            Procesa todos los elementos para crear tu video
          </p>
        </div>
      </div>

      {/* Requirements Check */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-white">Requisitos</h3>

        <div className="space-y-2">
          <div
            className={`flex items-center gap-3 p-3 rounded-lg ${
              currentProject.images?.length === 30
                ? "bg-green-500/10 border border-green-500/30"
                : "bg-red-500/10 border border-red-500/30"
            }`}
          >
            {currentProject.images?.length === 30 ? (
              <CheckCircle className="w-5 h-5 text-green-400" />
            ) : (
              <XCircle className="w-5 h-5 text-red-400" />
            )}
            <div>
              <span
                className={`font-medium ${
                  currentProject.images?.length === 30
                    ? "text-green-300"
                    : "text-red-300"
                }`}
              >
                30 Imágenes
              </span>
              <p
                className={`text-sm ${
                  currentProject.images?.length === 30
                    ? "text-green-200/80"
                    : "text-red-200/80"
                }`}
              >
                {currentProject.images?.length || 0} de 30 imágenes cargadas
              </p>
            </div>
          </div>

          <div
            className={`flex items-center gap-3 p-3 rounded-lg ${
              currentProject.audioNarration
                ? "bg-green-500/10 border border-green-500/30"
                : "bg-red-500/10 border border-red-500/30"
            }`}
          >
            {currentProject.audioNarration ? (
              <CheckCircle className="w-5 h-5 text-green-400" />
            ) : (
              <XCircle className="w-5 h-5 text-red-400" />
            )}
            <div>
              <span
                className={`font-medium ${
                  currentProject.audioNarration
                    ? "text-green-300"
                    : "text-red-300"
                }`}
              >
                Audio de Narración
              </span>
              <p
                className={`text-sm ${
                  currentProject.audioNarration
                    ? "text-green-200/80"
                    : "text-red-200/80"
                }`}
              >
                {currentProject.audioNarration
                  ? "Audio cargado"
                  : "Falta el audio principal"}
              </p>
            </div>
          </div>

          {/* FFmpeg Status */}
          <div
            className={`flex items-center gap-3 p-3 rounded-lg ${
              isLoaded
                ? "bg-green-500/10 border border-green-500/30"
                : isLoading
                ? "bg-yellow-500/10 border border-yellow-500/30"
                : error
                ? "bg-red-500/10 border border-red-500/30"
                : "bg-gray-500/10 border border-gray-700"
            }`}
          >
            {isLoaded ? (
              <CheckCircle className="w-5 h-5 text-green-400" />
            ) : isLoading ? (
              <Loader className="w-5 h-5 text-yellow-400 animate-spin" />
            ) : error ? (
              <XCircle className="w-5 h-5 text-red-400" />
            ) : (
              <Clock className="w-5 h-5 text-gray-400" />
            )}
            <div>
              <span
                className={`font-medium ${
                  isLoaded
                    ? "text-green-300"
                    : isLoading
                    ? "text-yellow-300"
                    : error
                    ? "text-red-300"
                    : "text-gray-300"
                }`}
              >
                Procesador de Video
              </span>
              <p
                className={`text-sm ${
                  isLoaded
                    ? "text-green-200/80"
                    : isLoading
                    ? "text-yellow-200/80"
                    : error
                    ? "text-red-200/80"
                    : "text-gray-200/80"
                }`}
              >
                {isLoaded
                  ? "FFmpeg cargado y listo"
                  : isLoading
                  ? "Cargando procesador..."
                  : error
                  ? "Error al cargar el procesador"
                  : "Procesador no inicializado"}
              </p>
            </div>
          </div>
        </div>

        {/* Optional requirements */}
        <div className="mt-4">
          <h4 className="text-sm font-medium text-gray-300 mb-2">Opcional</h4>
          <div className="grid grid-cols-2 gap-2">
            <div className="flex items-center gap-2 p-2 rounded-lg bg-gray-700/30">
              <div
                className={`w-3 h-3 rounded-full ${
                  currentProject.selectedSoundtrack
                    ? "bg-green-400"
                    : "bg-gray-500"
                }`}
              />
              <span className="text-sm text-gray-300">Soundtrack</span>
            </div>
            <div className="flex items-center gap-2 p-2 rounded-lg bg-gray-700/30">
              <div
                className={`w-3 h-3 rounded-full ${
                  currentProject.selectedFilter ? "bg-green-400" : "bg-gray-500"
                }`}
              />
              <span className="text-sm text-gray-300">Efectos</span>
            </div>
            <div className="flex items-center gap-2 p-2 rounded-lg bg-gray-700/30">
              <div
                className={`w-3 h-3 rounded-full ${
                  currentProject.thumbnail ? "bg-green-400" : "bg-gray-500"
                }`}
              />
              <span className="text-sm text-gray-300">Miniatura</span>
            </div>
          </div>
        </div>
      </div>

      {/* Process Button */}
      <div className="flex justify-center">
        <button
          onClick={handleStartProcessing}
          disabled={!canProcess() || isProcessing}
          className={`
            px-8 py-4 rounded-xl font-semibold text-lg transition-all
            ${
              canProcess() && !isProcessing
                ? "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl"
                : "bg-gray-700 text-gray-400 cursor-not-allowed"
            }
          `}
        >
          {isProcessing ? (
            <div className="flex items-center gap-3">
              <Loader className="w-6 h-6 animate-spin" />
              Procesando Video...
            </div>
          ) : !isLoaded ? (
            <div className="flex items-center gap-3">
              <Loader className="w-6 h-6 animate-spin" />
              Cargando Procesador...
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Play className="w-6 h-6" />
              Generar Video
            </div>
          )}
        </button>
      </div>

      {/* Processing Steps */}
      <AnimatePresence>
        {isProcessing && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-4"
          >
            <div className="text-center">
              <h3 className="text-lg font-semibold text-white mb-2">
                Progreso de Generación
              </h3>
              <div className="w-full bg-gray-700 rounded-full h-2 mb-4">
                <motion.div
                  className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${processingProgress}%` }}
                  transition={{ duration: 0.2 }}
                />
              </div>
            </div>

            <div className="space-y-3">
              {steps.map((step, index) => (
                <motion.div
                  key={step.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`
                    flex items-center gap-3 p-3 rounded-lg border-2
                    ${getStepColor(step.status)}
                  `}
                >
                  {getStepIcon(step)}
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{step.label}</span>
                      {step.status === "active" && (
                        <span className="text-sm">{step.progress}%</span>
                      )}
                    </div>
                    <p className="text-sm opacity-80">{step.description}</p>
                    {step.status === "active" && (
                      <div className="mt-2 h-1 bg-gray-600 rounded-full overflow-hidden">
                        <motion.div
                          className="h-full bg-blue-500"
                          initial={{ width: 0 }}
                          animate={{ width: `${step.progress}%` }}
                          transition={{ duration: 0.2 }}
                        />
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Completed Video */}
      <AnimatePresence>
        {videoUrl && videoBlob && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-green-500/10 border border-green-500/30 rounded-xl p-6"
          >
            <div className="text-center">
              <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-green-300 mb-2">
                ¡Video Completado!
              </h3>
              <p className="text-green-200/80 mb-6">
                Tu video ha sido generado exitosamente
              </p>

              <div className="flex gap-4 justify-center">
                <button
                  onClick={handlePreview}
                  className="flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                >
                  <Eye className="w-5 h-5" />
                  Vista Previa
                </button>
                <button
                  onClick={handleDownload}
                  className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  <Download className="w-5 h-5" />
                  Descargar
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default VideoProcessor;
