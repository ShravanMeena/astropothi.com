import { Select } from "./Picker";

/**
 * The Vastu subject: a building, not a person.
 *
 * Every field except the facing is optional, and "not sure" is a first-class
 * answer — the report says nothing about a room you did not record rather than
 * guessing, so an honest blank is better than a wrong direction.
 */
export const DIRECTIONS = [
  { value: "", label: "Not sure" },
  { value: "N", label: "North" },
  { value: "NE", label: "North-East" },
  { value: "E", label: "East" },
  { value: "SE", label: "South-East" },
  { value: "S", label: "South" },
  { value: "SW", label: "South-West" },
  { value: "W", label: "West" },
  { value: "NW", label: "North-West" },
  { value: "C", label: "Centre of the house" }
];

export const ROOMS = [
  { key: "entrance",       label: "Main entrance",  hint: "the door you use every day" },
  { key: "kitchen",        label: "Kitchen",        hint: "where the flame is" },
  { key: "master_bedroom", label: "Master bedroom", hint: "" },
  { key: "pooja",          label: "Pooja room",     hint: "or the shelf, if there is no room" },
  { key: "toilet",         label: "Toilet",         hint: "the main one" },
  { key: "water",          label: "Water source",   hint: "tank, borewell or main tap" },
  { key: "staircase",      label: "Staircase",      hint: "" },
  { key: "store",          label: "Store room",     hint: "" }
];

export type VastuValue = { facing: string; property_type: string; rooms: Record<string, string> };

export default function VastuForm({ value, onChange, facingError }: {
  value: VastuValue; onChange: (v: Partial<VastuValue>) => void; facingError?: string;
}) {
  const setRoom = (k: string, v: string) =>
    onChange({ rooms: { ...value.rooms, [k]: v } });

  return (
    <>
      <div className="grid sm:grid-cols-2 gap-5">
        <div id="field-facing" className="scroll-mt-28">
          <label className="label">
            Which way does it face <span className="text-faint font-normal">the main entrance</span>
          </label>
          <div className={facingError
            ? "[&_.field]:border-ember [&_.field]:ring-4 [&_.field]:ring-ember/15" : ""}>
            <Select value={value.facing} ariaLabel="Facing direction"
                    onChange={(v) => onChange({ facing: v })}
                    options={DIRECTIONS.filter((d) => d.value && d.value !== "C")} />
          </div>
          {facingError
            ? <p className="mt-1.5 text-[12.5px] text-ember" role="alert">{facingError}</p>
            : <p className="mt-1.5 text-[12px] text-faint">
                Stand inside the door looking out — that is the facing.
              </p>}
        </div>
        <div>
          <label className="label">What is it</label>
          <Select value={value.property_type} ariaLabel="Property type"
                  onChange={(v) => onChange({ property_type: v })}
                  options={[{ value: "home", label: "Independent house" },
                            { value: "flat", label: "Flat or apartment" },
                            { value: "shop", label: "Shop or office" },
                            { value: "plot", label: "Empty plot" }]} />
        </div>
      </div>

      <div className="rounded-[3px] border border-line bg-sunken p-5 sm:p-6">
        <p className="caps text-brass">Where things sit</p>
        <p className="text-[13px] text-muted mt-2 leading-relaxed">
          Answer what you know. Anything left as <em>Not sure</em> is simply left out of the
          report — it will not be guessed at.
        </p>
        <div className="grid sm:grid-cols-2 gap-4 mt-5">
          {ROOMS.map((r) => (
            <div key={r.key}>
              <label className="label">
                {r.label}{r.hint && <span className="text-faint font-normal"> — {r.hint}</span>}
              </label>
              <Select value={value.rooms[r.key] ?? ""} ariaLabel={r.label}
                      onChange={(v) => setRoom(r.key, v)} options={DIRECTIONS} />
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
