import React, { useState, useEffect } from 'react';

export default function FarkleGame() {
  // 游戏状态
  const [dice, setDice] = useState(Array(6).fill(0));
  const [activeDiceCount, setActiveDiceCount] = useState(6); // 当前可以投掷的骰子数量
  const [heldDice, setHeldDice] = useState(Array(6).fill(false));
  const [turnScore, setTurnScore] = useState(0);
  const [totalScore, setTotalScore] = useState(0);
  const [playerScores, setPlayerScores] = useState([0]);
  const [currentPlayer, setCurrentPlayer] = useState(0);
  const [gameStatus, setGameStatus] = useState('准备开始');
  const [selectedScore, setSelectedScore] = useState(0);
  const [canRoll, setCanRoll] = useState(true);
  const [hasFarkle, setHasFarkle] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [playerCount, setPlayerCount] = useState(1);
  const [winningScore, setWinningScore] = useState(10000);
  const [validMoves, setValidMoves] = useState([]);
  const [currentRoll, setCurrentRoll] = useState([]);
  const [hasSavedScoreThisTurn, setHasSavedScoreThisTurn] = useState(false); // 跟踪是否已在本回合保存过分数

  // 掷骰子
  const rollDice = () => {
    if (!canRoll || isGameOver) return;
    
    // 如果已投掷过但尚未保存分数，不允许再次投掷
    if (dice.some(value => value > 0) && !hasSavedScoreThisTurn) {
      setGameStatus('必须先保存分数才能继续投掷');
      return;
    }
    
    const newDice = [...dice];
    const currentRollDice = [];
    
    // 只投掷未保存的骰子
    for (let i = 0; i < 6; i++) {
      if (!heldDice[i] && i < activeDiceCount) {
        newDice[i] = Math.floor(Math.random() * 6) + 1;
        currentRollDice.push({
          value: newDice[i],
          index: i
        });
      }
    }
    
    setDice(newDice);
    setCurrentRoll(currentRollDice);
    
    // 找出可得分的组合
    const validScoringOptions = findValidScoringOptions(currentRollDice);
    setValidMoves(validScoringOptions);
    
    if (validScoringOptions.length === 0) {
      // Farkle! 失去本轮积分
      setHasFarkle(true);
      setGameStatus('Farkle! 你失去了本轮积分');
      setTurnScore(0);
      setCanRoll(false);
      setTimeout(() => {
        nextPlayer();
      }, 2000);
    } else {
      // 检查是否所有骰子都可以计分
      const allDiceScorable = checkAllDiceScorable(currentRollDice, validScoringOptions);
      if (allDiceScorable) {
        setGameStatus('所有骰子都可得分！选择要保留的骰子');
      } else {
        setGameStatus('选择要保留的骰子');
      }
      setHasFarkle(false);
    }
  };

  // 检查所有新投掷的骰子是否都可以得分
  const checkAllDiceScorable = (currentRollDice, validOptions) => {
    if (currentRollDice.length === 0) return false;
    
    // 创建一个集合来记录所有可以得分的骰子索引
    const scorableDiceIndices = new Set();
    
    validOptions.forEach(option => {
      option.dice.forEach(dieIndex => {
        scorableDiceIndices.add(dieIndex);
      });
    });
    
    // 检查所有新投掷的骰子是否都在可得分集合中
    return currentRollDice.every(die => scorableDiceIndices.has(die.index));
  };

  // 找出有效的得分组合
  const findValidScoringOptions = (currentRollDice) => {
    if (currentRollDice.length === 0) return [];
    
    const options = [];
    const diceValues = currentRollDice.map(die => die.value);
    const diceIndices = currentRollDice.map(die => die.index);
    
    // 计算各点数出现的次数
    const counts = {};
    diceValues.forEach(value => {
      counts[value] = (counts[value] || 0) + 1;
    });
    
    // 检查顺子 (1-6)
    if (diceValues.length === 6 && 
        [1, 2, 3, 4, 5, 6].every(val => diceValues.includes(val))) {
      options.push({
        type: '顺子',
        score: 1500,
        dice: diceIndices
      });
      return options; // 如果有顺子，直接返回，因为这是最优选择
    }
    
    // 检查三对
    const pairs = Object.entries(counts).filter(([_, count]) => count === 2);
    if (pairs.length === 3 && diceValues.length === 6) {
      options.push({
        type: '三对',
        score: 1500,
        dice: diceIndices
      });
      return options; // 如果有三对，直接返回，因为这是最优选择
    }
    
    // 检查三个或更多相同点数
    for (let value = 1; value <= 6; value++) {
      if (counts[value] >= 3) {
        const indices = currentRollDice
          .filter(die => die.value === value)
          .map(die => die.index);
        
        let score;
        if (value === 1) {
          score = 1000 * Math.pow(2, counts[value] - 3);
        } else {
          score = value * 100 * Math.pow(2, counts[value] - 3);
        }
        
        options.push({
          type: `${counts[value]}个${value}`,
          score: score,
          dice: indices
        });
      }
    }
    
    // 检查单个1和5
    if (counts[1] && counts[1] < 3) {
      const indices = currentRollDice
        .filter(die => die.value === 1)
        .map(die => die.index);
      
      options.push({
        type: `${counts[1]}个1`,
        score: 100 * counts[1],
        dice: indices
      });
    }
    
    if (counts[5] && counts[5] < 3) {
      const indices = currentRollDice
        .filter(die => die.value === 5)
        .map(die => die.index);
      
      options.push({
        type: `${counts[5]}个5`,
        score: 50 * counts[5],
        dice: indices
      });
    }
    
    return options;
  };

  // 检查骰子是否可以被选中（只有在有效得分组合中的骰子才能被选中）
  const isDiceSelectable = (index) => {
    return validMoves.some(move => move.dice.includes(index));
  };

  // 切换骰子保留状态
  const toggleHold = (index) => {
    if (hasFarkle || isGameOver) return;
    
    // 检查该骰子是否可以被选中
    if (!isDiceSelectable(index) && !heldDice[index]) {
      return; // 如果不在有效得分组合中，阻止选择
    }
    
    const newHeldDice = [...heldDice];
    
    // 如果选择了一个已经被保留的骰子，允许取消选择
    if (heldDice[index]) {
      newHeldDice[index] = false;
      setHeldDice(newHeldDice);
      updateSelectedScore(dice, newHeldDice);
      return;
    }
    
    // 确定该骰子属于哪个得分组合
    const moveWithThisDice = validMoves.find(move => move.dice.includes(index));
    
    if (moveWithThisDice) {
      // 如果是三个以上的相同点数、顺子或三对，需要选择所有相关骰子
      if (moveWithThisDice.type.includes('个') && parseInt(moveWithThisDice.type) >= 3 || 
          moveWithThisDice.type === '顺子' || 
          moveWithThisDice.type === '三对') {
        moveWithThisDice.dice.forEach(dieIndex => {
          newHeldDice[dieIndex] = true;
        });
      } else {
        // 对于单个1和5，只选择点击的骰子
        newHeldDice[index] = true;
      }
      
      setHeldDice(newHeldDice);
      updateSelectedScore(dice, newHeldDice);
    }
  };

  // 更新选中骰子的分数
  const updateSelectedScore = (currentDice, currentHeld) => {
    let score = 0;
    
    // 获取已保留的骰子
    const heldDiceValues = [];
    for (let i = 0; i < currentDice.length; i++) {
      if (currentHeld[i]) {
        heldDiceValues.push(currentDice[i]);
      }
    }
    
    // 计算各个点数的数量
    const counts = {};
    for (const die of heldDiceValues) {
      counts[die] = (counts[die] || 0) + 1;
    }
    
    // 计算顺子
    if (heldDiceValues.length === 6 && 
        Object.keys(counts).length === 6 && 
        Object.keys(counts).every(key => parseInt(key) >= 1 && parseInt(key) <= 6)) {
      score = 1500;
    }
    // 计算三对
    else if (heldDiceValues.length === 6 && 
             Object.values(counts).every(count => count === 2) && 
             Object.values(counts).length === 3) {
      score = 1500;
    }
    // 计算其他组合
    else {
      for (let i = 1; i <= 6; i++) {
        if (counts[i] >= 3) {
          if (i === 1) {
            score += 1000 * Math.pow(2, counts[i] - 3);
          } else {
            score += i * 100 * Math.pow(2, counts[i] - 3);
          }
        } else {
          if (i === 1) {
            score += (counts[i] || 0) * 100;
          } else if (i === 5) {
            score += (counts[i] || 0) * 50;
          }
        }
      }
    }
    
    setSelectedScore(score);
  };

  // 保存当前选择的分数
  const bankScore = () => {
    if (hasFarkle || isGameOver || selectedScore === 0) return;
    
    const newTurnScore = turnScore + selectedScore;
    setTurnScore(newTurnScore);
    setSelectedScore(0);
    
    // 标记本回合已保存过分数
    setHasSavedScoreThisTurn(true);
    
    // 检查是否所有可投掷骰子都已使用
    const remainingDiceCount = activeDiceCount - heldDice.filter((held, index) => held && index < activeDiceCount).length;
    
    if (remainingDiceCount === 0) {
      // 检查是否所有骰子都可得分
      const allDiceScorable = checkAllDiceScorable(currentRoll, validMoves);
      
      if (allDiceScorable) {
        // 如果所有骰子都可得分，重置所有骰子状态，允许玩家重新掷所有骰子
        setHeldDice(Array(6).fill(false));
        setActiveDiceCount(6);
        setGameStatus('所有骰子都可得分! 你可以继续掷所有骰子');
      } else {
        // 如果没有剩余骰子但不是所有骰子都可得分，结束回合
        endTurn();
        return;
      }
    } else {
      // 从界面上移除已保存分数的骰子
      // 我们通过调整activeDiceCount和重新排列未保存的骰子来实现
      const newDice = [...dice];
      const newHeldDice = Array(6).fill(false);
      
      let newIndex = 0;
      for (let i = 0; i < activeDiceCount; i++) {
        if (!heldDice[i]) {
          newDice[newIndex] = dice[i];
          newIndex++;
        }
      }
      
      // 填充剩余空位
      for (let i = newIndex; i < 6; i++) {
        newDice[i] = 0;
      }
      
      setDice(newDice);
      setHeldDice(newHeldDice);
      setActiveDiceCount(remainingDiceCount);
      setGameStatus('已保存分数，继续掷剩余骰子');
    }
    
    // 清空当前有效组合和选中骰子
    setValidMoves([]);
    setCurrentRoll([]);
  };

  // 结束当前玩家的回合
  const endTurn = () => {
    if (isGameOver) return;
    
    const newScores = [...playerScores];
    newScores[currentPlayer] += turnScore;
    setPlayerScores(newScores);
    
    // 检查游戏是否结束
    if (newScores[currentPlayer] >= winningScore) {
      setIsGameOver(true);
      setGameStatus(`玩家 ${currentPlayer + 1} 获胜，总分: ${newScores[currentPlayer]}!`);
    } else {
      nextPlayer();
    }
  };

  // 切换到下一个玩家
  const nextPlayer = () => {
    const nextPlayer = (currentPlayer + 1) % playerCount;
    setCurrentPlayer(nextPlayer);
    resetTurn();
    setGameStatus(`玩家 ${nextPlayer + 1} 的回合`);
  };

  // 重置当前回合
  const resetTurn = () => {
    setDice(Array(6).fill(0));
    setHeldDice(Array(6).fill(false));
    setTurnScore(0);
    setSelectedScore(0);
    setCanRoll(true);
    setHasFarkle(false);
    setValidMoves([]);
    setCurrentRoll([]);
    setActiveDiceCount(6);
    setHasSavedScoreThisTurn(false); // 重置本回合的保存分数状态
  };

  // 启动新游戏
  const startNewGame = () => {
    setPlayerScores(Array(playerCount).fill(0));
    setCurrentPlayer(0);
    resetTurn();
    setIsGameOver(false);
    setGameStatus('游戏开始! 玩家 1 的回合');
  };

  // 更改玩家数量
  const changePlayerCount = (count) => {
    if (count >= 1 && count <= 6) {
      setPlayerCount(count);
      setPlayerScores(Array(count).fill(0));
    }
  };

  // 更改获胜分数
  const changeWinningScore = (score) => {
    if (score >= 1000) {
      setWinningScore(score);
    }
  };

  // 骰子渲染
  const renderDie = (index) => {
    // 如果索引超出当前活动骰子数量，不显示该骰子
    if (index >= activeDiceCount) {
      return null;
    }
    
    const value = dice[index];
    if (value === 0) return <div key={index} className="w-16 h-16 bg-gray-100 rounded-lg" />;
    
    const isHeld = heldDice[index];
    const isSelectable = isDiceSelectable(index) || isHeld;
    
    let bgColor = 'bg-white';
    if (isHeld) {
      bgColor = 'bg-green-200';
    } else if (!isSelectable) {
      bgColor = 'bg-red-100';
    }
    
    const pips = [];
    const pipClass = "bg-black rounded-full w-3 h-3";
    
    switch (value) {
      case 1:
        pips.push(<div key="center" className={`${pipClass} absolute inset-0 m-auto`} />);
        break;
      case 2:
        pips.push(<div key="top-right" className={`${pipClass} absolute top-2 right-2`} />);
        pips.push(<div key="bottom-left" className={`${pipClass} absolute bottom-2 left-2`} />);
        break;
      case 3:
        pips.push(<div key="top-right" className={`${pipClass} absolute top-2 right-2`} />);
        pips.push(<div key="center" className={`${pipClass} absolute inset-0 m-auto`} />);
        pips.push(<div key="bottom-left" className={`${pipClass} absolute bottom-2 left-2`} />);
        break;
      case 4:
        pips.push(<div key="top-left" className={`${pipClass} absolute top-2 left-2`} />);
        pips.push(<div key="top-right" className={`${pipClass} absolute top-2 right-2`} />);
        pips.push(<div key="bottom-left" className={`${pipClass} absolute bottom-2 left-2`} />);
        pips.push(<div key="bottom-right" className={`${pipClass} absolute bottom-2 right-2`} />);
        break;
      case 5:
        pips.push(<div key="top-left" className={`${pipClass} absolute top-2 left-2`} />);
        pips.push(<div key="top-right" className={`${pipClass} absolute top-2 right-2`} />);
        pips.push(<div key="center" className={`${pipClass} absolute inset-0 m-auto`} />);
        pips.push(<div key="bottom-left" className={`${pipClass} absolute bottom-2 left-2`} />);
        pips.push(<div key="bottom-right" className={`${pipClass} absolute bottom-2 right-2`} />);
        break;
      case 6:
        pips.push(<div key="top-left" className={`${pipClass} absolute top-2 left-2`} />);
        pips.push(<div key="top-right" className={`${pipClass} absolute top-2 right-2`} />);
        pips.push(<div key="middle-left" className={`${pipClass} absolute top-1/2 left-2 -translate-y-1/2`} />);
        pips.push(<div key="middle-right" className={`${pipClass} absolute top-1/2 right-2 -translate-y-1/2`} />);
        pips.push(<div key="bottom-left" className={`${pipClass} absolute bottom-2 left-2`} />);
        pips.push(<div key="bottom-right" className={`${pipClass} absolute bottom-2 right-2`} />);
        break;
      default:
        break;
    }
    
    return (
      <div 
        key={index}
        className={`${bgColor} w-16 h-16 border-2 border-gray-300 rounded-lg shadow-md relative cursor-pointer ${isSelectable ? 'hover:border-blue-500' : 'cursor-not-allowed'}`}
        onClick={() => toggleHold(index)}
      >
        {pips}
      </div>
    );
  };

  // 有效得分组合渲染
  const renderValidMoves = () => {
    if (validMoves.length === 0) return null;
    
    return (
      <div className="mb-4 p-3 bg-gray-50 rounded-lg">
        <h3 className="font-bold mb-2">可选的得分组合:</h3>
        <div className="grid grid-cols-2 gap-2">
          {validMoves.map((move, index) => (
            <div key={index} className="text-sm p-2 bg-white rounded border">
              <span className="font-semibold">{move.type}</span>: {move.score}分
            </div>
          ))}
        </div>
      </div>
    );
  };

  // 玩家分数渲染
  const renderPlayerScores = () => {
    return (
      <div className="grid grid-cols-3 gap-2 mb-4">
        {playerScores.map((score, index) => (
          <div 
            key={index} 
            className={`p-2 border rounded-md text-center ${currentPlayer === index ? 'bg-blue-100 border-blue-500' : 'bg-gray-50'}`}
          >
            <div className="font-semibold">玩家 {index + 1}</div>
            <div>{score}</div>
          </div>
        ))}
      </div>
    );
  };

  // 游戏设置
  const renderGameSettings = () => {
    if (gameStatus !== '准备开始') return null;
    
    return (
      <div className="mb-4 p-4 bg-gray-50 rounded-lg">
        <h3 className="font-bold mb-2">游戏设置</h3>
        
        <div className="flex flex-col gap-4">
          <div>
            <label className="block mb-1">玩家数量:</label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5, 6].map(num => (
                <button
                  key={num}
                  className={`px-3 py-1 rounded ${playerCount === num ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
                  onClick={() => changePlayerCount(num)}
                >
                  {num}
                </button>
              ))}
            </div>
          </div>
          
          <div>
            <label className="block mb-1">获胜分数:</label>
            <div className="flex gap-2">
              {[5000, 10000, 15000, 20000].map(score => (
                <button
                  key={score}
                  className={`px-3 py-1 rounded ${winningScore === score ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
                  onClick={() => changeWinningScore(score)}
                >
                  {score}
                </button>
              ))}
            </div>
          </div>
          
          <button
            className="bg-green-500 text-white py-2 rounded-md font-bold"
            onClick={startNewGame}
          >
            开始游戏
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="p-4 bg-gray-100 rounded-lg max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-center mb-4">Farkle 骰子游戏</h1>
      
      {/* 游戏规则 */}
      <div className="mb-4 p-3 bg-blue-50 rounded-lg text-sm">
        <h3 className="font-bold">游戏规则:</h3>
        <ul className="list-disc pl-5">
          <li>每次投掷后，只能选择得分的骰子组合</li>
          <li>第一次投掷后，必须先保存分数才能继续投掷</li>
          <li>已保存得分的骰子将从界面上移除</li>
          <li>单个1 = 100分，单个5 = 50分</li>
          <li>三个1 = 1000分，三个其他数字 = 数字值×100分</li>
          <li>四个、五个、六个相同的点数会得到更多分数</li>
          <li>顺子(1-6) = 1500分，三对 = 1500分</li>
          <li>如果所有骰子都可得分，保存分数后可以重新掷出6个骰子</li>
          <li>如果一次投掷没有得分组合，就会"Farkle"，失去本回合所有分数</li>
          <li>先达到获胜分数的玩家获胜</li>
        </ul>
      </div>
      
      {/* 游戏状态 */}
      <div className="mb-4 p-2 bg-yellow-100 rounded-lg text-center font-semibold">
        {gameStatus}
      </div>
      
      {/* 玩家分数 */}
      {gameStatus !== '准备开始' && renderPlayerScores()}
      
      {/* 游戏设置 */}
      {renderGameSettings()}
      
      {/* 有效得分组合 */}
      {gameStatus !== '准备开始' && renderValidMoves()}
      
      {/* 骰子区域 */}
      {gameStatus !== '准备开始' && (
        <div className="mb-6 flex flex-wrap justify-center gap-4">
          {Array.from({ length: activeDiceCount }).map((_, index) => renderDie(index))}
        </div>
      )}
      
      {/* 分数和按钮区域 */}
      {gameStatus !== '准备开始' && (
        <div className="flex flex-col gap-3">
          <div className="flex justify-between p-3 bg-white rounded-lg">
            <div className="text-lg">
              <span className="font-semibold">本回合分数:</span> {turnScore}
            </div>
            <div className="text-lg">
              <span className="font-semibold">选中分数:</span> {selectedScore}
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-3">
            <button
              className={`py-2 rounded-md font-bold ${canRoll && !isGameOver && (dice.every(d => d === 0) || hasSavedScoreThisTurn) ? 'bg-blue-500 text-white' : 'bg-gray-300'}`}
              onClick={rollDice}
              disabled={!canRoll || isGameOver || (dice.some(d => d > 0) && !hasSavedScoreThisTurn)}
            >
              掷骰子
            </button>
            
            <button
              className={`py-2 rounded-md font-bold ${selectedScore > 0 && !hasFarkle && !isGameOver ? 'bg-green-500 text-white' : 'bg-gray-300'}`}
              onClick={bankScore}
              disabled={selectedScore === 0 || hasFarkle || isGameOver}
            >
              保存分数
            </button>
            
            <button
              className={`py-2 rounded-md font-bold ${turnScore > 0 && !hasFarkle && !isGameOver ? 'bg-yellow-500 text-white' : 'bg-gray-300'}`}
              onClick={endTurn}
              disabled={turnScore === 0 || hasFarkle || isGameOver}
            >
              结束回合
            </button>
          </div>
          
          {isGameOver && (
            <button
              className="mt-4 py-2 bg-purple-500 text-white rounded-md font-bold"
              onClick={startNewGame}
            >
              开始新游戏
            </button>
          )}
        </div>
      )}
    </div>
  );
}
