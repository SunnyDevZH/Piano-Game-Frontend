import React, { useRef, useEffect, useState } from 'react';

interface GameCanvasProps {
  width?: number;
  height?: number;
}

interface Note {
  x: number;
  y: number;
  width: number;
  height: number;
  column: number;
  color: string;
  speed: number;
}

interface GameState {
  notes: Note[];
  score: number;
  speed: number;
}

const GameCanvas: React.FC<GameCanvasProps> = ({ 
  width = 800, 
  height = 600 
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number | undefined>(undefined);
  const [isRunning, setIsRunning] = useState(false);
  const ballRef = useRef<Ball>({
    x: width / 2,
    y: height / 2,
    dx: 3,
    dy: 2,
    radius: 20,
    color: '#ff6b6b'
  });

  const draw = (ctx: CanvasRenderingContext2D) => {
    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    
    // Draw background
    ctx.fillStyle = '#2c3e50';
    ctx.fillRect(0, 0, width, height);
    
    // Draw border
    ctx.strokeStyle = '#34495e';
    ctx.lineWidth = 4;
    ctx.strokeRect(2, 2, width - 4, height - 4);
    
    // Draw ball
    const ball = ballRef.current;
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
    ctx.fillStyle = ball.color;
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Draw game title
    ctx.fillStyle = '#ecf0f1';
    ctx.font = '24px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Piano Game Canvas', width / 2, 40);
    
    // Draw instructions
    ctx.font = '16px Arial';
    ctx.fillText('Klicken Sie auf Start/Stop um den Ball zu animieren', width / 2, height - 20);
  };

  const update = () => {
    const ball = ballRef.current;
    
    // Update ball position
    ball.x += ball.dx;
    ball.y += ball.dy;
    
    // Bounce off walls
    if (ball.x + ball.radius > width || ball.x - ball.radius < 0) {
      ball.dx = -ball.dx;
      ball.color = `hsl(${Math.random() * 360}, 70%, 60%)`;
    }
    if (ball.y + ball.radius > height || ball.y - ball.radius < 0) {
      ball.dy = -ball.dy;
      ball.color = `hsl(${Math.random() * 360}, 70%, 60%)`;
    }
    
    // Keep ball within bounds
    ball.x = Math.max(ball.radius, Math.min(width - ball.radius, ball.x));
    ball.y = Math.max(ball.radius, Math.min(height - ball.radius, ball.y));
  };

  const gameLoop = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    update();
    draw(ctx);
    
    if (isRunning) {
      animationFrameRef.current = requestAnimationFrame(gameLoop);
    }
  };

  const toggleGame = () => {
    setIsRunning(!isRunning);
  };

  const resetBall = () => {
    ballRef.current = {
      x: width / 2,
      y: height / 2,
      dx: (Math.random() - 0.5) * 6,
      dy: (Math.random() - 0.5) * 6,
      radius: 20,
      color: '#ff6b6b'
    };
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Initial draw
    draw(ctx);
  }, []);

  useEffect(() => {
    if (isRunning) {
      gameLoop();
    } else {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    }
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isRunning]);

  return (
    <div className="game-canvas-container">
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        style={{
          border: '2px solid #34495e',
          borderRadius: '8px',
          display: 'block',
          margin: '0 auto',
          backgroundColor: '#2c3e50'
        }}
      />
      <div className="game-controls" style={{ 
        textAlign: 'center', 
        marginTop: '20px',
        display: 'flex',
        gap: '10px',
        justifyContent: 'center'
      }}>
        <button
          onClick={toggleGame}
          style={{
            padding: '10px 20px',
            fontSize: '16px',
            backgroundColor: isRunning ? '#e74c3c' : '#27ae60',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            transition: 'all 0.3s ease'
          }}
        >
          {isRunning ? 'Stop' : 'Start'}
        </button>
        <button
          onClick={resetBall}
          style={{
            padding: '10px 20px',
            fontSize: '16px',
            backgroundColor: '#3498db',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            transition: 'all 0.3s ease'
          }}
        >
          Reset
        </button>
      </div>
    </div>
  );
};

export default GameCanvas;
