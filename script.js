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
    const numProcesses = getRandomInt(5, 6);
    const processes = [];
    const labels = ['A', 'B', 'C', 'D', 'E', 'F'];

    for (let i = 0; i < numProcesses; i++) {
        const arrivalTime = getRandomInt(0, 10);
        const burstTime = getRandomInt(1, 5);
        const priority = getRandomInt(1, 5);
        processes.push(new Process(labels[i], arrivalTime, burstTime, priority));
    }

    processes.sort((a, b) => a.arrivalTime - b.arrivalTime);
    return processes;
}

// Calculate FCFS scheduling
function calculateFCFS(processes) {
    let currentTime = 0;
    let totalWaitingTime = 0;
    let totalTurnaroundTime = 0;
    
    // Create a copy of processes to avoid modifying the original
    const sortedProcesses = [...processes].sort((a, b) => a.arrivalTime - b.arrivalTime);
    
    for (let i = 0; i < sortedProcesses.length; i++) {
        const process = sortedProcesses[i];
        
        // If process arrives after current time, update current time
        if (process.arrivalTime > currentTime) {
            currentTime = process.arrivalTime;
        }
        
        // Set start time
        process.startTime = currentTime;
        
        // Calculate finish time
        process.finishTime = currentTime + process.burstTime;
        
        // Calculate turnaround time
        process.turnaroundTime = process.finishTime - process.arrivalTime;
        
        // Calculate waiting time
        process.waitingTime = process.startTime - process.arrivalTime;
        
        // Update current time
        currentTime = process.finishTime;
        
        // Add to totals
        totalWaitingTime += process.waitingTime;
        totalTurnaroundTime += process.turnaroundTime;
    }
    
    // Calculate averages
    const avgWaitingTime = totalWaitingTime / sortedProcesses.length;
    const avgTurnaroundTime = totalTurnaroundTime / sortedProcesses.length;
    
    return {
        processes: sortedProcesses,
        avgWaitingTime,
        avgTurnaroundTime
    };
}

// Calculate SRTF (Shortest Remaining Time First)
function calculateSRTF(processes) {
    let currentTime = 0;
    let totalWaitingTime = 0;
    let totalTurnaroundTime = 0;
    
    // Create a deep copy of processes
    const processQueue = processes.map(p => {
        const newProcess = new Process(p.id, p.arrivalTime, p.burstTime, p.priority);
        newProcess.remainingTime = p.burstTime;
        return newProcess;
    });
    
    const completedProcesses = [];
    let currentProcess = null;
    let lastProcess = null;
    
    while (processQueue.length > 0 || currentProcess) {
        // Add newly arrived processes to ready queue
        const arrivedProcesses = processQueue.filter(p => p.arrivalTime <= currentTime);
        processQueue.splice(0, arrivedProcesses.length);
        
        // Add current process to arrived processes if it exists and not completed
        if (currentProcess && currentProcess.remainingTime > 0) {
            arrivedProcesses.push(currentProcess);
        }
        currentProcess = null;
        
        // Find process with shortest remaining time
        if (arrivedProcesses.length > 0) {
            arrivedProcesses.sort((a, b) => a.remainingTime - b.remainingTime);
            currentProcess = arrivedProcesses.shift();
            
            // Put remaining processes back in queue
            processQueue.push(...arrivedProcesses);
            
            // If this is the first time process is running
            if (currentProcess.startTime === 0) {
                currentProcess.startTime = currentTime;
            }
            
            // If we switched to a different process, record execution for the last process
            if (lastProcess && lastProcess !== currentProcess) {
                const lastExecution = lastProcess.executionHistory[lastProcess.executionHistory.length - 1];
                if (lastExecution && lastExecution.end === undefined) {
                    lastExecution.end = currentTime;
                }
            }
            
            // Start new execution segment if needed
            if (lastProcess !== currentProcess) {
                // Only add new execution segment if this process has remaining time
                if (currentProcess.remainingTime > 0) {
                    currentProcess.addExecution(currentTime, undefined);
                }
            }
        }
        
        if (currentProcess) {
            // Execute for 1 time unit
            currentTime++;
            currentProcess.remainingTime--;
            
            // Check if process is completed
            if (currentProcess.remainingTime === 0) {
                // Set end time for last execution segment
                const lastExecution = currentProcess.executionHistory[currentProcess.executionHistory.length - 1];
                if (lastExecution && lastExecution.end === undefined) {
                    lastExecution.end = currentTime;
                }
                
                currentProcess.finishTime = currentTime;
                currentProcess.turnaroundTime = currentProcess.finishTime - currentProcess.arrivalTime;
                currentProcess.waitingTime = currentProcess.turnaroundTime - currentProcess.burstTime;
                
                completedProcesses.push(currentProcess);
                
                // Update totals
                totalWaitingTime += currentProcess.waitingTime;
                totalTurnaroundTime += currentProcess.turnaroundTime;
                
                lastProcess = null;
                currentProcess = null;
            } else {
                lastProcess = currentProcess;
            }
        } else {
            currentTime++;
        }
    }
    
    // Clean up any execution segments with undefined end times
    completedProcesses.forEach(process => {
        process.executionHistory = process.executionHistory.filter(segment => 
            segment.end !== undefined && segment.end > segment.start
        );
    });
    
    return {
        processes: completedProcesses,
        avgWaitingTime: totalWaitingTime / completedProcesses.length,
        avgTurnaroundTime: totalTurnaroundTime / completedProcesses.length
    };
}

// Calculate Non-Preemptive Highest Priority First
function calculateNPHPF(processes) {
    let currentTime = 0;
    let totalWaitingTime = 0;
    let totalTurnaroundTime = 0;
    
    // Create a copy of processes
    const processQueue = [...processes];
    const completedProcesses = [];
    const readyQueue = [];
    
    while (processQueue.length > 0 || readyQueue.length > 0) {
        // Add processes that have arrived to ready queue
        while (processQueue.length > 0 && processQueue[0].arrivalTime <= currentTime) {
            readyQueue.push(processQueue.shift());
        }
        
        if (readyQueue.length === 0 && processQueue.length > 0) {
            currentTime = processQueue[0].arrivalTime;
            continue;
        }
        
        // Sort ready queue by priority (highest first)
        readyQueue.sort((a, b) => b.priority - a.priority);
        
        // Get highest priority process
        const process = readyQueue.shift();
        
        // Set start time
        process.startTime = currentTime;
        
        // Execute process
        process.addExecution(currentTime, currentTime + process.burstTime);
        currentTime += process.burstTime;
        
        // Calculate metrics
        process.finishTime = currentTime;
        process.turnaroundTime = process.finishTime - process.arrivalTime;
        process.waitingTime = process.turnaroundTime - process.burstTime;
        
        // Add to completed processes
        completedProcesses.push(process);
        
        // Update totals
        totalWaitingTime += process.waitingTime;
        totalTurnaroundTime += process.turnaroundTime;
    }
    
    return {
        processes: completedProcesses,
        avgWaitingTime: totalWaitingTime / completedProcesses.length,
        avgTurnaroundTime: totalTurnaroundTime / completedProcesses.length
    };
}

// Calculate Round Robin scheduling
function calculateRoundRobin(processes, timeQuantum = 2) {
    let currentTime = 0;
    let totalWaitingTime = 0;
    let totalTurnaroundTime = 0;
    
    // Create a copy of processes to avoid modifying the original
    const sortedProcesses = [...processes].map(p => {
        const newProcess = new Process(p.id, p.arrivalTime, p.burstTime);
        newProcess.remainingTime = p.burstTime;
        return newProcess;
    });
    
    // Sort processes by arrival time
    sortedProcesses.sort((a, b) => a.arrivalTime - b.arrivalTime);
    
    const readyQueue = [];
    const completedProcesses = [];
    
    // Add first process to ready queue
    if (sortedProcesses.length > 0) {
        readyQueue.push(sortedProcesses.shift());
    }
    
    while (readyQueue.length > 0 || sortedProcesses.length > 0) {
        // Add processes that have arrived to the ready queue
        while (sortedProcesses.length > 0 && sortedProcesses[0].arrivalTime <= currentTime) {
            readyQueue.push(sortedProcesses.shift());
        }
        
        // If ready queue is empty but there are still processes to be scheduled
        if (readyQueue.length === 0 && sortedProcesses.length > 0) {
            currentTime = sortedProcesses[0].arrivalTime;
            readyQueue.push(sortedProcesses.shift());
        }
        
        // Get the next process from the ready queue
        const process = readyQueue.shift();
        
        // If this is the first time this process is being executed
        if (process.startTime === 0) {
            process.startTime = currentTime;
        }
        
        // Record execution start time
        const executionStart = currentTime;
        
        // Execute process for the time quantum or until it completes
        const executionTime = Math.min(timeQuantum, process.remainingTime);
        process.remainingTime -= executionTime;
        currentTime += executionTime;
        
        // Record execution history
        process.executionHistory.push({
            start: executionStart,
            end: currentTime
        });
        
        // If process is not completed, add it back to the ready queue
        if (process.remainingTime > 0) {
            readyQueue.push(process);
        } else {
            // Process is completed
            process.finishTime = currentTime;
            process.turnaroundTime = process.finishTime - process.arrivalTime;
            process.waitingTime = process.turnaroundTime - process.burstTime;
            
            // Add to completed processes
            completedProcesses.push(process);
            
            // Add to totals
            totalWaitingTime += process.waitingTime;
            totalTurnaroundTime += process.turnaroundTime;
        }
    }
    
    // Calculate averages
    const avgWaitingTime = totalWaitingTime / completedProcesses.length;
    const avgTurnaroundTime = totalTurnaroundTime / completedProcesses.length;
    
    return {
        processes: completedProcesses,
        avgWaitingTime,
        avgTurnaroundTime
    };
}

// Sort processes alphabetically by ID
function sortProcessesAlphabetically(processes) {
    return [...processes].sort((a, b) => a.id.localeCompare(b.id));
}

// Display processes in the table with animations
function displayProcesses(processes) {
    const tableBody = document.querySelector('#process-table tbody');
    tableBody.innerHTML = '';

    // Sort processes alphabetically by ID
    const sortedProcesses = sortProcessesAlphabetically(processes);

    sortedProcesses.forEach((process, index) => {
        const row = document.createElement('tr');
        row.style.opacity = '0';
        row.style.transform = 'translateY(10px)';
        row.style.transition = 'all 0.3s ease';
        
        row.innerHTML = `
            <td>Process ${process.id}</td>
            <td>${process.arrivalTime}</td>
            <td>${process.burstTime}</td>
            <td>${process.finishTime || '-'}</td>
            <td>${process.turnaroundTime || '-'}</td>
            <td>${process.waitingTime || '-'}</td>
        `;
        
        tableBody.appendChild(row);
        
        // Trigger animation after a small delay
        setTimeout(() => {
            row.style.opacity = '1';
            row.style.transform = 'translateY(0)';
        }, index * 100);
    });
}

// Display Gantt chart with enhanced interactivity
function displayGanttChart(processes, algorithm) {
    const ganttDisplay = document.getElementById('gantt-display');
    ganttDisplay.innerHTML = '';
    
    // Find the maximum finish time
    const maxFinishTime = Math.max(...processes.map(p => p.finishTime));
    
    // Create main chart structure
    const ganttChart = document.createElement('div');
    ganttChart.className = 'gantt-chart';
    
    // Set minimum width based on maxFinishTime (add padding for last element)
    const minWidth = Math.max(800, (maxFinishTime + 1) * 50);
    ganttChart.style.minWidth = `${minWidth}px`;
    
    // Create process labels column
    const labelsColumn = document.createElement('div');
    labelsColumn.className = 'process-labels';
    
    // Create chart area
    const chartArea = document.createElement('div');
    chartArea.className = 'chart-area';
    chartArea.style.minWidth = `${minWidth - 120}px`;
    
    // Sort processes alphabetically
    const sortedProcesses = sortProcessesAlphabetically(processes);
    
    // Add process labels with hover effect
    sortedProcesses.forEach(process => {
        const label = document.createElement('div');
        label.className = 'process-label';
        label.textContent = `Process ${process.id}`;
        label.setAttribute('data-process', process.id);
        labelsColumn.appendChild(label);
    });
    
    // Create and position process blocks
    let processSegments = [];
    
    if (algorithm === 'rr' || algorithm === 'srtf') {
        sortedProcesses.forEach(process => {
            process.executionHistory.forEach(segment => {
                processSegments.push({
                    id: process.id,
                    start: segment.start,
                    end: segment.end,
                    process: process
                });
            });
        });
    } else {
        processSegments = sortedProcesses.map(process => ({
            id: process.id,
            start: process.startTime,
            end: process.finishTime,
            process: process
        }));
    }
    
    // Create process blocks with enhanced tooltips and animations
    processSegments.forEach((segment, index) => {
        const processIndex = sortedProcesses.findIndex(p => p.id === segment.id);
        const block = document.createElement('div');
        block.className = 'process-block';
        block.style.top = `${processIndex * 50}px`;
        
        const startPercent = (segment.start / (maxFinishTime + 1)) * 100;
        const widthPercent = ((segment.end - segment.start) / (maxFinishTime + 1)) * 100;
        
        block.style.left = `${startPercent}%`;
        block.style.width = `${widthPercent}%`;
        block.textContent = segment.id;
        
        // Add animation delay
        block.style.opacity = '0';
        block.style.transform = 'scale(0.9)';
        block.style.transition = 'all 0.3s ease';
        
        // Create enhanced tooltip
        const tooltip = document.createElement('div');
        tooltip.className = 'tooltip';
        tooltip.innerHTML = `
            <strong>Process ${segment.id}</strong><br>
            Start: ${segment.start}<br>
            End: ${segment.end}<br>
            Duration: ${segment.end - segment.start}<br>
            ${algorithm === 'nphpf' ? `Priority: ${segment.process.priority}` : ''}
        `;
        block.appendChild(tooltip);
        
        // Add hover effect to highlight related blocks
        block.addEventListener('mouseenter', () => {
            const relatedBlocks = document.querySelectorAll(`.process-block:not([data-highlighted])`);
            relatedBlocks.forEach(b => {
                if (b !== block) b.style.opacity = '0.5';
            });
            block.setAttribute('data-highlighted', 'true');
        });
        
        block.addEventListener('mouseleave', () => {
            const relatedBlocks = document.querySelectorAll('.process-block');
            relatedBlocks.forEach(b => {
                b.style.opacity = '1';
                b.removeAttribute('data-highlighted');
            });
        });
        
        chartArea.appendChild(block);
        
        // Trigger animation after a small delay
        setTimeout(() => {
            block.style.opacity = '1';
            block.style.transform = 'scale(1)';
        }, index * 100);
    });
    
    // Create timeline with animated markers
    const timeline = document.createElement('div');
    timeline.className = 'timeline';
    timeline.style.minWidth = `${minWidth - 120}px`;
    
    for (let i = 0; i <= maxFinishTime + 1; i++) {
        const marker = document.createElement('div');
        marker.className = 'time-marker';
        marker.style.left = `${(i / (maxFinishTime + 1)) * 100}%`;
        
        const label = document.createElement('div');
        label.className = 'time-label';
        label.style.left = `${(i / (maxFinishTime + 1)) * 100}%`;
        label.textContent = i;
        
        timeline.appendChild(marker);
        timeline.appendChild(label);
    }
    
    // Assemble the chart
    ganttChart.appendChild(labelsColumn);
    ganttChart.appendChild(chartArea);
    
    const container = document.createElement('div');
    container.className = 'gantt-container';
    container.appendChild(ganttChart);
    container.appendChild(timeline);
    
    ganttDisplay.appendChild(container);
}

// Event Listeners with loading states and animations
document.addEventListener('DOMContentLoaded', () => {
    const generateButton = document.getElementById('generate');
    const solveButton = document.getElementById('solve');
    const algorithmSelect = document.getElementById('algorithm');
    let currentProcesses = [];

    generateButton.addEventListener('click', () => {
        // Add loading state
        generateButton.classList.add('loading');
        generateButton.disabled = true;
        
        setTimeout(() => {
            currentProcesses = generateProcesses();
            displayProcesses(currentProcesses);
            document.getElementById('gantt-display').innerHTML = '';
            
            // Remove loading state
            generateButton.classList.remove('loading');
            generateButton.disabled = false;
        }, 500);
    });

    solveButton.addEventListener('click', () => {
        if (currentProcesses.length === 0) {
            alert('Please generate processes first!');
            return;
        }
        
        // Add loading state
        solveButton.classList.add('loading');
        solveButton.disabled = true;
        
        setTimeout(() => {
            const algorithm = algorithmSelect.value;
            let result;
            
            switch (algorithm) {
                case 'fcfs':
                    result = calculateFCFS(currentProcesses);
                    break;
                case 'srtf':
                    result = calculateSRTF(currentProcesses);
                    break;
                case 'nphpf':
                    result = calculateNPHPF(currentProcesses);
                    break;
                case 'rr':
                    result = calculateRoundRobin(currentProcesses);
                    break;
                default:
                    alert('This algorithm is not implemented yet!');
                    return;
            }
            
            displayProcesses(result.processes);
            displayGanttChart(result.processes, algorithm);
            
            // Remove loading state
            solveButton.classList.remove('loading');
            solveButton.disabled = false;
        }, 500);
    });
}); 