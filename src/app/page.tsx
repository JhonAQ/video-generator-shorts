"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  Play,
  Film,
  Sparkles,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

// Components
import ImageUploader from "@/components/ImageUploader";
import AudioUploader from "@/components/AudioUploader";
import SoundtrackSelector from "@/components/SoundtrackSelector";
import FilterSelector from "@/components/FilterSelector";
import ThumbnailUploader from "@/components/ThumbnailUploader";
import VideoProcessor from "@/components/VideoProcessor";

const steps = [
  {
    id: "images",
    title: "Imágenes",
    description: "Carga las 30 imágenes para tu video",
    icon: <Film className="w-6 h-6" />,
    component: ImageUploader,
  },
  {
    id: "audio",
    title: "Audio",
    description: "Sube el audio de narración",
    icon: <Play className="w-6 h-6" />,
    component: AudioUploader,
  },
  {
    id: "soundtrack",
    title: "Soundtrack",
    description: "Selecciona música de fondo",
    icon: <Sparkles className="w-6 h-6" />,
    component: SoundtrackSelector,
  },
  {
    id: "filters",
    title: "Efectos",
    description: "Agrega filtros visuales",
    icon: <Sparkles className="w-6 h-6" />,
    component: FilterSelector,
  },
  {
    id: "thumbnail",
    title: "Miniatura",
    description: "Imagen de introducción",
    icon: <Film className="w-6 h-6" />,
    component: ThumbnailUploader,
  },
  {
    id: "generate",
    title: "Generar",
    description: "Crear el video final",
    icon: <ArrowRight className="w-6 h-6" />,
    component: VideoProcessor,
  },
];

export default function Home() {
  const [currentStep, setCurrentStep] = useState(0);

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const goToStep = (stepIndex: number) => {
    setCurrentStep(stepIndex);
  };

  const CurrentComponent = steps[currentStep].component;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900">
      {/* Background Pattern */}
      <div className="fixed inset-0 opacity-5">
        <div
          className="absolute inset-0 bg-repeat"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='7' cy='7' r='1'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
      </div>

      <div className="relative">
        {/* Header */}
        <header className="border-b border-gray-800">
          <div className="max-w-7xl mx-auto px-6 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                  <Film className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-white">
                    VideoGen Pro
                  </h1>
                  <p className="text-gray-400 text-sm">
                    Generador de Videos Profesional
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-gray-300 font-semibold">
                    Paso {currentStep + 1} de {steps.length}
                  </p>
                  <p className="text-gray-500 text-sm">
                    {steps[currentStep].title}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </header>

        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="grid grid-cols-12 gap-8">
            {/* Sidebar - Steps Navigation */}
            <div className="col-span-3">
              <div className="sticky top-8 space-y-1">
                <h3 className="text-lg font-semibold text-white mb-4">
                  Proceso de Creación
                </h3>

                {steps.map((step, index) => (
                  <button
                    key={step.id}
                    onClick={() => goToStep(index)}
                    className={`
                      w-full flex items-center gap-3 p-4 rounded-xl text-left transition-all
                      ${
                        index === currentStep
                          ? "bg-blue-600 text-white shadow-lg shadow-blue-600/25"
                          : index < currentStep
                          ? "bg-green-500/10 text-green-300 hover:bg-green-500/20"
                          : "bg-gray-800/50 text-gray-400 hover:bg-gray-800 hover:text-gray-300"
                      }
                    `}
                  >
                    <div
                      className={`
                      flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center
                      ${
                        index === currentStep
                          ? "bg-white/20"
                          : index < currentStep
                          ? "bg-green-500/20"
                          : "bg-gray-700"
                      }
                    `}
                    >
                      {index < currentStep ? (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center"
                        >
                          <div className="w-2 h-2 bg-white rounded-full" />
                        </motion.div>
                      ) : (
                        step.icon
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="font-semibold">{step.title}</p>
                      <p
                        className={`text-xs ${
                          index === currentStep
                            ? "text-blue-200"
                            : index < currentStep
                            ? "text-green-200/80"
                            : "text-gray-500"
                        }`}
                      >
                        {step.description}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Main Content */}
            <div className="col-span-9">
              <div className="bg-gray-900/30 backdrop-blur-sm border border-gray-800 rounded-2xl p-8">
                <motion.div
                  key={currentStep}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <CurrentComponent />
                </motion.div>

                {/* Navigation */}
                <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-800">
                  <button
                    onClick={prevStep}
                    disabled={currentStep === 0}
                    className={`
                      flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all
                      ${
                        currentStep === 0
                          ? "bg-gray-800 text-gray-500 cursor-not-allowed"
                          : "bg-gray-700 text-gray-300 hover:bg-gray-600 hover:text-white"
                      }
                    `}
                  >
                    <ChevronLeft className="w-5 h-5" />
                    Anterior
                  </button>

                  <div className="flex items-center gap-2">
                    {steps.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => goToStep(index)}
                        className={`
                          w-3 h-3 rounded-full transition-all
                          ${
                            index === currentStep
                              ? "bg-blue-500 w-8"
                              : index < currentStep
                              ? "bg-green-500"
                              : "bg-gray-600"
                          }
                        `}
                      />
                    ))}
                  </div>

                  <button
                    onClick={nextStep}
                    disabled={currentStep === steps.length - 1}
                    className={`
                      flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all
                      ${
                        currentStep === steps.length - 1
                          ? "bg-gray-800 text-gray-500 cursor-not-allowed"
                          : "bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-600/25"
                      }
                    `}
                  >
                    Siguiente
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
