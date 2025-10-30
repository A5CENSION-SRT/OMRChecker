export type BubbleGridField = {
  type: 'bubble-grid';
  length: number;
  radius?: number;
  x: Record<string, number>; // index → x
  y: Record<string, number>; // digit → y
  text?: {
    y: number;
    fontSize?: number;
    xOffset?: number;
  };
};

export type TextField = {
  type: 'text';
  x: number;
  y: number;
  fontSize?: number;
};


export type AnswesrGrid = {
  type: 'answers-grid';
  x: number;
  y: number;
  radius: number;
  groups: [{
    startQuestion: number, endQuestion: number, x: Record<"A" | "B" | "C" | "D" | "E", number>;
    y: number, yStart: number, spacing: number
  }]
};
export type FieldConfig = BubbleGridField | TextField | AnswesrGrid;

export type Config = {
  [fieldName: string]: FieldConfig;
};