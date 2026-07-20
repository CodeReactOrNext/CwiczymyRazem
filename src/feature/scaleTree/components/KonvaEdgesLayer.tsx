import { useEffect,useState } from 'react';
import { Circle,Group, Line } from 'react-konva';

interface KonvaEdgesLayerProps {
  edges: Array<{ id: string; source: string; target: string }>;
  nodeDataMap: Record<string, { status: string; family: string }>;
  positionMap: Record<string, { x: number; y: number }>;
  flashSourceNodeId?: string | null;
}

const FAMILY_EDGE_COLORS: Record<string, string> = {
  pentatonic: '245, 158, 11',
  diatonic: '34, 211, 238',
  mode: '167, 139, 250',
};

export function KonvaEdgesLayer({
  edges,
  nodeDataMap,
  positionMap,
  flashSourceNodeId,
}: KonvaEdgesLayerProps) {
  const [offset, setOffset] = useState(0);
  const [flashProgress, setFlashProgress] = useState(0);

  useEffect(() => {
    let animId: number;
    const tick = () => {
      setOffset((prev) => (prev - 0.4) % 24);
      animId = requestAnimationFrame(tick);
    };
    tick();
    return () => cancelAnimationFrame(animId);
  }, []);

  useEffect(() => {
    if (!flashSourceNodeId) {
      setFlashProgress(0);
      return;
    }
    setFlashProgress(0);
    let animId: number;
    const startTime = Date.now();
    const duration = 650;
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      setFlashProgress(progress);
      if (progress < 1) {
        animId = requestAnimationFrame(animate);
      }
    };
    animId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animId);
  }, [flashSourceNodeId]);

  return (
    <>
      {edges.map((edge) => {
        const sourceData = nodeDataMap[edge.source] || {
          status: 'locked',
          family: 'diatonic',
        };
        const targetData = nodeDataMap[edge.target] || {
          status: 'locked',
          family: 'diatonic',
        };

        const isCompleted =
          sourceData.status === 'completed' &&
          targetData.status === 'completed';
        const colorRGB = FAMILY_EDGE_COLORS[sourceData.family] ||
          FAMILY_EDGE_COLORS.diatonic;

        const sourcePos = positionMap[edge.source];
        const targetPos = positionMap[edge.target];
        if (!sourcePos || !targetPos) return null;

        const dx = Math.abs(sourcePos.x - targetPos.x);
        const dy = Math.abs(sourcePos.y - targetPos.y);
        if (dy < 1 && dx > 500) return null;

        const isSingleStringEdge =
          edge.source.includes('single_string') &&
          edge.target.includes('single_string');
        const opacity = isSingleStringEdge
          ? isCompleted ? 0.3 : 0.06
          : isCompleted ? 0.9 : 0.15;

        const isFlashing = edge.source === flashSourceNodeId && flashProgress > 0 && flashProgress < 1;
        const sparkX = isFlashing ? sourcePos.x + (targetPos.x - sourcePos.x) * flashProgress : 0;
        const sparkY = isFlashing ? sourcePos.y + (targetPos.y - sourcePos.y) * flashProgress : 0;

        return (
          <Group key={edge.id}>
            <Line
              points={[sourcePos.x, sourcePos.y, targetPos.x, targetPos.y]}
              stroke={isCompleted ? `rgba(${colorRGB}, 0.08)` : 'rgba(255,255,255,0.02)'}
              strokeWidth={9}
              perfectDrawEnabled={false}
            />

            <Line
              points={[sourcePos.x, sourcePos.y, targetPos.x, targetPos.y]}
              stroke={isCompleted ? `rgba(${colorRGB}, ${opacity * 0.25})` : 'rgba(0,0,0,0.6)'}
              strokeWidth={isCompleted ? 2.5 : 5}
              perfectDrawEnabled={false}
            />

            {isCompleted && (
              <Line
                points={[sourcePos.x, sourcePos.y, targetPos.x, targetPos.y]}
                stroke={`rgba(${colorRGB}, ${opacity})`}
                strokeWidth={2.5}
                dash={[8, 16]}
                dashOffset={offset}
                perfectDrawEnabled={false}
              />
            )}

            {isFlashing && (
              <>
                <Circle
                  x={sparkX}
                  y={sparkY}
                  radius={8}
                  fill="rgba(255, 255, 255, 0.4)"
                  perfectDrawEnabled={false}
                />
                <Circle
                  x={sparkX}
                  y={sparkY}
                  radius={4}
                  fill="#ffffff"
                  perfectDrawEnabled={false}
                />
              </>
            )}
          </Group>
        );
      })}
    </>
  );
}
