#!/bin/bash

if [ "$1" != "" ]; then
    cd src
    filename="$1.zip"
    echo "Packing for version $1"
    zip -r ../release/$filename . -x "*.DS_Store"
else
    echo "Usage: $0 version_number"
fi