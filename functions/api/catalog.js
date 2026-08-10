import { CATALOG } from "../_shared/catalog.js";
import { corsHeaders, json } from "../_shared/cors.js";

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: corsHeaders });
}

export async function onRequestGet() {
  return json({ items: CATALOG, count: CATALOG.length, service: "Nura Catalog API" });
}
