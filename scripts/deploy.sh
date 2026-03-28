#!/bin/bash

ZIP_FILE=".output/hustle-hub-0.0.0-chrome.zip"
TEMP_DIR=".output/hustle-hub-temp"
DEST_DIR="$HOME/Desktop/hustle-hub"

echo "Running yarn zip..."
yarn zip

echo "Unzipping $ZIP_FILE to $TEMP_DIR..."
mkdir -p "$TEMP_DIR"
unzip -q "$ZIP_FILE" -d "$TEMP_DIR"

if [ -d "$DEST_DIR" ]; then
    echo "Removing existing folder at $DEST_DIR..."
    rm -rf "$DEST_DIR"
fi
echo "Moving unzipped content to $DEST_DIR..."
mv "$TEMP_DIR" "$DEST_DIR"

echo "Deleting zip file $ZIP_FILE..."
rm -f "$ZIP_FILE"

echo "Done."
