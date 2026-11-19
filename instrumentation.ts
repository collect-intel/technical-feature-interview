// Runs once when the Next.js server starts: open the database and start the job worker.
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { startBackground } = await import("./server/app.ts");
    startBackground();
  }
}
