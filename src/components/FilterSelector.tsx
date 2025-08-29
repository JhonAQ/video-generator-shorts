"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Layers, Check, Info, Eye } from "lucide-react";
import useVideoStore from "@/store/useVideoStore";

interface FilterSelectorProps {
  className?: string;
}

export default function FilterSelector({
  className = "",
}: FilterSelectorProps) {
  const { currentProject, filters, selectFilter, loadFilters } =
    useVideoStore();

  const [previewFilter, setPreviewFilter] = useState<string | null>(null);

  useEffect(() => {
    loadFilters();
  }, [loadFilters]);

  const handleSelect = (filterId: string) => {
    if (currentProject.selectedFilter === filterId) {
      selectFilter(""); // Deselect if already selected
    } else {
      selectFilter(filterId);
    }
  };

  const handlePreview = (filterId: string) => {
    setPreviewFilter(previewFilter === filterId ? null : filterId);
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Filtros y Efectos</h2>
          <p className="text-gray-400 mt-1">
            Agrega efectos visuales con chroma key a tu video
          </p>
        </div>
      </div>

      {/* None Option */}
      <motion.div
        className={`
          relative group border-2 rounded-xl p-4 transition-all cursor-pointer
          ${
            !currentProject.selectedFilter
              ? "border-gray-500 bg-gray-500/10"
              : "border-gray-700 hover:border-gray-600 bg-gray-900/50"
          }
        `}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => selectFilter("")}
      >
        {/* Selection indicator */}
        <AnimatePresence>
          {!currentProject.selectedFilter && (
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.5 }}
              className="absolute -top-2 -right-2 w-6 h-6 bg-gray-500 rounded-full flex items-center justify-center z-10"
            >
              <Check className="w-4 h-4 text-white" />
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex items-center gap-4">
          <div
            className={`
            w-20 h-12 rounded-lg border-2 border-dashed flex items-center justify-center
            ${
              !currentProject.selectedFilter
                ? "border-gray-500"
                : "border-gray-700"
            }
          `}
          >
            <span
              className={`text-sm font-medium ${
                !currentProject.selectedFilter
                  ? "text-gray-300"
                  : "text-gray-500"
              }`}
            >
              Sin filtro
            </span>
          </div>

          <div className="flex-1">
            <h3
              className={`font-semibold ${
                !currentProject.selectedFilter
                  ? "text-gray-300"
                  : "text-gray-400"
              }`}
            >
              Sin efectos adicionales
            </h3>
            <p
              className={`text-sm ${
                !currentProject.selectedFilter
                  ? "text-gray-400"
                  : "text-gray-500"
              }`}
            >
              Video limpio sin overlays ni efectos especiales
            </p>
          </div>
        </div>
      </motion.div>

      {/* Filters Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filters.map((filter) => {
          const isSelected = currentProject.selectedFilter === filter.id;
          const isPreview = previewFilter === filter.id;

          return (
            <motion.div
              key={filter.id}
              layout
              className={`
                relative group border-2 rounded-xl overflow-hidden transition-all cursor-pointer
                ${
                  isSelected
                    ? "border-green-500 bg-green-500/10"
                    : "border-gray-700 hover:border-gray-600 bg-gray-900/50"
                }
              `}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleSelect(filter.id)}
            >
              {/* Selection indicator */}
              <AnimatePresence>
                {isSelected && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.5 }}
                    className="absolute top-2 right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center z-10"
                  >
                    <Check className="w-4 h-4 text-white" />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Preview Image */}
              <div className="relative h-32 bg-gray-800 overflow-hidden">
                {filter.preview ? (
                  <img
                    src={filter.preview}
                    alt={filter.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Layers className="w-12 h-12 text-gray-600" />
                  </div>
                )}

                {/* Preview overlay */}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePreview(filter.id);
                    }}
                    className="bg-white/20 hover:bg-white/30 rounded-full p-2 transition-colors"
                  >
                    <Eye className="w-5 h-5 text-white" />
                  </button>
                </div>
              </div>

              {/* Filter Info */}
              <div className="p-4">
                <h3
                  className={`font-semibold mb-1 ${
                    isSelected ? "text-green-300" : "text-white"
                  }`}
                >
                  {filter.name}
                </h3>

                <p className="text-sm text-gray-400 mb-3">
                  {filter.description}
                </p>

                {/* Technical info */}
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <Info className="w-3 h-3" />
                  <span>Chroma Key • Video overlay</span>
                </div>
              </div>

              {/* Selection overlay */}
              {isSelected && (
                <div className="absolute inset-0 bg-green-500/5 pointer-events-none" />
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Preview Modal */}
      <AnimatePresence>
        {previewFilter && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
            onClick={() => setPreviewFilter(null)}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="bg-gray-900 rounded-xl border border-gray-700 max-w-2xl w-full max-h-[80vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Preview content */}
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-white">
                    Vista Previa:{" "}
                    {filters.find((f) => f.id === previewFilter)?.name}
                  </h3>
                  <button
                    onClick={() => setPreviewFilter(null)}
                    className="text-gray-400 hover:text-white"
                  >
                    ✕
                  </button>
                </div>

                <div className="aspect-video bg-gray-800 rounded-lg mb-4">
                  {filters.find((f) => f.id === previewFilter)?.preview ? (
                    <img
                      src={filters.find((f) => f.id === previewFilter)?.preview}
                      alt="Preview"
                      className="w-full h-full object-cover rounded-lg"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Layers className="w-16 h-16 text-gray-600" />
                    </div>
                  )}
                </div>

                <p className="text-gray-300 mb-4">
                  {filters.find((f) => f.id === previewFilter)?.description}
                </p>

                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      handleSelect(previewFilter);
                      setPreviewFilter(null);
                    }}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg transition-colors"
                  >
                    Seleccionar Filtro
                  </button>
                  <button
                    onClick={() => setPreviewFilter(null)}
                    className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg transition-colors"
                  >
                    Cerrar
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Selected Filter Info */}
      {currentProject.selectedFilter && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-green-500/10 border border-green-500/30 rounded-xl p-4"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-green-500/20 rounded-lg flex items-center justify-center">
              <Layers className="w-4 h-4 text-green-400" />
            </div>
            <div>
              <p className="text-green-300 font-medium">Filtro Seleccionado</p>
              <p className="text-green-200/80 text-sm">
                {
                  filters.find((f) => f.id === currentProject.selectedFilter)
                    ?.name
                }
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Instructions */}
      {!currentProject.selectedFilter && filters.length === 0 && (
        <div className="text-center py-8">
          <Layers className="w-12 h-12 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400">Cargando filtros disponibles...</p>
        </div>
      )}
    </div>
  );
}
