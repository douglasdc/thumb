import os from "os";
import fs from "fs";
import { spawn } from "child_process";
import { rejects } from "assert";

function mergeArrays(one: Uint8Array, two: Uint8Array) {
  const temp = new Uint8Array(one.length + two.length);
  temp.set(one);
  temp.set(two, one.length);

  return temp;
}

const args128 = [
  "-i",
  `${import.meta.dir}/sample_1280x720.mp4`,
  "-frames:v",
  "1",
  "-q:v",
  "0",
  "-vf",
  "scale=w='if(gte(ih, iw), 128, -1)':h='if(gte(iw, ih), 128, -1)',crop=128:128",
  "-f",
  "image2",
  "pipe:1",
];

const args64 = ["-i", `-`, "-frames:v", "1", "-q:v", "0", "-vf", "scale=64:64", "-f", "image2", "pipe:1"];

const args32 = ["-i", `-`, "-frames:v", "1", "-q:v", "0", "-vf", "scale=32:32", "-f", "image2", "pipe:1"];

class FfmpegBuilder {
  input: string | Buffer;
  scale: number;
  crop?: number;

  constructor(input: string | Buffer, scale: number, crop?: number) {
    this.input = input;
    this.crop = crop;
    this.scale = scale;
  }

  private script() {
    const args = ["-i"];

    if (typeof this.input === "string") {
      args.push(this.input);
    } else {
      args.push("-");
    }

    args.push("-frames:v", "1", "-q:v", "0", "-vf");

    let process = `scale=w='if(gte(ih, iw), ${this.scale}, -1)':h='if(gte(iw, ih), ${this.scale}, -1)'`;

    if (this.crop) {
      process += `,crop=${this.crop}:${this.crop}`;
    }

    args.push(process, "-f", "image2", "pipe:1");

    return args;
  }

  run(onComplete: (buffer: Buffer) => void, onError: (error: string) => void) {
    console.log(this.script());
    const a = spawn("ffmpeg", this.script(), { cwd: os.tmpdir() });

    let buffer: Uint8Array[] = [];
    const bufferError: any[] = [];

    a.stdout.on("data", (data) => {
      buffer.push(data);
    });

    a.stderr.on("data", (err) => {
      bufferError.push(err);
    });

    a.on("exit", (code) => {
      if (code !== 0) {
        onError(Buffer.concat(bufferError).toString().trim());
      } else {
        onComplete(Buffer.concat(buffer));
      }
    });

    if (this.input instanceof Uint8Array) {
      a.stdin.write(this.input);
      a.stdin.end();
    }
  }
}

//function run(script: FfmpegBuilder , onComplete: (buffer: Uint8Array) => void, onError: (error: string) => void) {
//    const a = spawn("ffmpeg", script.script(), { cwd: os.tmpdir() });
//
//    let buffer = new Uint8Array();
//    const bufferError: any[] = [];
//
//    a.stdout.on("data", (data) => {
//      buffer = mergeArrays(buffer, data);
//    });
//
//    a.stderr.on("data", (err) => {
//      bufferError.push(err);
//    });
//
//    a.on("exit", (code) => {
//      if (code !== 0) {
//        onError(Buffer.concat(bufferError).toString().trim());
//      } else {
//        onComplete(buffer);
//      }
//    });
//}

function ex() {
  return new Promise((resolve, reject) => {
    const a = spawn("ffmpeg", args128, { cwd: os.tmpdir() });

    let buffer = new Uint8Array();
    const bufferError: any[] = [];

    a.stdout.on("data", (data) => {
      buffer = mergeArrays(buffer, data);
    });

    a.stderr.on("data", (err) => {
      bufferError.push(err);
    });

    a.on("exit", (code, signal) => {
      if (code !== 0) {
        reject(new Error(Buffer.concat(bufferError).toString().trim()));
      } else {
        resolve(buffer);
      }
    });
  });
}

function ex2(input: Uint8Array) {
  return new Promise((resolve, reject) => {
    const args = [
      "-i",
      "-",
      "-frames:v",
      "1",
      "-q:v",
      "0",
      "-vf",
      "scale=64:64",
      "-f",
      "image2",
      `${import.meta.dir}/teste.jpg`,
    ];
    const a = spawn("ffmpeg", args, { cwd: os.tmpdir() });

    const buffer: any[] = [];
    const bufferError: any[] = [];

    a.stdout.on("data", (data) => {
      buffer.push(data);
    });

    a.stderr.on("data", (err) => {
      bufferError.push(err);
    });

    a.on("exit", (code, signal) => {
      console.log(`Exited with ${code}:${signal}`);
      if (code !== 0) {
        reject(new Error(Buffer.concat(bufferError).toString().trim()));
      } else {
        resolve(Buffer.concat(buffer));
      }
      console.log("b", buffer);
    });

    a.stdin.write(input);
    a.stdin.end();
  });
}

console.time("RUN TIME");

function onError(error: string) {
  console.log(error);
}

function scale32(buffer: Buffer) {
  const script = new FfmpegBuilder(buffer, 32);
  script.run((buffer) => {
    console.log(buffer);
    fs.writeFileSync(`${import.meta.dir}/thumb_32x32.jpg`, buffer);
  }, onError);
}

function scale64(buffer: Buffer) {
  const script = new FfmpegBuilder(buffer, 64);
  script.run((buffer) => {
    scale32(buffer);
    fs.writeFileSync(`${import.meta.dir}/thumb_64x64.jpg`, buffer);
  }, onError);
}

function scale128() {
  return new Promise((resolve, reject) => {
    const script = new FfmpegBuilder(`${import.meta.dir}/sample_1280x720.mp4`, 128, 128);
    script.run((buffer) => {
      scale64(buffer);
      fs.writeFileSync(`${import.meta.dir}/thumb_128x128.jpg`, buffer);
      resolve(null);
    }, onError);
  });
}

await scale128();

// const b = await ex();
// console.log(b);
//import fs from "fs";
//fs.writeFileSync(`${import.meta.dir}/thumb.jpg`, b);
// console.log("b", b);
//await ex2(b);

console.timeEnd("RUN TIME");
