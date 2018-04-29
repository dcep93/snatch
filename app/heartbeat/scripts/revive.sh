#!/bin/bash

exec &> >(tee -a /var/log/snatch.log)

echo "$(date) revive $(whoami)"
gcloud compute instances start instance-1
code=$?
echo "$(date) $code revived"
echo
