// Process class to store process information
class Process {
    constructor(id, arrivalTime, burstTime, priority = 0) {
        this.id = id;
        this.arrivalTime = arrivalTime;
        this.burstTime = burstTime;
        this.priority = priority;
        this.remainingTime = burstTime;
        this.finishTime = 0;
        this.turnaroundTime = 0;
        this.waitingTime = 0;
        this.startTime = 0;
        this.executionHistory = [];
    }

    addExecution(start, end) {
        this.executionHistory.push({ start, end });
    }
}

// Generate random number between min and max (inclusive)
function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Generate random processes
function generateProcesses() {
    return Array.from({ length: Math.floor(Math.random() * 2) + 5 }, (_, i) => 
        new Process(
            String.fromCharCode(65 + i), // A, B, C, etc.
            Math.floor(Math.random() * 11), // 0-10
            Math.floor(Math.random() * 5) + 1, // 1-5
            Math.floor(Math.random() * 5) + 1  // 1-5
        )
    ).sort((a, b) => a.arrivalTime - b.arrivalTime);
}

// Calculate FCFS scheduling
function calculateFCFS(processes) {
    let currentTime = 0;
    const result = processes.map(p => {
        const process = { ...p };
        currentTime = Math.max(currentTime, process.arrivalTime);
        process.startTime = currentTime;
        process.finishTime = currentTime + process.burstTime;
        process.turnaroundTime = process.finishTime - process.arrivalTime;
        process.waitingTime = process.turnaroundTime - process.burstTime;
        currentTime = process.finishTime;
        process.executionHistory = [{ start: process.startTime, end: process.finishTime }];
        return process;
    });
    
    return getMetrics(result);
}

// Calculate SRTF (Shortest Remaining Time First)
function calculateSRTF(processes) {
    const queue = processes.map(p => ({ ...p, remainingTime: p.burstTime }));
    const completed = [];
    let currentTime = 0;
    let current = null;
    let last = null;

    while (queue.length > 0 || current) {
        const arrived = queue.filter(p => p.arrivalTime <= currentTime);
        queue.splice(0, arrived.length);
        
        if (current?.remainingTime > 0) arrived.push(current);
        current = null;

        if (arrived.length > 0) {
            current = arrived.sort((a, b) => a.remainingTime - b.remainingTime)[0];
            if (last !== current) {
                if (last?.executionHistory.at(-1)?.end === undefined) {
                    last.executionHistory.at(-1).end = currentTime;
                }
                if (current.remainingTime > 0) {
                    current.addExecution(currentTime, undefined);
                }
            }
        }

        if (current) {
            currentTime++;
            current.remainingTime--;
            if (current.remainingTime === 0) {
                current.executionHistory.at(-1).end = currentTime;
                current.finishTime = currentTime;
                current.turnaroundTime = current.finishTime - current.arrivalTime;
                current.waitingTime = current.turnaroundTime - current.burstTime;
                completed.push(current);
                last = null;
            } else {
                last = current;
            }
        } else {
            currentTime++;
        }
    }
    
    return getMetrics(completed);
}

// Calculate Non-Preemptive Highest Priority First
function calculateNPHPF(processes) {
    const queue = [...processes];
    const completed = [];
    let currentTime = 0;

    while (queue.length > 0) {
        const ready = queue.filter(p => p.arrivalTime <= currentTime)
            .sort((a, b) => b.priority - a.priority);

        if (ready.length === 0) {
            currentTime = queue[0].arrivalTime;
            continue;
        }

        const process = ready[0];
        queue.splice(queue.indexOf(process), 1);
        
        process.startTime = currentTime;
        process.addExecution(currentTime, currentTime + process.burstTime);
        currentTime += process.burstTime;
        process.finishTime = currentTime;
        process.turnaroundTime = process.finishTime - process.arrivalTime;
        process.waitingTime = process.turnaroundTime - process.burstTime;
        completed.push(process);
    }

    return getMetrics(completed);
}

// Calculate Round Robin scheduling
function calculateRoundRobin(processes, timeQuantum = 2) {
    const queue = processes.map(p => ({ ...p, remainingTime: p.burstTime }));
    const completed = [];
    let currentTime = 0;
    const ready = [];

    while (queue.length > 0 || ready.length > 0) {
        while (queue.length > 0 && queue[0].arrivalTime <= currentTime) {
            ready.push(queue.shift());
        }

        if (ready.length === 0 && queue.length > 0) {
            currentTime = queue[0].arrivalTime;
            continue;
        }

        if (ready.length > 0) {
            const process = ready.shift();
            if (!process.startTime) process.startTime = currentTime;
            
            const execTime = Math.min(timeQuantum, process.remainingTime);
            process.addExecution(currentTime, currentTime + execTime);
            process.remainingTime -= execTime;
            currentTime += execTime;

            if (process.remainingTime > 0) {
                ready.push(process);
            } else {
                process.finishTime = currentTime;
                process.turnaroundTime = process.finishTime - process.arrivalTime;
                process.waitingTime = process.turnaroundTime - process.burstTime;
                completed.push(process);
            }
        }
    }

    return getMetrics(completed);
}

function getMetrics(processes) {
    const total = processes.reduce((acc, p) => ({
        waiting: acc.waiting + p.waitingTime,
        turnaround: acc.turnaround + p.turnaroundTime
    }), { waiting: 0, turnaround: 0 });

    return {
        processes: processes.sort((a, b) => a.id.localeCompare(b.id)),
        avgWaitingTime: total.waiting / processes.length,
        avgTurnaroundTime: total.turnaround / processes.length
    };
}

// Sort processes alphabetically by ID
function sortProcessesAlphabetically(processes) {
    return [...processes].sort((a, b) => a.id.localeCompare(b.id));
}

// Display processes in the table with animations
function displayProcesses(processes) {
    const tbody = document.querySelector('#process-table tbody');
    tbody.innerHTML = '';
    
    processes.forEach((p, i) => {
        const row = document.createElement('tr');
        row.style.cssText = 'opacity: 0; transform: translateY(10px); transition: all 0.3s ease;';
        row.innerHTML = `
            <td>Process ${p.id}</td>
            <td>${p.arrivalTime}</td>
            <td>${p.burstTime}</td>
            <td>${p.finishTime || '-'}</td>
            <td>${p.turnaroundTime || '-'}</td>
            <td>${p.waitingTime || '-'}</td>
        `;
        tbody.appendChild(row);
        setTimeout(() => row.style.cssText = 'opacity: 1; transform: none;', i * 100);
    });
}

// Display Gantt chart with enhanced interactivity
function displayGanttChart(processes, algorithm) {
    const container = document.getElementById('gantt-display');
    container.innerHTML = '';
    
    const maxFinishTime = Math.max(...processes.map(p => p.finishTime));
    const timeUnitWidth = 50;
    const minWidth = Math.max(1200, (maxFinishTime + 2) * timeUnitWidth);
    
    const chart = document.createElement('div');
    chart.className = 'gantt-chart';
    chart.style.minWidth = `${minWidth}px`;
    
    const labels = document.createElement('div');
    labels.className = 'process-labels';
    
    const chartArea = document.createElement('div');
    chartArea.className = 'chart-area';
    chartArea.style.minWidth = `${minWidth - 120}px`;
    
    processes.forEach(p => {
        const label = document.createElement('div');
        label.className = 'process-label';
        label.textContent = `Process ${p.id}`;
        labels.appendChild(label);
    });
    
    const segments = (algorithm === 'rr' || algorithm === 'srtf') ?
        processes.flatMap(p => p.executionHistory.map(h => ({ ...h, id: p.id, process: p }))) :
        processes.map(p => ({ start: p.startTime, end: p.finishTime, id: p.id, process: p }));
    
    segments.forEach((segment, i) => {
        const block = document.createElement('div');
        block.className = 'process-block';
        block.style.cssText = `
            top: ${processes.findIndex(p => p.id === segment.id) * 50}px;
            left: ${segment.start * timeUnitWidth}px;
            width: ${(segment.end - segment.start) * timeUnitWidth}px;
            opacity: 0;
            transform: scale(0.9);
            transition: all 0.3s ease;
        `;
        block.textContent = segment.id;
        
        chartArea.appendChild(block);
        setTimeout(() => block.style.cssText += 'opacity: 1; transform: scale(1);', i * 100);
    });
    
    const timeline = document.createElement('div');
    timeline.className = 'timeline';
    timeline.style.minWidth = `${minWidth - 120}px`;
    
    for (let i = 0; i <= maxFinishTime + 1; i++) {
        const marker = document.createElement('div');
        marker.className = 'time-marker';
        marker.style.left = `${i * timeUnitWidth}px`;
        
        const label = document.createElement('div');
        label.className = 'time-label';
        label.style.left = `${i * timeUnitWidth}px`;
        label.textContent = i;
        
        timeline.appendChild(marker);
        timeline.appendChild(label);
    }
    
    chart.appendChild(labels);
    chart.appendChild(chartArea);
    
    const wrapper = document.createElement('div');
    wrapper.className = 'gantt-container';
    wrapper.appendChild(chart);
    wrapper.appendChild(timeline);
    
    container.appendChild(wrapper);
}

// Event Listeners with loading states and animations
document.addEventListener('DOMContentLoaded', () => {
    let processes = [];
    const generateBtn = document.getElementById('generate');
    const solveBtn = document.getElementById('solve');
    const algorithmSelect = document.getElementById('algorithm');

    generateBtn.addEventListener('click', () => {
        generateBtn.classList.add('loading');
        generateBtn.disabled = true;
        setTimeout(() => {
            processes = generateProcesses();
            displayProcesses(processes);
            document.getElementById('gantt-display').innerHTML = '';
            generateBtn.classList.remove('loading');
            generateBtn.disabled = false;
        }, 500);
    });

    solveBtn.addEventListener('click', () => {
        if (processes.length === 0) {
            alert('Please generate processes first!');
            return;
        }
        
        solveBtn.classList.add('loading');
        solveBtn.disabled = true;
        
        setTimeout(() => {
            const algorithm = algorithmSelect.value;
            const calculators = {
                fcfs: calculateFCFS,
                srtf: calculateSRTF,
                nphpf: calculateNPHPF,
                rr: calculateRoundRobin
            };
            
            const result = calculators[algorithm](processes);
            displayProcesses(result.processes);
            displayGanttChart(result.processes, algorithm);
            
            solveBtn.classList.remove('loading');
            solveBtn.disabled = false;
        }, 500);
    });
}); 