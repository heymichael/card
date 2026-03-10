export interface TextBlock {
  id: 'blockA' | 'blockB';
  label: string;
  text: string;
  x: number;
  y: number;
  fontSize: number;
  fontFamily: string;
  fill: string;
  align: 'left' | 'center' | 'right';
  width: number;
  // Curve properties
  curved: boolean;           // Flag to enable curved text rendering
  curveType: 'arc' | 'bezier' | 'wavy-bezier'; // Type of curve
  arcRadius: number;         // Controls curve depth (arc: radius, bezier: control point offset)
}

export interface PhotoState {
  src: string;        // object URL
  naturalWidth: number;
  naturalHeight: number;
  x: number;
  y: number;
  scaleX: number;
  scaleY: number;
}

export type ActiveBlock = 'blockA' | 'blockB';
export type ActiveElement = ActiveBlock | 'photo';
