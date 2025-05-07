import React, { useState } from 'react';
import { History, Plus, RotateCcw, Play } from 'lucide-react';
import { suggestOptimalFrameSize } from './utils';
import './App.css';
import { BarChart } from '@mantine/charts';
interface PageFrame {
  page: number;
  timestamp: number;
  lastUsed: number;
}

interface StepHistory {
  page: number;
  frames: number[];
  isFault: boolean;
}

type Algorithm = 'FIFO' | 'LRU' | 'Optimal' | 'LFU';
function simulate(algorithmType: Algorithm, sequence: number[], frameSize: number) {
  let currentFrames: PageFrame[] = [];
  let faults = 0;
  let hits = 0;
  const frequencyMap: { [page: number]: number } = {};

  sequence.forEach((page, index) => {
    const existingPage = currentFrames.find(frame => frame.page === page);
    const isFault = !existingPage;

    if (isFault) {
      faults++;
      if (currentFrames.length >= frameSize) {
        let victimIndex = 0;
        switch (algorithmType) {
          case 'FIFO':
            victimIndex = 0;
            break;
          case 'LRU':
            const leastRecent = Math.min(...currentFrames.map(f => f.lastUsed));
            victimIndex = currentFrames.findIndex(f => f.lastUsed === leastRecent);
            break;
          case 'Optimal':
            const future = sequence.slice(index + 1);
            const nextUse = currentFrames.map(frame => {
              const nextIndex = future.indexOf(frame.page);
              return nextIndex === -1 ? Infinity : nextIndex;
            });
            victimIndex = nextUse.indexOf(Math.max(...nextUse));
            break;
          case 'LFU':
            const minFreq = Math.min(...currentFrames.map(f => frequencyMap[f.page] || 0));
            const candidates = currentFrames.filter(f => frequencyMap[f.page] === minFreq);
            victimIndex = currentFrames.indexOf(candidates[0]);
            break;
        }
        currentFrames.splice(victimIndex, 1);
      }
      currentFrames.push({ page, timestamp: index, lastUsed: index });
    } else {
      hits++;
      if (algorithmType === 'LRU') {
        existingPage.lastUsed = index;
      }
    }

    frequencyMap[page] = (frequencyMap[page] || 0) + 1;
  });

  return { hits, faults };
}

function App() {
  const [frames, setFrames] = useState<PageFrame[]>([]);
  const [pageSequence, setPageSequence] = useState<number[]>([]);
  const [input, setInput] = useState<string>('');
  const [frameSize, setFrameSize] = useState<number>(3);
  const [pageFaults, setPageFaults] = useState<number>(0);
  const [pageHits, setPageHits] = useState<number>(0);
  const [history, setHistory] = useState<StepHistory[]>([]);
  const [algorithm, setAlgorithm] = useState<Algorithm>('FIFO');
  const [suggestedSize, setSuggestedSize] = useState<number | null>(null);
  const [showBelady, setShowBelady] = useState<boolean>(false);
  const [comparison, setComparison] = useState<{ [key in Algorithm]: { hits: number; faults: number } }>({
    FIFO: { hits: 0, faults: 0 },
    LRU: { hits: 0, faults: 0 },
    Optimal: { hits: 0, faults: 0 },
    LFU: {hits:0, faults: 0},
  });
  const processInput = (randomInput) => {
    const inputToprocess = randomInput ?? input;
    const numbers = inputToprocess
      .split(',')
      .map(num => parseInt(num.trim()))
      .filter(num => !isNaN(num));
  
    if (numbers.length > 0) {
      setPageSequence(numbers);
      const suggested = suggestOptimalFrameSize(numbers);
      setSuggestedSize(suggested);
    } else {
      setPageSequence([]);
      setSuggestedSize(null);
    }
  };

  const findOptimalVictim = (currentFrames: PageFrame[], currentIndex: number) => {
    const future = pageSequence.slice(currentIndex + 1);
    const nextUse = currentFrames.map(frame => {
      const nextIndex = future.indexOf(frame.page);
      return nextIndex === -1 ? Infinity : nextIndex;
    });
    return nextUse.indexOf(Math.max(...nextUse));
  };

  const simulatePageReplacement = () => {
    let currentFrames: PageFrame[] = [];
    let faults = 0;
    let hits = 0;
    let stepHistory: StepHistory[] = [];
    const frequencyMap: { [page: number]: number } = {};

    pageSequence.forEach((page, index) => {
      const existingPage = currentFrames.find(frame => frame.page === page);
      const isFault = !existingPage;
      
      if (isFault) {
        faults++;
        if (currentFrames.length >= frameSize) {
          let victimIndex = 0;
          
          switch (algorithm) {
            case 'FIFO':
              // Remove the oldest page (first in)
              victimIndex = 0;
              break;
            
            case 'LRU':
              // Remove the least recently used page
              const leastRecent = Math.min(...currentFrames.map(f => f.lastUsed));
              victimIndex = currentFrames.findIndex(f => f.lastUsed === leastRecent);
              break;
            
            case 'Optimal':
              // Remove the page that won't be used for the longest time
              victimIndex = findOptimalVictim(currentFrames, index);
              break;
            case 'LFU':
              const minFreq = Math.min(...currentFrames.map(f => frequencyMap[f.page] || 0));
              const candidates = currentFrames.filter(f => frequencyMap[f.page] === minFreq);
              victimIndex = currentFrames.indexOf(candidates[0]);
              break;
          }
          
          currentFrames.splice(victimIndex, 1);
        }
        currentFrames.push({
          page,
          timestamp: index,
          lastUsed: index
        });
      } else {
        hits++;
        if (algorithm === 'LRU') {
          existingPage.lastUsed = index;
        }
      }

      frequencyMap[page] = (frequencyMap[page] || 0) + 1;

      stepHistory.push({
        page,
        frames: currentFrames.map(f => f.page),
        isFault
      });
    });

    setFrames(currentFrames);
    setPageFaults(faults);
    setPageHits(hits);
    setHistory(stepHistory);
    setComparison({
      FIFO: simulate('FIFO', pageSequence, frameSize),
      LRU: simulate('LRU', pageSequence, frameSize),
      Optimal: simulate('Optimal', pageSequence, frameSize),
      LFU: simulate('LFU', pageSequence, frameSize),
    });
    
  };
  const beladyCheck = () => {
    if (pageSequence.length === 0) return null;
  
    const results = [];
    for (let size = 1; size <= frameSize + 2; size++) {
      const { faults } = simulate(algorithm, pageSequence, size);
      results.push({ size, faults });
    }
  
    const anomalyPairs = [];
    for (let i = 1; i < results.length; i++) {
      if (results[i].faults > results[i - 1].faults) {
        anomalyPairs.push({
          from: results[i - 1],
          to: results[i]
        });
      }
    }
  
    return anomalyPairs.length > 0 ? anomalyPairs : null;
  };
  const reset = () => {
    setFrames([]);
    setPageSequence([]);
    setInput('');
    setPageFaults(0);
    setPageHits(0);
    setHistory([]);
  };

  const getPageAtPosition = (frameIndex: number, stepIndex: number) => {
    if (!history[stepIndex]) return null;
    return history[stepIndex].frames[frameIndex];
  };

  const isHitAtPosition = (frameIndex: number, stepIndex: number) => {
    if (!history[stepIndex]) return false;
    const currentPage = history[stepIndex].page;
    const previousFrames = stepIndex > 0 ? history[stepIndex - 1].frames : [];
    return previousFrames.includes(currentPage);
  };

  const genRandomRef = () =>{
    let refArray = [];
    const length = 6 + Math.floor(Math.random()*7)
    console.log(length);
    for (let i = 0; i < length; i++) {
      let n = Math.floor(Math.random()*10);
      refArray.push(n);
    };
    console.log(refArray);
    refArray = refArray.join(',');
    setInput(refArray);
    console.log(`the upadte input ${refArray}`);
    processInput(refArray);
  };

  const data = [
    {
      name: 'Hits',
      FIFO: comparison.FIFO.hits,
      LRU: comparison.LRU.hits,
      Optimal: comparison.Optimal.hits,
      LFU: comparison.LFU.hits,
    }
  ];  

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <History className="w-8 h-8 text-indigo-600" />
              <h1 className="text-2xl font-bold text-gray-800">Page Replacement Algorithms</h1>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            <div className="space-y-4">
              <div className="flex gap-4 items-center">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Enter numbers separated by commas (e.g., 1,2,3,4)"
                  className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
                <button
                  onClick={()=>{processInput(input)}}
                  className="p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  <Plus className="w-5 h-5" />
                </button>
                <button className='gen-btn'
                  onClick={genRandomRef}>Generate</button>
              </div>

              <div className="flex gap-4 items-center">
                <label className="text-sm text-gray-600">Frame Size:</label>
                <input
                  type="number"
                  value={frameSize}
                  onChange={(e) => setFrameSize(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-20 px-3 py-1 border rounded-lg"
                  min="1"
                />
              </div>
                            
              {suggestedSize !== null && (
                <p className="text-sm text-indigo-600 ml-1 mt-1">
                  Suggested optimal frame size: <strong>{suggestedSize}</strong>
                </p>
              )}
              
              <div className="flex gap-4 items-center">
                <label className="text-sm text-gray-600">Algorithm:</label>
                <select
                  value={algorithm}
                  onChange={(e) => setAlgorithm(e.target.value as Algorithm)}
                  className="px-3 py-1 border rounded-lg bg-white"
                >
                  <option value="FIFO">First In First Out (FIFO)</option>
                  <option value="LRU">Least Recently Used (LRU)</option>
                  <option value="Optimal">Optimal</option>
                  <option value="LFU">Least Frequently Used (LFU)</option>
                </select>
                <div className="flex items-center gap-2 mt-2">
                  <label className="text-sm text-gray-600">Show Belady’s Anomaly</label>
                  <input
                    type="checkbox"
                    checked={showBelady}
                    onChange={() => setShowBelady(!showBelady)}
                    className="h-4 w-4 text-indigo-600"
                  />
</div>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={simulatePageReplacement}
                  disabled={input.length===0}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-200"
                >
                  <Play className="w-4 h-4" />
                  Simulate
                </button>
                <button
                  onClick={reset}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  <RotateCcw className="w-4 h-4" />
                  Reset
                </button>
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <h2 className="text-lg font-semibold mb-2">Statistics</h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white p-4 rounded-lg shadow">
                  <p className="text-sm text-gray-600">Page Faults</p>
                  <p className="text-2xl font-bold text-red-600">{pageFaults}</p>
                </div>
                <div className="bg-white p-4 rounded-lg shadow">
                  <p className="text-sm text-gray-600">Page Hits</p>
                  <p className="text-2xl font-bold text-green-600">{pageHits}</p>
                </div>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg mt-6">
                <h2 className="text-lg font-semibold mb-2">Algorithm Comparison</h2>
                <div className="grid grid-cols-3 gap-4">
                  {(['FIFO', 'LRU', 'Optimal','LFU'] as Algorithm[]).map((alg) => (
                    <div key={alg} className="bg-white p-4 rounded-lg shadow text-center">
                      <p className="text-sm text-gray-600 font-medium">{alg}</p>
                      <p className="text-red-600 text-lg">Faults: {comparison[alg].faults}</p>
                      <p className="text-green-600 text-lg">Hits: {comparison[alg].hits}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="graph">
              {pageHits || pageFaults ?
              <div>
              <h2 className="text-lg font-semibold mb-2 p-4">Graph</h2>
              <BarChart
              h={300}
              data={data}
            dataKey='Hits'
            series={[
              { name: 'FIFO', color: 'indigo.6' },
              { name: 'LRU', color: 'blue.6' },
              { name: 'Optimal', color: 'teal.6' },
              { name: 'LFU', color: 'orange.6' },
            ]}
            />
            </div>:null}
            </div>
                {showBelady && (
                  <div className="bg-yellow-50 p-4 rounded-lg mt-4 border border-yellow-200">
                    <h2 className="text-md font-semibold text-yellow-700 mb-2">Belady's Anomaly Detection</h2>
                    {(() => {
                      const result = beladyCheck();
                      return result ? (
                        <div>
                          <p className="text-yellow-800 mb-2">Anomaly detected at:</p>
                          <ul className="list-disc pl-5 text-yellow-900">
                            {result.map((pair, idx) => (
                              <li key={idx}>
                                {`Frame Size ${pair.from.size} ➝ ${pair.to.size}: Faults increased from ${pair.from.faults} to ${pair.to.faults}`}
                              </li>
                            ))}
                          </ul>
                        </div>
                      ) : (
                        <p className="text-green-700">No Belady’s anomaly detected in the given input.</p>
                      );
                    })()}
                </div>
                )}
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold mb-2">Page Sequence</h2>
              <div className="flex flex-wrap gap-2">
                {pageSequence.map((page, index) => (
                  <div
                    key={index}
                    className="px-3 py-1 bg-indigo-100 text-indigo-800 rounded"
                  >
                    {page}
                  </div>
                ))}
              </div>
            </div>

            {history.length > 0 && (
              <div className="mt-8">
                <h2 className="text-lg font-semibold mb-4">Page Replacement Visualization</h2>
                <div className="overflow-x-auto">
                  <table className="min-w-full border-collapse">
                    <thead>
                      <tr>
                        <th className="px-4 py-2 bg-gray-50 border border-gray-200">Frame</th>
                        {pageSequence.map((page, index) => (
                          <th key={index} className="px-4 py-2 bg-gray-50 border border-gray-200">
                            {page}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {Array.from({ length: frameSize }).map((_, frameIndex) => (
                        <tr key={frameIndex}>
                          <td className="px-4 py-2 font-medium bg-gray-50 border border-gray-200">
                            {frameIndex + 1}
                          </td>
                          {history.map((_, stepIndex) => {
                            const page = getPageAtPosition(frameIndex, stepIndex);
                            const isHit = isHitAtPosition(frameIndex, stepIndex);
                            return (
                              <td
                                key={stepIndex}
                                className={`px-4 py-2 text-center border ${
                                  page !== null
                                    ? isHit
                                      ? 'bg-green-50 border-green-200'
                                      : 'bg-white border-gray-200'
                                    : 'bg-gray-50 border-gray-200'
                                }`}
                              >
                                {page !== null ? page : '-'}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                      <tr>
                        <td className="px-4 py-2 font-medium bg-gray-50 border border-gray-200">
                          Status
                        </td>
                        {history.map((step, index) => (
                          <td
                            key={index}
                            className={`px-4 py-2 text-center border ${
                              step.isFault
                                ? 'bg-red-50 border-red-200 text-red-700'
                                : 'bg-green-50 border-green-200 text-green-700'
                            }`}
                          >
                            {step.isFault ? 'Miss' : 'Hit'}
                          </td>
                        ))}
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;