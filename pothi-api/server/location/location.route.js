import { Router } from "express";
import * as Loc from "./location.service.js";
import { ok, h } from "../../utilities/http.js";

export function noAuth() {
  const r = Router();
  r.get("/autocomplete", h(async (req, res) => ok(res, await Loc.autocomplete(req.query.q))));
  r.get("/geocode", h(async (req, res) =>
    ok(res, await Loc.geocode({ placeId: req.query.placeId, address: req.query.address }))));
  r.get("/mode", (req, res) => ok(res, { mode: Loc.mode() }));
  return r;
}
