import { useCallback } from 'react';

export function useVideoCompression() {
    const compressVideo = useCallback((file: File): Promise<Blob> => {
        return new Promise((resolve, reject) => {
            const video = document.createElement('video');
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');

            if (!ctx) {
                reject(new Error('Canvas context not found'));
                return;
            }

            video.preload = 'metadata';
            video.onloadedmetadata = () => {
                URL.revokeObjectURL(video.src);
                
                // Set max dimensions (1080p max, maintain aspect ratio)
                const maxWidth = 1920;
                const maxHeight = 1080;
                let width = video.videoWidth;
                let height = video.videoHeight;

                // Calculate new dimensions maintaining aspect ratio
                if (width > maxWidth || height > maxHeight) {
                    const ratio = Math.min(maxWidth / width, maxHeight / height);
                    width = width * ratio;
                    height = height * ratio;
                }

                canvas.width = width;
                canvas.height = height;

                // Draw video frame to canvas
                ctx.drawImage(video, 0, 0, width, height);

                // Convert canvas to blob (this creates a single frame)
                // For actual video compression, you'd need a library like ffmpeg.wasm
                canvas.toBlob(
                    (blob) => {
                        if (blob) {
                            // Note: This only captures a frame, not the full video
                            // For full video compression, use ffmpeg.wasm or similar
                            resolve(blob);
                        } else {
                            reject(new Error('Video compression failed'));
                        }
                    },
                    'image/jpeg',
                    0.8
                );
            };

            video.onerror = (err) => {
                URL.revokeObjectURL(video.src);
                reject(err);
            };

            video.src = URL.createObjectURL(file);
        });
    }, []);

    /**
     * Compress video using MediaRecorder API (browser-native)
     * This provides actual video compression, not just frame extraction
     */
    const compressVideoWithMediaRecorder = useCallback((file: File): Promise<Blob> => {
        return new Promise((resolve, reject) => {
            const video = document.createElement('video');
            video.preload = 'metadata';
            video.muted = true;
            video.playsInline = true;

            video.onloadedmetadata = () => {
                video.currentTime = 0.1; // Seek to first frame
            };

            video.onloadeddata = () => {
                const stream =
                    typeof (video as HTMLVideoElement & { captureStream?: () => MediaStream }).captureStream === 'function'
                        ? (video as HTMLVideoElement & { captureStream: () => MediaStream }).captureStream()
                        : null;

                if (!stream) {
                    reject(new Error('Video captureStream is not supported'));
                    return;
                }
                
                // Check if MediaRecorder supports the codec
                const codecs = [
                    'video/webm;codecs=vp9',
                    'video/webm;codecs=vp8',
                    'video/webm',
                    'video/mp4',
                ];

                let selectedCodec = '';
                for (const codec of codecs) {
                    if (MediaRecorder.isTypeSupported(codec)) {
                        selectedCodec = codec;
                        break;
                    }
                }

                if (!selectedCodec) {
                    reject(new Error('No supported video codec found'));
                    return;
                }

                const chunks: Blob[] = [];
                const recorder = new MediaRecorder(stream, {
                    mimeType: selectedCodec,
                    videoBitsPerSecond: 2500000, // 2.5 Mbps (adjust for quality/size)
                });

                recorder.ondataavailable = (e) => {
                    if (e.data.size > 0) {
                        chunks.push(e.data);
                    }
                };

                recorder.onstop = () => {
                    const compressedBlob = new Blob(chunks, { type: selectedCodec });
                    URL.revokeObjectURL(video.src);
                    resolve(compressedBlob);
                };

                recorder.onerror = (err) => {
                    URL.revokeObjectURL(video.src);
                    reject(err);
                };

                // Start recording
                video.play();
                recorder.start();

                // Stop after video duration
                setTimeout(() => {
                    recorder.stop();
                    video.pause();
                }, video.duration * 1000);
            };

            video.onerror = (err) => {
                URL.revokeObjectURL(video.src);
                reject(err);
            };

            video.src = URL.createObjectURL(file);
        });
    }, []);

    return {
        compressVideo,
        compressVideoWithMediaRecorder,
    };
}

