import React from 'react';
import { MazeNode, NodeStatus, NodeType } from '../types';
import { CheckCircle, Lock, Play, Flag, MapPin, AlertCircle, Info, Eye } from 'lucide-react';

interface GameOverviewProps {
  nodes: MazeNode[];
  totalQuestions: number;
  completedCount: number;
  onClose?: () => void; // For mobile modal
  lastCompletedNodeId?: number | null;
  onNodeClick?: (nodeId: number) => void;
}

const GameOverview: React.FC<GameOverviewProps> = ({ nodes, totalQuestions, completedCount, onClose, lastCompletedNodeId, onNodeClick }) => {
  const percentage = Math.round((completedCount / totalQuestions) * 100);

  return (
    <div className="h-full flex flex-col bg-surface w-full">
      <div className="p-4 border-b border-border flex justify-between items-start">
        <div>
            <h3 className="font-bold text-lg flex items-center gap-2">
                <Info size={20} className="text-primary"/>
                Tổng quan
            </h3>
            <p className="text-xs text-muted">Chi tiết tiến độ màn chơi</p>
        </div>
        {onClose && (
            <button onClick={onClose} className="p-1 rounded-full hover:bg-background text-muted">
                <AlertCircle size={20} className="rotate-45"/>
            </button>
        )}
      </div>

      <div className="p-4 border-b border-border bg-background/50">
        {/* Progress Bar */}
        <div className="mb-1 flex justify-between text-sm">
          <span className="text-muted font-medium">Tiến độ hoàn thành</span>
          <span className="font-bold text-primary">{percentage}%</span>
        </div>
        <div className="w-full bg-surface rounded-full h-2.5 border border-border overflow-hidden shadow-inner">
          <div className="bg-primary h-2.5 rounded-full transition-all duration-500" style={{ width: `${percentage}%` }}></div>
        </div>
        <div className="text-xs text-muted mt-2 flex justify-end gap-1">
            <span className="font-bold text-text">{completedCount}</span> / {totalQuestions} phòng
        </div>
        
        {/* Review Button */}
        {lastCompletedNodeId && onNodeClick && (
            <button 
                onClick={() => onNodeClick(lastCompletedNodeId)}
                className="w-full mt-4 py-2.5 px-3 bg-surface border border-primary/30 text-primary rounded-lg text-sm font-medium hover:bg-primary/5 transition-colors flex items-center justify-center gap-2"
            >
                <Eye size={16} />
                Xem lại câu vừa làm
            </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
        {/* Legend */}
        <div className="mb-6 p-3 bg-background rounded-xl border border-border">
          <h4 className="text-xs font-bold text-muted uppercase mb-3 tracking-wider">Chú giải bản đồ</h4>
          <div className="space-y-2.5 text-sm">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-full bg-primary text-primary-text flex items-center justify-center shadow-sm"><MapPin size={14}/></div>
              <span className="text-text">Điểm khởi đầu</span>
            </div>
             <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-full border border-primary text-primary bg-surface flex items-center justify-center shadow-sm"><Play size={14}/></div>
              <span className="text-text">Sẵn sàng (Mở khóa)</span>
            </div>
             <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-full bg-surface border border-border text-muted flex items-center justify-center"><Lock size={14}/></div>
              <span className="text-muted">Đang bị khóa</span>
            </div>
             <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-full bg-success text-white flex items-center justify-center shadow-sm"><CheckCircle size={14}/></div>
              <span className="text-text">Đã hoàn thành</span>
            </div>
             <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-full bg-danger text-white flex items-center justify-center animate-pulse shadow-sm"><Flag size={14}/></div>
              <span className="text-text font-medium text-danger">Đích (Boss)</span>
            </div>
          </div>
        </div>

        {/* Node List */}
        <div>
           <h4 className="text-xs font-bold text-muted uppercase mb-3 tracking-wider">Trạng thái các phòng</h4>
           <div className="space-y-2">
             {nodes.map(node => {
                let statusText = '';
                let statusColor = 'text-muted';
                let borderColor = 'border-border';
                let bgClass = 'bg-background';
                let icon = <Lock size={14} />;
                
                switch (node.status) {
                  case NodeStatus.LOCKED: 
                    statusText = 'Đang khóa'; 
                    break;
                  case NodeStatus.UNLOCKED: 
                    statusText = 'Sẵn sàng'; 
                    statusColor='text-primary'; 
                    borderColor='border-primary/30';
                    bgClass = 'bg-primary/5';
                    icon = <Play size={14}/>; 
                    break;
                  case NodeStatus.COMPLETED: 
                    statusText = 'Đã xong'; 
                    statusColor='text-success'; 
                    borderColor='border-success/30';
                    bgClass = 'bg-success/5';
                    icon = <CheckCircle size={14}/>; 
                    break;
                }
                
                if (node.type === NodeType.BOSS) {
                    if (node.status !== NodeStatus.COMPLETED) {
                        icon = <Flag size={14}/>;
                    }
                    if (node.status === NodeStatus.UNLOCKED) {
                        statusColor='text-danger';
                        bgClass='bg-danger/5';
                        borderColor='border-danger/30';
                    }
                }
                if (node.type === NodeType.START) {
                    icon = <MapPin size={14}/>;
                }

                return (
                  <div key={node.id} className={`px-3 py-2.5 rounded-lg border flex items-center justify-between text-sm transition-all ${bgClass} ${borderColor}`}>
                    <div className="flex items-center gap-3">
                       <span className="font-mono font-bold text-[10px] w-5 h-5 flex items-center justify-center rounded bg-surface border border-border text-muted shadow-sm">{node.id}</span>
                       <span className={`font-medium ${node.type === NodeType.BOSS ? 'text-danger font-bold' : 'text-text'}`}>
                            {node.type === NodeType.BOSS ? 'PHÒNG BOSS' : node.type === NodeType.START ? 'KHỞI ĐẦU' : `Câu hỏi số ${node.id}`}
                       </span>
                    </div>
                    <div className={`flex items-center gap-1.5 ${statusColor} text-xs font-semibold`}>
                       {icon}
                       <span className="hidden sm:inline">{statusText}</span>
                    </div>
                  </div>
                )
             })}
           </div>
        </div>
      </div>
    </div>
  );
};

export default GameOverview;