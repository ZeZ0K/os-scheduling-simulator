<<<<<<< HEAD
# OS Scheduling Simulator

An interactive web-based simulator for CPU scheduling algorithms. This tool helps visualize and understand different CPU scheduling algorithms commonly used in operating systems.

## Features

- Multiple scheduling algorithms:
  - First Come First Serve (FCFS)
  - Shortest Remaining Time First (SRTF)
  - Non-Preemptive Highest Priority First (NPHPF)
  - Round Robin (RR)
- Interactive Gantt chart visualization
- Process metrics calculation (Waiting Time, Turnaround Time)
- Random process generation
- Responsive design
- Animated UI elements

## Live Demo

Visit [https://ZeZ0K.github.io/os-scheduler-](https://ZeZ0K.github.io/os-scheduler-)

## Usage

1. Select a scheduling algorithm from the dropdown menu
2. Click "Generate Random Processes" to create a set of processes
3. Click "Solve" to see the scheduling solution
4. Hover over process blocks in the Gantt chart to see detailed information

## Local Development

1. Clone the repository:
```bash
git clone git@github.com:ZeZ0K/os-scheduler-.git
```

2. Open the project directory:
```bash
cd os-scheduler-
```

3. Open `index.html` in your web browser or use a local server:
```bash
python -m http.server 8000
```

Then visit `http://localhost:8000` in your browser.

## Technologies Used

- HTML5
- CSS3
- JavaScript (ES6+)
- No external dependencies

