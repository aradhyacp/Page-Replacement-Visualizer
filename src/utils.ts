export function suggestOptimalFrameSize(sequence: number[]): number {
  const maxTestSize = Math.min(sequence.length, 10); // Don't over-test
  let minFaults = Infinity;
  let bestSize = 1;

  for (let size = 1; size <= maxTestSize; size++) {
    let faults = 0;
    let frames: number[] = [];

    sequence.forEach((page, idx) => {
      if (frames.includes(page)) return;

      faults++;
      if (frames.length >= size) {
        // Optimal victim: farthest in future or not at all
        const future = sequence.slice(idx + 1);
        const nextUse = frames.map(p => {
          const next = future.indexOf(p);
          return next === -1 ? Infinity : next;
        });

        const victimIndex = nextUse.indexOf(Math.max(...nextUse));
        frames.splice(victimIndex, 1);
      }

      frames.push(page);
    });

    if (faults < minFaults) {
      minFaults = faults;
      bestSize = size;
    }
  }

  return bestSize;
}