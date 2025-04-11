import { createClient } from '@/lib/supabase/client'
import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * Throttle a callback to a certain delay, It will only call the callback if the delay has passed, with the arguments
 * from the last call
 */
const useThrottleCallback = (callback, delay) => {
  const lastCall = useRef(0)
  const timeout = useRef(null)

  return useCallback((...args) => {
    const now = Date.now()
    const remainingTime = delay - (now - lastCall.current)

    if (remainingTime <= 0) {
      if (timeout.current) {
        clearTimeout(timeout.current)
        timeout.current = null
      }
      lastCall.current = now
      callback(...args)
    } else if (!timeout.current) {
      timeout.current = setTimeout(() => {
        lastCall.current = Date.now()
        timeout.current = null
        callback(...args)
      }, remainingTime)
    }
  }, [callback, delay]);
}

const supabase = createClient()

const generateRandomColor = () => `hsl(${Math.floor(Math.random() * 360)}, 100%, 70%)`

const generateRandomNumber = () => Math.floor(Math.random() * 100)

const EVENT_NAME = 'realtime-cursor-move'

export const useRealtimeCursors = ({
  roomName,
  username,
  throttleMs
}) => {
  const [color] = useState(generateRandomColor())
  const [userId] = useState(generateRandomNumber())
  const [cursors, setCursors] = useState({})

  const channelRef = useRef(null)

  const callback = useCallback((event) => {
    const { clientX, clientY } = event

    const payload = {
      position: {
        x: clientX,
        y: clientY,
      },
      user: {
        id: userId,
        name: username,
      },
      color: color,
      timestamp: new Date().getTime(),
    }

    channelRef.current?.send({
      type: 'broadcast',
      event: EVENT_NAME,
      payload: payload,
    })
  }, [color, userId, username])

  const handleMouseMove = useThrottleCallback(callback, throttleMs)

  useEffect(() => {
    const channel = supabase.channel(roomName)
    channelRef.current = channel

    channel
      .on('broadcast', { event: EVENT_NAME }, (data) => {
        const { user } = data.payload
        // Don't render your own cursor
        if (user.id === userId) return

        setCursors((prev) => {
          if (prev[userId]) {
            delete prev[userId]
          }

          return {
            ...prev,
            [user.id]: data.payload,
          }
        })
      })
      .subscribe()

    return () => {
      channel.unsubscribe()
    };
  }, [])

  useEffect(() => {
    // Add event listener for mousemove
    window.addEventListener('mousemove', handleMouseMove)

    // Cleanup on unmount
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
    };
  }, [handleMouseMove])

  return { cursors }
}
