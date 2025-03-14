const canvas = document.getElementById("drawingCanvas");
const ctx = canvas.getContext("2d");
const colorPicker = document.getElementById("colorPicker");
const lineWidthSelector = document.getElementById("lineWidth");
const saveBtn = document.getElementById("saveBtn");
const floodFillBtn = document.getElementById("floodFillBtn");

let drawing = false;
let lastX = 0;
let lastY = 0;
let floodFillEnabled = false; // Flag to toggle flood fill

function hexToRgb(hex) {
  // Remove the hash at the start if it's there
  hex = hex.replace(/^#/, "");

  // Parse r, g, b values
  let bigint = parseInt(hex, 16);
  let r = (bigint >> 16) & 255;
  let g = (bigint >> 8) & 255;
  let b = bigint & 255;

  return [r, g, b];
}
canvas.addEventListener("mousedown", (e) => {
  if (floodFillEnabled) {
    const fillColor = hexToRgb(colorPicker.value);
    floodFill(e.offsetX, e.offsetY, fillColor);
    return;
  }
  drawing = true;
  [lastX, lastY] = [e.offsetX, e.offsetY];
});

// Stop drawing
canvas.addEventListener("mouseup", () => {
  if (floodFillEnabled) {
    return;
  }

  drawing = false;
  ctx.beginPath(); // Reset the path
});

// Draw on the canvas
canvas.addEventListener("mousemove", (e) => {
  if (!drawing) return;
  ctx.strokeStyle = colorPicker.value;
  ctx.lineWidth = lineWidthSelector.value;
  ctx.lineJoin = "round";
  ctx.beginPath();
  ctx.moveTo(lastX, lastY);
  ctx.lineTo(e.offsetX, e.offsetY);
  ctx.closePath();
  ctx.stroke();
  [lastX, lastY] = [e.offsetX, e.offsetY];
});

// Function to convert canvas to Base64 string
function getCanvasData() {
  return canvas.toDataURL("image/png");
}

// Function to load the image from a Base64 string
function loadCanvasData(data) {
  const img = new Image();
  img.onload = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear the canvas
    ctx.drawImage(img, 0, 0); // Draw the image on the canvas
  };
  img.src = data;
}

// Add event listener for flood fill toggle button
floodFillBtn.addEventListener("click", () => {
  floodFillEnabled = !floodFillEnabled;
  floodFillBtn.textContent = floodFillEnabled ? "Flood Fill: ON" : "Flood Fill: OFF";
});

// Save the canvas as a Base64 string and send it via AJAX
saveBtn.addEventListener("click", () => {
  const base64String = getCanvasData();

  // Example AJAX request (using Fetch API)
  fetch("your-server-endpoint", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ image: base64String }),
  })
    .then((response) => response.json())
    .then((data) => {
      console.log("Success:", data);
    })
    .catch((error) => {
      console.error("Error:", error);
    });
});

// Example function to load a Base64 string (replace with your actual data)
function loadExampleImage() {
  const exampleBase64 = "data:image/png;base64,..."; // Replace with your Base64 string
  loadCanvasData(exampleBase64);
}

// Call loadExampleImage

function floodFill(startX, startY, fillColor) {
  var newPos,
    canvasWidth = canvas.width,
    canvasHeight = canvas.height,
    x,
    y,
    pixelPos,
    reachLeft,
    reachRight,
    drawingBoundLeft = 0,
    drawingBoundTop = 0,
    drawingBoundRight = canvasWidth - 1,
    drawingBoundBottom = canvasHeight - 1,
    threshold = 0,
    pixelStack = [[startX, startY]];

  var pxData = ctx.getImageData(0, 0, canvasWidth, canvasHeight);

  var pixelPos = (startY * canvasWidth + startX) * 4,
    startR = pxData.data[pixelPos],
    startG = pxData.data[pixelPos + 1],
    startB = pxData.data[pixelPos + 2],
    a = pxData.data[pixelPos + 3];

  console.log("start", startR, startG, startB, a);
  console.log("fill", fillColor[0], fillColor[1], fillColor[2]);
  if (startR === fillColor[0] && startG === fillColor[1] && startB === fillColor[2]) {
    // Return because trying to fill with the same color
    return;
  }

  while (pixelStack.length) {
    newPos = pixelStack.pop();
    x = newPos[0];
    y = newPos[1];

    // Get current pixel position
    pixelPos = (y * canvasWidth + x) * 4;

    // Go up as long as the color matches and are inside the canvas
    while (y >= drawingBoundTop && matchStartColor(pixelPos, startR, startG, startB)) {
      y -= 1;
      pixelPos -= canvasWidth * 4;
    }

    pixelPos += canvasWidth * 4;
    y += 1;
    reachLeft = false;
    reachRight = false;

    // Go down as long as the color matches and in inside the canvas
    while (
      y <= drawingBoundBottom &&
      matchStartColor(pixelPos, startR, startG, startB)
    ) {
      y += 1;

      colorPixel(pixelPos, fillColor[0], fillColor[1], fillColor[2]);

      if (x > drawingBoundLeft) {
        if (matchStartColor(pixelPos - 4, startR, startG, startB)) {
          if (!reachLeft) {
            // Add pixel to stack
            pixelStack.push([x - 1, y]);
            reachLeft = true;
          }
        } else if (reachLeft) {
          reachLeft = false;
        }
      }

      if (x < drawingBoundRight) {
        if (matchStartColor(pixelPos + 4, startR, startG, startB)) {
          if (!reachRight) {
            // Add pixel to stack
            pixelStack.push([x + 1, y]);
            reachRight = true;
          }
        } else if (reachRight) {
          reachRight = false;
        }
      }

      pixelPos += canvasWidth * 4;
    }
  }

  function matchStartColor(pixelPos, startR, startG, startB) {
    var r = pxData.data[pixelPos],
      g = pxData.data[pixelPos + 1],
      b = pxData.data[pixelPos + 2];

    // If the current pixel matches the clicked color
    if (r === startR && g === startG && b === startB) {
      return true;
    }

    return false;
  }

  function colorPixel(pixelPos, r, g, b, a) {
    pxData.data[pixelPos] = r;
    pxData.data[pixelPos + 1] = g;
    pxData.data[pixelPos + 2] = b;
    pxData.data[pixelPos + 3] = a !== undefined ? a : 255;
  }

  ctx.putImageData(pxData, 0, 0);
}
