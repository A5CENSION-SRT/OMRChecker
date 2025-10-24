'use client';

import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';

interface UploadZoneProps {
    onFilesSelected: (files: File[]) => void;
    disabled?: boolean;
    maxFiles?: number;
}

export function UploadZone({ onFilesSelected, disabled = false, maxFiles = 100 }: UploadZoneProps) {
    const onDrop = useCallback(
        (acceptedFiles: File[]) => {
            if (acceptedFiles.length > 0) {
                onFilesSelected(acceptedFiles);
            }
        },
        [onFilesSelected]
    );

    const { getRootProps, getInputProps, isDragActive: dropzoneDragActive } = useDropzone({
        onDrop,
        accept: {
            'image/jpeg': ['.jpg', '.jpeg'],
            'image/png': ['.png'],
            'image/bmp': ['.bmp'],
            'image/tiff': ['.tiff', '.tif'],
        },
        disabled,
        maxFiles,
        multiple: true,
    });

    return (
        <div
            {...getRootProps()}
            className={`
        border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
        ${dropzoneDragActive
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-300 hover:border-gray-400'
                }
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
      `}
        >
            <input {...getInputProps()} />
            <div className="space-y-4">
                <div className="text-6xl">📄</div>
                <div>
                    <p className="text-lg font-medium text-gray-900">
                        {dropzoneDragActive ? 'Drop the files here...' : 'Drag & drop OMR sheets here'}
                    </p>
                    <p className="text-sm text-gray-500 mt-2">
                        or click to select files (JPG, PNG, BMP, TIFF)
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                        Maximum {maxFiles} files • Up to 10MB each
                    </p>
                </div>
            </div>
        </div>
    );
}