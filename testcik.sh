#!/bin/bash

# Telegram API bilgileri
BOT_TOKEN="7112280532:AAH-nh0K5RYdqLVHtIvm-fcN35TakIVYno4"
CHAT_ID="-1002202685092"  # Burada doğru chat ID'yi negatif işareti ile kullanın

# Sunucu ID
SERVER_ID="sunucu 30"  # İstediğiniz sunucu adını burada değiştirebilirsiniz

# CPU kullanımı eşiği
THRESHOLD=50

# Kontrol süresi (saniye)
CHECK_INTERVAL=$((30 * 60)) # 30 dakika

# Geçici dosya (CPU kullanımını kaydetmek için)
TEMP_FILE="/tmp/cpu_usage_$SERVER_ID.txt"

# Başlangıç mesajı gönder
curl -s -X POST "https://api.telegram.org/bot$BOT_TOKEN/sendMessage" -d chat_id="$CHAT_ID" -d text="$SERVER_ID çalışıyor."

# Geçici dosya oluştur veya temizle
> "$TEMP_FILE"

# CPU kullanımını izlemek için başlangıç zamanı
START_TIME=$(date +%s)

# CPU kullanımını izleme döngüsü
while true; do
  # Mevcut zaman damgası
  CURRENT_TIME=$(date +%s)
  
  # Süreyi kontrol et
  ELAPSED_TIME=$((CURRENT_TIME - START_TIME))

  # CPU kullanımını kontrol et
  CPU_USAGE=$(top -bn1 | grep "Cpu(s)" | sed "s/.*, *\([0-9.]*\)%* id.*/\1/" | awk '{print 100 - $1}')
  
  # Eşiği kontrol et ve logla
  if (( $(echo "$CPU_USAGE > $THRESHOLD" | bc -l) )); then
    CPU_OVER_THRESHOLD=1
    echo "$(date): CPU usage is at $CPU_USAGE%" >> "$TEMP_FILE"
  fi

  # 30 dakika geçtiyse durumu kontrol et ve yeniden başlat
  if [ "$ELAPSED_TIME" -ge "$CHECK_INTERVAL" ]; then
    if [ "${CPU_OVER_THRESHOLD:-0}" -eq 0 ]; then
      curl -s -X POST "https://api.telegram.org/bot$BOT_TOKEN/sendMessage" -d chat_id="$CHAT_ID" -d text="$SERVER_ID'da CPU kullanımı son 30 dakika boyunca %50'nin üzerine çıkmadı."
    fi
    # Yeniden başlat
    START_TIME=$(date +%s)
    CPU_OVER_THRESHOLD=0
    > "$TEMP_FILE"
  fi

  # Kontrol aralığı (saniye)
  sleep 1
done
