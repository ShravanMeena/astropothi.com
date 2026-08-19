#!/bin/bash
# Run the whole suite N times and report any run that differs.
#
# Flakiness is invisible in a single green run: the pilot test generated a phone
# from $RANDOM and truncated it, so it passed or failed by luck for several
# sessions. This surfaces that class of defect.
N=${1:-8}
cd "$(dirname "$0")/.."
mkdir -p /tmp/pothi-loop && rm -f /tmp/pothi-loop/*
pass=0; fail=0
declare -a FAILED
for i in $(seq 1 "$N"); do
  out=/tmp/pothi-loop/run$i.log
  if npm test > "$out" 2>&1; then
    printf "  run %-2s ✓\n" "$i"; pass=$((pass+1))
  else
    printf "  run %-2s ✗\n" "$i"; fail=$((fail+1)); FAILED+=("$i")
  fi
done
echo
echo "  $pass/$N green, $fail red"
if [ "$fail" -gt 0 ]; then
  echo "  first failing assertions:"
  for i in "${FAILED[@]}"; do grep -m3 -E "✗|Error|failed" "/tmp/pothi-loop/run$i.log" | sed "s/^/    run $i: /"; done
fi
# Non-determinism even among green runs: compare the numeric fingerprints.
echo
echo "  variance across green runs (should be identical):"
for i in $(seq 1 "$N"); do
  f=/tmp/pothi-loop/run$i.log
  [ -f "$f" ] || continue
  grep -oE "[0-9]+ invariants held|[0-9]+ passed|median|[0-9]+w" "$f" 2>/dev/null | tr '\n' ' '
  echo "  <- run $i"
done | sort | uniq -c | sed 's/^/    /'
exit $((fail>0))
