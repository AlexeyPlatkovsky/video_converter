import React, { useState } from "react";
import { createFFmpeg, fetchFile } from '@ffmpeg/ffmpeg';
import { saveAs } from "file-saver";

const VideoConverter = () => {
  const [file, setFile] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [outputUrl, setOutputUrl] = useState("");
  // const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd';
  const baseURL = '/ffmpeg';

  const ffmpeg = createFFmpeg({
    log: true,
  });

  const allowedTypes = ["video/mp4", "video/mkv", "video/avi", "video/mov", "video/webm", "video/mpeg"];
  const maxSize = 2 * 1024 * 1024 * 1024; // 2GB

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (!allowedTypes.includes(selectedFile.type)) {
        alert("Unsupported file type. Please upload a valid video file.");
        return;
      }
      if (selectedFile.size > maxSize) {
        alert("File size exceeds 2GB. Please upload a smaller file.");
        return;
      }
      setFile(selectedFile);
    }
  };

  const processVideo = async () => {
    if (!file) {
      alert("No video selected!");
      return;
    }

    setProcessing(true);
    if (!ffmpeg.isLoaded()) {
      await ffmpeg.load();
    }

    try {
      ffmpeg.writeFile("writeFile", file.name, await fetchFile(file));
      const outputFileName = "output.mp4";
      const command = [
        "-i", file.name,
        "-vf", "scale=-1:1080", // Preserve aspect ratio, scale height to 1080
        "-b:v", "5000k", // Set video bitrate
        "-r", "60", // Set frame rate
        outputFileName
      ];

      await ffmpeg.exec(command);
      const fileData = await ffmpeg.readFile(outputFileName);
      const data = new Uint8Array(fileData);
      const url = URL.createObjectURL(new Blob([data.buffer], { type: "video/mp4" }));
      setOutputUrl(url);
      alert("Video processed successfully!");
    } catch (error) {
      console.error("Error during video processing:", error);
      alert("Video processing failed.");
    } finally {
      setProcessing(false);
    }
  };

  const saveVideo = () => {
    if (outputUrl) {
      saveAs(outputUrl, "converted_video.mp4");
    } else {
      alert("No video to save!");
    }
  };

  return (
    <div>
      <h2>Video Converter</h2>
      <input type="file" accept={allowedTypes.join(", ")} onChange={handleFileChange} />
      <button onClick={processVideo} disabled={!file || processing}>
        {processing ? "Processing..." : "Convert Video"}
      </button>
      {outputUrl && (
        <>
          <video src={outputUrl} controls width="600"></video>
          <button onClick={saveVideo}>Save As</button>
        </>
      )}
    </div>
  );
};

export default VideoConverter;