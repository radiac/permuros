class Point {
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }
}

class Colour {
  constructor(r, g, b, a = 255) {
    this.r = r;
    this.g = g;
    this.b = b;
    this.a = a;
  }

  static fromHex(hex) {
    hex = hex.replace(/^#/, "");
    let bigint = parseInt(hex, 16);
    let r = (bigint >> 16) & 255;
    let g = (bigint >> 8) & 255;
    let b = bigint & 255;
    return new Colour(r, g, b);
  }

  equals(other) {
    return (
      this.r === other.r &&
      this.g === other.g &&
      this.b === other.b &&
      this.a === other.a
    );
  }
}

class Tool {
  constructor(board) {
    this.board = board;
  }

  mousedown(point) {}
  mouseup(point) {}
  mousemove(point) {}
}

class DrawTool extends Tool {
  constructor(board) {
    super(board);
    this.drawing = false;
    this.last = new Point(0, 0);
  }
  mousedown(point) {
    this.drawing = true;
    this.last = point;
  }
  mouseup(point) {
    this.drawing = false;
    this.board.ctx.beginPath();
  }
  mousemove(point) {
    if (!this.drawing) return;

    const ctx = this.board.ctx;
    ctx.strokeStyle = this.board.toolbar.colour;
    ctx.lineWidth = this.board.toolbar.lineWidth;
    ctx.lineJoin = "round";

    ctx.beginPath();
    ctx.moveTo(this.last.x, this.last.y);
    ctx.lineTo(point.x, point.y);
    ctx.closePath();
    ctx.stroke();

    this.last = point;
  }
}
class FillTool extends Tool {
  mousedown(point) {
    fill(
      this.board.canvas,
      this.board.ctx,
      point,
      Colour.fromHex(this.board.toolbar.colour)
    );
  }
}

class Toolbar {
  constructor(board, el) {
    this.el = el;
    this.board = board;

    this.colourEl = document.getElementById("toolbar-colour");
    this.lineWidthEl = document.getElementById("toolbar-lineWidth");
    this.lineWidthSliderEl = document.getElementById("toolbar-lineWidthSlider");

    this.updateLineWidthSlider(this.lineWidthEl.value);
    this.lineWidthEl.oninput = (e) => this.updateLineWidthSlider();
    this.lineWidthSliderEl.oninput = (e) => {
      this.lineWidthEl.value = this.lineWidthSliderEl.value;
    };

    this.drawEl = document.getElementById("toolbar-draw");
    this.fillEl = document.getElementById("toolbar-fill");

    this.drawEl.addEventListener("click", (e) => this.selectDrawTool());
    this.fillEl.addEventListener("click", (e) => this.selectFillTool());
    this.selectDrawTool();

    document
      .getElementById("toolbar-save")
      .addEventListener("click", (e) => this.board.save());
    document
      .getElementById("toolbar-print")
      .addEventListener("click", (e) => this.board.print());

    document.body.addEventListener("htmx:beforeRequest", (e) => this.board.close(e));
    window.addEventListener("beforeunload", (e) => this.board.close(e));
  }

  selectDrawTool() {
    this.board.setTool(DrawTool);
    this.selectToolButton(this.drawEl);
    this.showLineWidth();
  }
  selectFillTool() {
    this.board.setTool(FillTool);
    this.selectToolButton(this.fillEl);
    this.hideLineWidth();
  }
  selectToolButton(el) {
    for (const button of [this.drawEl, this.fillEl]) {
      button.classList.toggle("selected", button == el);
    }
  }

  get colour() {
    return this.colourEl.value;
  }
  get lineWidth() {
    const value = this.lineWidthEl.value;
    if (value <= 10) {
      // Linear from 1 to 10
      return value;
    } else if (value > 10 && value <= 30) {
      // Nonlinear curve from 10 to 30
      const normalizedValue = (value - 10) / 20;
      return 10 + normalizedValue * normalizedValue * 290;
    }
    return value;
  }

  updateLineWidthSlider() {
    let value = this.lineWidthEl.value;
    if (value < 1) value = 1;
    const max = parseInt(this.lineWidthSliderEl.max, 10);
    if (value > max) value = max;
    this.lineWidthEl.value = value;
    this.lineWidthSliderEl.value = value;
  }

  showLineWidth() {
    this.lineWidthEl.style.display = "inline-block";
    this.lineWidthSliderEl.style.display = "inline-block";
  }
  hideLineWidth() {
    this.lineWidthEl.style.display = "none";
    this.lineWidthSliderEl.style.display = "none";
  }
}

class Board {
  constructor(el, toolbarEl) {
    this.saved = true;
    this.el = this.canvas = el;
    this.ctx = this.el.getContext("2d");

    this.toolbar = new Toolbar(this, toolbarEl);

    this.el.addEventListener("mousedown", (e) => this.mousedown(e));
    this.el.addEventListener("mouseup", (e) => this.mouseup(e));
    this.el.addEventListener("mouseout", (e) => this.mouseup(e));
    this.el.addEventListener("mousemove", (e) => this.mousemove(e));

    const resizeObserver = new ResizeObserver(() => {
      this.resize();
    });
    resizeObserver.observe(this.el.parentNode);
    this.resize();
  }

  setTool(toolCls) {
    this.tool = new toolCls(this);
  }

  resize() {
    let newWidth = null;
    let newHeight = null;
    if (this.canvas.parentNode.clientWidth > this.canvas.width) {
      newWidth = this.canvas.parentNode.clientWidth;
    }

    if (this.canvas.parentNode.clientHeight > this.canvas.height) {
      newHeight = this.canvas.parentNode.clientHeight;
    }

    if (newWidth || newHeight) {
      newWidth = newWidth || this.canvas.width;
      newHeight = newHeight || this.canvas.height;
      const pxData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
      this.canvas.width = newWidth;
      this.canvas.height = newHeight;
      this.ctx.putImageData(pxData, 0, 0);
    }
  }

  mousedown(e) {
    this.saved = false;
    const point = new Point(e.offsetX, e.offsetY);
    this.tool.mousedown(point);
  }

  mouseup(e) {
    const point = new Point(e.offsetX, e.offsetY);
    this.tool.mouseup(point);
  }

  mousemove(e) {
    const point = new Point(e.offsetX, e.offsetY);
    this.tool.mousemove(point);
  }

  save() {
    this.saved = true;
    const imageData = this.canvas.toDataURL("image/png");
    document.getElementById("drawImageData").value = imageData;
    document.getElementById("drawWidth").value = this.canvas.width;
    document.getElementById("drawHeight").value = this.canvas.height;
    htmx.trigger(document.getElementById("drawForm"), "submit");
  }
  load(url, width, height) {
    const img = new Image();
    this.canvas.width = width;
    this.canvas.height = height;
    img.onload = () => {
      this.ctx.clearRect(0, 0, width, height);
      this.ctx.drawImage(img, 0, 0);
    };
    img.src = url;
    this.saved = true;
  }
  print() {
    const dataUrl = canvas.toDataURL();
    const printWindow = window.open("", "_blank");
    printWindow.document.write(`
      <html>
        <head>
          <title>Print from Draw</title>
          <link id="stylesheet" rel="stylesheet" href="/static/draw/print.css">
        </head>
        <body>
          <img src="${dataUrl}">
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.document.getElementById("stylesheet").onload = () => {
      printWindow.print();
      printWindow.close();
    };
  }
  close(event) {
    if (this.saved) {
      return;
    }

    const confirmed = confirm(
      "You have unsaved changes - are you sure you want to do this?"
    );
    if (!confirmed) {
      event.preventDefault();
    }
    return confirmed;
  }
}

function fill(canvas, ctx, startPoint, fillColour) {
  var reachLeft,
    reachRight,
    drawingBoundLeft = 0,
    drawingBoundTop = 0,
    drawingBoundRight = canvas.width - 1,
    drawingBoundBottom = canvas.height - 1,
    pixelStack = [startPoint];

  const pxData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  let pixelIndex = (startPoint.y * canvas.width + startPoint.x) * 4;
  const startColour = colourFromIndex(pixelIndex);

  if (startColour.equals(fillColour)) {
    // Return because trying to fill with the same color
    return;
  }

  while (pixelStack.length) {
    const newPos = pixelStack.pop();
    let x = newPos.x;
    let y = newPos.y;

    // Get current pixel position
    pixelIndex = (y * canvas.width + x) * 4;

    // Go up as long as the color matches and are inside the canvas
    while (y >= drawingBoundTop && startColour.equals(colourFromIndex(pixelIndex))) {
      y -= 1;
      pixelIndex -= canvas.width * 4;
    }

    pixelIndex += canvas.width * 4;
    y += 1;
    reachLeft = false;
    reachRight = false;

    // Go down as long as the color matches and in inside the canvas
    while (y <= drawingBoundBottom && startColour.equals(colourFromIndex(pixelIndex))) {
      y += 1;

      colorPixel(pixelIndex, fillColour);

      if (x > drawingBoundLeft) {
        if (startColour.equals(colourFromIndex(pixelIndex - 4))) {
          if (!reachLeft) {
            // Add pixel to stack
            pixelStack.push(new Point(x - 1, y));
            reachLeft = true;
          }
        } else if (reachLeft) {
          reachLeft = false;
        }
      }

      if (x < drawingBoundRight) {
        if (startColour.equals(colourFromIndex(pixelIndex + 4))) {
          if (!reachRight) {
            // Add pixel to stack
            pixelStack.push(new Point(x + 1, y));
            reachRight = true;
          }
        } else if (reachRight) {
          reachRight = false;
        }
      }

      pixelIndex += canvas.width * 4;
    }
  }
  ctx.putImageData(pxData, 0, 0);

  function colourFromIndex(i) {
    return new Colour(
      pxData.data[i],
      pxData.data[i + 1],
      pxData.data[i + 2],
      pxData.data[i + 3]
    );
  }

  function colorPixel(pixelIndex, colour) {
    pxData.data[pixelIndex] = colour.r;
    pxData.data[pixelIndex + 1] = colour.g;
    pxData.data[pixelIndex + 2] = colour.b;
    pxData.data[pixelIndex + 3] = 255;
  }
}
