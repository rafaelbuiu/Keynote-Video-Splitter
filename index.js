const fs = require("fs-extra");
const util = require("util");
const looksSame = require("looks-same");
const moveFile = require("move-file");
const imagesToPdf = require("images-to-pdf")

const exec = util.promisify(require("child_process").exec);

const debug = false;
const videoEncoder = "h264"; // mpeg4 libvpx
const input = "mantrac.mp4";
const output = "output.mp4";

let lastCheck = false;
let lastImage;
let totalImages = 0;
let checkCount = 0;
let imagesPdf = [];
let framesData = {};

(async function() {
  try {
    console.log("Initializing temporary files");

    try {
      await fs.remove("temp");
    } catch (err) {}
    await fs.mkdir("temp");
    await fs.mkdir("temp/raw-frames");
    await fs.mkdir("temp/edited-frames");

    console.log("Decoding");
    await exec(`ffmpeg -i ${input} -r 30 temp/raw-frames/%d.png`);

    const frames = fs.readdirSync("temp/raw-frames");

    totalImages = frames.length;

    checkImage(2);
  } catch (error) {
    console.log("An error occurred:", error);

    if (debug === false) {
      await fs.remove("temp");
    }
  }
})();

async function checkImage(image) {
  if (image > totalImages) {
    await imagesToPdf(imagesPdf, "temp/combined.pdf");
    await fs.remove("temp/raw-frames");
    await fs.writeFile('temp/frameData.json', JSON.stringify(framesData));
    return;
  }

  lastImage = image - 1;
  var imageLast = `temp/raw-frames/${lastImage}.png`;
  var imageCurrent = `temp/raw-frames/${image}.png`;

  looksSame(
    imageCurrent,
    imageLast,
    { tolerance: 10, ignoreAntialiasing: true, antialiasingTolerance: 14 },
    function(error, { equal }) {
      if (error) {
        console.log(error);
        return;
      }

      console.log(
        "checking " + checkCount,
        imageLast,
        imageCurrent,
        equal
      );

      if (equal) {
        checkCount++;
        if (checkCount == 59) {
          checkCount = 0;
          var newPath = imageLast.replace("raw", "edited");
          var seconds = (lastImage / 30);
          framesData[lastImage] = seconds;
          moveFile(imageLast, newPath);
          imagesPdf.push(newPath)
        }
      } else {
        checkCount = 0;
      }

      var nextImage = image + 1;
      checkImage(nextImage);
    }
  );
}