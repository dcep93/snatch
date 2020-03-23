#!/bin/bash

exec &> >(tee -a /var/log/snatch.log)

MACHINE=$(cat /var/log/cheat_machine.txt)
echo "$(date) $(whoami) $MACHINE kill"
gcloud compute instances stop "$MACHINE"
code=$?
echo "$(date) $code killed"
echo
