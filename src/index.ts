import os from "os";
import fs from "fs";
import { spawn } from "child_process";
import { isMainThread, workerData, parentPort } from "worker_threads";

const DEFAULT_THUMB_SIZE = [32, 64];

type ScaleOutput = {
    size: number;
    buffer: Buffer;
};

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

        //parentPort?.postMessage(args.join(" "));

        return args;
    }

    run(): Promise<ScaleOutput> {
        return new Promise((resolve, reject) => {
            const t1 = Date.now();
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
                    parentPort?.postMessage(`exit in: ${Date.now() - t1}`);
                    resolve({
                        size: this.scale,
                        buffer: Buffer.concat(buffer),
                    });
                }
            });

            if (this.input instanceof Uint8Array) {
                a.stdin.write(this.input);
                a.stdin.end();
            }
        });
    }
}

function scale(input: Buffer, size: number): Promise<ScaleOutput> {
    return new Promise(async (resolve, reject) => {
        try {
            const script = new FfmpegBuilder(input, size);
            const output = await script.run();

            //fs.writeFileSync(
            //    `${process.cwd()}/thumb_${size}_${size}.jpg`,
            //    output,
            //);

            resolve(output);
        } catch (e) {
            reject(e);
        }
    });
}

type RunOptions = {
    file: Buffer | string;
    sizes?: number[];
};

export async function createThumbs(params: RunOptions) {
    const sizes = params.sizes || DEFAULT_THUMB_SIZE;

    try {
        const script128 = new FfmpegBuilder(params.file, 128, 128);

        const buffer128: ScaleOutput = await script128.run();
        console.log("dasdsa");

        const jobs: Promise<ScaleOutput>[] = [];

        sizes.forEach((size) => {
            jobs.push(scale(buffer128.buffer, size));
        });

        const smallThumbs: ScaleOutput[] = await Promise.all(jobs);

        console.log("???");

        return [buffer128, ...smallThumbs];

        //fs.writeFileSync(`${process.cwd()}/thumb_128_128.jpg`, buffer128);
    } catch (e) {
        console.log(e);
    }
}

if (!isMainThread) {
    parentPort?.postMessage("dasdsadsa");
    const file: string = workerData.file;
    createThumbs({ file: file });
}

//createThumbs({ file: `${process.cwd()}/samples/1280x720_71MB.mp4` });
