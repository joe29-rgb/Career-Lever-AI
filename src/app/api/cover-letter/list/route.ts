import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import connectToDatabase from '@/lib/mongodb'
import CoverLetter from '@/models/CoverLetter'

export async function GET(_request: NextRequest) {
	const session = await getServerSession(authOptions)
	if (!session?.user?.id) {
		return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
	}
	await connectToDatabase()
	const letters = await CoverLetter.find({ userId: (session.user as any).id })
		.sort({ createdAt: -1 })
		.limit(10)
		.select('jobTitle companyName createdAt content')
		.lean()
	return NextResponse.json({ success: true, letters })
}


