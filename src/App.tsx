import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, SkipForward, SkipBack, Volume2, VolumeX, RefreshCw } from 'lucide-react';

const GRID_SIZE = 20;
const CELL_SIZE = 20; // px
const INITIAL_SNAKE = [{ x: 10, y: 10 }];
const INITIAL_DIRECTION = { x: 0, y: -1 };
const GAME_SPEED = 100;

const TRACKS = [
  { id: 1, title: "SYS.AUDIO.01 // VOID", url: "https://actions.google.com/sounds/v1/science_fiction/sci_fi_drone_loop.ogg" },
  { id: 2, title: "SYS.AUDIO.02 // PULSE", url: "https://actions.google.com/sounds/v1/science_fiction/space_engine_loop.ogg" },
  { id: 3, title: "SYS.AUDIO.03 // BREATH", url: "https://actions.google.com/sounds/v1/science_fiction/alien_breath_loop.ogg" },
];

export default function App() {
  // Game State
  const [snake, setSnake] = useState(INITIAL_SNAKE);
  const [food, setFood] = useState({ x: 5, y: 5 });
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [isGameRunning, setIsGameRunning] = useState(false);
  
  // Music State
  const [currentTrack, setCurrentTrack] = useState(0);
  const [isPlayingMusic, setIsPlayingMusic] = useState(false);
  const [volume, setVolume] = useState(0.5);
  const [isMuted, setIsMuted] = useState(false);
  
  const audioRef = useRef<HTMLAudioElement>(null);
  const directionRef = useRef(INITIAL_DIRECTION);
  const lastProcessedDirectionRef = useRef(INITIAL_DIRECTION);

  const generateFood = useCallback((currentSnake: {x: number, y: number}[]) => {
    let newFood;
    while (true) {
      newFood = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE),
      };
      // Ensure food doesn't spawn on snake
      if (!currentSnake.some(segment => segment.x === newFood.x && segment.y === newFood.y)) {
        break;
      }
    }
    setFood(newFood);
  }, []);

  const resetGame = () => {
    setSnake(INITIAL_SNAKE);
    directionRef.current = INITIAL_DIRECTION;
    lastProcessedDirectionRef.current = INITIAL_DIRECTION;
    setScore(0);
    setGameOver(false);
    setIsGameRunning(true);
    generateFood(INITIAL_SNAKE);
  };

  // Game Loop
  useEffect(() => {
    if (!isGameRunning || gameOver) return;

    const moveSnake = () => {
      setSnake(prev => {
        const head = prev[0];
        const currentDir = directionRef.current;
        lastProcessedDirectionRef.current = currentDir;
        
        const newHead = { x: head.x + currentDir.x, y: head.y + currentDir.y };

        // Collision with walls
        if (
          newHead.x < 0 || newHead.x >= GRID_SIZE ||
          newHead.y < 0 || newHead.y >= GRID_SIZE
        ) {
          setGameOver(true);
          setIsGameRunning(false);
          return prev;
        }

        // Collision with self
        if (prev.some(segment => segment.x === newHead.x && segment.y === newHead.y)) {
          setGameOver(true);
          setIsGameRunning(false);
          return prev;
        }

        const newSnake = [newHead, ...prev];

        // Eat food
        if (newHead.x === food.x && newHead.y === food.y) {
          setScore(s => s + 10);
          generateFood(newSnake);
        } else {
          newSnake.pop();
        }

        return newSnake;
      });
    };

    const intervalId = setInterval(moveSnake, GAME_SPEED);
    return () => clearInterval(intervalId);
  }, [isGameRunning, gameOver, food, generateFood]);

  // Keyboard Controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
        e.preventDefault();
      }

      const lastDir = lastProcessedDirectionRef.current;

      switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
          if (lastDir.y !== 1) directionRef.current = { x: 0, y: -1 };
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          if (lastDir.y !== -1) directionRef.current = { x: 0, y: 1 };
          break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
          if (lastDir.x !== 1) directionRef.current = { x: -1, y: 0 };
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          if (lastDir.x !== -1) directionRef.current = { x: 1, y: 0 };
          break;
        case ' ':
          if (gameOver) {
            resetGame();
          } else {
            setIsGameRunning(prev => !prev);
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameOver]);

  // Music Player Effects
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  useEffect(() => {
    if (isPlayingMusic) {
      audioRef.current?.play().catch(e => console.error("Audio playback failed:", e));
    } else {
      audioRef.current?.pause();
    }
  }, [isPlayingMusic, currentTrack]);

  const togglePlayMusic = () => setIsPlayingMusic(!isPlayingMusic);
  const nextTrack = () => setCurrentTrack((prev) => (prev + 1) % TRACKS.length);
  const prevTrack = () => setCurrentTrack((prev) => (prev - 1 + TRACKS.length) % TRACKS.length);
  const handleTrackEnd = () => nextTrack();

  return (
    <div className="min-h-screen bg-[#050505] text-[#0ff] font-mono flex flex-col items-center justify-center p-4 selection:bg-[#f0f] selection:text-[#050505] overflow-hidden">
      <div className="static-noise"></div>
      <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(0,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(0,255,255,0.05)_1px,transparent_1px)] bg-[size:20px_20px] z-0"></div>
      
      <div className="z-10 flex flex-col items-center max-w-4xl w-full gap-6 screen-tear">
        
        {/* Header */}
        <div className="text-center">
          <h1 className="text-6xl font-bold mb-2 tracking-widest text-[#0ff] glitch-text" data-text="SNAKE_PROTOCOL.EXE">
            SNAKE_PROTOCOL.EXE
          </h1>
          <div className="flex items-center justify-center gap-4 text-[#f0f] tracking-widest text-3xl font-bold">
            <span>DATA_HARVESTED: {score.toString().padStart(4, '0')}</span>
          </div>
        </div>

        {/* Game Container */}
        <div className="relative bg-[#050505] border-4 border-[#0ff] p-1 shadow-[0_0_15px_#0ff,inset_0_0_15px_#0ff]">
          <div 
            className="relative bg-[#050505] overflow-hidden"
            style={{ width: GRID_SIZE * CELL_SIZE, height: GRID_SIZE * CELL_SIZE }}
          >
            {/* Snake */}
            {snake.map((segment, i) => (
              <div
                key={i}
                className={`absolute ${i === 0 ? 'bg-[#f0f]' : 'bg-[#0ff]'} border border-[#050505]`}
                style={{
                  width: CELL_SIZE,
                  height: CELL_SIZE,
                  left: segment.x * CELL_SIZE,
                  top: segment.y * CELL_SIZE,
                }}
              />
            ))}

            {/* Food */}
            <div
              className="absolute bg-[#f0f] animate-pulse border border-[#0ff]"
              style={{
                width: CELL_SIZE,
                height: CELL_SIZE,
                left: food.x * CELL_SIZE,
                top: food.y * CELL_SIZE,
              }}
            />

            {/* Overlays */}
            {!isGameRunning && !gameOver && (
              <div className="absolute inset-0 bg-[#050505]/90 flex flex-col items-center justify-center z-20 border-2 border-[#0ff]">
                <p className="text-[#0ff] text-3xl font-bold mb-4 glitch-text" data-text="AWAITING_INPUT... [SPACE]">AWAITING_INPUT... [SPACE]</p>
                <p className="text-[#f0f] text-2xl">WASD // ARROWS TO INITIATE</p>
              </div>
            )}

            {gameOver && (
              <div className="absolute inset-0 bg-[#050505]/90 flex flex-col items-center justify-center z-20 border-4 border-[#f0f]">
                <p className="text-[#f0f] text-5xl font-bold mb-2 glitch-text" data-text="CRITICAL_ERROR">CRITICAL_ERROR</p>
                <p className="text-[#0ff] text-2xl mb-6">ENTITY_TERMINATED // {score}</p>
                <button 
                  onClick={resetGame}
                  className="flex items-center gap-2 px-6 py-2 bg-[#050505] border-2 border-[#0ff] text-[#0ff] hover:bg-[#0ff] hover:text-[#050505] transition-none text-2xl uppercase"
                >
                  <RefreshCw size={24} className="animate-spin-slow" /> EXECUTE_REBOOT
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Music Player */}
        <div className="w-full max-w-md bg-[#050505] border-2 border-[#f0f] p-4 shadow-[4px_4px_0px_#0ff]">
          <audio 
            ref={audioRef} 
            src={TRACKS[currentTrack].url} 
            onEnded={handleTrackEnd}
            loop={false}
          />
          
          <div className="flex items-center justify-between mb-4 border-b border-[#0ff] pb-2">
            <div>
              <p className="text-sm text-[#0ff] font-bold tracking-widest mb-1 animate-pulse">AUDIO_FEED_ACTIVE</p>
              <h3 className="text-2xl font-bold text-[#f0f] uppercase">
                {TRACKS[currentTrack].title}
              </h3>
            </div>
            {isPlayingMusic && (
              <div className="flex gap-1 h-8 items-end">
                {[1, 2, 3, 4, 5].map(i => (
                  <div 
                    key={i} 
                    className="w-2 bg-[#0ff]"
                    style={{ 
                      height: `${Math.random() * 100}%`,
                      animationDuration: `${0.1 + Math.random() * 0.3}s`
                    }}
                  />
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button 
                onClick={prevTrack}
                className="p-2 text-[#0ff] hover:bg-[#0ff] hover:text-[#050505] border border-transparent hover:border-[#0ff] transition-none"
              >
                <SkipBack size={24} />
              </button>
              
              <button 
                onClick={togglePlayMusic}
                className="p-3 bg-[#050505] border-2 border-[#f0f] text-[#f0f] hover:bg-[#f0f] hover:text-[#050505] transition-none shadow-[2px_2px_0px_#0ff]"
              >
                {isPlayingMusic ? <Pause size={28} fill="currentColor" /> : <Play size={28} fill="currentColor" className="ml-1" />}
              </button>
              
              <button 
                onClick={nextTrack}
                className="p-2 text-[#0ff] hover:bg-[#0ff] hover:text-[#050505] border border-transparent hover:border-[#0ff] transition-none"
              >
                <SkipForward size={24} />
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button 
                onClick={() => setIsMuted(!isMuted)}
                className="text-[#f0f] hover:text-[#0ff]"
              >
                {isMuted || volume === 0 ? <VolumeX size={24} /> : <Volume2 size={24} />}
              </button>
              <input 
                type="range" 
                min="0" 
                max="1" 
                step="0.01" 
                value={isMuted ? 0 : volume}
                onChange={(e) => {
                  setVolume(parseFloat(e.target.value));
                  if (isMuted) setIsMuted(false);
                }}
                className="w-24 h-2 bg-[#050505] border border-[#0ff] appearance-none cursor-pointer accent-[#f0f]"
              />
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
