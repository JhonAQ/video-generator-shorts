"use client";

import React, { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload,
  X,
  Image as ImageIcon,
  Shuffle,
  Trash2,
  Grid3X3,
} from "lucide-react";
import useVideoStore from "@/store/useVideoStore";

interface ImageUploaderProps {
  className?: string;
}

export default function ImageUploader({ className = "" }: ImageUploaderProps) {
  const { currentProject, addImages, updateCurrentProject } = useVideoStore();
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const imageFiles = acceptedFiles.filter((file) =>
        file.type.startsWith("image/")
      );

      if (imageFiles.length > 0) {
        addImages(imageFiles);
      }
    },
    [addImages]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".jpeg", ".jpg", ".png", ".gif", ".webp"],
    },
    maxFiles: 30,
    disabled: (currentProject.images?.length || 0) >= 30,
  });

  const removeImage = (index: number) => {
    const newImages = [...(currentProject.images || [])];
    newImages.splice(index, 1);
    updateCurrentProject({ images: newImages });
  };

  const shuffleImages = () => {
    if (!currentProject.images || currentProject.images.length === 0) return;

    const shuffled = [...currentProject.images].sort(() => Math.random() - 0.5);
    updateCurrentProject({ images: shuffled });
  };

  const clearAll = () => {
    updateCurrentProject({ images: [] });
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null) return;

    const newImages = [...(currentProject.images || [])];
    const draggedItem = newImages[draggedIndex];

    newImages.splice(draggedIndex, 1);
    newImages.splice(targetIndex, 0, draggedItem);

    updateCurrentProject({ images: newImages });
    setDraggedIndex(targetIndex);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const images = currentProject.images || [];
  const hasImages = images.length > 0;
  const isComplete = images.length === 30;

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Imágenes del Video</h2>
          <p className="text-gray-400 mt-1">
            {images.length}/30 imágenes • Cada imagen durará 2 segundos
          </p>
        </div>

        {hasImages && (
          <div className="flex gap-3">
            <button
              onClick={shuffleImages}
              className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors text-sm text-gray-300"
            >
              <Shuffle className="w-4 h-4" />
              Mezclar
            </button>
            <button
              onClick={clearAll}
              className="flex items-center gap-2 px-4 py-2 bg-red-900/30 hover:bg-red-900/50 rounded-lg transition-colors text-sm text-red-400"
            >
              <Trash2 className="w-4 h-4" />
              Limpiar
            </button>
          </div>
        )}
      </div>

      {/* Progress Bar */}
      <div className="relative">
        <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
          <motion.div
            className={`h-full ${
              isComplete
                ? "bg-green-500"
                : images.length > 15
                ? "bg-blue-500"
                : "bg-gray-600"
            }`}
            initial={{ width: 0 }}
            animate={{ width: `${(images.length / 30) * 100}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>0</span>
          <span>15</span>
          <span>30</span>
        </div>
      </div>

      {/* Upload Area */}
      {!isComplete && (
        <div
          {...getRootProps()}
          className={`
            relative border-2 border-dashed rounded-xl p-8 transition-all cursor-pointer
            ${
              isDragActive
                ? "border-blue-500 bg-blue-500/10"
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
              <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            </motion.div>
            <h3 className="text-lg font-semibold text-white mb-2">
              {isDragActive
                ? "Suelta las imágenes aquí"
                : "Arrastra o selecciona imágenes"}
            </h3>
            <p className="text-gray-400 mb-4">
              Formatos soportados: JPG, PNG, GIF, WebP
            </p>
            <p className="text-sm text-gray-500">
              Faltan {30 - images.length} imágenes para completar
            </p>
          </div>
        </div>
      )}

      {/* Images Grid */}
      <AnimatePresence>
        {hasImages && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-4"
          >
            <div className="flex items-center gap-3">
              <Grid3X3 className="w-5 h-5 text-gray-400" />
              <span className="text-sm text-gray-400">
                Arrastra para reordenar las imágenes
              </span>
            </div>

            <div className="grid grid-cols-6 gap-3">
              {images.map((image, index) => (
                <motion.div
                  key={`${image.name}-${index}`}
                  layout
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="relative group aspect-square"
                  draggable
                  onDragStart={() => handleDragStart(index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDragEnd={handleDragEnd}
                >
                  <div
                    className={`
                    relative w-full h-full rounded-lg overflow-hidden border-2 transition-all cursor-grab active:cursor-grabbing
                    ${
                      draggedIndex === index
                        ? "border-blue-500 shadow-lg shadow-blue-500/25"
                        : "border-gray-700 hover:border-gray-600"
                    }
                  `}
                  >
                    <img
                      src={URL.createObjectURL(image)}
                      alt={`Image ${index + 1}`}
                      className="w-full h-full object-cover"
                    />

                    {/* Order Number */}
                    <div className="absolute top-1 left-1 bg-black/70 text-white text-xs px-1.5 py-0.5 rounded">
                      {index + 1}
                    </div>

                    {/* Remove Button */}
                    <button
                      onClick={() => removeImage(index)}
                      className="absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-3 h-3" />
                    </button>

                    {/* Duration Label */}
                    <div className="absolute bottom-1 right-1 bg-black/70 text-white text-xs px-1.5 py-0.5 rounded">
                      2s
                    </div>
                  </div>
                </motion.div>
              ))}

              {/* Empty slots */}
              {Array.from({ length: 30 - images.length }).map((_, index) => (
                <div
                  key={`empty-${index}`}
                  className="aspect-square border-2 border-dashed border-gray-800 rounded-lg flex items-center justify-center"
                >
                  <div className="text-center">
                    <ImageIcon className="w-6 h-6 text-gray-600 mx-auto mb-1" />
                    <span className="text-xs text-gray-600">
                      {images.length + index + 1}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Completion Status */}
      {isComplete && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 text-center"
        >
          <div className="text-green-400 text-lg font-semibold mb-1">
            ✓ Imágenes Completas
          </div>
          <p className="text-green-300/80 text-sm">
            Tienes las 30 imágenes necesarias para crear tu video de 60 segundos
          </p>
        </motion.div>
      )}
    </div>
  );
}
