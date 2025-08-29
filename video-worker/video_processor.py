#!/usr/bin/env python3
"""
Video Generator Worker
Procesa las imágenes, audio y efectos para crear el video final
"""

import os
import json
import sys
import subprocess
from pathlib import Path
from typing import List, Dict, Optional
import argparse


class VideoProcessor:
    def __init__(self, project_dir: str):
        self.project_dir = Path(project_dir)
        self.config_path = self.project_dir / "config.json"
        self.output_dir = self.project_dir / "output"
        self.images_dir = self.project_dir / "images"
        self.audio_dir = self.project_dir / "audio"

        # Load project configuration
        with open(self.config_path, "r", encoding="utf-8") as f:
            self.config = json.load(f)

    def update_status(self, status: str, progress: int = 0, message: str = ""):
        """Update project status"""
        self.config["status"] = status
        self.config["progress"] = progress
        if message:
            self.config["message"] = message

        with open(self.config_path, "w", encoding="utf-8") as f:
            json.dump(self.config, f, indent=2, ensure_ascii=False)

        print(f"Status: {status} ({progress}%) - {message}")

    def validate_files(self) -> bool:
        """Validate that all required files exist"""
        print("🔍 Validating files...")

        # Check images
        if len(self.config["images"]) != 30:
            self.update_status(
                "error",
                0,
                f"Se requieren 30 imágenes, encontradas: {len(self.config['images'])}",
            )
            return False

        for img_config in self.config["images"]:
            img_path = self.images_dir / img_config["filename"]
            if not img_path.exists():
                self.update_status(
                    "error", 0, f"Imagen no encontrada: {img_config['filename']}"
                )
                return False

        # Check audio narration
        audio_path = self.audio_dir / self.config["audio"]["narration"]["filename"]
        if not audio_path.exists():
            self.update_status(
                "error",
                0,
                f"Audio de narración no encontrado: {self.config['audio']['narration']['filename']}",
            )
            return False

        self.update_status("processing", 10, "Archivos validados correctamente")
        return True

    def prepare_images(self) -> List[str]:
        """Prepare and resize images to standard format"""
        print("🖼️ Preparing images...")

        image_paths = []
        processed_dir = self.output_dir / "processed_images"
        processed_dir.mkdir(exist_ok=True)

        for i, img_config in enumerate(self.config["images"]):
            input_path = self.images_dir / img_config["filename"]
            output_path = processed_dir / f"img_{i:02d}.jpg"

            # Use FFmpeg to resize and standardize images
            cmd = [
                "ffmpeg",
                "-y",
                "-i",
                str(input_path),
                "-vf",
                "scale=1920:1080:force_original_aspect_ratio=increase,crop=1920:1080",
                "-q:v",
                "2",
                str(output_path),
            ]

            try:
                subprocess.run(cmd, check=True, capture_output=True)
                image_paths.append(str(output_path))

                # Update progress
                progress = 10 + int((i + 1) / len(self.config["images"]) * 20)
                self.update_status(
                    "processing", progress, f"Procesando imagen {i + 1}/30"
                )

            except subprocess.CalledProcessError as e:
                self.update_status("error", 0, f"Error procesando imagen {i + 1}: {e}")
                return []

        return image_paths

    def prepare_audio(self) -> Dict[str, str]:
        """Prepare audio tracks"""
        print("🎵 Preparing audio...")

        audio_files = {}

        # Process narration audio
        narration_input = self.audio_dir / self.config["audio"]["narration"]["filename"]
        narration_output = self.output_dir / "narration.wav"

        cmd = [
            "ffmpeg",
            "-y",
            "-i",
            str(narration_input),
            "-acodec",
            "pcm_s16le",
            "-ar",
            "44100",
            "-ac",
            "2",
            str(narration_output),
        ]

        try:
            subprocess.run(cmd, check=True, capture_output=True)
            audio_files["narration"] = str(narration_output)
            self.update_status("processing", 35, "Audio de narración procesado")
        except subprocess.CalledProcessError as e:
            self.update_status("error", 0, f"Error procesando audio: {e}")
            return {}

        # Process soundtrack if selected
        if self.config.get("selectedSoundtrack"):
            soundtrack_path = Path(
                f"public/sounds/{self.config['selectedSoundtrack']}.mp3"
            )
            if soundtrack_path.exists():
                soundtrack_output = self.output_dir / "soundtrack.wav"

                cmd = [
                    "ffmpeg",
                    "-y",
                    "-i",
                    str(soundtrack_path),
                    "-acodec",
                    "pcm_s16le",
                    "-ar",
                    "44100",
                    "-ac",
                    "2",
                    "-af",
                    "volume=0.3",  # Lower volume for background
                    str(soundtrack_output),
                ]

                try:
                    subprocess.run(cmd, check=True, capture_output=True)
                    audio_files["soundtrack"] = str(soundtrack_output)
                    self.update_status("processing", 40, "Soundtrack procesado")
                except subprocess.CalledProcessError as e:
                    print(f"Warning: Error processing soundtrack: {e}")

        return audio_files

    def create_video_timeline(self, image_paths: List[str]) -> str:
        """Create video timeline from images"""
        print("🎬 Creating video timeline...")

        # Create video from images (2 seconds per image = 60 seconds total)
        images_video = self.output_dir / "images_video.mp4"

        # Create input file list for FFmpeg
        filelist_path = self.output_dir / "images_list.txt"
        with open(filelist_path, "w") as f:
            for img_path in image_paths:
                f.write(f"file '{img_path}'\n")
                f.write(f"duration 2\n")
            # Duplicate last image for proper ending
            f.write(f"file '{image_paths[-1]}'\n")

        # Create video from image sequence
        cmd = [
            "ffmpeg",
            "-y",
            "-f",
            "concat",
            "-safe",
            "0",
            "-i",
            str(filelist_path),
            "-vf",
            "fps=30,scale=1920:1080",
            "-c:v",
            "libx264",
            "-pix_fmt",
            "yuv420p",
            str(images_video),
        ]

        try:
            subprocess.run(cmd, check=True, capture_output=True)
            self.update_status("processing", 50, "Timeline de video creado")
            return str(images_video)
        except subprocess.CalledProcessError as e:
            self.update_status("error", 0, f"Error creando timeline: {e}")
            return ""

    def add_thumbnail(self, video_path: str) -> str:
        """Add thumbnail at the beginning if provided"""
        if not self.config.get("thumbnail"):
            return video_path

        print("🖼️ Adding thumbnail...")

        thumbnail_path = self.images_dir / self.config["thumbnail"]["filename"]
        thumbnail_video = self.output_dir / "thumbnail_video.mp4"
        final_with_thumb = self.output_dir / "with_thumbnail.mp4"

        # Create 0.2s video from thumbnail
        cmd = [
            "ffmpeg",
            "-y",
            "-loop",
            "1",
            "-i",
            str(thumbnail_path),
            "-t",
            "0.2",
            "-vf",
            "scale=1920:1080",
            "-c:v",
            "libx264",
            "-pix_fmt",
            "yuv420p",
            str(thumbnail_video),
        ]

        try:
            subprocess.run(cmd, check=True, capture_output=True)
        except subprocess.CalledProcessError as e:
            print(f"Warning: Error creating thumbnail video: {e}")
            return video_path

        # Concatenate thumbnail + main video
        concat_list = self.output_dir / "concat_list.txt"
        with open(concat_list, "w") as f:
            f.write(f"file '{thumbnail_video}'\n")
            f.write(f"file '{video_path}'\n")

        cmd = [
            "ffmpeg",
            "-y",
            "-f",
            "concat",
            "-safe",
            "0",
            "-i",
            str(concat_list),
            "-c",
            "copy",
            str(final_with_thumb),
        ]

        try:
            subprocess.run(cmd, check=True, capture_output=True)
            self.update_status("processing", 60, "Miniatura agregada")
            return str(final_with_thumb)
        except subprocess.CalledProcessError as e:
            print(f"Warning: Error adding thumbnail: {e}")
            return video_path

    def add_audio(self, video_path: str, audio_files: Dict[str, str]) -> str:
        """Add audio tracks to video"""
        print("🔊 Adding audio tracks...")

        output_path = self.output_dir / "with_audio.mp4"

        # Build FFmpeg command
        cmd = ["ffmpeg", "-y", "-i", video_path]

        # Add audio inputs
        audio_inputs = []
        if "narration" in audio_files:
            cmd.extend(["-i", audio_files["narration"]])
            audio_inputs.append("1:a")

        if "soundtrack" in audio_files:
            cmd.extend(["-i", audio_files["soundtrack"]])
            audio_inputs.append("2:a")

        # Audio filter
        if len(audio_inputs) == 1:
            # Only narration
            cmd.extend(["-c:v", "copy", "-c:a", "aac", "-map", "0:v", "-map", "1:a"])
        elif len(audio_inputs) == 2:
            # Mix narration and soundtrack
            cmd.extend(
                [
                    "-filter_complex",
                    f"[1:a][2:a]amix=inputs=2:duration=first:dropout_transition=2[audio]",
                    "-c:v",
                    "copy",
                    "-c:a",
                    "aac",
                    "-map",
                    "0:v",
                    "-map",
                    "[audio]",
                ]
            )
        else:
            self.update_status("error", 0, "No audio tracks available")
            return ""

        cmd.append(str(output_path))

        try:
            subprocess.run(cmd, check=True, capture_output=True)
            self.update_status("processing", 75, "Audio agregado al video")
            return str(output_path)
        except subprocess.CalledProcessError as e:
            self.update_status("error", 0, f"Error agregando audio: {e}")
            return ""

    def apply_effects(self, video_path: str) -> str:
        """Apply visual effects and filters"""
        if not self.config.get("selectedFilter"):
            return video_path

        print("✨ Applying visual effects...")

        filter_file = Path(f"public/filters/{self.config['selectedFilter']}.mp4")
        if not filter_file.exists():
            print(f"Warning: Filter file not found: {filter_file}")
            return video_path

        output_path = self.output_dir / "with_effects.mp4"

        # Apply chroma key overlay
        cmd = [
            "ffmpeg",
            "-y",
            "-i",
            video_path,
            "-i",
            str(filter_file),
            "-filter_complex",
            "[1:v]colorkey=green:0.3:0.2[fg];[0:v][fg]overlay[v]",
            "-map",
            "[v]",
            "-map",
            "0:a",
            "-c:a",
            "copy",
            "-c:v",
            "libx264",
            str(output_path),
        ]

        try:
            subprocess.run(cmd, check=True, capture_output=True)
            self.update_status("processing", 85, "Efectos visuales aplicados")
            return str(output_path)
        except subprocess.CalledProcessError as e:
            print(f"Warning: Error applying effects: {e}")
            return video_path

    def add_fade_out(self, video_path: str) -> str:
        """Add 1.5 second fade-out at the end"""
        print("🌅 Adding fade-out...")

        output_path = self.output_dir / "final_video.mp4"

        # Get video duration first
        cmd = [
            "ffprobe",
            "-v",
            "quiet",
            "-show_entries",
            "format=duration",
            "-of",
            "default=noprint_wrappers=1:nokey=1",
            video_path,
        ]

        try:
            result = subprocess.run(cmd, check=True, capture_output=True, text=True)
            duration = float(result.stdout.strip())
        except subprocess.CalledProcessError as e:
            print(f"Warning: Could not get video duration: {e}")
            return video_path

        fade_start = duration - 1.5

        # Apply fade-out to video and audio
        cmd = [
            "ffmpeg",
            "-y",
            "-i",
            video_path,
            "-vf",
            f"fade=out:st={fade_start}:d=1.5",
            "-af",
            f"afade=out:st={fade_start}:d=1.5",
            "-c:v",
            "libx264",
            "-c:a",
            "aac",
            str(output_path),
        ]

        try:
            subprocess.run(cmd, check=True, capture_output=True)
            self.update_status("processing", 95, "Fade-out agregado")
            return str(output_path)
        except subprocess.CalledProcessError as e:
            print(f"Warning: Error adding fade-out: {e}")
            return video_path

    def process(self) -> bool:
        """Main processing function"""
        try:
            print(f"🚀 Starting video processing for project: {self.config['id']}")

            # Step 1: Validate files
            if not self.validate_files():
                return False

            # Step 2: Prepare images
            image_paths = self.prepare_images()
            if not image_paths:
                return False

            # Step 3: Prepare audio
            audio_files = self.prepare_audio()
            if not audio_files:
                return False

            # Step 4: Create video timeline
            video_path = self.create_video_timeline(image_paths)
            if not video_path:
                return False

            # Step 5: Add thumbnail if provided
            video_path = self.add_thumbnail(video_path)

            # Step 6: Add audio
            video_path = self.add_audio(video_path, audio_files)
            if not video_path:
                return False

            # Step 7: Apply effects
            video_path = self.apply_effects(video_path)

            # Step 8: Add fade-out
            final_video = self.add_fade_out(video_path)

            # Update final status
            self.config["status"] = "completed"
            self.config["progress"] = 100
            self.config["outputFile"] = os.path.basename(final_video)
            self.config["completedAt"] = str(
                subprocess.run(["date"], capture_output=True, text=True).stdout.strip()
            )

            with open(self.config_path, "w", encoding="utf-8") as f:
                json.dump(self.config, f, indent=2, ensure_ascii=False)

            print("✅ Video processing completed successfully!")
            return True

        except Exception as e:
            self.update_status("error", 0, f"Error inesperado: {str(e)}")
            print(f"❌ Unexpected error: {e}")
            return False


def main():
    parser = argparse.ArgumentParser(description="Process video project")
    parser.add_argument("project_dir", help="Path to project directory")

    args = parser.parse_args()

    if not os.path.exists(args.project_dir):
        print(f"Error: Project directory not found: {args.project_dir}")
        sys.exit(1)

    processor = VideoProcessor(args.project_dir)
    success = processor.process()

    sys.exit(0 if success else 1)


if __name__ == "__main__":
    main()
