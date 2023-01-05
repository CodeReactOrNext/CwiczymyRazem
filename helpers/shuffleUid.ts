export let shuffleUid = (inputString: string, unshuffle = false) => {
  console.log(inputString);
  const seed = process.env.NEXT_PUBLIC_UID_SEED_NUMBER as string;
  let inArr = Array.from(inputString);
  let seedArr = Array.from(String(seed), Number);
  console.log(seedArr);
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
  console.log("shuffled", outArr.join(""));
  return outArr.join("");
};
// seed variable should be a number as 4 characters string,
//ex.: 1234 in env file, don't use quotes, string with letters won't work
