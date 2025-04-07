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

// Generate random processes
function generateProcesses() {
    return Array.from({ length: Math.floor(Math.random() * 2) + 5 }, (_, i) => 
        new Process(
            String.fromCharCode(65 + i),
            Math.floor(Math.random() * 11),
            Math.floor(Math.random() * 5) + 1,
            Math.floor(Math.random() * 5) + 1
        )
    ).sort((a, b) => a.arrivalTime - b.arrivalTime);
}

// Calculate FCFS scheduling
function calculateFCFS(processes) {
    let currentTime = 0;
    const result = processes.map(p => {
        const process = new Process(p.id, p.arrivalTime, p.burstTime, p.priority);
        currentTime = Math.max(currentTime, process.arrivalTime);
        process.startTime = currentTime;
        process.finishTime = currentTime + process.burstTime;
        process.turnaroundTime = process.finishTime - process.arrivalTime;
        process.waitingTime = process.turnaroundTime - process.burstTime;
        currentTime = process.finishTime;
        process.addExecution(process.startTime, process.finishTime);
        return process;
    });
    return getMetrics(result);
}

// Calculate SRTF (Shortest Remaining Time First)
function calculateSRTF(processes) {
    // Create deep copies of processes
    const processQueue = processes.map(p => {
        const process = new Process(p.id, p.arrivalTime, p.burstTime, p.priority);
        process.remainingTime = process.burstTime;
        return process;
    });

    const completed = [];
    let currentTime = 0;
    let currentProcess = null;

    while (completed.length < processes.length) {
        // Find all arrived processes that aren't completed
        const availableProcesses = processQueue.filter(p => 
            p.arrivalTime <= currentTime && 
            p.remainingTime > 0
        );

        // If no process is available, jump to the next arrival time
        if (availableProcesses.length === 0) {
            const nextArrival = Math.min(...processQueue
                .filter(p => p.remainingTime > 0)
                .map(p => p.arrivalTime));
            currentTime = nextArrival;
            continue;
        }

        // Find the process with shortest remaining time
        const shortestProcess = availableProcesses.reduce((shortest, current) => {
            if (current.remainingTime < shortest.remainingTime) {
                return current;
            } else if (current.remainingTime === shortest.remainingTime) {
                return current.arrivalTime < shortest.arrivalTime ? current : shortest;
            }
            return shortest;
        }, availableProcesses[0]);

        // If we're switching to a new process
        if (currentProcess !== shortestProcess) {
            if (currentProcess && currentProcess.executionHistory.length > 0) {
                currentProcess.executionHistory[currentProcess.executionHistory.length - 1].end = currentTime;
            }
            if (!shortestProcess.startTime) {
                shortestProcess.startTime = currentTime;
            }
            shortestProcess.addExecution(currentTime, undefined);
            currentProcess = shortestProcess;
        }

        // Execute for 1 time unit
        currentTime++;
        shortestProcess.remainingTime--;

        // If process completes
        if (shortestProcess.remainingTime === 0) {
            shortestProcess.executionHistory[shortestProcess.executionHistory.length - 1].end = currentTime;
            shortestProcess.finishTime = currentTime;
            shortestProcess.turnaroundTime = shortestProcess.finishTime - shortestProcess.arrivalTime;
            shortestProcess.waitingTime = shortestProcess.turnaroundTime - shortestProcess.burstTime;
            completed.push(shortestProcess);
            currentProcess = null;
        }
    }

    return getMetrics(completed);
}

// Calculate Non-Preemptive Highest Priority First
function calculateNPHPF(processes) {
    const queue = processes.map(p => new Process(p.id, p.arrivalTime, p.burstTime, p.priority));
    const completed = [];
    let currentTime = 0;

    while (queue.length > 0) {
        const ready = queue.filter(p => p.arrivalTime <= currentTime)
            .sort((a, b) => b.priority - a.priority);

        if (ready.length === 0) {
            currentTime = Math.min(...queue.map(p => p.arrivalTime));
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
    const queue = processes.map(p => {
        const process = new Process(p.id, p.arrivalTime, p.burstTime, p.priority);
        process.remainingTime = process.burstTime;
        return process;
    });
    const completed = [];
    let currentTime = 0;
    const ready = [];

    queue.sort((a, b) => a.arrivalTime - b.arrivalTime);

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
        } else {
            currentTime++;
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
        requestAnimationFrame(() => {
            setTimeout(() => row.style.cssText = 'opacity: 1; transform: none;', i * 50);
        });
    });
}

function displayGanttChart(processes, algorithm) {
    const container = document.getElementById('gantt-display');
    container.innerHTML = '';
    
    const maxFinishTime = Math.max(...processes.map(p => p.finishTime || 0));
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
    
    let segments = (algorithm === 'rr' || algorithm === 'srtf') ?
        processes.flatMap(p => p.executionHistory.map(h => ({ ...h, id: p.id }))) :
        processes.map(p => ({ start: p.startTime, end: p.finishTime, id: p.id }));
    
    segments = segments.filter(s => s && s.start >= 0 && s.end > s.start);
    
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
        requestAnimationFrame(() => {
            setTimeout(() => block.style.cssText += 'opacity: 1; transform: scale(1);', i * 50);
        });
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

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    let processes = [];
    const generateBtn = document.getElementById('generate');
    const solveBtn = document.getElementById('solve');
    const algorithmSelect = document.getElementById('algorithm');

    generateBtn.addEventListener('click', () => {
        generateBtn.disabled = true;
        processes = generateProcesses();
        displayProcesses(processes);
        document.getElementById('gantt-display').innerHTML = '';
        generateBtn.disabled = false;
    });

    solveBtn.addEventListener('click', () => {
        if (processes.length === 0) {
            alert('Please generate processes first!');
            return;
        }
        
        solveBtn.disabled = true;
        
        try {
            const algorithm = algorithmSelect.value;
            // Create copies that preserve the exact original values
            const processesCopy = processes.map(p => {
                const copy = new Process(p.id, p.arrivalTime, p.burstTime, p.priority);
                // Ensure we copy any existing calculated values
                copy.finishTime = p.finishTime;
                copy.turnaroundTime = p.turnaroundTime;
                copy.waitingTime = p.waitingTime;
                copy.startTime = p.startTime;
                copy.executionHistory = [...(p.executionHistory || [])];
                return copy;
            });
            
            const calculators = {
                fcfs: calculateFCFS,
                srtf: calculateSRTF,
                nphpf: calculateNPHPF,
                rr: calculateRoundRobin
            };
            
            const result = calculators[algorithm](processesCopy);
            displayProcesses(result.processes);
            displayGanttChart(result.processes, algorithm);
        } catch (error) {
            alert('An error occurred while solving: ' + error.message);
        } finally {
            solveBtn.disabled = false;
        }
    });
}); 