(async function() {
    // Canvas Part
    const canvas = document.createElement("canvas");
    canvas.width = 500;
    canvas.height = 500;

    canvas.style.position = "fixed";
    canvas.style.top = "0px";
    canvas.style.left = "0px";
    canvas.style.zIndex = "999999999";
    canvas.style.border = "2px solid blue";

    document.body.appendChild(canvas);

    const ctx = canvas.getContext("2d");

    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Audio Part
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 2048;
    analyser.smoothingTimeConstant = 0;

    // Function to get microphone data
    function getMicData(analyser) {
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        analyser.getByteFrequencyData(dataArray);

        return dataArray;
    }

    // Function to draw frequencies to the canvas
    function frequenciesToCanvas(dataArray, index, pixelSize) {
        const multiplier = 0.4;
        const posX = pixelSize * index;
        
        for(let i = 0; i < dataArray.length; i++) {
            let value = dataArray[i];
            let posY = i * multiplier;

            if(value < 1) continue;

            if(posY > canvas.height) {
                ctx.fillStyle = "#f00";
                ctx.fillRect(posX, 0, pixelSize, 10);
                continue;
            }
            
            ctx.fillStyle = "hsl(" + ((i / 512) * 260) + ",100%," + (value * (100 / 255)) + "%)";
            ctx.fillRect(posX, canvas.height - posY, pixelSize, 5);
        }
    }

    // Function to draw to canvas the data
    function micDataToCanvas(dataHistory, pixelSize) {
        // Clear the canvas
        ctx.fillStyle = "#000";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        for(let i = 0; i < dataHistory.length; i++) {
            let dataArray = dataHistory[i];
            frequenciesToCanvas(dataArray, i, pixelSize);
        }
    }

    // Data History
    const pixelSize = 2;
    const maxDataHistoryLength = canvas.width / pixelSize;
    const dataHistory = [];

    // Microphone
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const source = audioContext.createMediaStreamSource(stream);
    source.connect(analyser);

    // Tick
    function tick() {
        const data = getMicData(analyser);
        dataHistory.push(data);

        if(dataHistory.length > maxDataHistoryLength) dataHistory.shift();
        
        micDataToCanvas(dataHistory, pixelSize);

        requestAnimationFrame(tick);
    }

    tick();

    // Make sound by mousedown
    const gain = audioContext.createGain();
    gain.gain.setValueAtTime(0, audioContext.currentTime);

    const oscillator = audioContext.createOscillator();
    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(440, audioContext.currentTime);

    oscillator.connect(gain);
    gain.connect(audioContext.destination);

    oscillator.start();

    addEventListener("mousedown", function() {
        gain.gain.setValueAtTime(1, audioContext.currentTime);
    });

    addEventListener("mouseup", function() {
        gain.gain.setValueAtTime(0, audioContext.currentTime);
    });
})();