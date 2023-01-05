export let shuffleUid = (string: string, unshuffle = false) => {
  const seed = "1583";
  let inArr = Array.from(string);
  let seedArr = Array.from(seed, Number);

  let outArr = Array.from(inArr),
    len = inArr.length;

  let swap = (a: number, b: number) =>
    ([outArr[a], outArr[b]] = [outArr[b], outArr[a]]);

  for (
    var i = unshuffle ? len - 1 : 0;
    (unshuffle && i >= 0) || (!unshuffle && i < len);
    i += unshuffle ? -1 : 1
  )
    swap(seedArr[i % seedArr.length] % len, i);

  return outArr.join("");
};
// seed variable should be a number as 4 characters string,
//ex.: "1234", string with letters won't work
