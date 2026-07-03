export const getRowLetter = (index: number) => {
  if (index < 26) {
    return String.fromCharCode(65 + index); // A-Z
  } else {
    const firstChar = String.fromCharCode(65 + Math.floor(index / 26) - 1);
    const secondChar = String.fromCharCode(65 + (index % 26));
    return firstChar + secondChar; // AA, AB, AC...
  }
};