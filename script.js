// 全局变量
let currentWordIndex = 0;
let isDrawing = false;
let lastX = 0;
let lastY = 0;
let canvas, ctx;

// 初始化
window.onload = function() {
    initCanvas();
    loadProgress();
    updateWordDisplay();
    setupEventListeners();
};

// 初始化Canvas
function initCanvas() {
    canvas = document.getElementById('drawingCanvas');
    ctx = canvas.getContext('2d');
    drawGrid();
    
    // 设置线条样式
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#000';
}

// 绘制田字格
function drawGrid() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // 绘制边框
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.strokeRect(10, 10, canvas.width - 20, canvas.height - 20);
    
    // 绘制田字格
    ctx.lineWidth = 1;
    ctx.strokeStyle = '#ccc';
    
    // 水平线
    ctx.beginPath();
    ctx.moveTo(10, canvas.height / 2);
    ctx.lineTo(canvas.width - 10, canvas.height / 2);
    ctx.stroke();
    
    // 垂直线
    ctx.beginPath();
    ctx.moveTo(canvas.width / 2, 10);
    ctx.lineTo(canvas.width / 2, canvas.height - 10);
    ctx.stroke();
    
    // 恢复绘制样式
    ctx.lineWidth = 5;
    ctx.strokeStyle = '#000';
}

// 设置事件监听器
function setupEventListeners() {
    // 鼠标事件
    canvas.addEventListener('mousedown', startDrawing);
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseup', stopDrawing);
    canvas.addEventListener('mouseout', stopDrawing);
    
    // 触摸事件
    canvas.addEventListener('touchstart', startDrawingTouch);
    canvas.addEventListener('touchmove', drawTouch);
    canvas.addEventListener('touchend', stopDrawing);
    
    // 按钮事件
    document.getElementById('prevBtn').addEventListener('click', prevWord);
    document.getElementById('nextBtn').addEventListener('click', nextWord);
    document.getElementById('listenBtn').addEventListener('click', playAudio);
    document.getElementById('repeatBtn').addEventListener('click', startRecognition);
    document.getElementById('checkBtn').addEventListener('click', checkDrawing);
    document.getElementById('clearBtn').addEventListener('click', clearCanvas);
}

// 开始绘制（鼠标）
function startDrawing(e) {
    isDrawing = true;
    [lastX, lastY] = getMousePos(canvas, e);
}

// 绘制（鼠标）
function draw(e) {
    if (!isDrawing) return;
    
    const [currentX, currentY] = getMousePos(canvas, e);
    ctx.beginPath();
    ctx.moveTo(lastX, lastY);
    ctx.lineTo(currentX, currentY);
    ctx.stroke();
    [lastX, lastY] = [currentX, currentY];
}

// 停止绘制
function stopDrawing() {
    isDrawing = false;
}

// 开始绘制（触摸）
function startDrawingTouch(e) {
    e.preventDefault();
    isDrawing = true;
    const touch = e.touches[0];
    [lastX, lastY] = getTouchPos(canvas, touch);
}

// 绘制（触摸）
function drawTouch(e) {
    e.preventDefault();
    if (!isDrawing) return;
    
    const touch = e.touches[0];
    const [currentX, currentY] = getTouchPos(canvas, touch);
    ctx.beginPath();
    ctx.moveTo(lastX, lastY);
    ctx.lineTo(currentX, currentY);
    ctx.stroke();
    [lastX, lastY] = [currentX, currentY];
}

// 获取鼠标位置
function getMousePos(canvas, e) {
    const rect = canvas.getBoundingClientRect();
    return [e.clientX - rect.left, e.clientY - rect.top];
}

// 获取触摸位置
function getTouchPos(canvas, touch) {
    const rect = canvas.getBoundingClientRect();
    return [touch.clientX - rect.left, touch.clientY - rect.top];
}

// 清除画布
function clearCanvas() {
    drawGrid();
    document.getElementById('feedback').textContent = '';
}

// 更新单词显示
function updateWordDisplay() {
    const word = words[currentWordIndex];
    document.getElementById('word-kanji').textContent = word.kanji;
    document.getElementById('word-kana').textContent = word.kana;
    document.getElementById('word-meaning').textContent = word.meaning;
    clearCanvas();
    saveProgress();
}

// 上一个单词
function prevWord() {
    currentWordIndex = (currentWordIndex - 1 + words.length) % words.length;
    updateWordDisplay();
}

// 下一个单词
function nextWord() {
    currentWordIndex = (currentWordIndex + 1) % words.length;
    updateWordDisplay();
}

// 生成标准字模板
function generateTemplate(kanji) {
    const templateCanvas = document.createElement('canvas');
    templateCanvas.width = canvas.width;
    templateCanvas.height = canvas.height;
    const templateCtx = templateCanvas.getContext('2d');
    
    // 绘制田字格
    templateCtx.strokeStyle = '#000';
    templateCtx.lineWidth = 2;
    templateCtx.strokeRect(10, 10, templateCanvas.width - 20, templateCanvas.height - 20);
    
    templateCtx.lineWidth = 1;
    templateCtx.strokeStyle = '#ccc';
    templateCtx.beginPath();
    templateCtx.moveTo(10, templateCanvas.height / 2);
    templateCtx.lineTo(templateCanvas.width - 10, templateCanvas.height / 2);
    templateCtx.stroke();
    
    templateCtx.beginPath();
    templateCtx.moveTo(templateCanvas.width / 2, 10);
    templateCtx.lineTo(templateCanvas.width / 2, templateCanvas.height - 10);
    templateCtx.stroke();
    
    // 绘制标准字
    templateCtx.font = '180px Arial';
    templateCtx.textAlign = 'center';
    templateCtx.textBaseline = 'middle';
    templateCtx.fillStyle = '#000';
    templateCtx.fillText(kanji, templateCanvas.width / 2, templateCanvas.height / 2);
    
    return templateCanvas;
}

// 图像二值化
function binarize(canvas) {
    const ctx = canvas.getContext('2d');
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    const binaryData = [];
    
    for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const brightness = (r + g + b) / 3;
        binaryData.push(brightness < 200 ? 1 : 0);
    }
    
    return binaryData;
}

// 计算相似度
function calculateSimilarity(userData, templateData) {
    let matchCount = 0;
    let totalCount = 0;
    
    for (let i = 0; i < userData.length; i++) {
        if (templateData[i] === 1) {
            totalCount++;
            if (userData[i] === 1) {
                matchCount++;
            }
        }
    }
    
    return totalCount > 0 ? matchCount / totalCount : 0;
}

// 检查手写
function checkDrawing() {
    const word = words[currentWordIndex];
    const templateCanvas = generateTemplate(word.kanji);
    
    const userData = binarize(canvas);
    const templateData = binarize(templateCanvas);
    
    const similarity = calculateSimilarity(userData, templateData);
    const feedback = document.getElementById('feedback');
    
    if (similarity > 0.7) {
        feedback.textContent = '正确！';
        feedback.style.color = 'green';
        setTimeout(nextWord, 1000);
    } else {
        feedback.textContent = '再试一次！';
        feedback.style.color = 'red';
    }
}

// 播放语音
function playAudio() {
    const word = words[currentWordIndex];
    const utterance = new SpeechSynthesisUtterance(word.kanji);
    utterance.lang = 'ja-JP';
    utterance.rate = 0.7;
    speechSynthesis.speak(utterance);
}

// 开始语音识别
function startRecognition() {
    if (!('webkitSpeechRecognition' in window)) {
        alert('您的浏览器不支持语音识别');
        return;
    }
    
    const recognition = new webkitSpeechRecognition();
    recognition.lang = 'ja-JP';
    recognition.continuous = false;
    recognition.interimResults = false;
    
    const feedback = document.getElementById('feedback');
    feedback.textContent = '请跟读...';
    feedback.style.color = 'blue';
    
    recognition.onresult = function(event) {
        const transcript = event.results[0][0].transcript;
        const word = words[currentWordIndex];
        
        if (transcript === word.kanji) {
            feedback.textContent = '正确！';
            feedback.style.color = 'green';
            setTimeout(nextWord, 1000);
        } else {
            feedback.textContent = '再试一次！';
            feedback.style.color = 'red';
        }
    };
    
    recognition.onerror = function(event) {
        feedback.textContent = '识别失败，请重试';
        feedback.style.color = 'red';
    };
    
    recognition.start();
}

// 保存进度到localStorage
function saveProgress() {
    localStorage.setItem('japaCurrentWordIndex', currentWordIndex);
}

// 从localStorage加载进度
function loadProgress() {
    const savedIndex = localStorage.getItem('japaCurrentWordIndex');
    if (savedIndex !== null) {
        currentWordIndex = parseInt(savedIndex) % words.length;
    }
}