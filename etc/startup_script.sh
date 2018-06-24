#!/bin/bash

set -e
set -o pipefail

INDEX=$1

if [ -z "$INDEX" ]; then
	echo "usage: $0 <index_path>" | tee -a /var/log/snatch.log
	exit 1
fi

echo "$(date) startup" | tee -a /var/log/snatch.log

iptables -A PREROUTING -t nat -p tcp --dport 80 -j REDIRECT --to-ports 8080
iptables -A PREROUTING -t nat -p tcp --dport 443 -j REDIRECT --to-ports 8080

screen -dm bash -c "set -x; nodemon --delay 1 $INDEX; exec sh"

echo "$(date) success" | tee -a /var/log/snatch.log
