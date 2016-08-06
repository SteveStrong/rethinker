#!/bin/bash
# reset containers
bash dockerreset.sh
# Delete all images
docker rmi $(docker images -q)