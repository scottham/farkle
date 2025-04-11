"use client"
import { motion } from "framer-motion"

interface DiceAnimationProps {
  index: number
  value: number
  isHeld: boolean
  isSelectable: boolean
  isRolling: boolean
  onClick: () => void
}

export function DiceAnimation({ index, value, isHeld, isSelectable, isRolling, onClick }: DiceAnimationProps) {
  if (value === 0) {
    return <div className="w-16 h-16 bg-gray-100 rounded-lg" />
  }

  let bgColor = "bg-white"
  if (isHeld) {
    bgColor = "bg-green-200"
  } else if (!isSelectable) {
    bgColor = "bg-red-100"
  }

  const pips = []
  const pipClass = "bg-black rounded-full w-3 h-3"

  switch (value) {
    case 1:
      pips.push(<div key="center" className={`${pipClass} absolute inset-0 m-auto`} />)
      break
    case 2:
      pips.push(<div key="top-right" className={`${pipClass} absolute top-2 right-2`} />)
      pips.push(<div key="bottom-left" className={`${pipClass} absolute bottom-2 left-2`} />)
      break
    case 3:
      pips.push(<div key="top-right" className={`${pipClass} absolute top-2 right-2`} />)
      pips.push(<div key="center" className={`${pipClass} absolute inset-0 m-auto`} />)
      pips.push(<div key="bottom-left" className={`${pipClass} absolute bottom-2 left-2`} />)
      break
    case 4:
      pips.push(<div key="top-left" className={`${pipClass} absolute top-2 left-2`} />)
      pips.push(<div key="top-right" className={`${pipClass} absolute top-2 right-2`} />)
      pips.push(<div key="bottom-left" className={`${pipClass} absolute bottom-2 left-2`} />)
      pips.push(<div key="bottom-right" className={`${pipClass} absolute bottom-2 right-2`} />)
      break
    case 5:
      pips.push(<div key="top-left" className={`${pipClass} absolute top-2 left-2`} />)
      pips.push(<div key="top-right" className={`${pipClass} absolute top-2 right-2`} />)
      pips.push(<div key="center" className={`${pipClass} absolute inset-0 m-auto`} />)
      pips.push(<div key="bottom-left" className={`${pipClass} absolute bottom-2 left-2`} />)
      pips.push(<div key="bottom-right" className={`${pipClass} absolute bottom-2 right-2`} />)
      break
    case 6:
      pips.push(<div key="top-left" className={`${pipClass} absolute top-2 left-2`} />)
      pips.push(<div key="top-right" className={`${pipClass} absolute top-2 right-2`} />)
      pips.push(<div key="middle-left" className={`${pipClass} absolute top-1/2 left-2 -translate-y-1/2`} />)
      pips.push(<div key="middle-right" className={`${pipClass} absolute top-1/2 right-2 -translate-y-1/2`} />)
      pips.push(<div key="bottom-left" className={`${pipClass} absolute bottom-2 left-2`} />)
      pips.push(<div key="bottom-right" className={`${pipClass} absolute bottom-2 right-2`} />)
      break
    default:
      break
  }

  return (
    <motion.div
      className={`${bgColor} w-16 h-16 border-2 border-gray-300 rounded-lg shadow-md relative cursor-pointer ${isSelectable ? "hover:border-blue-500" : "cursor-not-allowed"}`}
      onClick={onClick}
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{
        opacity: 1,
        scale: 1,
        rotate: isRolling ? [0, 360, 720, 1080] : 0,
        x: isRolling ? [0, -20, 20, -10, 10, 0] : 0,
        y: isRolling ? [0, 20, -10, 15, -5, 0] : 0,
      }}
      transition={{
        duration: isRolling ? 1 : 0.3,
        ease: "easeInOut",
      }}
      whileHover={isSelectable ? { scale: 1.05, boxShadow: "0px 5px 15px rgba(0, 0, 0, 0.1)" } : {}}
      whileTap={isSelectable ? { scale: 0.95 } : {}}
    >
      {pips}
    </motion.div>
  )
}
