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
  { fill: string; stroke: string; accent: string }
> = {
  locked: { fill: '#18181b', stroke: '#27272a', accent: '#52525b' },
  available: { fill: '#082f49', stroke: '#0c4a6e', accent: '#38bdf8' },
  in_progress: { fill: '#083344', stroke: '#155e75', accent: '#22d3ee' },
  completed: { fill: '#022c22', stroke: '#065f46', accent: '#10b981' },
};

const FAMILY_COLORS: Record<string, string> = {
  pentatonic: '#f59e0b',
  diatonic: '#22d3ee',
  mode: '#a78bfa',
};

const FAMILY_SHADOWS: Record<string, string> = {
  pentatonic: 'rgba(245, 158, 11, 0.4)',
  diatonic: 'rgba(34, 211, 238, 0.4)',
  mode: 'rgba(167, 139, 250, 0.4)',
};

function getNodeRadius(node: Node): number {
  try {
    const req = node?.data?.requiredExercises?.[0];
    if (req?.stringNum != null) return 80;
    if (
      req?.patternType === 'asc' ||
      req?.patternType === 'ascending'
    )
      return 55;
  } catch {
    // fallback if structure is unexpected
  }
  return 40;
}

const FAMILY_BG_COLORS: Record<string, string> = {
  pentatonic: '#451a03',
  diatonic: '#083344',
  mode: '#2e1065',
};

function getStatusColors(node: Node) {
  const family = node.data.scaleFamily || 'diatonic';
  const familyColor = FAMILY_COLORS[family] || FAMILY_COLORS.diatonic;
  const familyBg = FAMILY_BG_COLORS[family] || FAMILY_BG_COLORS.diatonic;
  const status = node.data.status;
  
  if (node.type === 'rewardNode') {
    const isClaimed = (node.data as any).claimed;
    return isClaimed
      ? { fill: '#064e3b', stroke: '#10b981', icon: '#10b981' }
      : { fill: '#451a03', stroke: '#fbbf24', icon: '#fbbf24' };
  }

  if (status === 'locked') {
    return { fill: '#0c0a09', stroke: '#1c1917', icon: '#27272a' };
  }

  // Active nodes (available, in_progress, completed)
  return {
    fill: familyBg,
    stroke: familyColor,
    icon: familyColor
  };
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
    if (node.type === 'rewardNode') return '⭐';
    const req = node?.data?.requiredExercises?.[0];
    if (req?.stringNum != null) return '♬';
    if (node.id.includes('single_string')) return '♭';
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
  const size = radius * 2;
  const shapeType = getShapeType(node);
  const { fill, stroke, icon } = getStatusColors(node);

  const finalStroke = isSelected ? '#ffffff' : stroke;
  const sides = shapeType === 'pentagon' ? 5 : shapeType === 'hexagon' ? 6 : 8;

  // Custom drawing function for geometric shapes
  const drawPath = useCallback((context: Konva.Context, r: number) => {
    if (shapeType === 'diamond') {
      context.beginPath();
      context.moveTo(r, 0);
      context.lineTo(0, r);
      context.lineTo(-r, 0);
      context.lineTo(0, -r);
      context.closePath();
    } else {
      const angle = (Math.PI * 2) / sides;
      context.beginPath();
      context.moveTo(r, 0);
      for (let i = 1; i <= sides; i++) {
        context.lineTo(r * Math.cos(angle * i), r * Math.sin(angle * i));
      }
      context.closePath();
    }
  }, [shapeType, sides]);

  const isLocked = node.data.status === 'locked';

  return (
    <Group
      x={node.position.x}
      y={node.position.y}
      onClick={onNodeClick}
      listening={true}
      onMouseEnter={(e) => {
        const stage = e.target.getStage();
        if (stage) stage.container().style.cursor = 'pointer';
      }}
      onMouseLeave={(e) => {
        const stage = e.target.getStage();
        if (stage) stage.container().style.cursor = 'default';
      }}
    >
      {/* Main Shape with dynamic styling based on status */}
      <Shape
        sceneFunc={(context, shape) => {
          drawPath(context, radius);

          if (isLocked) {
            // 1. Base Fill
            context.fillStyle = '#0a0a0a';
            context.fill();

            // 2. Uniform Delicate Inner Shadow - radial gradient for equal depth from all sides
            const innerShadow = context.createRadialGradient(0, 0, radius * 0.7, 0, 0, radius);
            innerShadow.addColorStop(0, 'rgba(0,0,0,0)');
            innerShadow.addColorStop(1, 'rgba(0,0,0,0.4)');
            context.fillStyle = innerShadow;
            context.fill();

            // 3. Faint Rim Stroke - slightly lighter than background #141414
            context.strokeStyle = 'rgba(255,255,255,0.02)';
            context.lineWidth = 4;
            context.stroke();
          } else {
            // 2. Original Vibrant style for UNLOCKED nodes
            const fillGrad = context.createLinearGradient(-radius * 0.7, -radius * 0.7, radius * 0.5, radius);
            fillGrad.addColorStop(0, fill);
            fillGrad.addColorStop(1, '#0c0a09');
            context.fillStyle = fillGrad;
            context.fill();

            const strokeGrad = context.createLinearGradient(-radius * 0.8, -radius * 0.8, radius * 0.6, radius);
            strokeGrad.addColorStop(0, finalStroke);
            strokeGrad.addColorStop(1, isSelected ? '#ffffff22' : `${finalStroke}33`);
            context.strokeStyle = strokeGrad;
            context.lineWidth = 2.5;
            context.stroke();
          }
        }}
        perfectDrawEnabled={false}
      />

      {/* Center text: Roman numeral or music symbol */}
      <Text
        text={getCenterText(node)}
        fontSize={radius * 0.6}
        fontFamily="serif"
        fill={icon}
        opacity={isLocked && !isSelected ? 0.7 : 1}
        align="center"
        verticalAlign="middle"
        x={-radius}
        y={-radius}
        width={size}
        height={size}
        fontStyle="normal"
        perfectDrawEnabled={false}
      />

      {/* Label below (Subtle) */}
      {(node.data.subtitle || node.data.label) && (
        <Text
          text={node.data.subtitle || node.data.label}
          fontSize={radius * 0.28}
          fontFamily="sans-serif"
          fill="#52525b"
          align="center"
          verticalAlign="top"
          x={-100}
          y={radius + 14}
          width={200}
          fontStyle="bold"
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
