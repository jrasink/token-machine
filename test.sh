#!/bin/sh

# this will send 10 requests sequentially, waiting 100ms in between
# simulate multiple consumers by running this script multiple times in parallel

t0=$(date +%s)
for run in {1..10}; do
  sleep .1
  echo "request $((run)) at t = $(($(date +%s)-$t0))s"
  curl -s -o /dev/null localhost:1337
  echo "response $((run)) at t = $(($(date +%s)-$t0))s"
done
