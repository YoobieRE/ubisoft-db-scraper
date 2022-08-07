export const chunkArray = <T>(initArray: T[], size: number): T[][] =>
  Array.from(new Array(Math.ceil(initArray.length / size)), (_, i) =>
    initArray.slice(i * size, i * size + size)
  );
