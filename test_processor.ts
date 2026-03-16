import { processBatch } from "./utils/processor.ts";

const rawData = JSON.parse(await Deno.readTextFile("./kontekst/partner_export_dirty.json"));
const cleaned = processBatch(rawData);

console.log(JSON.stringify(cleaned, null, 2));
