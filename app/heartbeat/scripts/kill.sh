#!/bin/bash

exec &> >(tee -a /var/log/snatch.log)

echo "$(date) kill $(whoami)"
gcloud compute instances stop instance-1
code=$?
echo "$(date) $code killed"
echo
