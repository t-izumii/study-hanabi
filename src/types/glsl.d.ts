declare module '*.glsl' {
  const content: string;
  export default content;
}

declare global {
  var gc: (() => void) | undefined;
}