import React from 'react';
import { MazeNode, NodeStatus, NodeType } from '../types';
import { Lock, Check, Play, Flag, MapPin } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface GameMapProps {
  nodes: MazeNode[];
  onNodeClick: (nodeId: number) => void;
  rows: number;
  cols: number;
}

const GameMap: React.FC<GameMapProps> = ({ nodes, onNodeClick, rows, cols }) => {
  const isNeighbor = React.useCallback((n1: MazeNode, n2: MazeNode) => {
    const dx = Math.abs(n1.col - n2.col);
    const dy = Math.abs(n1.row - n2.row);
    return (dx === 1 && dy === 0) || (dx === 0 && dy === 1);
  }, []);

  const baseSize = 400 / Math.max(rows, cols);
  const cellSize = Math.max(80, Math.min(140, baseSize)); 
  const containerWidth = cols * cellSize;
  const containerHeight = rows * cellSize;

  // Performance Optimization: Memoize paths
  const paths = React.useMemo(() => {
    const result: any[] = [];
    nodes.forEach(node => {
      const neighbors = nodes.filter(n => isNeighbor(node, n) && (n.col > node.col || n.row > node.row));
      neighbors.forEach(neighbor => {
        const x1 = node.col * cellSize + cellSize / 2;
        const y1 = node.row * cellSize + cellSize / 2;
        const x2 = neighbor.col * cellSize + cellSize / 2;
        const y2 = neighbor.row * cellSize + cellSize / 2;
        const isActive = (node.status !== NodeStatus.LOCKED) && (neighbor.status !== NodeStatus.LOCKED);
        result.push({ id: `${node.id}-${neighbor.id}`, x1, y1, x2, y2, isActive });
      });
    });
    return result;
  }, [nodes, cellSize, isNeighbor]);

  return (
    <div className="relative flex justify-center items-center p-8 w-full h-full overflow-auto bg-background/50 custom-scrollbar">
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative" 
        style={{ width: `${containerWidth}px`, height: `${containerHeight}px` }}
      >
        
        {/* Paths */}
        <svg className="absolute top-0 left-0 w-full h-full pointer-events-none z-0">
          {paths.map(path => (
            <motion.line
              key={path.id}
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ 
                pathLength: 1, 
                opacity: path.isActive ? 1 : 0.2,
                stroke: path.isActive ? 'var(--color-primary)' : 'var(--color-border)'
              }}
              transition={{ duration: 1.5, ease: "easeInOut" }}
              x1={path.x1} y1={path.y1} x2={path.x2} y2={path.y2}
              strokeWidth={path.isActive ? 4 : 2}
              strokeDasharray={path.isActive ? 'none' : '8,8'}
              className="transition-all duration-500"
            />
          ))}
        </svg>

        {/* Nodes */}
        <AnimatePresence>
          {nodes.map((node) => {
            const isCompleted = node.status === NodeStatus.COMPLETED;
            const isLocked = node.status === NodeStatus.LOCKED;
            const isUnlocked = node.status === NodeStatus.UNLOCKED;
            const isStart = node.type === NodeType.START;
            const isBoss = node.type === NodeType.BOSS;

            const nodeSize = 56; 

            let nodeClasses = "bg-surface border-border text-muted shadow-sm";
            let icon = <Lock size={18} />;
            
            if (isCompleted) {
              nodeClasses = 'bg-success text-white border-success shadow-[0_0_20px_rgba(16,185,129,0.4)]';
              icon = <Check size={28} strokeWidth={3} />;
            } else if (isUnlocked) {
              if (isBoss) {
                 nodeClasses = 'bg-danger text-white border-danger shadow-[0_0_30px_rgba(239,68,68,0.6)] ring-4 ring-danger/30';
                 icon = <Flag size={24} />;
              } else {
                 nodeClasses = 'bg-surface border-primary text-primary shadow-[0_0_25px_rgba(79,70,229,0.4)] ring-4 ring-primary/20';
                 icon = <Play size={24} className="fill-current ml-1"/>;
              }
            } else if (isStart) {
               nodeClasses = 'bg-primary text-primary-text border-primary shadow-xl';
               icon = <MapPin size={24} />;
            }

            return (
              <motion.div
                key={node.id}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ 
                  scale: 1, 
                  opacity: 1,
                  left: node.col * cellSize + cellSize / 2, 
                  top: node.row * cellSize + cellSize / 2 
                }}
                whileHover={!isLocked ? { scale: 1.15, zIndex: 20 } : {}}
                className="absolute transform -translate-x-1/2 -translate-y-1/2 z-10"
              >
                <button
                  onClick={() => !isLocked && onNodeClick(node.id)}
                  disabled={isLocked}
                  style={{ width: nodeSize, height: nodeSize }}
                  className={`
                    rounded-2xl border-2 flex items-center justify-center
                    transition-all duration-500
                    ${nodeClasses}
                    ${!isLocked ? 'cursor-pointer' : 'opacity-40 cursor-not-allowed'}
                  `}
                >
                  <motion.div
                    animate={isUnlocked && !isCompleted ? { scale: [1, 1.2, 1] } : {}}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    {icon}
                  </motion.div>
                </button>

                {/* Label */}
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`
                    absolute -bottom-10 left-1/2 transform -translate-x-1/2 whitespace-nowrap text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg shadow-lg border transition-all duration-500
                    ${isUnlocked && !isCompleted ? 'bg-primary text-primary-text border-primary' : 'bg-surface text-muted border-border'}
                    ${isBoss && isUnlocked ? 'bg-danger border-danger text-white' : ''}
                  `}
                >
                  {isStart ? 'Khởi hành' : isBoss ? 'Trùm cuối' : isCompleted ? 'Đã xong' : `Chặng ${node.id}`}
                </motion.div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default GameMap;
