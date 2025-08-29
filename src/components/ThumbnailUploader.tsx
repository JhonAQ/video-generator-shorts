"use client";

import React, { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { motion, AnimatePresence } from "framer-motion";
import { Image as ImageIcon, Upload, X, Clock } from "lucide-react";
import useVideoStore from "@/store/useVideoStore";

interface ThumbnailUploaderProps {
  className?: string;
}

export default function ThumbnailUploader({
  className = "",
}: ThumbnailUploaderProps) {
  const { currentProject, setThumbnail } = useVideoStore();

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const imageFile = acceptedFiles[0];
      if (imageFile && imageFile.type.startsWith("image/")) {
        setThumbnail(imageFile);
      }
    },
    [setThumbnail]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".jpeg", ".jpg", ".png", ".gif", ".webp"],
    },
    maxFiles: 1,
  });

  const removeThumbnail = () => {
    setThumbnail(undefined);
  };

  const hasThumbnail = !!currentProject.thumbnail;

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Miniatura de Intro</h2>
          <p className="text-gray-400 mt-1">
            Imagen que se mostrará por 0.2 segundos al inicio del video
          </p>
        </div>
      </div>

      {/* Upload Area or Thumbnail Display */}
      <AnimatePresence mode="wait">
        {!hasThumbnail ? (
          <div
            key="upload"
            {...getRootProps()}
            className={`
              relative border-2 border-dashed rounded-xl p-8 transition-all cursor-pointer
              ${
                isDragActive
                  ? "border-yellow-500 bg-yellow-500/10"
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
                    <ImageIcon className="h-12 w-12 text-gray-400" />
                    <Upload className="absolute -top-1 -right-1 h-6 w-6 text-yellow-500" />
                  </div>
                </div>
              </motion.div>
              <h3 className="text-lg font-semibold text-white mb-2">
                {isDragActive
                  ? "Suelta la miniatura aquí"
                  : "Arrastra o selecciona una miniatura"}
              </h3>
              <p className="text-gray-400 mb-2">
                Formatos soportados: JPG, PNG, GIF, WebP
              </p>
              <p className="text-sm text-gray-500">
                Recomendado: 1080x1920 (vertical) o 1920x1080 (horizontal)
              </p>
            </div>
          </div>
        ) : (
          <motion.div
            key="thumbnail"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-gray-900/50 border border-gray-700 rounded-xl p-6"
          >
            <div className="space-y-4">
              {/* Thumbnail Preview */}
              <div className="relative">
                <div className="aspect-video max-w-md mx-auto rounded-lg overflow-hidden bg-gray-800">
                  <img
                    src={URL.createObjectURL(currentProject.thumbnail!)}
                    alt="Thumbnail preview"
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Remove button */}
                <button
                  onClick={removeThumbnail}
                  className="absolute -top-2 -right-2 w-8 h-8 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* File Info */}
              <div className="text-center">
                <h3 className="text-white font-semibold mb-1">
                  {currentProject.thumbnail?.name}
                </h3>
                <p className="text-gray-400 text-sm">
                  {(
                    (currentProject.thumbnail?.size || 0) /
                    (1024 * 1024)
                  ).toFixed(2)}{" "}
                  MB
                </p>
              </div>

              {/* Duration info */}
              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3">
                <div className="flex items-center gap-2 text-yellow-300">
                  <Clock className="w-4 h-4" />
                  <span className="text-sm font-medium">
                    Duración: 0.2 segundos al inicio del video
                  </span>
                </div>
                <p className="text-yellow-200/80 text-xs mt-1">
                  Esta miniatura aparecerá brevemente antes de comenzar la
                  secuencia principal
                </p>
              </div>

              {/* Replace button */}
              <div className="flex justify-center">
                <div {...getRootProps()} className="cursor-pointer">
                  <input {...getInputProps()} />
                  <button className="px-6 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg transition-colors">
                    Cambiar Miniatura
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Optional indicator */}
      <div className="text-center">
        <p className="text-gray-500 text-sm">
          <span className="font-medium">Opcional:</span> Si no seleccionas una
          miniatura, el video comenzará directamente con las imágenes
        </p>
      </div>
    </div>
  );
}
