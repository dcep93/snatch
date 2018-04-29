#! /bin/bash

set -e

args=()
while [[ $# -gt 0 ]]; do
	var="$1"
	if [[ $var == -* ]]; then
		[[ $var == -l ]] || (echo "invalid arg: $var" >&2 && exit 1)
		letters="$2"
		shift
	else
		args+=("$var")
	fi
	shift
done
set -- "${args[@]}"

words=$(printf '%s\n' "$@" | jq -R . | jq -cs .)

if [[ -z $letters ]]; then
	data="{\"words\": $words}"
else
	data="{\"words\": $words, \"letters\": \"$letters\"}"
fi

curl cheat:8000 -X POST -H "Content-Type: application/json" -d "$data"
