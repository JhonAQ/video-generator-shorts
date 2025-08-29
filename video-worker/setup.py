#!/usr/bin/env python3
"""
Setup script for Video Worker
Checks dependencies and prepares the environment
"""

import subprocess
import sys
import os
from pathlib import Path


def check_ffmpeg():
    """Check if FFmpeg is installed"""
    try:
        result = subprocess.run(["ffmpeg", "-version"], capture_output=True, text=True)
        if result.returncode == 0:
            print("✅ FFmpeg is installed")
            return True
        else:
            print("❌ FFmpeg is not working properly")
            return False
    except FileNotFoundError:
        print("❌ FFmpeg is not installed")
        return False


def check_ffprobe():
    """Check if FFprobe is installed"""
    try:
        result = subprocess.run(["ffprobe", "-version"], capture_output=True, text=True)
        if result.returncode == 0:
            print("✅ FFprobe is installed")
            return True
        else:
            print("❌ FFprobe is not working properly")
            return False
    except FileNotFoundError:
        print("❌ FFprobe is not installed")
        return False


def install_python_requirements():
    """Install Python requirements"""
    requirements_file = Path(__file__).parent / "requirements.txt"
    if not requirements_file.exists():
        print("❌ requirements.txt not found")
        return False

    try:
        result = subprocess.run(
            [sys.executable, "-m", "pip", "install", "-r", str(requirements_file)],
            check=True,
            capture_output=True,
            text=True,
        )
        print("✅ Python requirements installed")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ Error installing Python requirements: {e}")
        return False


def create_directories():
    """Create necessary directories"""
    base_dir = Path(__file__).parent.parent
    directories = [
        base_dir / "uploads",
        base_dir / "public" / "sounds",
        base_dir / "public" / "filters",
        base_dir / "public" / "filters" / "previews",
    ]

    for directory in directories:
        try:
            directory.mkdir(parents=True, exist_ok=True)
            print(f"✅ Created directory: {directory}")
        except Exception as e:
            print(f"❌ Error creating directory {directory}: {e}")
            return False

    return True


def main():
    print("🔧 Setting up Video Worker environment...")
    print("=" * 50)

    all_ok = True

    # Check system dependencies
    print("\n📋 Checking system dependencies:")
    if not check_ffmpeg():
        print("   Please install FFmpeg: https://ffmpeg.org/download.html")
        all_ok = False

    if not check_ffprobe():
        print("   FFprobe should come with FFmpeg installation")
        all_ok = False

    # Install Python requirements
    print("\n🐍 Installing Python requirements:")
    if not install_python_requirements():
        all_ok = False

    # Create directories
    print("\n📁 Creating directories:")
    if not create_directories():
        all_ok = False

    print("\n" + "=" * 50)
    if all_ok:
        print("✅ Setup completed successfully!")
        print("\nThe video worker is ready to process videos.")
        print("\nUsage:")
        print(
            f"  python {Path(__file__).parent / 'video_processor.py'} <project_directory>"
        )
    else:
        print("❌ Setup failed. Please fix the errors above.")
        sys.exit(1)


if __name__ == "__main__":
    main()
