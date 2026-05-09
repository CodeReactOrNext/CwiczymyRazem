import { Group, RegularPolygon, Shape, Text } from 'react-konva';
import type Konva from 'konva';

interface NodeData {
  status: 'locked' | 'available' | 'in_progress' | 'completed';
  scaleFamily: 'pentatonic' | 'diatonic' | 'mode';
  label: string;
  subtitle?: string;
  requiredExercises?: Array<{
    position?: number;
    stringNum?: number;
    patternType?: string;
  }>;
}

interface Node {
  id: string;
  position: { x: number; y: number };
  type: string;
  data: NodeData;
}

interface KonvaNodesLayerProps {
  nodes: Node[];
  selectedNodeId: string | null;
  onNodeClick: (nodeId: string) => void;
}

const STATUS_COLORS: Record<
  string,
  { fill: string; stroke: string }
> = {
  locked: { fill: '#1e293b', stroke: '#334155' },
  available: { fill: '#1e3a8a', stroke: '#3b82f6' },
  in_progress: { fill: '#083344', stroke: '#06b6d4' },
  completed: { fill: '#022c22', stroke: '#10b981' },
};

const FAMILY_COLORS: Record<string, string> = {
  pentatonic: '#f59e0b',
  diatonic: '#22d3ee',
  mode: '#a78bfa',
};

const FAMILY_SHADOWS: Record<string, string> = {
  pentatonic: 'rgba(245, 158, 11, 0.5)',
  diatonic: 'rgba(34, 211, 238, 0.5)',
  mode: 'rgba(167, 139, 250, 0.5)',
};

function getNodeRadius(node: Node): number {
  try {
    const req = node?.data?.requiredExercises?.[0];
    if (req?.stringNum != null) return 50;
    if (
      req?.patternType === 'asc' ||
      req?.patternType === 'ascending'
    )
      return 32;
  } catch {
    // fallback if structure is unexpected
  }
  return 22;
}

function getShapeType(
  node: Node
): 'diamond' | 'pentagon' | 'hexagon' | 'octagon' {
  if (node?.id?.includes?.('single_string')) return 'diamond';
  const family = node?.data?.scaleFamily;
  if (family === 'pentatonic') return 'pentagon';
  if (family === 'diatonic') return 'octagon';
  return 'hexagon';
}

function drawDiamond(
  context: Konva.Context,
  radius: number
) {
  context.beginPath();
  context.moveTo(radius, 0);
  context.lineTo(0, radius);
  context.lineTo(-radius, 0);
  context.lineTo(0, -radius);
  context.closePath();
}

function getCenterText(node: Node): string {
  try {
    const req = node?.data?.requiredExercises?.[0];
    if (req?.stringNum != null) return '♬';
    const pos = req?.position;
    const romanMap: Record<number, string> = {
      1: 'I',
      2: 'II',
      3: 'III',
      5: 'V',
      7: 'VII',
      8: 'VIII',
      10: 'X',
    };
    return romanMap[pos as number] || '?';
  } catch {
    return '•';
  }
}

function ScaleTreeNode({
  node,
  isSelected,
  onNodeClick,
}: {
  node: Node;
  isSelected: boolean;
  onNodeClick: () => void;
}) {
  const radius = getNodeRadius(node);
  const shapeType = getShapeType(node);
  const statusColors = STATUS_COLORS[node.data.status] || STATUS_COLORS.locked;
  const { fill, stroke } = statusColors;
  const finalStroke = isSelected ? '#fbbf24' : stroke;
  const family = node.data.scaleFamily;
  const shadowColor = FAMILY_SHADOWS[family];

  return (
    <Group
      x={node.position.x}
      y={node.position.y}
      onClick={onNodeClick}
      listening={true}
    >
      {/* Polygon shape */}
      {shapeType === 'diamond' ? (
        <Shape
          sceneFunc={(context, shape) => {
            drawDiamond(context, radius);
            context.fillStrokeShape(shape);
          }}
          fill={fill}
          stroke={finalStroke}
          strokeWidth={2}
          shadowBlur={16}
          shadowColor={shadowColor}
          shadowOpacity={0.6}
          perfectDrawEnabled={false}
        />
      ) : (
        <RegularPolygon
          sides={
            shapeType === 'pentagon'
              ? 5
              : shapeType === 'hexagon'
              ? 6
              : 8
          }
          radius={radius}
          fill={fill}
          stroke={finalStroke}
          strokeWidth={2}
          shadowBlur={16}
          shadowColor={shadowColor}
          shadowOpacity={0.6}
          perfectDrawEnabled={false}
        />
      )}

      {/* Center text: Roman numeral or music symbol */}
      <Text
        text={getCenterText(node)}
        fontSize={radius * 0.85}
        fontFamily="serif"
        fill="white"
        align="center"
        verticalAlign="middle"
        x={0}
        y={0}
        width={radius * 2}
        height={radius * 2}
        offsetX={radius}
        offsetY={radius}
        perfectDrawEnabled={false}
      />

      {/* Label below */}
      {(node.data.subtitle || node.data.label) && (
        <Text
          text={node.data.subtitle || node.data.label}
          fontSize={9}
          fontFamily="sans-serif"
          fill="#cbd5e1"
          align="center"
          verticalAlign="top"
          x={0}
          y={radius + 6}
          offsetX={60}
          width={120}
          perfectDrawEnabled={false}
        />
      )}
    </Group>
  );
}

export function KonvaNodesLayer({
  nodes,
  selectedNodeId,
  onNodeClick,
}: KonvaNodesLayerProps) {
  const validNodes = nodes.filter(
    (node) =>
      node &&
      node.id &&
      node.position &&
      node.data &&
      node.data.status
  );

  return (
    <>
      {validNodes.map((node) => (
        <ScaleTreeNode
          key={node.id}
          node={node}
          isSelected={node.id === selectedNodeId}
          onNodeClick={() => onNodeClick(node.id)}
        />
      ))}
    </>
  );
}
