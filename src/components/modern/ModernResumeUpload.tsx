'use client'

import React, { useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { DocumentArrowUpIcon, CheckCircleIcon } from '@heroicons/react/24/outline'

interface ResumeUploadProps {
  onFileUpload: (file: File) => void
  isUploaded?: boolean
  fileName?: string
}

export const ModernResumeUpload: React.FC<ResumeUploadProps> = ({ 
  onFileUpload, 
  isUploaded = false, 
  fileName 
}) => {
  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      onFileUpload(acceptedFiles[0])
    }
  }, [onFileUpload])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
    },
    multiple: false,
  })

  if (isUploaded) {
    return (
      <div className="dribbble-card p-8 text-center">
        <div className="w-16 h-16 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-xl">
          <CheckCircleIcon className="w-8 h-8 text-white" />
        </div>
        <h3 className="text-xl font-bold text-foreground mb-2">Resume Uploaded!</h3>
        <p className="text-gray-600 mb-4">{fileName}</p>
        <button 
          {...getRootProps()} 
          className="btn-dribbble-secondary"
        >
          Upload Different File
        </button>
      </div>
    )
  }

  return (
    <div className="dribbble-card p-8">
      <div className="text-center mb-6">
        <h3 className="text-2xl font-bold text-foreground mb-2">📄 Upload Resume</h3>
        <p className="text-gray-600">Upload your PDF resume for AI-powered optimization</p>
      </div>

      <div
        {...getRootProps()}
        className={`
          border-3 border-dashed rounded-3xl p-12 text-center cursor-pointer transition-all duration-300
          ${isDragActive 
            ? 'border-blue-500 bg-blue-50 scale-105 shadow-lg' 
            : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50 hover:shadow-md'
          }
        `}
      >
        <input {...getInputProps()} />
        
        <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl">
          <DocumentArrowUpIcon className="w-10 h-10 text-white" />
        </div>

        {isDragActive ? (
          <div>
            <p className="text-xl font-semibold text-blue-600 mb-2">Drop your resume here!</p>
            <p className="text-gray-500">We'll analyze it with AI ✨</p>
          </div>
        ) : (
          <div>
            <p className="text-xl font-semibold text-foreground mb-2">
              Drag & drop your resume here
            </p>
            <p className="text-gray-500 mb-4">Or click to browse files</p>
            <div className="inline-flex px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-2xl font-semibold shadow-lg hover:shadow-xl transition-shadow">
              Choose File
            </div>
          </div>
        )}

        <p className="text-xs text-gray-400 mt-4">PDF files only • Max 10MB</p>
      </div>
    </div>
  )
}

