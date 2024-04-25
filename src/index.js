import os from "os";
import { spawn } from "child_process";
import { isMainThread, workerData } from "worker_threads";

const DEFAULT_THUMB_SIZE = [32, 64];

class FfmpegBuilder {
    id;
    input;
    scale;
    crop;

    constructor(input, scale, crop) {
        this.id = workerData.id;
        this.input = input;
        this.crop = crop;
        this.scale = scale;
    }

    script() {
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

    run() {
        return new Promise((resolve, reject) => {
            const a = spawn("ffmpeg", this.script(), { cwd: os.tmpdir() });

            let buffer = [];
            const bufferError = [];

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
                    if (this.scale === 128) {
                        //parentPort.postMessage(
                        //    `${this.id} - ${this.scale}: ${Date.now() - t1}`,
                        //);
                    }
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

function scale(input, size) {
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

export async function createThumbs(params) {
    const sizes = params.sizes || DEFAULT_THUMB_SIZE;

    try {
        const script128 = new FfmpegBuilder(params.file, 128, 128);

        console.time(`RUN ${script128.id}`);

        const buffer128 = await script128.run();

        const jobs = [];

        sizes.forEach((size) => {
            jobs.push(scale(buffer128.buffer, size));
        });

        const smallThumbs = await Promise.all(jobs);

        console.timeEnd(`RUN ${script128.id}`);

        return [buffer128, ...smallThumbs];
    } catch (e) {
        console.log(e);
    }
}

if (!isMainThread) {
    createThumbs({ file: workerData.file }).then((c) => { });
}
