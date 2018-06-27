#!/bin/bash

if [ "$EUID" -ne 0 ]; then
  echo "must run as root"
  exit 1
fi

set -e
set -x
set -o pipefail

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# install nodejs
curl -sL https://deb.nodesource.com/setup_8.x | bash -
apt-get install -y nodejs
( cd $DIR/app && npm install )

# server service
cat <<END > /etc/systemd/system/cheat.service
[Unit]
Description=starts cheat server
After=local-fs.target
Wants=local-fs.target

[Service]
ExecStart=/usr/bin/node $DIR/app/index.js
Type=simple

[Install]
WantedBy=multi-user.target

END
systemctl daemon-reload
systemctl enable cheat

# cheat cmd
apt-get install -y jq
ln -s $DIR/cheat.sh /usr/local/bin/cheat

# build trie
echo
echo "python $DIR/../buildTrie.py $DIR/../../public/words/sowpods.json $DIR/app/trie.json"

echo
echo "alternatively"
echo "gcloud compute scp trie.json.gz cheat:$DIR/app/trie.json.gz && gzip -k -d $DIR/app/trie.json.gz"

systemctl start cheat
