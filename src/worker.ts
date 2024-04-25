import { Worker } from "worker_threads";

const threads = new Set<Worker>();
let nThreads = 0;

export function run(file: string) {
    return new Promise((resolve, reject) => {
        const thread = new Worker("./src/index.js", {
            workerData: {
                file,
                id: threads.size + 1,
            },
        });

        thread.on("error", (err) => {
            console.log(err);
            reject(err);
        });

        thread.on("exit", (a) => {
            threads.delete(thread);
            resolve(null);
        });

        thread.on("message", (msg) => {
            console.log(msg);
        });

        threads.add(thread);
    });
}
