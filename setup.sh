#!/bin/bash
# Bash setup script for Quista App

pip install -r backend/requirements.txt

while read model; do
  ollama pull "$model"
done < ollama-models.txt 