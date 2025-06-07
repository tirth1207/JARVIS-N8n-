import React, { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient'; 
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  MarkerType,
  Handle,
  Position,
  Node,
  Edge,
  NodeProps,
  BackgroundVariant,
} from 'reactflow';
import 'reactflow/dist/style.css';

// Pastel color palette
const pastelColors = [
  '#FFB3BA', // Light pink
  '#BAFFC9', // Light green
  '#BAE1FF', // Light blue
  '#FFFFBA', // Light yellow
  '#FFD1BA', // Light orange
  '#E1BAFF', // Light purple
  '#FFBAE1', // Light magenta
  '#C9FFBA', // Light lime
  '#BAFFFF', // Light cyan
  '#F0BAFF', // Light lavender
  '#FFCABA', // Light coral
  '#BAFFE1', // Light mint
];

// Function to get consistent color for a node
const getNodeColor = (nodeId: string): string => {
  // Use node ID to get consistent color
  const hash = nodeId.split('').reduce((a: number, b: string) => {
    a = ((a << 5) - a) + b.charCodeAt(0);
    return a & a;
  }, 0);
  return pastelColors[Math.abs(hash) % pastelColors.length];
};

// Custom node component for Obsidian-style circular nodes
const ObsidianNode: React.FC<NodeProps> = ({ data, selected, id }) => {
  const nodeColor = getNodeColor(id);
  
  return (
    <div
      className={`relative flex items-center justify-center transition-all duration-200 ${
        selected 
          ? 'w-20 h-20 shadow-lg' 
          : 'w-12 h-12 hover:brightness-110'
      }`}
      style={{
        backgroundColor: nodeColor,
        borderRadius: '50%',
        border: selected ? `3px solid ${nodeColor}` : `2px solid ${nodeColor}`,
        cursor: 'pointer',
        filter: selected ? 'brightness(1.2) saturate(1.3)' : 'brightness(0.9)',
      }}
    >
      <Handle
        type="target"
        position={Position.Top}
        style={{ background: 'transparent', border: 'none' }}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        style={{ background: 'transparent', border: 'none' }}
      />
      
      {/* Show label only when selected */}
      {selected && (
        <div 
          className="absolute top-full mt-2 px-2 py-1 bg-black text-white text-xs rounded whitespace-nowrap z-10"
          style={{ transform: 'translateX(-50%)', left: '50%' }}
        >
          {data.label}
        </div>
      )}
    </div>
  );
};

// Register the custom node type
const nodeTypes = {
  obsidianNode: ObsidianNode,
};

// Types for node and edge
interface GraphNode extends Node {
  vx?: number;
  vy?: number;
  fx?: number;
  fy?: number;
  fixed?: boolean;
}

interface GraphEdge extends Edge {}

// Physics simulation class
class PhysicsSimulation {
  nodes: Map<string, GraphNode>;
  edges: GraphEdge[];
  onUpdate: (nodes: GraphNode[]) => void;
  isRunning: boolean;
  animationFrame: number | null;
  repulsionStrength: number;
  attractionStrength: number;
  dampening: number;
  minDistance: number;
  maxDistance: number;

  constructor(nodes: GraphNode[], edges: GraphEdge[], onUpdate: (nodes: GraphNode[]) => void) {
    this.nodes = new Map();
    this.edges = edges;
    this.onUpdate = onUpdate;
    this.isRunning = false;
    this.animationFrame = null;
    
    // Physics parameters
    this.repulsionStrength = 1000;
    this.attractionStrength = 0.1;
    this.dampening = 0.9;
    this.minDistance = 100;
    this.maxDistance = 300;
    
    // Initialize nodes with physics properties
    nodes.forEach((node: GraphNode) => {
      this.nodes.set(node.id, {
        ...node,
        vx: 0,
        vy: 0,
        fx: 0,
        fy: 0,
        fixed: false
      });
    });
  }

  updateNodes(newNodes: GraphNode[]) {
    newNodes.forEach((node: GraphNode) => {
      const existing = this.nodes.get(node.id);
      if (existing) {
        this.nodes.set(node.id, {
          ...existing,
          ...node,
          vx: existing.vx,
          vy: existing.vy
        });
      } else {
        this.nodes.set(node.id, {
          ...node,
          vx: 0,
          vy: 0,
          fx: 0,
          fy: 0,
          fixed: false
        });
      }
    });
  }

  calculateForces() {
    const nodeArray = Array.from(this.nodes.values());
    
    // Reset forces
    nodeArray.forEach((node) => {
      node.fx = 0;
      node.fy = 0;
    });

    // Repulsion forces (nodes push each other away)
    for (let i = 0; i < nodeArray.length; i++) {
      for (let j = i + 1; j < nodeArray.length; j++) {
        const nodeA = nodeArray[i];
        const nodeB = nodeArray[j];
        
        const dx = nodeB.position.x - nodeA.position.x;
        const dy = nodeB.position.y - nodeA.position.y;
        const distance = Math.sqrt(dx * dx + dy * dy) || 1;
        
        if (distance < this.maxDistance) {
          const force = this.repulsionStrength / (distance * distance);
          const fx = (dx / distance) * force;
          const fy = (dy / distance) * force;
          
          nodeA.fx! -= fx;
          nodeA.fy! -= fy;
          nodeB.fx! += fx;
          nodeB.fy! += fy;
        }
      }
    }

    // Attraction forces (connected nodes pull toward each other)
    this.edges.forEach((edge) => {
      const sourceNode = this.nodes.get(edge.source);
      const targetNode = this.nodes.get(edge.target);
      
      if (sourceNode && targetNode) {
        const dx = targetNode.position.x - sourceNode.position.x;
        const dy = targetNode.position.y - sourceNode.position.y;
        const distance = Math.sqrt(dx * dx + dy * dy) || 1;
        
        const optimalDistance = this.minDistance * 1.5;
        const force = this.attractionStrength * (distance - optimalDistance);
        const fx = (dx / distance) * force;
        const fy = (dy / distance) * force;
        
        sourceNode.fx! += fx;
        sourceNode.fy! += fy;
        targetNode.fx! -= fx;
        targetNode.fy! -= fy;
      }
    });
  }

  updatePositions() {
    const nodeArray = Array.from(this.nodes.values());
    let maxMovement = 0;

    nodeArray.forEach((node) => {
      if (!node.fixed) {
        // Update velocity
        node.vx = (node.vx! + node.fx!) * this.dampening;
        node.vy = (node.vy! + node.fy!) * this.dampening;
        
        // Update position
        node.position.x += node.vx!;
        node.position.y += node.vy!;
        
        // Track maximum movement for convergence detection
        const movement = Math.abs(node.vx!) + Math.abs(node.vy!);
        maxMovement = Math.max(maxMovement, movement);
      }
    });

    return maxMovement;
  }

  step() {
    this.calculateForces();
    const movement = this.updatePositions();
    
    // Update React Flow nodes
    const updatedNodes = Array.from(this.nodes.values()).map((node) => ({
      ...node,
      position: { ...node.position }
    }));
    
    this.onUpdate(updatedNodes);
    
    // Continue simulation if there's significant movement
    if (movement > 0.1 && this.isRunning) {
      this.animationFrame = window.requestAnimationFrame(() => this.step());
    } else {
      this.isRunning = false;
    }
  }

  start() {
    if (!this.isRunning) {
      this.isRunning = true;
      this.step();
    }
  }

  stop() {
    this.isRunning = false;
    if (this.animationFrame) {
      window.cancelAnimationFrame(this.animationFrame);
    }
  }

  setNodeFixed(nodeId: string, fixed: boolean, position?: { x: number; y: number }) {
    const node = this.nodes.get(nodeId);
    if (node) {
      node.fixed = fixed;
      if (position) {
        node.position = { ...position };
      }
      if (fixed) {
        node.vx = 0;
        node.vy = 0;
      }
    }
  }
}

interface NoteGraphProps {
  refresh: boolean;
  setRefresh: React.Dispatch<React.SetStateAction<boolean>>;
}

export default function NoteGraph({ refresh, setRefresh }: NoteGraphProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState<GraphNode[]>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<GraphEdge[]>([]);
  const [selectedNodes, setSelectedNodes] = useState<Set<string>>(new Set());
  const physicsRef = useRef<PhysicsSimulation | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  
  const onSelectionChange = useCallback((elements: { nodes?: GraphNode[] }) => {
    const selectedNodeIds = new Set(
      elements.nodes?.map((node) => node.id) || []
    );
    setSelectedNodes(selectedNodeIds);
  }, []);

  // Handle node drag
  const onNodeDragStart = useCallback((event: React.MouseEvent, node: GraphNode) => {
    setIsDragging(true);
    if (physicsRef.current) {
      physicsRef.current.setNodeFixed(node.id, true, node.position);
    }
  }, []);

  const onNodeDrag = useCallback((event: React.MouseEvent, node: GraphNode) => {
    if (physicsRef.current) {
      physicsRef.current.setNodeFixed(node.id, true, node.position);
    }
  }, []);

  const onNodeDragStop = useCallback((event: React.MouseEvent, node: GraphNode) => {
    setIsDragging(false);
    if (physicsRef.current) {
      // Keep node fixed for a moment, then release
      setTimeout(() => {
        if (physicsRef.current) {
          physicsRef.current.setNodeFixed(node.id, false);
          physicsRef.current.start();
        }
      }, 1000);
    }
  }, []);

  // Initialize physics simulation when data loads
  useEffect(() => {
    if (nodes.length > 0 && edges.length >= 0) {
      if (physicsRef.current) {
        physicsRef.current.stop();
      }
      
      physicsRef.current = new PhysicsSimulation(
        nodes,
        edges,
        (updatedNodes: GraphNode[]) => {
          setNodes(updatedNodes);
        }
      );
      
      // Start physics simulation
      setTimeout(() => {
        if (physicsRef.current) {
          physicsRef.current.start();
        }
      }, 100);
    }

    return () => {
      if (physicsRef.current) {
        physicsRef.current.stop();
      }
    };
  }, [edges, setNodes]); // Depend on edges to restart when connections change

  // Update physics simulation when nodes change externally
  useEffect(() => {
    if (physicsRef.current && !isDragging) {
      physicsRef.current.updateNodes(nodes);
    }
  }, [nodes, isDragging]);

  useEffect(() => {
    const fetchData = async () => {
      // Fetch all notes
      const { data: notes, error: notesError } = await supabase.from('notes').select('id, title');
      if (notesError) {
        console.error('Error fetching notes:', notesError);
        return;
      }

      // Fetch all links between notes
      const { data: links, error: linksError } = await supabase.from('note_links').select('note_id, linked_note_id');
      if (linksError) {
        console.error('Error fetching note_links:', linksError);
        return;
      }

      // Create nodes with initial random positions
      const nodeData: GraphNode[] = notes.map((note: any, index: number) => {
        const angle = (index * 2 * Math.PI) / notes.length;
        const radius = 200;
        return {
          id: note.id.toString(),
          type: 'obsidianNode',
          data: { 
            label: note.title,
          },
          position: {
            x: 400 + radius * Math.cos(angle) + (Math.random() - 0.5) * 100,
            y: 300 + radius * Math.sin(angle) + (Math.random() - 0.5) * 100,
          },
          draggable: true,
          selectable: true,
        };
      });

      // Create edges with Obsidian-style connections
      const edgeData: GraphEdge[] = links.map((link: any) => ({
        id: `${link.note_id}-${link.linked_note_id}`,
        source: link.note_id.toString(),
        target: link.linked_note_id.toString(),
        type: 'straight',
        animated: false,
        style: {
          stroke: '#6b7280',
          strokeWidth: 1.5,
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          width: 15,
          height: 15,
          color: '#6b7280',
        },
      }));

      setNodes(nodeData);
      setEdges(edgeData);
    };

    fetchData();
  }, [refresh, setNodes, setEdges]);

  // Update node styles based on selection
  useEffect(() => {
    setNodes((nds) =>
      nds.map((node) => ({
        ...node,
        selected: selectedNodes.has(node.id),
      }))
    );
  }, [selectedNodes, setNodes]);

  return (
    <div className="h-screen w-full bg-gray-900">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onSelectionChange={onSelectionChange}
        onNodeDragStart={onNodeDragStart}
        onNodeDrag={onNodeDrag}
        onNodeDragStop={onNodeDragStop}
        nodeTypes={nodeTypes}
        fitView
        attributionPosition="bottom-left"
        className="bg-gray-900"
        style={{ backgroundColor: '#111827' }}
      >
        <MiniMap 
          zoomable 
          pannable 
          style={{ 
            backgroundColor: '#1f2937',
            border: '1px solid #374151'
          }}
          nodeColor="#4b5563"
          maskColor="rgba(0, 0, 0, 0.8)"
        />
        <Controls 
          style={{
            button: {
              backgroundColor: '#374151',
              border: '1px solid #4b5563',
              color: '#f9fafb'
            }
          }}
        />
        <Background 
          variant={BackgroundVariant.Dots}
          gap={20} 
          size={1} 
          color="#374151"
          style={{ backgroundColor: '#111827' }}
        />
      </ReactFlow>
    </div>
  );
}