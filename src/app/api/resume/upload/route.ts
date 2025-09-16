import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { promises as fs } from 'fs';
import path from 'path';
import connectToDatabase from '@/lib/mongodb';
import Resume from '@/models/Resume';
import { authOptions } from '@/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Connect to database
    await connectToDatabase();

    // Handle file upload
    const formData = await request.formData();
    const file = formData.get('resume') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file uploaded' },
        { status: 400 }
      );
    }

    // Validate file type
    if (file.type !== 'application/pdf') {
      return NextResponse.json(
        { error: 'Only PDF files are allowed' },
        { status: 400 }
      );
    }

    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File size too large. Maximum 10MB allowed.' },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Extract text from PDF
    let extractedText: string;
    try {
      const pdfParse = (await import('pdf-parse')).default;
      const pdfData = await pdfParse(buffer);
      extractedText = pdfData.text;
    } catch (error) {
      console.error('PDF parsing error:', error);
      return NextResponse.json(
        { error: 'Failed to parse PDF. Please ensure it contains readable text.' },
        { status: 400 }
      );
    }

    if (!extractedText || extractedText.trim().length < 100) {
      return NextResponse.json(
        { error: 'PDF appears to be empty or contains insufficient text. Please upload a valid resume.' },
        { status: 400 }
      );
    }

    // Save file to uploads directory
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'resumes');
    await fs.mkdir(uploadsDir, { recursive: true });

    const fileName = `${Date.now()}-${file.name}`;
    const filePath = path.join(uploadsDir, fileName);
    await fs.writeFile(filePath, buffer);

    // Create resume record in database
    const resume = new Resume({
      userId: session.user.id,
      originalFileName: file.name,
      fileUrl: `/uploads/resumes/${fileName}`,
      extractedText,
      customizedVersions: [],
    });

    await resume.save();

    return NextResponse.json({
      success: true,
      resume: {
        _id: resume._id,
        originalFileName: resume.originalFileName,
        fileUrl: resume.fileUrl,
        extractedText: extractedText.substring(0, 500) + '...', // Truncate for response
        customizedVersions: resume.customizedVersions,
        createdAt: resume.createdAt,
      },
      message: 'Resume uploaded successfully',
    });

  } catch (error) {
    console.error('Resume upload error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

