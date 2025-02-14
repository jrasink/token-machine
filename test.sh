#!/bin/sh

nreqs=100
pids=""
t0=$(date +%s)

run()
{
  curl -s -o /dev/null localhost:1337
  echo "Got response $(($1)) at t = $(($(date +%s)-$t0))s"
}

echo "Sending $((nreqs)) requests..."

for i in $(seq 0 $nreqs); do
  run i &
  p=$!
  pids="${pids} ${p}"
done

echo "All requests underway, now we wait.\n---"

for p in $pids; do
  wait $p
done

echo "---\nAll responses received, cheers."
