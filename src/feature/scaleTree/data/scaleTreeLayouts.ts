import type { Node, Edge } from "@xyflow/react";

/**
 * Organizes scale tree nodes by family (pentatonic, diatonic, modes)
 * Each family gets its own column with organized grid layout
 */
export function organizeNodesByFamily(nodes: Node[], edges: Edge[]) {
  const pentatonicNodes = nodes.filter(n => (n.data?.scaleFamily === "pentatonic" && !n.id.startsWith("pl_")));
  const diatonicNodes = nodes.filter(n => (n.data?.scaleFamily === "diatonic" && !n.id.startsWith("pl_")));
  const modeNodes = nodes.filter(n => (n.data?.scaleFamily === "mode" && !n.id.startsWith("pl_")));

  const organized = [...nodes];

  // Column positions
  const colWidth = 1800;
  const col1X = -colWidth; // Pentatonic (left)
  const col2X = 0;         // Diatonic (center)
  const col3X = colWidth;  // Modes (right)

  const gridSpacingX = 180;
  const gridSpacingY = 120;
  const nodesPerRow = 8;

  // Helper: arrange nodes in a grid within a column
  const arrangeColumn = (nodeList: Node[], startX: number, startY: number = -800) => {
    return nodeList.map((node, idx) => {
      const col = idx % nodesPerRow;
      const row = Math.floor(idx / nodesPerRow);
      return {
        ...node,
        position: {
          x: startX + col * gridSpacingX,
          y: startY + row * gridSpacingY
        }
      };
    });
  };

  // Arrange each family in its column
  const arrangedPent = arrangeColumn(pentatonicNodes, col1X);
  const arrangedDiat = arrangeColumn(diatonicNodes, col2X);
  const arrangedModes = arrangeColumn(modeNodes, col3X);

  // Merge all back
  const updatedNodes = organized.map(node => {
    const p = arrangedPent.find(n => n.id === node.id);
    if (p) return p;
    const d = arrangedDiat.find(n => n.id === node.id);
    if (d) return d;
    const m = arrangedModes.find(n => n.id === node.id);
    if (m) return m;
    return node;
  });

  return { nodes: updatedNodes, edges };
}

/**
 * Organizes by scale type in concentric rings
 * Each scale (minor_pentatonic, major, dorian, etc.) gets a hexagon
 * All nodes of that scale arranged in rings around the center
 */
export function organizeByScaleTypeRings(nodes: Node[], edges: Edge[]) {
  const scaleGroups = new Map<string, Node[]>();

  nodes
    .filter(n => !n.id.startsWith("pl_"))
    .forEach(node => {
      const scaleType = node.data?.scaleType as string;
      if (!scaleGroups.has(scaleType)) {
        scaleGroups.set(scaleType, []);
      }
      scaleGroups.get(scaleType)!.push(node);
    });

  const organized = [...nodes];
  const scaleArray = Array.from(scaleGroups.entries());

  // Arrange scales in a grid (3x3 for 9 scales)
  const scalesPerRow = 3;
  const scaleGridX = 800;
  const scaleGridY = 600;

  const updatedNodes = organized.map(node => {
    const scaleType = node.data?.scaleType as string;
    const scaleIdx = scaleArray.findIndex(([type]) => type === scaleType);

    if (scaleIdx !== -1) {
      const scaleCol = scaleIdx % scalesPerRow;
      const scaleRow = Math.floor(scaleIdx / scalesPerRow);
      const scaleCenterX = -scaleGridX + scaleCol * scaleGridX;
      const scaleCenterY = -scaleGridY + scaleRow * scaleGridY;

      const nodesInScale = scaleGroups.get(scaleType)!;
      const nodeIdxInScale = nodesInScale.findIndex(n => n.id === node.id);

      // Arrange within scale as concentric rings
      if (nodeIdxInScale !== -1) {
        const angle = (nodeIdxInScale / nodesInScale.length) * Math.PI * 2;
        const radius = Math.min(180, 60 + nodesInScale.length * 15);

        return {
          ...node,
          position: {
            x: scaleCenterX + Math.cos(angle) * radius,
            y: scaleCenterY + Math.sin(angle) * radius
          }
        };
      }
    }

    return node;
  });

  return { nodes: updatedNodes, edges };
}

/**
 * Organizes by scale type in hierarchical tree
 * Each scale at center, children (positions/patterns) branch out in levels
 * Respects prerequisite edges for hierarchy
 */
/**
 * Super simple grid layout - deterministic, easy to read
 * Scales as columns, positions as rows, patterns as linear spread
 */
export function organizeByGridSimple(nodes: Node[], edges: Edge[]) {
  const scaleGroups = new Map<string, Node[]>();

  nodes
    .filter(n => !n.id.startsWith("pl_"))
    .forEach(node => {
      const scaleType = node.data?.scaleType as string;
      if (!scaleGroups.has(scaleType)) {
        scaleGroups.set(scaleType, []);
      }
      scaleGroups.get(scaleType)!.push(node);
    });

  const scaleArray = Array.from(scaleGroups.keys()).sort();

  // Grid parameters - larger spacing for clarity, fixed overlapping issues
  const colWidth = 1800;     // X spacing between scales (increased from 1100 to prevent overlap)
  const rowHeight = 400;     // Y spacing between position rows
  const patternGap = 260;    // X spacing between patterns within position
  const startX = -4000;      // Starting X position (adjusted for wider columns)
  const startY = -1200;      // Starting Y position

  const updatedNodes = nodes.map(node => {
    if (node.id.startsWith("pl_")) return node;

    const scaleType = node.data?.scaleType as string;
    const scaleIdx = scaleArray.indexOf(scaleType);

    // Get position number (pos1, pos3, pos5, etc.)
    const posMatch = node.id.match(/pos(\d+)/);
    const posNum = posMatch ? parseInt(posMatch[1]) : 0;

    // Get pattern type - fixed regex to capture full suffix including underscores and digits
    const patternMatch = node.id.match(/_pos\d+_(.+)$/);
    const pattern = patternMatch ? patternMatch[1] : "";

    // Special handling for single_string nodes
    if (node.id.includes("single_string")) {
      return {
        ...node,
        position: {
          x: startX + scaleIdx * colWidth,
          y: startY - 300  // Above all positions
        }
      };
    }

    // Map position numbers to row indices (pos1->0, pos3->1, pos5->2, etc.)
    const positionOrder = [1, 2, 3, 5, 7, 8, 10];
    const rowIdx = positionOrder.indexOf(posNum);

    // Map patterns to column indices within position
    const patternOrder = ["asc", "desc", "asc_desc", "thirds", "fourths", "seq3", "seq4"];
    const patternIdx = patternOrder.indexOf(pattern);

    // Alternate direction for even/odd positions (right hand vs left hand play)
    const isEvenPosition = rowIdx % 2 === 1;
    const direction = isEvenPosition ? -1 : 1;
    const offsetX = direction * (patternIdx - 3) * patternGap;

    return {
      ...node,
      position: {
        x: startX + scaleIdx * colWidth + offsetX,
        y: startY + rowIdx * rowHeight
      }
    };
  });

  return { nodes: updatedNodes, edges };
}

export function organizeByScaleTypeHierarchy(nodes: Node[], edges: Edge[]) {
  const scaleGroups = new Map<string, Node[]>();
  const nodeMap = new Map<string, Node>();

  nodes
    .filter(n => !n.id.startsWith("pl_"))
    .forEach(node => {
      nodeMap.set(node.id, node);
      const scaleType = node.data?.scaleType as string;
      if (!scaleGroups.has(scaleType)) {
        scaleGroups.set(scaleType, []);
      }
      scaleGroups.get(scaleType)!.push(node);
    });

  const organized = [...nodes];
  const scaleArray = Array.from(scaleGroups.entries());

  // Arrange scales in grid (3x3) with much larger spacing
  const scalesPerRow = 3;
  const scaleGridX = 1800;
  const scaleGridY = 1400;

  const updatedNodes = organized.map(node => {
    const scaleType = node.data?.scaleType as string;
    const scaleIdx = scaleArray.findIndex(([type]) => type === scaleType);

    if (scaleIdx !== -1) {
      const scaleCol = scaleIdx % scalesPerRow;
      const scaleRow = Math.floor(scaleIdx / scalesPerRow);
      const scaleCenterX = -scaleGridX + scaleCol * scaleGridX;
      const scaleCenterY = -scaleGridY + scaleRow * scaleGridY;

      const nodesInScale = scaleGroups.get(scaleType)!;

      // Find single-string node (root) - it has "single_string" in ID
      const rootNode = nodesInScale.find(n => n.id.includes("single_string"));
      const otherNodes = nodesInScale.filter(n => !n.id.includes("single_string"));

      if (node.id === rootNode?.id) {
        // Root at center
        return {
          ...node,
          position: {
            x: scaleCenterX,
            y: scaleCenterY
          }
        };
      }

      // Group by position number to create proper hierarchical rings
      const positionGroups = new Map<number, Node[]>();
      otherNodes.forEach(n => {
        const posMatch = n.id.match(/pos(\d+)/);
        const posNum = posMatch ? parseInt(posMatch[1]) : 0;
        if (!positionGroups.has(posNum)) {
          positionGroups.set(posNum, []);
        }
        positionGroups.get(posNum)!.push(n);
      });

      const positionArray = Array.from(positionGroups.entries()).sort((a, b) => a[0] - b[0]);

      const nodeIdx = otherNodes.findIndex(n => n.id === node.id);
      if (nodeIdx !== -1) {
        // Find which position group this node belongs to
        let posGroupIdx = 0;
        let nodeInGroupIdx = 0;
        let cumulative = 0;

        for (let i = 0; i < positionArray.length; i++) {
          const groupSize = positionArray[i][1].length;
          if (nodeIdx < cumulative + groupSize) {
            posGroupIdx = i;
            nodeInGroupIdx = nodeIdx - cumulative;
            break;
          }
          cumulative += groupSize;
        }

        const posNum = positionArray[posGroupIdx][0];
        const nodesInPosGroup = positionArray[posGroupIdx][1];

        // Ring radius based on position number (outer rings for higher positions)
        const baseRingRadius = 280;
        const ringSpacing = 160;
        const ringRadius = baseRingRadius + posGroupIdx * ringSpacing;

        // Arrange patterns within position group in a small arc
        const anglePerPatternGroup = (Math.PI * 2) / positionArray.length;
        const groupCenterAngle = posGroupIdx * anglePerPatternGroup;

        // Within group, spread patterns around group center
        const anglePerPattern = (Math.PI * 1.2) / Math.max(nodesInPosGroup.length - 1, 1);
        const startAngle = groupCenterAngle - (Math.PI * 0.6);
        const nodeAngle = startAngle + nodeInGroupIdx * anglePerPattern;

        return {
          ...node,
          position: {
            x: scaleCenterX + Math.cos(nodeAngle) * ringRadius,
            y: scaleCenterY + Math.sin(nodeAngle) * ringRadius
          }
        };
      }
    }

    return node;
  });

  return { nodes: updatedNodes, edges };
}
