import { ObjectDetector, FilesetResolver } from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.2";
const demosSection = document.getElementById("demos");
let objectDetector;
let runningMode = "IMAGE";
// Initialize the object detector
const initializeObjectDetector = async () => {
    const vision = await FilesetResolver.forVisionTasks("https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.2/wasm");
    objectDetector = await ObjectDetector.createFromOptions(vision, {
        baseOptions: {
            modelAssetPath: `https://storage.googleapis.com/mediapipe-models/object_detector/efficientdet_lite0/float16/1/efficientdet_lite0.tflite`,
            delegate: "GPU"
        },
        scoreThreshold: 0.7,
        categoryAllowlist: ["person"],
        runningMode: runningMode
    });
    demosSection.classList.remove("invisible");
};
initializeObjectDetector();
/********************************************************************
 // Demo 2: Continuously grab image from webcam stream and detect it.
 ********************************************************************/


let video = document.getElementById("webcam");
const liveView = document.getElementById("liveView");
let enableWebcamButton;
// Check if webcam access is supported.
function hasGetUserMedia() {
    return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
}
// Keep a reference of all the child elements we create
// so we can remove them easilly on each render.
var children = [];
// If webcam supported, add event listener to button for when user
// wants to activate it.
if (hasGetUserMedia()) {
    enableWebcamButton = document.getElementById("webcamButton");
    enableWebcamButton.addEventListener("click", enableCam);
}
else {
    console.warn("getUserMedia() is not supported by your browser");
}
// Enable the live webcam view and start detection.
async function enableCam(event) {
    if (!objectDetector) {
        console.log("Wait! objectDetector not loaded yet.");
        return;
    }
    // Hide the button.
    enableWebcamButton.classList.add("removed");
    // getUsermedia parameters
    const constraints = {
        video: true
    };
    // Activate the webcam stream.
    navigator.mediaDevices
        .getUserMedia(constraints)
        .then(function (stream) {
        video.srcObject = stream;
        video.addEventListener("loadeddata", predictWebcam);
    })
        .catch((err) => {
        console.error(err);
        /* handle the error */
    });
}
let averageCenterX = 0;
let averageCenterY = 0;
let lastVideoTime = -1;
async function predictWebcam() {
    // if image mode is initialized, create a new classifier with video runningMode.
    if (runningMode === "IMAGE") {
        runningMode = "VIDEO";
        await objectDetector.setOptions({ runningMode: "VIDEO" });
    }
    let startTimeMs = performance.now();
    let intervalID = null;
    // Detect objects using detectForVideo.
    if (video.currentTime !== lastVideoTime) {
        lastVideoTime = video.currentTime;
        const detections = await objectDetector.detectForVideo(video, startTimeMs);
        displayVideoDetections(detections);
        // Call this function again to keep predicting when the browser is ready.
        window.requestAnimationFrame(predictWebcam);
    }
    function displayVideoDetections(result) {
        // Remove any highlighting from previous frame.
        for (let child of children) {
            liveView.removeChild(child);
        }
        children.splice(0);
        const canvas = document.getElementById("overlayCanvas");
        canvas.width = video.offsetWidth;
        canvas.height = video.offsetHeight;
        const ctx = canvas.getContext("2d");
        ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear previous drawings
        // Inicializar variables para calcular posicion
        let totalCenterX = 0;
        let totalCenterY = 0;
        const numDetections = result.detections.length;
        result.detections.forEach((detection) => {
            const centerX = (video.offsetWidth -
                detection.boundingBox.width / 2 -
                detection.boundingBox.originX) /
                video.offsetWidth;
            const centerY = (detection.boundingBox.originY + detection.boundingBox.height / 2) /
                video.offsetHeight;
            totalCenterX += centerX;
            totalCenterY += centerY;
        });
        averageCenterX = totalCenterX / numDetections;
        averageCenterY = totalCenterY / numDetections;

        const positionMessage = JSON.stringify({
            averageCenterX: averageCenterX,
            averageCenterY: averageCenterY
        });

        //console.log("Average Center X:", averageCenterX);
        //console.log("Average Center Y:", averageCenterY);
        document.getElementById("averagePosition").innerText = `Average Center X: ${averageCenterX.toFixed(2)}, Average Center Y: ${averageCenterY.toFixed(2)}`;
        // Iterate through predictions and draw them to the live view
        for (let detection of result.detections) {
            const p = document.createElement("p");
            p.innerText =
                detection.categories[0].categoryName +
                    " - with " +
                    Math.round(parseFloat(detection.categories[0].score) * 100) +
                    "% confidence.";
            p.style =
                "left: " +
                    (video.offsetWidth -
                        detection.boundingBox.width -
                        detection.boundingBox.originX) +
                    "px;" +
                    "top: " +
                    detection.boundingBox.originY +
                    "px; " +
                    "width: " +
                    (detection.boundingBox.width - 10) +
                    "px;";
            const highlighter = document.createElement("div");
            highlighter.setAttribute("class", "highlighter");
            highlighter.style =
                "left: " +
                    (video.offsetWidth -
                        detection.boundingBox.width -
                        detection.boundingBox.originX) +
                    "px;" +
                    "top: " +
                    detection.boundingBox.originY +
                    "px;" +
                    "width: " +
                    (detection.boundingBox.width - 10) +
                    "px;" +
                    "height: " +
                    detection.boundingBox.height +
                    "px;";
            ctx.fillStyle = "red";
            ctx.beginPath();
            ctx.arc(averageCenterX * canvas.width, averageCenterY * canvas.height, 5, 0, 2 * Math.PI);
            ctx.fill();
            liveView.appendChild(highlighter);
            liveView.appendChild(p);
            // Store drawn objects in memory so they are queued to delete at next call.
            children.push(highlighter);
            children.push(p);
        }
    }
}

