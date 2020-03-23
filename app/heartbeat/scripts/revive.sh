#!/bin/bash

exec &> >(tee -a /var/log/snatch.log)

MACHINE=$(cat /var/log/cheat_machine.txt)
echo "$(date) $(whoami) $MACHINE revive"
gcloud compute instances start "$MACHINE"
code=$?
echo "$(date) $code revived"
echo
