import { useState, useRef } from "react";
import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile } from "@ffmpeg/util";

function Converter() {
    const [loaded, setLoaded] = useState(false);
    const [fileError, setFileError] = useState("");
    const [selectedFile, setSelectedFile] = useState(null);
    const ffmpegRef = useRef(new FFmpeg());
    const videoRef = useRef(null);
    const messageRef = useRef(null);
    const allowedTypes = ["video/mp4", "video/mkv", "video/avi", "video/mov", "video/webm", "video/mpeg"];
    const sizeUnti = 1024 * 1024 * 1024; // 1 Gb
    const limit = 2;
    const maxSize = limit * sizeUnti; // 2 Gb
    const fpsLimit = "30";

    const load = async () => {
        const ffmpeg = ffmpegRef.current;
        ffmpeg.on('progress', ({ progress, time }) => {
            const progressPercentage = (progress * 100).toFixed(2); // Format progress to 2 decimal places
            const transcodedTime = (time / 1000000).toFixed(2); // Format time to 2 decimal places
            messageRef.current.innerHTML = `${progressPercentage} % (transcoded time: ${transcodedTime} s)`;
        });
        
        await ffmpeg.load({
        });
        setLoaded(true);
    }

    const handleFileChange = (event) => {
        const file = event.target.files[0];
        if (!file) {
            setFileError("No file selected.");
            return;
        }
        if (!allowedTypes.includes(file.type)) {
            setFileError("Unsupported file type. Please select a valid video file.");
            return;
        }
        if (file.size > maxSize) {
            setFileError("File size exceeds " + {maxSizeGb: limit}+ "GB. Please select a smaller file.");
            return;
        }

        setSelectedFile(file);
        setFileError("");
    };

    const transcode = async () => {
        const outputFileName = "output.mp4";
        if (!selectedFile) {
            setFileError("Please select a valid file before transcoding.");
            return;
        }

        const ffmpeg = ffmpegRef.current;
        // Load the file content into FFmpeg
        await ffmpeg.writeFile("input.file", await fetchFile(selectedFile));
        // Define FFmpeg conversion command
        const command = [
            "-i", "input.file", // Input file in FFmpeg's virtual file system
            "-vf", "scale=-1:720", // Preserve aspect ratio, scale height to 720
            "-b:v", "2500k", // Set video bitrate
            "-r", fpsLimit, // Set frame rate
            outputFileName
          ];
           // Execute the command
        await ffmpeg.exec(command);
        // Read the output file
        const data = await ffmpeg.readFile(outputFileName);
        // Create a URL for the converted video and assign it to the video element
        videoRef.current.src = URL.createObjectURL(new Blob([data.buffer], { type: "video/mp4" }));
    };

    return (    
        <div>
            <h2>Video Converter</h2>
            {loaded ? (
                <>
                    <input type="file" accept={allowedTypes.join(", ")} onChange={handleFileChange} />
                    {fileError && <p style={{ color: "red" }}>{fileError}</p>}
                    <video ref={videoRef} controls></video>
                    <br />
                    <button onClick={transcode} disabled={!selectedFile}>Transcode to mp4</button>
                    <p ref={messageRef}></p>
                    <p>Open Developer Tools (Ctrl+Shift+I) to View Logs</p>
                </>
            ) : (
                <>
                    <h3>You can convert video up to {limit} Gbs and for the following types: {allowedTypes.join(", ").replaceAll('video/', '')}</h3>
                    <h3>The result video will be 720p@{fpsLimit}fps</h3>
                    <button onClick={load}>Go to converter</button>
                </>
            )}
        </div>
    );
    
}

export default Converter;