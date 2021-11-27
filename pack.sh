#!/bin/bash
function usage() {
    echo "Usage: $0 [version_number]"
}

if [ "$1" != "" ]; then
    PACKAGE_VERSION=$1
else
    PACKAGE_VERSION=v$(cat src/manifest.json \
    | grep version \
    | grep -v manifest \
    | awk -F: '{print $2}' \
    | sed 's/[ ",]//g')
fi

filename="$PACKAGE_VERSION.zip"
echo "Packing for version $PACKAGE_VERSION"
OUTPUT_DIR='release'
if [ ! -d $OUTPUT_DIR ]; then
    mkdir -p $OUTPUT_DIR
fi
zip -r $OUTPUT_DIR/$filename ./src -x "*.DS_Store"
cp $OUTPUT_DIR/$filename $OUTPUT_DIR/latest.zip