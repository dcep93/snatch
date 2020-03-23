# Snatch

## On Cheat Server
run `journalctl -u cheat.service` to see logs
machine should have 16GB memory

### install git
`sudo apt install -y git-all`
### clone this repo
`git clone https://github.com/dcep93/snatch`

[`./setup.sh`](setup.sh)
[`etc/cheat/setup.sh`](etc/cheat/setup.sh)

dont forget to build the trie (takes 20 min)

## on redeploy
### On Cheat Server
  - [create service account](https://console.cloud.google.com/iam-admin/serviceaccounts?folder&organizationId)
  - need a service account with compute admin (I think)
### On Socket Games Server
  - run [`etc/cheat/setup_heartbeat.sh <key_file>`](etc/cheat/setup_heartbeat.sh)

