import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import connectToDatabase from '@/lib/mongodb';
import { authOptions } from '@/lib/auth';
import { extractKeywords } from '@/lib/utils';
import { AIService } from '@/lib/ai-service';

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

    const body = await request.json();
    const { jobDescription, jobTitle, companyName } = body;

    if (!jobDescription || jobDescription.trim().length < 50) {
      return NextResponse.json(
        { error: 'Job description must be at least 50 characters long' },
        { status: 400 }
      );
    }

    // Connect to database
    await connectToDatabase();

    // Use AI service to analyze the job description
    const analysis = await AIService.analyzeJobDescription(jobDescription);

    // Extract keywords from the job description
    const keywords = extractKeywords(jobDescription);

    return NextResponse.json({
      success: true,
      analysis,
      keywords,
    });

  } catch (error) {
    console.error('Job analysis error:', error);
    return NextResponse.json(
      { error: 'Failed to analyze job description' },
      { status: 500 }
    );
  }
}
