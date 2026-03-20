#!/bin/bash
# Wrapper script to start OSD with correct Node version

source ~/.nvm/nvm.sh
nvm use 22
exec yarn start "$@"
