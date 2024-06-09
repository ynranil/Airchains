#!/bin/bash

# Betiğin 5 dakikada bir çalışmasını sağlayan döngü
while true; do
  echo "Komut çalıştırılıyor: $(date)"
  
  # Komutu çalıştır ve 5 dakika sonra durdur
  timeout 5m ./tracks start
  
  echo "Komut durduruldu: $(date)"
  
  # 5 dakika bekle ve döngüyü tekrar başlat
  sleep 300
done
