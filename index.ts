import os from "os";
import fs from "fs";
import { spawn } from "child_process";
import * as path from "path";

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

  run(): Promise<Buffer> {
    return new Promise((resolve, reject) => {
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
          reject(Buffer.concat(bufferError).toString().trim());
        } else {
          resolve(Buffer.concat(buffer));
        }
      });

      if (this.input instanceof Uint8Array) {
        a.stdin.write(this.input);
        a.stdin.end();
      }
    });
  }
}

console.time("RUN TIME");

async function scale(input: Buffer, size: number): Promise<null> {
  return new Promise(async (resolve, reject) => {
    try {
      const script = new FfmpegBuilder(input, size);
      const output = await script.run();

      fs.writeFileSync(`${process.cwd()}/thumb_${size}_${size}.jpg`, output);

      resolve(null);
    } catch (e) {
      reject(e);
    }
  });
}

async function makeThumbs(buffer: Buffer, sizes: number[]) {
  const jobs: Promise<null>[] = [];

  sizes.forEach((size) => {
    jobs.push(scale(buffer, size));
  });

  await Promise.all(jobs);
}

try {
  console.time("128");
  const script128 = new FfmpegBuilder(`${process.cwd()}/sample_1280x720.mp4`, 128, 128);
  console.log(process.cwd());
  const buffer128 = await script128.run();

  console.timeEnd("128");

  await makeThumbs(buffer128, [64, 32]);

  fs.writeFileSync(`${process.cwd()}/thumb_128_128.jpg`, buffer128);
} catch (e) {
  console.log(e);
}

console.timeEnd("RUN TIME");
