"use client"

import { useState } from "react"
import { AnimatePresence } from "framer-motion"
import { DiceAnimation } from "./dice-animation"

export default function FarkleGame() {
  // Game state
  const [dice, setDice] = useState(Array(6).fill(0))
  const [activeDiceCount, setActiveDiceCount] = useState(6) // Current number of dice that can be rolled
  const [heldDice, setHeldDice] = useState(Array(6).fill(false))
  const [turnScore, setTurnScore] = useState(0)
  const [totalScore, setTotalScore] = useState(0)
  const [playerScores, setPlayerScores] = useState([0])
  const [currentPlayer, setCurrentPlayer] = useState(0)
  const [gameStatus, setGameStatus] = useState("Ready to start")
  const [selectedScore, setSelectedScore] = useState(0)
  const [canRoll, setCanRoll] = useState(true)
  const [hasFarkle, setHasFarkle] = useState(false)
  const [isGameOver, setIsGameOver] = useState(false)
  const [playerCount, setPlayerCount] = useState(1)
  const [winningScore, setWinningScore] = useState(10000)
  const [validMoves, setValidMoves] = useState([])
  const [currentRoll, setCurrentRoll] = useState([])
  const [hasSavedScoreThisTurn, setHasSavedScoreThisTurn] = useState(false)
  const [isRolling, setIsRolling] = useState(false)

  // Roll dice
  const rollDice = () => {
    if (!canRoll || isGameOver || isRolling) return

    // If already rolled but haven't saved score, don't allow another roll
    if (dice.some((value) => value > 0) && !hasSavedScoreThisTurn) {
      setGameStatus("You must save a score before rolling again")
      return
    }

    setIsRolling(true)

    // Start animation
    setTimeout(() => {
      const newDice = [...dice]
      const currentRollDice = []

      // Only roll dice that aren't held
      for (let i = 0; i < 6; i++) {
        if (!heldDice[i] && i < activeDiceCount) {
          newDice[i] = Math.floor(Math.random() * 6) + 1
          currentRollDice.push({
            value: newDice[i],
            index: i,
          })
        }
      }

      setDice(newDice)
      setCurrentRoll(currentRollDice)

      // Find valid scoring combinations
      const validScoringOptions = findValidScoringOptions(currentRollDice)
      setValidMoves(validScoringOptions)

      if (validScoringOptions.length === 0) {
        // Farkle! Lose all points for this turn
        setHasFarkle(true)
        setGameStatus("Farkle! You lost all points for this turn")
        setTurnScore(0)
        setCanRoll(false)
        setTimeout(() => {
          nextPlayer()
        }, 2000)
      } else {
        // Check if all dice are scorable
        const allDiceScorable = checkAllDiceScorable(currentRollDice, validScoringOptions)
        if (allDiceScorable) {
          setGameStatus("All dice can score! Select dice to keep")
        } else {
          setGameStatus("Select dice to keep")
        }
        setHasFarkle(false)
      }

      setIsRolling(false)
    }, 1000) // Animation duration
  }

  // Check if all newly rolled dice can score
  const checkAllDiceScorable = (currentRollDice, validOptions) => {
    if (currentRollDice.length === 0) return false

    // Create a set to track all dice indices that can score
    const scorableDiceIndices = new Set()

    validOptions.forEach((option) => {
      option.dice.forEach((dieIndex) => {
        scorableDiceIndices.add(dieIndex)
      })
    })

    // Check if all newly rolled dice are in the scorable set
    return currentRollDice.every((die) => scorableDiceIndices.has(die.index))
  }

  // Find valid scoring combinations
  const findValidScoringOptions = (currentRollDice) => {
    if (currentRollDice.length === 0) return []

    const options = []
    const diceValues = currentRollDice.map((die) => die.value)
    const diceIndices = currentRollDice.map((die) => die.index)

    // Count occurrences of each value
    const counts = {}
    diceValues.forEach((value) => {
      counts[value] = (counts[value] || 0) + 1
    })

    // Check for straight (1-6)
    if (diceValues.length === 6 && [1, 2, 3, 4, 5, 6].every((val) => diceValues.includes(val))) {
      options.push({
        type: "Straight",
        score: 1500,
        dice: diceIndices,
      })
      return options // If there's a straight, return immediately as it's the best option
    }

    // Check for three pairs
    const pairs = Object.entries(counts).filter(([_, count]) => count === 2)
    if (pairs.length === 3 && diceValues.length === 6) {
      options.push({
        type: "Three Pairs",
        score: 1500,
        dice: diceIndices,
      })
      return options // If there are three pairs, return immediately as it's the best option
    }

    // Check for three or more of the same value
    for (let value = 1; value <= 6; value++) {
      if (counts[value] >= 3) {
        const indices = currentRollDice.filter((die) => die.value === value).map((die) => die.index)

        let score
        if (value === 1) {
          score = 1000 * Math.pow(2, counts[value] - 3)
        } else {
          score = value * 100 * Math.pow(2, counts[value] - 3)
        }

        options.push({
          type: `${counts[value]} of ${value}`,
          score: score,
          dice: indices,
        })
      }
    }

    // Check for single 1s and 5s
    if (counts[1] && counts[1] < 3) {
      const indices = currentRollDice.filter((die) => die.value === 1).map((die) => die.index)

      options.push({
        type: `${counts[1]} of 1`,
        score: 100 * counts[1],
        dice: indices,
      })
    }

    if (counts[5] && counts[5] < 3) {
      const indices = currentRollDice.filter((die) => die.value === 5).map((die) => die.index)

      options.push({
        type: `${counts[5]} of 5`,
        score: 50 * counts[5],
        dice: indices,
      })
    }

    return options
  }

  // Check if a die can be selected (only dice in valid scoring combinations can be selected)
  const isDiceSelectable = (index) => {
    return validMoves.some((move) => move.dice.includes(index))
  }

  // Toggle die hold state
  const toggleHold = (index) => {
    if (hasFarkle || isGameOver || isRolling) return

    // Check if this die can be selected
    if (!isDiceSelectable(index) && !heldDice[index]) {
      return // If not in a valid scoring combination, prevent selection
    }

    const newHeldDice = [...heldDice]

    // If selecting a die that's already held, allow deselection
    if (heldDice[index]) {
      newHeldDice[index] = false
      setHeldDice(newHeldDice)
      updateSelectedScore(dice, newHeldDice)
      return
    }

    // Determine which scoring combination this die belongs to
    const moveWithThisDice = validMoves.find((move) => move.dice.includes(index))

    if (moveWithThisDice) {
      // If it's three or more of the same value, a straight, or three pairs, select all related dice
      if (
        (moveWithThisDice.type.includes("of") && Number.parseInt(moveWithThisDice.type) >= 3) ||
        moveWithThisDice.type === "Straight" ||
        moveWithThisDice.type === "Three Pairs"
      ) {
        moveWithThisDice.dice.forEach((dieIndex) => {
          newHeldDice[dieIndex] = true
        })
      } else {
        // For single 1s and 5s, only select the clicked die
        newHeldDice[index] = true
      }

      setHeldDice(newHeldDice)
      updateSelectedScore(dice, newHeldDice)
    }
  }

  // Update the score for selected dice
  const updateSelectedScore = (currentDice, currentHeld) => {
    let score = 0

    // Get held dice values
    const heldDiceValues = []
    for (let i = 0; i < currentDice.length; i++) {
      if (currentHeld[i]) {
        heldDiceValues.push(currentDice[i])
      }
    }

    // Count occurrences of each value
    const counts = {}
    for (const die of heldDiceValues) {
      counts[die] = (counts[die] || 0) + 1
    }

    // Calculate score for straight
    if (
      heldDiceValues.length === 6 &&
      Object.keys(counts).length === 6 &&
      Object.keys(counts).every((key) => Number.parseInt(key) >= 1 && Number.parseInt(key) <= 6)
    ) {
      score = 1500
    }
    // Calculate score for three pairs
    else if (
      heldDiceValues.length === 6 &&
      Object.values(counts).every((count) => count === 2) &&
      Object.values(counts).length === 3
    ) {
      score = 1500
    }
    // Calculate score for other combinations
    else {
      for (let i = 1; i <= 6; i++) {
        if (counts[i] >= 3) {
          if (i === 1) {
            score += 1000 * Math.pow(2, counts[i] - 3)
          } else {
            score += i * 100 * Math.pow(2, counts[i] - 3)
          }
        } else {
          if (i === 1) {
            score += (counts[i] || 0) * 100
          } else if (i === 5) {
            score += (counts[i] || 0) * 50
          }
        }
      }
    }

    setSelectedScore(score)
  }

  // Save the currently selected score
  const bankScore = () => {
    if (hasFarkle || isGameOver || selectedScore === 0 || isRolling) return

    const newTurnScore = turnScore + selectedScore
    setTurnScore(newTurnScore)
    setSelectedScore(0)

    // Mark that a score has been saved this turn
    setHasSavedScoreThisTurn(true)

    // Check if all rollable dice have been used
    const remainingDiceCount =
      activeDiceCount - heldDice.filter((held, index) => held && index < activeDiceCount).length

    if (remainingDiceCount === 0) {
      // Check if all dice can score
      const allDiceScorable = checkAllDiceScorable(currentRoll, validMoves)

      if (allDiceScorable) {
        // If all dice can score, reset all dice state, allow player to roll all dice again
        setHeldDice(Array(6).fill(false))
        setActiveDiceCount(6)
        setGameStatus("All dice can score! You can roll all dice again")
      } else {
        // If no dice remain but not all dice can score, end the turn
        endTurn()
        return
      }
    } else {
      // Remove saved dice from the UI
      // We do this by adjusting activeDiceCount and rearranging unsaved dice
      const newDice = [...dice]
      const newHeldDice = Array(6).fill(false)

      let newIndex = 0
      for (let i = 0; i < activeDiceCount; i++) {
        if (!heldDice[i]) {
          newDice[newIndex] = dice[i]
          newIndex++
        }
      }

      // Fill remaining slots
      for (let i = newIndex; i < 6; i++) {
        newDice[i] = 0
      }

      setDice(newDice)
      setHeldDice(newHeldDice)
      setActiveDiceCount(remainingDiceCount)
      setGameStatus("Score saved, roll remaining dice")
    }

    // Clear current valid combinations and selected dice
    setValidMoves([])
    setCurrentRoll([])
  }

  // End the current player's turn
  const endTurn = () => {
    if (isGameOver || isRolling) return

    const newScores = [...playerScores]
    newScores[currentPlayer] += turnScore
    setPlayerScores(newScores)

    // Check if the game is over
    if (newScores[currentPlayer] >= winningScore) {
      setIsGameOver(true)
      setGameStatus(`Player ${currentPlayer + 1} wins with a score of ${newScores[currentPlayer]}!`)
    } else {
      nextPlayer()
    }
  }

  // Switch to the next player
  const nextPlayer = () => {
    const nextPlayer = (currentPlayer + 1) % playerCount
    setCurrentPlayer(nextPlayer)
    resetTurn()
    setGameStatus(`Player ${nextPlayer + 1}'s turn`)
  }

  // Reset the current turn
  const resetTurn = () => {
    setDice(Array(6).fill(0))
    setHeldDice(Array(6).fill(false))
    setTurnScore(0)
    setSelectedScore(0)
    setCanRoll(true)
    setHasFarkle(false)
    setValidMoves([])
    setCurrentRoll([])
    setActiveDiceCount(6)
    setHasSavedScoreThisTurn(false)
  }

  // Start a new game
  const startNewGame = () => {
    setPlayerScores(Array(playerCount).fill(0))
    setCurrentPlayer(0)
    resetTurn()
    setIsGameOver(false)
    setGameStatus("Game started! Player 1's turn")
  }

  // Change the number of players
  const changePlayerCount = (count) => {
    if (count >= 1 && count <= 6) {
      setPlayerCount(count)
      setPlayerScores(Array(count).fill(0))
    }
  }

  // Change the winning score
  const changeWinningScore = (score) => {
    if (score >= 1000) {
      setWinningScore(score)
    }
  }

  // Render player scores
  const renderPlayerScores = () => {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 mb-4">
        {playerScores.map((score, index) => (
          <div
            key={index}
            className={`p-2 border rounded-md text-center ${currentPlayer === index ? "bg-blue-100 border-blue-500" : "bg-gray-50"}`}
          >
            <div className="font-semibold">Player {index + 1}</div>
            <div>{score}</div>
          </div>
        ))}
      </div>
    )
  }

  // Render valid scoring moves
  const renderValidMoves = () => {
    if (validMoves.length === 0) return null

    return (
      <div className="mb-4 p-3 bg-gray-50 rounded-lg">
        <h3 className="font-bold mb-2">Available Scoring Combinations:</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {validMoves.map((move, index) => (
            <div key={index} className="text-sm p-2 bg-white rounded border">
              <span className="font-semibold">{move.type}</span>: {move.score} points
            </div>
          ))}
        </div>
      </div>
    )
  }

  // Game settings
  const renderGameSettings = () => {
    if (gameStatus !== "Ready to start") return null

    return (
      <div className="mb-4 p-4 bg-gray-50 rounded-lg">
        <h3 className="font-bold mb-2">Game Settings</h3>

        <div className="flex flex-col gap-4">
          <div>
            <label className="block mb-1">Number of Players:</label>
            <div className="flex flex-wrap gap-2">
              {[1, 2, 3, 4, 5, 6].map((num) => (
                <button
                  key={num}
                  className={`px-3 py-1 rounded ${playerCount === num ? "bg-blue-500 text-white" : "bg-gray-200"}`}
                  onClick={() => changePlayerCount(num)}
                >
                  {num}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block mb-1">Winning Score:</label>
            <div className="flex flex-wrap gap-2">
              {[5000, 10000, 15000, 20000].map((score) => (
                <button
                  key={score}
                  className={`px-3 py-1 rounded ${winningScore === score ? "bg-blue-500 text-white" : "bg-gray-200"}`}
                  onClick={() => changeWinningScore(score)}
                >
                  {score}
                </button>
              ))}
            </div>
          </div>

          <button
            className="bg-green-500 text-white py-2 rounded-md font-bold hover:bg-green-600 transition-colors"
            onClick={startNewGame}
          >
            Start Game
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 bg-gray-100 rounded-lg max-w-4xl mx-auto shadow-lg">
      <h1 className="text-3xl font-bold text-center mb-4">Farkle Dice Game</h1>

      {/* Game rules */}
      <div className="mb-4 p-3 bg-blue-50 rounded-lg text-sm">
        <h3 className="font-bold">Game Rules:</h3>
        <ul className="list-disc pl-5">
          <li>After each roll, you can only select scoring dice combinations</li>
          <li>After the first roll, you must save a score before rolling again</li>
          <li>Dice that have been scored are removed from play</li>
          <li>Single 1 = 100 points, single 5 = 50 points</li>
          <li>Three 1s = 1000 points, three of any other number = number value × 100 points</li>
          <li>Four, five, or six of a kind score even more points</li>
          <li>Straight (1-6) = 1500 points, three pairs = 1500 points</li>
          <li>If all dice score, you can roll all 6 dice again after banking points</li>
          <li>If a roll has no scoring combinations, you "Farkle" and lose all points for that turn</li>
          <li>First player to reach the winning score wins</li>
        </ul>
      </div>

      {/* Game status */}
      <div className="mb-4 p-2 bg-yellow-100 rounded-lg text-center font-semibold">{gameStatus}</div>

      {/* Player scores */}
      {gameStatus !== "Ready to start" && renderPlayerScores()}

      {/* Game settings */}
      {renderGameSettings()}

      {/* Valid scoring combinations */}
      {gameStatus !== "Ready to start" && renderValidMoves()}

      {/* Dice area */}
      {gameStatus !== "Ready to start" && (
        <div className="mb-6 flex flex-wrap justify-center gap-4">
          <AnimatePresence>
            {Array.from({ length: activeDiceCount }).map((_, index) => (
              <DiceAnimation
                key={index}
                index={index}
                value={dice[index]}
                isHeld={heldDice[index]}
                isSelectable={isDiceSelectable(index) || heldDice[index]}
                isRolling={isRolling && !heldDice[index]}
                onClick={() => toggleHold(index)}
              />
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Score and button area */}
      {gameStatus !== "Ready to start" && (
        <div className="flex flex-col gap-3">
          <div className="flex justify-between p-3 bg-white rounded-lg">
            <div className="text-lg">
              <span className="font-semibold">Turn Score:</span> {turnScore}
            </div>
            <div className="text-lg">
              <span className="font-semibold">Selected Score:</span> {selectedScore}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <button
              className={`py-2 rounded-md font-bold transition-colors ${canRoll && !isGameOver && (dice.every((d) => d === 0) || hasSavedScoreThisTurn) ? "bg-blue-500 text-white hover:bg-blue-600" : "bg-gray-300"}`}
              onClick={rollDice}
              disabled={!canRoll || isGameOver || isRolling || (dice.some((d) => d > 0) && !hasSavedScoreThisTurn)}
            >
              {isRolling ? "Rolling..." : "Roll Dice"}
            </button>

            <button
              className={`py-2 rounded-md font-bold transition-colors ${selectedScore > 0 && !hasFarkle && !isGameOver && !isRolling ? "bg-green-500 text-white hover:bg-green-600" : "bg-gray-300"}`}
              onClick={bankScore}
              disabled={selectedScore === 0 || hasFarkle || isGameOver || isRolling}
            >
              Save Score
            </button>

            <button
              className={`py-2 rounded-md font-bold transition-colors ${turnScore > 0 && !hasFarkle && !isGameOver && !isRolling ? "bg-yellow-500 text-white hover:bg-yellow-600" : "bg-gray-300"}`}
              onClick={endTurn}
              disabled={turnScore === 0 || hasFarkle || isGameOver || isRolling}
            >
              End Turn
            </button>
          </div>

          {isGameOver && (
            <button
              className="mt-4 py-2 bg-purple-500 text-white rounded-md font-bold hover:bg-purple-600 transition-colors"
              onClick={startNewGame}
            >
              Start New Game
            </button>
          )}
        </div>
      )}
    </div>
  )
}
