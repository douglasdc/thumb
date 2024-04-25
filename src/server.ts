import { Hono } from "hono";
import { serve } from "@hono/node-server";
import { run } from "./worker";

const app = new Hono();

app.get("/", async (c) => {
    const file = c.req.query("file");

    if (file) {
        await run(file!);
    } else {
    }

    return c.text(`file: ${file}`);
});

serve({
    fetch: app.fetch,
    port: 3300,
});
