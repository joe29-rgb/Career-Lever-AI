import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import connectToDatabase from '@/lib/mongodb'
import NetworkConnection from '@/models/NetworkConnection'
import User from '@/models/User'
import { authOptions } from '@/lib/auth'
import { z } from 'zod'
import { isRateLimited } from '@/lib/rate-limit'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await connectToDatabase()

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'all' // all, accepted, pending, suggestions

    let connections = []

    if (type === 'suggestions') {
      // Return suggested connections (users not already connected)
      const existingConnections = await NetworkConnection.find({
        $or: [
          { userId: session.user.id },
          { connectedUserId: session.user.id }
        ]
      }).select('userId connectedUserId')

      const connectedUserIds = existingConnections.map(conn =>
        conn.userId.toString() === session.user.id ? conn.connectedUserId.toString() : conn.userId.toString()
      )

      // Get random users not connected (in a real app, this would use more sophisticated algorithms)
      const suggestedUsers = await User.find({
        _id: { $nin: [...connectedUserIds, session.user.id] },
        email: { $ne: session.user.email } // Exclude self
      }).limit(10).select('name image title location skills')

      // Get connection data for all suggested users
      const suggestedUserIds = suggestedUsers.map(user => user._id)

      // Get all connections for suggested users and current user
      const [suggestedUsersConnections, currentUserConnections] = await Promise.all([
        NetworkConnection.find({
          $or: [
            { userId: { $in: suggestedUserIds }, status: 'accepted' },
            { connectedUserId: { $in: suggestedUserIds }, status: 'accepted' }
          ]
        }).select('userId connectedUserId'),
        NetworkConnection.find({
          $or: [
            { userId: session.user.id, status: 'accepted' },
            { connectedUserId: session.user.id, status: 'accepted' }
          ]
        }).select('userId connectedUserId')
      ])

      // Calculate connection data for each suggested user
      connections = suggestedUsers.map(user => {
        // Count user's total connections
        const userConnectionsCount = suggestedUsersConnections.filter(conn =>
          conn.userId.toString() === user._id.toString() || conn.connectedUserId.toString() === user._id.toString()
        ).length

        // Calculate mutual connections
        const currentUserConnectedIds = currentUserConnections.map(conn =>
          conn.userId.toString() === session.user.id ? conn.connectedUserId.toString() : conn.userId.toString()
        )

        const suggestedUserConnectedIds = suggestedUsersConnections
          .filter(conn =>
            conn.userId.toString() === user._id.toString() || conn.connectedUserId.toString() === user._id.toString()
          )
          .map(conn =>
            conn.userId.toString() === user._id.toString() ? conn.connectedUserId.toString() : conn.userId.toString()
          )

        const mutualConnections = currentUserConnectedIds.filter(id =>
          suggestedUserConnectedIds.includes(id)
        ).length

        return {
          id: user._id,
          name: user.name,
          title: user.title || 'Job Seeker',
          avatar: user.image,
          location: user.location || 'Unknown',
          skills: user.skills || [],
          experience: user.experience || 'Unknown',
          connections: userConnectionsCount,
          mutualConnections
        }
      })
    } else {
      // Return actual connections
      const query: any = {
        $or: [
          { userId: session.user.id },
          { connectedUserId: session.user.id }
        ]
      }

      if (type !== 'all') {
        query['status'] = type
      }

      const userConnections = await NetworkConnection.find(query)
        .populate('userId', 'name image title location skills experience')
        .populate('connectedUserId', 'name image title location skills experience')
        .sort({ createdAt: -1 })

      // Get unique user IDs to fetch connection counts
      const userIds = userConnections.map(conn => {
        const isInitiator = conn.userId.toString() === session.user.id
        return isInitiator ? conn.connectedUserId._id : conn.userId._id
      })

      // Get connection counts for all users in one query
      const connectionCounts = await NetworkConnection.aggregate([
        {
          $match: {
            $or: [
              { userId: { $in: userIds }, status: 'accepted' },
              { connectedUserId: { $in: userIds }, status: 'accepted' }
            ]
          }
        },
        {
          $group: {
            _id: {
              $cond: {
                if: { $in: ['$userId', userIds] },
                then: '$userId',
                else: '$connectedUserId'
              }
            },
            count: { $sum: 1 }
          }
        }
      ])

      // Create a map of user ID to connection count
      const connectionCountMap = new Map()
      connectionCounts.forEach(item => {
        connectionCountMap.set(item._id.toString(), item.count)
      })

      // Transform connections to match expected format
      connections = userConnections.map(conn => {
        const isInitiator = conn.userId.toString() === session.user.id
        const otherUser = isInitiator ? conn.connectedUserId : conn.userId
        const connectionCount = connectionCountMap.get(otherUser._id.toString()) || 0

        return {
          _id: conn._id,
          userId: conn.userId._id,
          connectedUserId: conn.connectedUserId._id,
          status: conn.status,
          initiatedBy: conn.initiatedBy._id,
          createdAt: conn.createdAt,
          acceptedAt: conn.acceptedAt,
          message: conn.message,
          user: {
            id: otherUser._id,
            name: otherUser.name,
            title: otherUser.title || 'Job Seeker',
            avatar: otherUser.image,
            location: otherUser.location || 'Unknown',
            skills: otherUser.skills || [],
            experience: otherUser.experience || 'Unknown',
            connections: connectionCount,
            mutualConnections: 0 // This would require additional calculation
          }
        }
      })
    }

    // Calculate stats
    const totalAccepted = await NetworkConnection.countDocuments({
      $or: [
        { userId: session.user.id, status: 'accepted' },
        { connectedUserId: session.user.id, status: 'accepted' }
      ]
    })

    const pendingRequests = await NetworkConnection.countDocuments({
      $or: [
        { userId: session.user.id, status: 'pending' },
        { connectedUserId: session.user.id, status: 'pending' }
      ],
      initiatedBy: { $ne: session.user.id } // Only incoming requests
    })

    return NextResponse.json({
      success: true,
      connections,
      stats: {
        total: totalAccepted,
        pending: pendingRequests
      }
    })

  } catch (error) {
    console.error('Get connections error:', error)
    return NextResponse.json(
      { error: 'Failed to get connections' },
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

    await connectToDatabase()

    const limiter = isRateLimited((session.user as any).id, 'network:connections:post')
    if (limiter.limited) return NextResponse.json({ error: 'Rate limit exceeded', reset: limiter.reset }, { status: 429 })

    const schema = z.object({
      action: z.enum(['connect','accept','decline']),
      targetUserId: z.string().min(1),
      message: z.string().max(500).optional(),
    })
    const raw = await request.json()
    const parsed = schema.safeParse(raw)
    if (!parsed.success) return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 })
    const { action, targetUserId, message } = parsed.data as any

    if (action === 'connect') {
      // Check if connection already exists
      const existingConnection = await NetworkConnection.findOne({
        $or: [
          { userId: session.user.id, connectedUserId: targetUserId },
          { userId: targetUserId, connectedUserId: session.user.id }
        ]
      })

      if (existingConnection) {
        return NextResponse.json(
          { error: 'Connection already exists' },
          { status: 400 }
        )
      }

      // Check if target user exists
      const targetUser = await User.findById(targetUserId)
      if (!targetUser) {
        return NextResponse.json(
          { error: 'Target user not found' },
          { status: 404 }
        )
      }

      const newConnection = new NetworkConnection({
        userId: session.user.id,
        connectedUserId: targetUserId,
        status: 'pending',
        initiatedBy: session.user.id,
        message
      })

      await newConnection.save()

      return NextResponse.json({
        success: true,
        connection: {
          _id: newConnection._id,
          userId: newConnection.userId,
          connectedUserId: newConnection.connectedUserId,
          status: newConnection.status,
          initiatedBy: newConnection.initiatedBy,
          createdAt: newConnection.createdAt,
          message: newConnection.message
        },
        message: 'Connection request sent!'
      })

    } else if (action === 'accept') {
      const connection = await NetworkConnection.findOne({
        userId: targetUserId,
        connectedUserId: session.user.id,
        status: 'pending'
      })

      if (!connection) {
        return NextResponse.json(
          { error: 'Connection request not found' },
          { status: 404 }
        )
      }

      connection.status = 'accepted'
      connection.acceptedAt = new Date()
      await connection.save()

      return NextResponse.json({
        success: true,
        connection: {
          _id: connection._id,
          userId: connection.userId,
          connectedUserId: connection.connectedUserId,
          status: connection.status,
          initiatedBy: connection.initiatedBy,
          createdAt: connection.createdAt,
          acceptedAt: connection.acceptedAt,
          message: connection.message
        },
        message: 'Connection accepted!'
      })

    } else if (action === 'decline') {
      const connection = await NetworkConnection.findOne({
        userId: targetUserId,
        connectedUserId: session.user.id,
        status: 'pending'
      })

      if (!connection) {
        return NextResponse.json(
          { error: 'Connection request not found' },
          { status: 404 }
        )
      }

      connection.status = 'declined'
      await connection.save()

      return NextResponse.json({
        success: true,
        message: 'Connection request declined'
      })
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    )

  } catch (error) {
    console.error('Connection action error:', error)
    return NextResponse.json(
      { error: 'Failed to process connection action' },
      { status: 500 }
    )
  }
}
