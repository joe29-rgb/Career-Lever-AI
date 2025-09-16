import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import connectToDatabase from '@/lib/mongodb'
import Message from '@/models/Message'
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
    const conversationId = searchParams.get('conversationId')
    const otherUserId = searchParams.get('otherUserId')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    if (!conversationId && !otherUserId) {
      return NextResponse.json(
        { error: 'Either conversationId or otherUserId is required' },
        { status: 400 }
      )
    }

    let query: any = {}

    if (conversationId) {
      query.conversationId = conversationId
    } else if (otherUserId) {
      // Generate conversation ID from current user and other user
      const userIds = [session.user.id, otherUserId].sort()
      query.conversationId = userIds.join('_')
    }

    // Ensure user is part of the conversation
    query.$or = [
      { senderId: session.user.id },
      { receiverId: session.user.id }
    ]

    // Get messages with pagination
    const messages = await Message.find(query)
      .populate('senderId', 'name image')
      .populate('receiverId', 'name image')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean()

    // Transform messages and mark as read for current user
    const transformedMessages = messages.map(msg => ({
      _id: msg._id,
      senderId: msg.senderId._id,
      receiverId: msg.receiverId._id,
      conversationId: msg.conversationId,
      content: msg.content,
      messageType: msg.messageType,
      attachments: msg.attachments,
      isRead: msg.isRead,
      readAt: msg.readAt,
      createdAt: msg.createdAt,
      updatedAt: msg.updatedAt,
      // Additional metadata
      sender: {
        id: msg.senderId._id,
        name: msg.senderId.name,
        avatar: msg.senderId.image
      },
      receiver: {
        id: msg.receiverId._id,
        name: msg.receiverId.name,
        avatar: msg.receiverId.image
      },
      isFromCurrentUser: msg.senderId._id.toString() === session.user.id
    }))

    // Mark messages as read (only those received by current user)
    await Message.updateMany(
      {
        conversationId: query.conversationId,
        receiverId: session.user.id,
        isRead: false
      },
      {
        isRead: true,
        readAt: new Date()
      }
    )

    // Get total count for pagination
    const total = await Message.countDocuments(query)

    return NextResponse.json({
      success: true,
      messages: transformedMessages.reverse(), // Return in chronological order
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })

  } catch (error) {
    console.error('Get messages error:', error)
    return NextResponse.json(
      { error: 'Failed to get messages' },
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

    const body = await request.json()
    const { receiverId, content, messageType = 'text', attachments = [] } = body

    if (!receiverId) {
      return NextResponse.json(
        { error: 'Receiver ID is required' },
        { status: 400 }
      )
    }

    if (!content && (!attachments || attachments.length === 0)) {
      return NextResponse.json(
        { error: 'Message content or attachments are required' },
        { status: 400 }
      )
    }

    // Check if users are connected (can only message connections)
    const connection = await NetworkConnection.findOne({
      $or: [
        { userId: session.user.id, connectedUserId: receiverId, status: 'accepted' },
        { userId: receiverId, connectedUserId: session.user.id, status: 'accepted' }
      ]
    })

    if (!connection) {
      return NextResponse.json(
        { error: 'You can only message accepted connections' },
        { status: 403 }
      )
    }

    // Create new message
    const newMessage = new Message({
      senderId: session.user.id,
      receiverId,
      content,
      messageType,
      attachments
    })

    await newMessage.save()

    // Populate sender and receiver info
    await newMessage.populate('senderId', 'name image')
    await newMessage.populate('receiverId', 'name image')

    return NextResponse.json({
      success: true,
      message: {
        _id: newMessage._id,
        senderId: newMessage.senderId._id,
        receiverId: newMessage.receiverId._id,
        conversationId: newMessage.conversationId,
        content: newMessage.content,
        messageType: newMessage.messageType,
        attachments: newMessage.attachments,
        isRead: newMessage.isRead,
        createdAt: newMessage.createdAt,
        updatedAt: newMessage.updatedAt,
        sender: {
          id: newMessage.senderId._id,
          name: newMessage.senderId.name,
          avatar: newMessage.senderId.image
        },
        receiver: {
          id: newMessage.receiverId._id,
          name: newMessage.receiverId.name,
          avatar: newMessage.receiverId.image
        },
        isFromCurrentUser: true
      }
    })

  } catch (error) {
    console.error('Send message error:', error)
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    )
  }
}

