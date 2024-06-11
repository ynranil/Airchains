#!/bin/bash

# Renk kodları
RED='\033[0;31m'
GREEN='\033[0;32m'
NC='\033[0m' # No Color

# Ctrl+C ile manuel durdurma
trap 'echo -e "\n${RED}Betiği durdurdunuz: $(date)${NC}"; exit' SIGINT

# Betiğin 5 dakikada bir çalışmasını sağlayan döngü
while true; do
  echo -e "${GREEN}##############################################${NC}"
  echo -e "${GREEN}# Komut çalıştırılıyor: $(date)${NC}"
  echo -e "${GREEN}##############################################${NC}"
  
  # Komutu çalıştır ve 5 dakika sonra durdur
  timeout 5m ./tracks start
  
  echo -e "${RED}##############################################${NC}"
  echo -e "${RED}# Komut durduruldu: $(date)${NC}"
  echo -e "${RED}##############################################${NC}"
  
  # 5 dakika bekle ve döngüyü tekrar başlat
  sleep 360
done
