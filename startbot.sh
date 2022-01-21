#!/usr/bin/bash

nohup ts-node index.ts > botlog.txt 2>&1 </dev/null &
touch $!
