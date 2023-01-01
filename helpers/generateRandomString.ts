function generateRandomString(input: string) {
  // Create a new empty string
  let output = "";

  // Use the input string to create a seed for the random number generator
  let seed = input
    .split("")
    .map((char) => char.charCodeAt(0))
    .reduce((seed, code) => seed + code, 0);

  // Generate a random string of length 10
  for (let i = 0; i < 10; i++) {
    // Use the XOR shift algorithm to generate a random number
    seed ^= seed << 13;
    seed ^= seed >>> 17;
    seed ^= seed << 5;

    // Convert the random number to a lowercase letter and add it to the output string, excluding the apostrophe and grave accent characters
    let code = (seed % 26) + 97;
    if (code === 39 || code === 96) {
      code++;
    }
    output += String.fromCharCode(code);
  }

  return output;
}

export default generateRandomString;
