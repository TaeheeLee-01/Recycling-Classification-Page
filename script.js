// Teachable Machine 모델 URL
const MODEL_URL = "https://teachablemachine.withgoogle.com/models/NF6XlG3vng/";

let model, maxPredictions;
let webcamStream = null;

// DOM 요소
const cameraBtn = document.getElementById('cameraBtn');
const uploadBtn = document.getElementById('uploadBtn');
const cameraInput = document.getElementById('cameraInput');
const fileInput = document.getElementById('fileInput');
const webcamContainer = document.getElementById('webcamContainer');
const webcam = document.getElementById('webcam');
const captureBtn = document.getElementById('captureBtn');
const stopCameraBtn = document.getElementById('stopCameraBtn');
const imageContainer = document.getElementById('imageContainer');
const canvas = document.getElementById('canvas');
const resultContainer = document.getElementById('resultContainer');
const predictions = document.getElementById('predictions');
const retryBtn = document.getElementById('retryBtn');
const loadingIndicator = document.getElementById('loadingIndicator');

// 모델 로드
async function loadModel() {
    try {
        showLoading(true);
        const modelURL = MODEL_URL + "model.json";
        const metadataURL = MODEL_URL + "metadata.json";
        
        model = await tmImage.load(modelURL, metadataURL);
        maxPredictions = model.getTotalClasses();
        
        console.log("모델이 성공적으로 로드되었습니다.");
        showLoading(false);
    } catch (error) {
        console.error("모델 로드 실패:", error);
        alert("모델을 불러오는 데 실패했습니다. 인터넷 연결을 확인해주세요.");
        showLoading(false);
    }
}

// 로딩 표시
function showLoading(show) {
    loadingIndicator.style.display = show ? 'block' : 'none';
}

// 카메라 버튼 클릭 - 모바일 환경
cameraBtn.addEventListener('click', async () => {
    // 모바일에서는 직접 파일 입력 사용
    if (isMobile()) {
        cameraInput.click();
    } else {
        // 데스크톱에서는 웹캠 스트림 시작
        await startWebcam();
    }
});

// 모바일 기기 감지
function isMobile() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

// 카메라 입력 (모바일)
cameraInput.addEventListener('change', async (event) => {
    const file = event.target.files[0];
    if (file) {
        await processImageFile(file);
    }
});

// 업로드 버튼 클릭
uploadBtn.addEventListener('click', () => {
    fileInput.click();
});

// 파일 업로드
fileInput.addEventListener('change', async (event) => {
    const file = event.target.files[0];
    if (file) {
        await processImageFile(file);
    }
});

// 이미지 파일 처리
async function processImageFile(file) {
    const reader = new FileReader();
    
    reader.onload = async (e) => {
        const img = new Image();
        img.onload = async () => {
            // 캔버스에 이미지 그리기
            const ctx = canvas.getContext('2d');
            const maxWidth = 500;
            const scale = Math.min(1, maxWidth / img.width);
            canvas.width = img.width * scale;
            canvas.height = img.height * scale;
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            
            // UI 업데이트
            imageContainer.style.display = 'block';
            webcamContainer.style.display = 'none';
            document.querySelector('.controls').style.display = 'none';
            
            // 예측 실행
            await predict(canvas);
        };
        img.src = e.target.result;
    };
    
    reader.readAsDataURL(file);
}

// 웹캠 시작 (데스크톱)
async function startWebcam() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
            video: { facingMode: 'environment' } 
        });
        webcamStream = stream;
        webcam.srcObject = stream;
        webcamContainer.style.display = 'block';
        document.querySelector('.controls').style.display = 'none';
    } catch (error) {
        console.error("웹캠 접근 실패:", error);
        alert("카메라에 접근할 수 없습니다. 권한을 확인해주세요.");
    }
}

// 웹캠에서 캡처
captureBtn.addEventListener('click', async () => {
    const ctx = canvas.getContext('2d');
    canvas.width = webcam.videoWidth;
    canvas.height = webcam.videoHeight;
    ctx.drawImage(webcam, 0, 0, canvas.width, canvas.height);
    
    // 웹캠 정지
    stopWebcam();
    
    // UI 업데이트
    imageContainer.style.display = 'block';
    
    // 예측 실행
    await predict(canvas);
});

// 카메라 닫기
stopCameraBtn.addEventListener('click', () => {
    stopWebcam();
    webcamContainer.style.display = 'none';
    document.querySelector('.controls').style.display = 'flex';
});

// 웹캠 정지
function stopWebcam() {
    if (webcamStream) {
        webcamStream.getTracks().forEach(track => track.stop());
        webcamStream = null;
    }
    webcamContainer.style.display = 'none';
}

// 예측 실행
async function predict(imageElement) {
    if (!model) {
        alert("모델이 아직 로드되지 않았습니다. 잠시 후 다시 시도해주세요.");
        return;
    }
    
    try {
        showLoading(true);
        
        // 예측 수행
        const prediction = await model.predict(imageElement);
        
        // 결과를 확률 순으로 정렬
        prediction.sort((a, b) => b.probability - a.probability);
        
        // 결과 표시
        displayPredictions(prediction);
        
        showLoading(false);
    } catch (error) {
        console.error("예측 실패:", error);
        alert("이미지 분석에 실패했습니다. 다시 시도해주세요.");
        showLoading(false);
    }
}

// 예측 결과 표시
function displayPredictions(prediction) {
    predictions.innerHTML = '';
    
    prediction.forEach((pred) => {
        const percentage = (pred.probability * 100).toFixed(1);
        
        const item = document.createElement('div');
        item.className = 'prediction-item';
        
        item.innerHTML = `
            <div class="prediction-label">${pred.className}</div>
            <div class="prediction-bar-container">
                <div class="prediction-bar" style="width: ${percentage}%"></div>
            </div>
            <div class="prediction-probability">${percentage}%</div>
        `;
        
        predictions.appendChild(item);
    });
    
    resultContainer.style.display = 'block';
}

// 다시 시도
retryBtn.addEventListener('click', () => {
    // UI 초기화
    resultContainer.style.display = 'none';
    imageContainer.style.display = 'none';
    webcamContainer.style.display = 'none';
    document.querySelector('.controls').style.display = 'flex';
    
    // 입력 초기화
    fileInput.value = '';
    cameraInput.value = '';
});

// 페이지 로드 시 모델 로드
window.addEventListener('load', () => {
    loadModel();
});
