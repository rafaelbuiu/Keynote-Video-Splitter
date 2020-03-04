// Import dependencies
const Jimp = require("jimp");
const fs = require("fs-extra");
const util = require("util");
var looksSame = require('looks-same');
const moveFile = require('move-file');

const exec = util.promisify(require("child_process").exec);

const debug = false;
const videoEncoder = "h264"; // mpeg4 libvpx
const input = "input2.mp4";
const output = "output.mp4";

var lastCheck = false;
var prevImage = 0;
var lastImage;
var totalImages = 0;
var checkCount = 0;
var imageCollection = [];

(async function () {

    try {

        console.log("Initializing temporary files");

        try {
            await fs.remove("temp");
        } catch(err){}
        await fs.mkdir("temp");
        await fs.mkdir("temp/raw-frames");
        await fs.mkdir("temp/edited-frames");

        console.log("Decoding");
        await exec(`ffmpeg -i ${input} -r 30 temp/raw-frames/%d.png`);

        // console.log("Rendering");
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

async function checkImage(image){

    if(image > totalImages) return;

    lastImage = image - 1
    var imageLast = `temp/raw-frames/${lastImage}.png`;
    var imageCurrent = `temp/raw-frames/${image}.png`;

    looksSame(imageCurrent, imageLast, {tolerance:7, ignoreAntialiasing: true, antialiasingTolerance: 9}, function(error, {equal}) {
        if(error){
            console.log(error);
            return;
        }

        console.log("checking " + checkCount , imageLast, imageCurrent, equal, lastCheck)

        if(equal){
            checkCount++;
            if(checkCount == 61) {
                checkCount = 0
                var newPath = imageLast.replace("raw","edited");
                moveFile(imageLast, newPath);
            }
        } else {
            checkCount = 0;
        }
        

        var nextImage = image + 1
        checkImage(nextImage)
    });
}

async function onFrame(frame, frameCount) {

    // if (frameCount < 5) {

    //     frame = new Jimp(frame.bitmap.width, frame.bitmap.height, 0xff0000ff, (err, image) => { });

    // } else {

    //     // Add text
    //     const font = await Jimp.loadFont(Jimp.FONT_SANS_32_WHITE);
    //     frame.print(font, 0, 0, `Frame Count: ${frameCount}`);

    //     // Manual manipulation
    //     frame.scan(0, 0, frame.bitmap.width, frame.bitmap.height, function (x, y, idx) {

    //         // Get the colors
    //         const red = this.bitmap.data[idx + 0];
    //         const green = this.bitmap.data[idx + 1];
    //         const blue = this.bitmap.data[idx + 2];
    //         const alpha = this.bitmap.data[idx + 3];

    //         // If x is less than y
    //         if (x < y) {

    //             // Set the blue channel to 255
    //             this.bitmap.data[idx + 2] = 255;

    //         }

    //     });

    // }

    return frame;
}