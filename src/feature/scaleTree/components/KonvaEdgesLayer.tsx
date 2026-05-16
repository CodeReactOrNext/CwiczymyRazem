import { Line, Group } from 'react-konva';

interface KonvaEdgesLayerProps {
  edges: Array<{ id: string; source: string; target: string }>;
  nodeDataMap: Record<string, { status: string; family: string }>;
  positionMap: Record<string, { x: number; y: number }>;
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
}: KonvaEdgesLayerProps) {
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
        const colorRGB = isCompleted
          ? '16, 185, 129'
          : FAMILY_EDGE_COLORS[sourceData.family] ||
            FAMILY_EDGE_COLORS.diatonic;

        const sourcePos = positionMap[edge.source];
        const targetPos = positionMap[edge.target];
        if (!sourcePos || !targetPos) return null;

        // Filter out extremely long horizontal lines that suggest non-existent connections
        // (e.g. connections between distant scales that span the entire width)
        const dx = Math.abs(sourcePos.x - targetPos.x);
        const dy = Math.abs(sourcePos.y - targetPos.y);
        if (dy < 1 && dx > 500) return null;

        // Lines between single_string nodes are more transparent
        const isSingleStringEdge =
          edge.source.includes('single_string') &&
          edge.target.includes('single_string');
        const opacity = isSingleStringEdge
          ? isCompleted ? 0.3 : 0.06
          : isCompleted ? 0.9 : 0.15;

        return (
          <Group key={edge.id}>
            {/* 1. The Border - same color and style as node border */}
            {!isCompleted && (
              <Line
                points={[sourcePos.x, sourcePos.y, targetPos.x, targetPos.y]}
                stroke="rgba(255,255,255,0.02)"
                strokeWidth={9}
                perfectDrawEnabled={false}
              />
            )}

            {/* 2. The Ditch core (darker than background) */}
            <Line
              points={[sourcePos.x, sourcePos.y, targetPos.x, targetPos.y]}
              stroke={isCompleted ? `rgba(${colorRGB}, ${opacity})` : 'rgba(0,0,0,0.6)'}
              strokeWidth={isCompleted ? 7 : 5}
              perfectDrawEnabled={false}
            />
          </Group>
        );
      })}
    </>
  );
}
