# Page Replacement Calculator

A web-based tool designed to visualize and analyze different page replacement algorithms, including **LRU (Least Recently Used)**, **FIFO (First In First Out)**, and **Optimal**. This tool makes it easier to understand how these algorithms work through interactive visualizations and experiments.

## Watch it live
http://page-replacement.jack1337.serv00.net/

## Key Features

- **Page Replacement Algorithm Visualization**: Visualizes the working of various page replacement algorithms (LRU, FIFO, Optimal).
- **Optimal Frame Size Calculation**: Helps in determining the optimal frame size for a given reference string.
- **Algorithm Comparison**: Compares multiple algorithms and generates performance graphs for better understanding (e.g., comparing page faults over time).
- **Belady’s Anomaly Detection**: Detects when Belady’s anomaly occurs, helping to identify cases where increasing the number of frames results in more page faults.

## Stack

- **Frontend**: Vite + TypeScript (TSX)
- **Libraries/Tools**: React,
- **State Management**: React’s built-in state hooks
- **CSS Framework**: Tailwind CSS
## Installation

1. **Clone the repository**:
   ```
   git clone https://github.com/aradhyacp/Page-Replacement-Calc.git
   ```
2. **Navigate into the project directory**:
    ```
        cd Page-Replacement-Calc
    ```
3. **Install dependencies:**
    ```
    npm install
    ```
## Running the Project Locally
To run the project locally, use the following command
    ```
    npm run dev
    ```