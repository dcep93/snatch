#! /bin/bash

if [ "$EUID" -ne 0 ]; then
  echo "must run as root"
  exit 1
fi

set -e
set -x
set -o pipefail

KEY_FILE=$1
CHEAT_MACHINE=$2

if [ -z "$KEY_FILE" || -z "$CHEAT_MACHINE" ]; then
	echo "usage: $0 <key_file> <cheat_machine>"
	exit 1
fi

exec &> >(tee -a /var/log/snatch.log)

echo "$0 $(date)"

PROJECT_ID=$(grep '  "project_id":' $KEY_FILE | awk -F '"' '{print $4}')

gcloud auth activate-service-account --key-file=$KEY_FILE

gcloud config set project $PROJECT_ID

INSTANCE_CONFIG=$(gcloud compute instances list | sed -n 2p)

ZONE=$(echo $INSTANCE_CONFIG | awk '{print $2}')
gcloud config set compute/zone $ZONE

IP=$(echo $INSTANCE_CONFIG | awk '{print $5}')
echo "$IP  cheat" >> /etc/hosts

echo "$CHEAT_MACHINE" > /var/log/cheat_machine.txt

gcloud compute firewall-rules create cheat --rules tcp:8000 --source-ranges 0.0.0.0/0 --action allow
