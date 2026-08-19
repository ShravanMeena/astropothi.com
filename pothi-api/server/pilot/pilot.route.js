import { Router } from "express";
import * as Pilot from "./pilot.service.js";
import { ok, h } from "../../utilities/http.js";

export function noAuth() {
  const r = Router();
  // Public so the login screen can show how many seats are left.
  r.get("/status", h(async (req, res) => ok(res, await Pilot.status())));
  return r;
}
