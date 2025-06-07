// components/CustomNode.tsx
import React from 'react';
import { NodeProps } from 'reactflow';

export default function CustomNode({ data, selected }: NodeProps) {
  return (
    <div
      style={{
        width: 50,
        height: 50,
        borderRadius: '9999px',
        backgroundColor: '#8ab4f8',
        border: selected ? '3px solid white' : '2px solid #ccc',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 10,
        color: 'white',
        position: 'relative',
        cursor: 'pointer',
      }}
    >
      {/* Label shows only on select */}
      {selected && (
        <div
          style={{
            position: 'absolute',
            top: 60,
            background: '#222',
            color: '#fff',
            padding: '4px 8px',
            borderRadius: '6px',
            fontSize: '12px',
            whiteSpace: 'nowrap',
            boxShadow: '0 0 8px rgba(0,0,0,0.4)',
          }}
        >
          {data.title}
        </div>
      )}
    </div>
  );
}
