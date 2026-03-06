import PQueue from "p-queue";

export const reportQueue = new PQueue({ concurrency: 1 });
