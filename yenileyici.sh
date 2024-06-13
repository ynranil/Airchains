#!/bin/bash

# Renk kodları
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Log dosyası
LOG_FILE="restart_tracksd.log"

# Döngü içinde çalışan komut
while true; do
    # Zaman damgası
    TIMESTAMP=$(date +"%Y-%m-%d %H:%M:%S")
    
    # tracksd servisini yeniden başlat
    if sudo systemctl restart tracksd; then
        # Başarı durumunda çıktı ve log
        echo -e "${GREEN}Komut çalıştı saat: ${YELLOW}${TIMESTAMP}${NC}"
        echo "${TIMESTAMP} - tracksd restart successful" >> $LOG_FILE
    else
        # Hata durumunda çıktı ve log
        echo -e "${RED}Komut başarısız oldu saat: ${YELLOW}${TIMESTAMP}${NC}"
        echo "${TIMESTAMP} - tracksd restart failed" >> $LOG_FILE
    fi
    
    # Journalctl komutunu renkli bir şekilde öner
    echo -e "${GREEN}Verileri kontrol et: ${NC}${YELLOW}sudo journalctl -u tracksd -fo cat${NC}"
    
    # 15 dakika bekle
    sleep 900
done
