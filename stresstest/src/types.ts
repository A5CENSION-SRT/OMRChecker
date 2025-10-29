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

export type FieldConfig = BubbleGridField | TextField;

export type Config = {
  [fieldName: string]: FieldConfig;
};