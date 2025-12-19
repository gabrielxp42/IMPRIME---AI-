/**
 * SAM API Client
 * Handles communication with the FastAPI backend for image segmentation
 */

import axios, { AxiosInstance, AxiosError } from 'axios';

const API_BASE_URL = 'http://localhost:8000';

interface Point {
    x: number;
    y: number;
    label: number; // 1 for foreground, 0 for background
}

interface Box {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
}

interface SegmentResponse {
    success: boolean;
    mask: string; // base64 encoded PNG
    confidence: number;
}

interface RefineMaskResponse {
    success: boolean;
    refined_mask: string; // base64 encoded PNG
}

interface ApplyMaskResponse {
    success: boolean;
    result_image: string; // base64 encoded PNG (RGBA)
}

interface HealthResponse {
    status: string;
    sam_loaded: boolean;
    refiner_loaded: boolean;
}

class SAMAPIClient {
    private api: AxiosInstance;
    private maxRetries: number = 3;
    private retryDelay: number = 1000; // ms

    constructor(baseURL: string = API_BASE_URL) {
        this.api = axios.create({
            baseURL,
            timeout: 60000, // 60 seconds for heavy processing
            headers: {
                'Content-Type': 'application/json',
            },
        });

        // Response interceptor for error handling
        this.api.interceptors.response.use(
            (response) => response,
            async (error: AxiosError) => {
                const config = error.config;
                if (!config) return Promise.reject(error);

                // Retry logic for network errors
                const retryCount = (config as any)._retryCount || 0;
                if (retryCount < this.maxRetries && this.isRetryableError(error)) {
                    (config as any)._retryCount = retryCount + 1;

                    console.log(`Retrying API call (${retryCount + 1}/${this.maxRetries})...`);
                    await this.delay(this.retryDelay * (retryCount + 1));

                    return this.api.request(config);
                }

                return Promise.reject(this.formatError(error));
            }
        );
    }

    /**
     * Check if backend is healthy and models are loaded
     */
    async checkHealth(): Promise<HealthResponse> {
        try {
            const response = await this.api.get<HealthResponse>('/health');
            return response.data;
        } catch (error) {
            throw new Error(`Backend health check failed: ${this.getErrorMessage(error)}`);
        }
    }

    /**
     * Generate segmentation mask from user-clicked points
     * @param imageBase64 - Base64 encoded image
     * @param points - Array of points with labels (1=foreground, 0=background)
     */
    async segmentWithPoints(imageBase64: string, points: Point[]): Promise<SegmentResponse> {
        try {
            if (points.length === 0) {
                throw new Error('At least one point is required for segmentation');
            }

            const response = await this.api.post<SegmentResponse>('/api/segment/points', {
                image_base64: imageBase64,
                points: points,
            });

            return response.data;
        } catch (error) {
            throw new Error(`Point-based segmentation failed: ${this.getErrorMessage(error)}`);
        }
    }

    /**
     * Generate segmentation mask from bounding box
     * @param imageBase64 - Base64 encoded image
     * @param box - Bounding box coordinates
     */
    async segmentWithBox(imageBase64: string, box: Box): Promise<SegmentResponse> {
        try {
            const response = await this.api.post<SegmentResponse>('/api/segment/box', {
                image_base64: imageBase64,
                box: box,
            });

            return response.data;
        } catch (error) {
            throw new Error(`Box-based segmentation failed: ${this.getErrorMessage(error)}`);
        }
    }

    /**
     * Refine mask using ISNet for smoother edges
     * @param imageBase64 - Original image
     * @param maskBase64 - Rough mask to refine
     */
    async refineMask(imageBase64: string, maskBase64: string): Promise<RefineMaskResponse> {
        try {
            const response = await this.api.post<RefineMaskResponse>('/api/refine-mask', {
                image_base64: imageBase64,
                mask_base64: maskBase64,
            });

            return response.data;
        } catch (error) {
            throw new Error(`Mask refinement failed: ${this.getErrorMessage(error)}`);
        }
    }

    /**
     * Apply mask to image and return result with transparent background
     * @param imageBase64 - Original image
     * @param maskBase64 - Final mask to apply
     */
    async applyMask(imageBase64: string, maskBase64: string): Promise<ApplyMaskResponse> {
        try {
            const response = await this.api.post<ApplyMaskResponse>('/api/apply-mask', {
                image_base64: imageBase64,
                mask_base64: maskBase64,
            });

            return response.data;
        } catch (error) {
            throw new Error(`Mask application failed: ${this.getErrorMessage(error)}`);
        }
    }

    /**
     * Convert File/Blob to base64
     */
    async fileToBase64(file: File | Blob): Promise<string> {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
                const result = reader.result as string;
                resolve(result);
            };
            reader.onerror = () => {
                reject(new Error('Failed to read file'));
            };
            reader.readAsDataURL(file);
        });
    }

    /**
     * Convert canvas to base64
     */
    canvasToBase64(canvas: HTMLCanvasElement, mimeType: string = 'image/png'): string {
        return canvas.toDataURL(mimeType);
    }

    // Helper methods

    private isRetryableError(error: AxiosError): boolean {
        // Retry on network errors or 5xx server errors
        return (
            !error.response ||
            error.code === 'ECONNABORTED' ||
            error.code === 'ERR_NETWORK' ||
            (error.response.status >= 500 && error.response.status < 600)
        );
    }

    private delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    private getErrorMessage(error: unknown): string {
        if (axios.isAxiosError(error)) {
            if (error.response?.data?.detail) {
                return error.response.data.detail;
            }
            if (error.message) {
                return error.message;
            }
        }
        if (error instanceof Error) {
            return error.message;
        }
        return String(error);
    }

    private formatError(error: AxiosError): Error {
        const message = this.getErrorMessage(error);

        if (error.code === 'ECONNREFUSED') {
            return new Error('Backend server is not running. Please start the SAM backend.');
        }

        if (error.code === 'ECONNABORTED') {
            return new Error('Request timeout. Image processing took too long.');
        }

        return new Error(message);
    }
}

// Export singleton instance
const samAPI = new SAMAPIClient();
export default samAPI;

// Export types
export type { Point, Box, SegmentResponse, RefineMaskResponse, ApplyMaskResponse, HealthResponse };
