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

export default function VideoProcessor({
  className = "",
}: VideoProcessorProps) {
  const {
    currentProject,
    isProcessing,
    processingProgress,
    startProcessing,
    updateProgress,
    completeProcessing,
    failProcessing,
  } = useVideoStore();

  const [currentStep, setCurrentStep] = useState(0);
  const [steps, setSteps] = useState<ProcessingStep[]>([
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

  const canProcess = () => {
    return (
      currentProject.images &&
      currentProject.images.length === 30 &&
      currentProject.audioNarration
    );
  };

  const handleStartProcessing = async () => {
    if (!canProcess()) return;

    startProcessing();

    try {
      // Prepare form data
      const formData = new FormData();

      // Add project info
      formData.append(
        "projectName",
        currentProject.name || `Video ${new Date().toLocaleDateString()}`
      );

      // Add images
      currentProject.images?.forEach((image, index) => {
        formData.append(`image_${index}`, image);
      });

      // Add audio narration
      if (currentProject.audioNarration) {
        formData.append("audioNarration", currentProject.audioNarration);
      }

      // Add optional elements
      if (currentProject.selectedSoundtrack) {
        formData.append(
          "selectedSoundtrack",
          currentProject.selectedSoundtrack
        );
      }

      if (currentProject.selectedFilter) {
        formData.append("selectedFilter", currentProject.selectedFilter);
      }

      if (currentProject.thumbnail) {
        formData.append("thumbnail", currentProject.thumbnail);
      }

      // Send request to API
      const response = await fetch("/api/generate", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Error generating video");
      }

      const result = await response.json();
      console.log("Video generation started:", result);

      // Poll for status updates
      const projectId = result.projectId;
      const pollInterval = setInterval(async () => {
        try {
          const statusResponse = await fetch(
            `/api/generate?projectId=${projectId}`
          );

          if (statusResponse.ok) {
            const statusData = await statusResponse.json();
            const config = statusData.projectConfig;

            if (config.status === "completed") {
              clearInterval(pollInterval);
              completeProcessing(
                `/uploads/${projectId}/output/${config.outputFile}`
              );
            } else if (config.status === "error") {
              clearInterval(pollInterval);
              failProcessing(config.message || "Unknown error");
            } else if (config.progress) {
              updateProgress(config.progress);
            }
          }
        } catch (error) {
          console.error("Error polling status:", error);
        }
      }, 2000); // Poll every 2 seconds

      // Set timeout for polling (5 minutes max)
      setTimeout(() => {
        clearInterval(pollInterval);
        if (currentProject.status !== "completed") {
          failProcessing("Timeout: Video processing took too long");
        }
      }, 300000); // 5 minutes
    } catch (error) {
      console.error("Error starting video generation:", error);
      failProcessing(error instanceof Error ? error.message : "Unknown error");
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

          {/* Optional requirements */}
          <div className="grid grid-cols-2 gap-2">
            <div className="flex items-center gap-2 p-2 rounded-lg bg-gray-700/30">
              <div
                className={`w-3 h-3 rounded-full ${
                  currentProject.selectedSoundtrack
                    ? "bg-blue-400"
                    : "bg-gray-500"
                }`}
              />
              <span className="text-sm text-gray-300">
                Soundtrack{" "}
                {currentProject.selectedSoundtrack ? "✓" : "(Opcional)"}
              </span>
            </div>

            <div className="flex items-center gap-2 p-2 rounded-lg bg-gray-700/30">
              <div
                className={`w-3 h-3 rounded-full ${
                  currentProject.selectedFilter ? "bg-green-400" : "bg-gray-500"
                }`}
              />
              <span className="text-sm text-gray-300">
                Filtros {currentProject.selectedFilter ? "✓" : "(Opcional)"}
              </span>
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
            {/* Overall Progress */}
            <div className="bg-gray-900/50 border border-gray-700 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">
                  Progreso General
                </h3>
                <span className="text-sm text-gray-400">
                  {Math.round(processingProgress)}%
                </span>
              </div>

              <div className="relative h-3 bg-gray-700 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
                  initial={{ width: 0 }}
                  animate={{ width: `${processingProgress}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            </div>

            {/* Individual Steps */}
            <div className="space-y-3">
              {steps.map((step, index) => (
                <motion.div
                  key={step.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`
                    flex items-center gap-4 p-4 rounded-lg border
                    ${getStepColor(step.status)}
                  `}
                >
                  <div className="flex-shrink-0">{getStepIcon(step)}</div>

                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-white">{step.label}</h4>
                      {step.status === "active" && (
                        <span className="text-sm text-blue-300">
                          {step.progress}%
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-400 mt-1">
                      {step.description}
                    </p>

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
        {currentProject.status === "completed" && currentProject.videoUrl && (
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
                <button className="flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors">
                  <Eye className="w-5 h-5" />
                  Vista Previa
                </button>
                <button className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
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
}
