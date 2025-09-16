import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import connectToDatabase from '@/lib/mongodb'
import NetworkPost from '@/models/NetworkPost'
import NetworkConnection from '@/models/NetworkConnection'
import { authOptions } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await connectToDatabase()

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const type = searchParams.get('type')
    const search = searchParams.get('search')

    // Build MongoDB query
    const query: any = {}

    // Filter by post type if specified
    if (type && type !== 'all') {
      query.type = type
    }

    // Add search functionality
    if (search) {
      query.$or = [
        { content: { $regex: search, $options: 'i' } },
        { title: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ]
    }

    // Get user's connections for filtering posts based on visibility
    const connections = await NetworkConnection.find({
      $or: [
        { userId: session.user.id, status: 'accepted' },
        { connectedUserId: session.user.id, status: 'accepted' }
      ]
    }).select('userId connectedUserId')

    const connectedUserIds = connections.map(conn =>
      conn.userId.toString() === session.user.id ? conn.connectedUserId : conn.userId
    )

    // Include posts that are:
    // 1. Public
    // 2. Connections-only and user is connected to the author
    // 3. User's own posts (including private ones)
    query.$or = [
      { visibility: 'public' },
      { visibility: 'connections', userId: { $in: connectedUserIds } },
      { userId: session.user.id }
    ]

    // Get total count for pagination
    const total = await NetworkPost.countDocuments(query)

    // Get posts with pagination
    const posts = await NetworkPost.find(query)
      .populate('userId', 'name image title')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean()

    // Transform posts to match the expected format
    const transformedPosts = posts.map(post => ({
      _id: post._id,
      userId: post.userId._id || post.userId,
      userName: post.userName,
      userAvatar: post.userAvatar,
      userTitle: post.userTitle,
      type: post.type,
      title: post.title,
      content: post.content,
      tags: post.tags,
      attachments: post.attachments,
      likes: post.likes,
      comments: post.comments,
      shares: post.shares,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
      visibility: post.visibility
    }))

    return NextResponse.json({
      success: true,
      posts: transformedPosts,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })

  } catch (error) {
    console.error('Get network feed error:', error)
    return NextResponse.json(
      { error: 'Failed to get network feed' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      type,
      title,
      content,
      tags = [],
      attachments = [],
      visibility = 'public'
    } = body

    if (!content) {
      return NextResponse.json(
        { error: 'Content is required' },
        { status: 400 }
      )
    }

    await connectToDatabase()

    // Create new post using the database model
    const newPost = new NetworkPost({
      userId: session.user.id,
      userName: session.user.name || 'Anonymous',
      userAvatar: session.user.image,
      userTitle: 'Job Seeker', // This could be fetched from user profile
      type: type || 'general',
      title,
      content,
      tags,
      attachments,
      likes: [],
      comments: [],
      shares: 0,
      visibility
    })

    // Save to database
    const savedPost = await newPost.save()

    // Return the saved post
    return NextResponse.json({
      success: true,
      post: {
        _id: savedPost._id,
        userId: savedPost.userId,
        userName: savedPost.userName,
        userAvatar: savedPost.userAvatar,
        userTitle: savedPost.userTitle,
        type: savedPost.type,
        title: savedPost.title,
        content: savedPost.content,
        tags: savedPost.tags,
        attachments: savedPost.attachments,
        likes: savedPost.likes,
        comments: savedPost.comments,
        shares: savedPost.shares,
        createdAt: savedPost.createdAt,
        updatedAt: savedPost.updatedAt,
        visibility: savedPost.visibility
      }
    })

  } catch (error) {
    console.error('Create network post error:', error)
    return NextResponse.json(
      { error: 'Failed to create post' },
      { status: 500 }
    )
  }
}
