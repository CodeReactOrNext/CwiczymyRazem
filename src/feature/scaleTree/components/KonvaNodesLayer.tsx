import type Konva from 'konva';
import { useCallback } from 'react';
import { Circle,Group, Shape, Text } from 'react-konva';

interface NodeData {
  status: 'locked' | 'available' | 'in_progress' | 'completed';
  scaleFamily: 'pentatonic' | 'diatonic' | 'mode';
  label: string;
  subtitle?: string;
  scaleType?: string;
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
  onNodeMouseEnter?: (node: Node) => void;
  onNodeMouseLeave?: () => void;
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
  pentatonic: '#1a110a',
  diatonic: '#09151c',
  mode: '#130c1f',
};

function getStatusColors(node: Node) {
  const family = node.data.scaleFamily || 'diatonic';
  const familyColor = FAMILY_COLORS[family] || FAMILY_COLORS.diatonic;
  const familyBg = FAMILY_BG_COLORS[family] || FAMILY_BG_COLORS.diatonic;
  const status = node.data.status;
  
  if (node.type === 'rewardNode') {
    const isClaimed = (node.data as any).claimed;
    return isClaimed
      ? { fill: '#0a1a13', stroke: '#10b981', icon: '#10b981' }
      : { fill: '#1a120a', stroke: '#fbbf24', icon: '#fbbf24' };
  }

  if (status === 'locked') {
    return { fill: '#0a0a0d', stroke: '#1c1c21', icon: '#3f3f46' };
  }

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


function ScaleTreeNode({
  node,
  isSelected,
  onNodeClick,
  onNodeMouseEnter,
  onNodeMouseLeave,
}: {
  node: Node;
  isSelected: boolean;
  onNodeClick: () => void;
  onNodeMouseEnter?: (node: Node) => void;
  onNodeMouseLeave?: () => void;
}) {
  const radius = getNodeRadius(node);
  const size = radius * 2;
  const shapeType = getShapeType(node);
  const { fill, stroke, icon } = getStatusColors(node);

  const finalStroke = isSelected ? '#ffffff' : stroke;
  const sides = shapeType === 'pentagon' ? 5 : shapeType === 'hexagon' ? 6 : 8;

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
        if (onNodeMouseEnter) onNodeMouseEnter(node);
      }}
      onMouseLeave={(e) => {
        const stage = e.target.getStage();
        if (stage) stage.container().style.cursor = 'default';
        if (onNodeMouseLeave) onNodeMouseLeave();
      }}
    >
      <Circle
        radius={radius + 8}
        fill="transparent"
        listening={true}
        perfectDrawEnabled={false}
      />

      <Shape
        listening={false}
        sceneFunc={(context, shape) => {
          drawPath(context, radius);

          if (isLocked) {
            context.fillStyle = '#0a0a0d';
            context.fill();

            const innerShadow = context.createRadialGradient(0, 0, radius * 0.7, 0, 0, radius);
            innerShadow.addColorStop(0, 'rgba(0,0,0,0)');
            innerShadow.addColorStop(1, 'rgba(0,0,0,0.3)');
            context.fillStyle = innerShadow;
            context.fill();

            context.strokeStyle = 'rgba(255,255,255,0.03)';
            context.lineWidth = 1.0;
            context.stroke();
          } else {
            const fillGrad = context.createLinearGradient(-radius * 0.7, -radius * 0.7, radius * 0.5, radius);
            fillGrad.addColorStop(0, fill);
            fillGrad.addColorStop(0.6, '#0f0f12');
            fillGrad.addColorStop(1, '#08080a');
            context.fillStyle = fillGrad;
            context.fill();
            const strokeGrad = context.createLinearGradient(-radius * 0.8, -radius * 0.8, radius * 0.6, radius);
            if (isSelected) {
              strokeGrad.addColorStop(0, '#ffffff');
              strokeGrad.addColorStop(0.5, `${finalStroke}88`);
              strokeGrad.addColorStop(1, `${finalStroke}22`);
            } else {
              strokeGrad.addColorStop(0, `${finalStroke}66`);
              strokeGrad.addColorStop(0.5, `${finalStroke}22`);
              strokeGrad.addColorStop(1, 'rgba(255,255,255,0.06)');
            }
            context.strokeStyle = strokeGrad;
            context.lineWidth = isSelected ? 1.8 : 1.2;
            context.stroke();
          }
        }}
        perfectDrawEnabled={false}
      />

      <Shape
        listening={false}
        sceneFunc={(context, shape) => {
          context.strokeStyle = icon;
          context.fillStyle = icon;
          context.lineCap = 'round';
          context.lineJoin = 'round';

          if (node.type === 'rewardNode') {
            const cx = 0;
            const cy = 0;
            const spikes = 5;
            const outerRadius = radius * 0.45;
            const innerRadius = radius * 0.2;
            let rot = (Math.PI / 2) * 3;
            let x = cx;
            let y = cy;
            const step = Math.PI / spikes;

            context.beginPath();
            context.moveTo(cx, cy - outerRadius);
            for (let i = 0; i < spikes; i++) {
              x = cx + Math.cos(rot) * outerRadius;
              y = cy + Math.sin(rot) * outerRadius;
              context.lineTo(x, y);
              rot += step;

              x = cx + Math.cos(rot) * innerRadius;
              y = cy + Math.sin(rot) * innerRadius;
              context.lineTo(x, y);
              rot += step;
            }
            context.lineTo(cx, cy - outerRadius);
            context.closePath();
            context.fill();
          } else if (node.id.includes('single_string')) {
            context.lineWidth = 1.6;
            context.beginPath();
            context.moveTo(-radius * 0.45, 0);
            context.lineTo(radius * 0.45, 0);
            context.stroke();
            context.beginPath();
            context.moveTo(-radius * 0.25, -radius * 0.25);
            context.lineTo(-radius * 0.25, radius * 0.25);
            context.moveTo(0, -radius * 0.25);
            context.lineTo(0, radius * 0.25);
            context.moveTo(radius * 0.25, -radius * 0.25);
            context.lineTo(radius * 0.25, radius * 0.25);
            context.stroke();
            context.fillStyle = icon;
            context.beginPath();
            context.arc(0, 0, radius * 0.12, 0, Math.PI * 2);
            context.fill();
          } else {
            context.globalAlpha = isLocked ? 0.12 : 0.25;
            context.lineWidth = 1.0;
            context.beginPath();
            for (let i = -1.5; i <= 1.5; i += 1.0) {
              context.moveTo(radius * 0.25 * i, -radius * 0.3);
              context.lineTo(radius * 0.25 * i, radius * 0.3);
            }
            for (let i = -1.0; i <= 1.0; i += 1.0) {
              context.moveTo(-radius * 0.4, radius * 0.2 * i);
              context.lineTo(radius * 0.4, radius * 0.2 * i);
            }
            context.stroke();
            
            const points: Array<{ x: number; y: number }> = [];
            const type = node.data.scaleType;

            if (type === 'minor_pentatonic') {
              points.push({ x: -0.25, y: -0.22 }, { x: 0, y: -0.11 }, { x: -0.15, y: 0.11 }, { x: 0.25, y: 0.22 });
            } else if (type === 'major_pentatonic') {
              points.push({ x: -0.25, y: -0.22 }, { x: -0.08, y: -0.05 }, { x: 0.12, y: 0.11 }, { x: 0.25, y: 0.22 });
            } else if (type === 'minor') {
              points.push({ x: -0.2, y: -0.22 }, { x: -0.2, y: 0.1 }, { x: 0.2, y: -0.1 }, { x: 0.2, y: 0.22 });
            } else if (type === 'major') {
              points.push({ x: -0.25, y: 0.22 }, { x: 0, y: -0.25 }, { x: 0.25, y: 0.22 });
            } else if (type === 'dorian') {
              points.push({ x: 0, y: -0.25 }, { x: -0.25, y: 0 }, { x: 0.25, y: 0 }, { x: 0, y: 0.25 });
            } else if (type === 'phrygian') {
              points.push({ x: -0.25, y: -0.25 }, { x: 0.25, y: -0.25 }, { x: 0, y: 0.25 });
            } else if (type === 'mixolydian') {
              points.push({ x: -0.2, y: -0.2 }, { x: 0.2, y: -0.2 }, { x: 0, y: 0 }, { x: -0.2, y: 0.2 }, { x: 0.2, y: 0.2 });
            } else if (type === 'lydian') {
              points.push({ x: -0.25, y: 0 }, { x: 0, y: -0.22 }, { x: 0.25, y: 0 }, { x: 0, y: 0.22 });
            } else if (type === 'locrian') {
              points.push({ x: -0.25, y: -0.2 }, { x: -0.1, y: 0.2 }, { x: 0.1, y: -0.2 }, { x: 0.25, y: 0.2 });
            } else {
              points.push({ x: -0.25, y: -0.2 }, { x: 0, y: 0 }, { x: 0.25, y: 0.2 });
            }

            if (points.length > 1) {
              context.lineWidth = 0.8;
              context.beginPath();
              context.moveTo(radius * points[0].x, radius * points[0].y);
              for (let i = 1; i < points.length; i++) {
                context.lineTo(radius * points[i].x, radius * points[i].y);
              }
              context.stroke();
            }

            context.fillStyle = icon;
            for (const p of points) {
              context.beginPath();
              context.arc(radius * p.x, radius * p.y, radius * 0.08, 0, Math.PI * 2);
              context.fill();
            }

            context.globalAlpha = 1.0;

            const req = node?.data?.requiredExercises?.[0];
            const patternType = req?.patternType;
            const isSubnode = node.id.includes('_pos') && !node.id.endsWith('_asc');

            if (isSubnode && patternType) {
              context.strokeStyle = icon;
              context.lineWidth = 1.8;
              context.lineCap = 'round';
              context.lineJoin = 'round';

              if (patternType === 'descending') {
                context.beginPath();
                context.moveTo(-radius * 0.3, -radius * 0.2);
                context.lineTo(radius * 0.3, radius * 0.2);
                context.stroke();
                context.fillStyle = icon;
                context.beginPath();
                context.arc(radius * 0.3, radius * 0.2, radius * 0.08, 0, Math.PI * 2);
                context.fill();
              } else if (patternType === 'ascending_descending') {
                context.beginPath();
                context.moveTo(-radius * 0.35, radius * 0.15);
                context.lineTo(0, -radius * 0.22);
                context.lineTo(radius * 0.35, radius * 0.15);
                context.stroke();
                context.fillStyle = icon;
                context.beginPath();
                context.arc(0, -radius * 0.22, radius * 0.08, 0, Math.PI * 2);
                context.fill();
              } else if (patternType === 'intervals_thirds') {
                context.beginPath();
                context.moveTo(-radius * 0.35, radius * 0.15);
                context.lineTo(-radius * 0.12, -radius * 0.12);
                context.lineTo(-radius * 0.12, radius * 0.05);
                context.lineTo(radius * 0.12, -radius * 0.22);
                context.lineTo(radius * 0.12, -radius * 0.05);
                context.lineTo(radius * 0.35, -radius * 0.32);
                context.stroke();
              } else if (patternType === 'intervals_fourths') {
                context.beginPath();
                context.moveTo(-radius * 0.35, radius * 0.22);
                context.lineTo(-radius * 0.15, -radius * 0.18);
                context.lineTo(-radius * 0.15, radius * 0.08);
                context.lineTo(radius * 0.1, -radius * 0.32);
                context.lineTo(radius * 0.1, -radius * 0.05);
                context.lineTo(radius * 0.35, -radius * 0.42);
                context.stroke();
              } else if (patternType === 'sequence_3_notes') {
                context.beginPath();
                context.moveTo(-radius * 0.35, radius * 0.2);
                context.lineTo(-radius * 0.18, radius * 0.02);
                context.lineTo(-radius * 0.18, radius * 0.1);
                context.lineTo(0, -radius * 0.08);
                context.lineTo(0, 0);
                context.lineTo(radius * 0.18, -radius * 0.18);
                context.lineTo(radius * 0.18, -radius * 0.1);
                context.lineTo(radius * 0.35, -radius * 0.28);
                context.stroke();
              } else if (patternType === 'sequence_4_notes') {
                context.beginPath();
                context.moveTo(-radius * 0.4, radius * 0.25);
                context.lineTo(-radius * 0.12, -radius * 0.08);
                context.lineTo(-radius * 0.12, radius * 0.08);
                context.lineTo(0.12, -radius * 0.22);
                context.lineTo(0.12, -radius * 0.05);
                context.lineTo(0.4, -radius * 0.38);
                context.stroke();
              } else {
                context.beginPath();
                context.moveTo(-radius * 0.3, radius * 0.2);
                context.lineTo(radius * 0.3, -radius * 0.2);
                context.stroke();
                context.fillStyle = icon;
                context.beginPath();
                context.arc(radius * 0.3, -radius * 0.2, radius * 0.08, 0, Math.PI * 2);
                context.fill();
              }
            } else {
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
              const romanNumeral = romanMap[pos as number] || '?';

              context.fillStyle = icon;
              context.font = `900 ${radius * 0.46}px sans-serif`;
              context.textAlign = 'center';
              context.textBaseline = 'middle';
              context.fillText(romanNumeral, 0, 0);
            }
          }
        }}
        perfectDrawEnabled={false}
      />

      {/* Label below (Subtle) */}
      {(node.data.subtitle || node.data.label) && (
        <Text
          text={node.data.subtitle || node.data.label}
          fontSize={radius * 0.28}
          fontFamily="sans-serif"
          fill={isLocked ? '#4b5563' : '#9ca3af'}
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
  onNodeMouseEnter,
  onNodeMouseLeave,
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
          onNodeMouseEnter={onNodeMouseEnter}
          onNodeMouseLeave={onNodeMouseLeave}
        />
      ))}
    </>
  );
}
