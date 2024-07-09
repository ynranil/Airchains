import subprocess
import time
import signal
import os

while True:
    try:
        # Komutu başlat
        process = subprocess.Popen(['./tracks', 'start'], stderr=subprocess.PIPE)
        print("Komut çalıştırıldı, 10 dakika bekleniyor...")

        # 10 dakika bekle
        time.sleep(600)

        # Ctrl + C sinyali gönder (SIGINT)
        os.kill(process.pid, signal.SIGINT)
        print("Ctrl + C gönderildi, komut durduruluyor...")

        # Process'in sonlanmasını bekle
        process.wait()
        print("Komut durduruldu, işlemler kontrol ediliyor...")

        # Stderr çıktısını al
        stderr_output = process.stderr.read()

        if b'rpc error' in stderr_output:
            print("rpc error hatası algılandı, işlemler gerçekleştiriliyor...")
            # systemctl stop tracksd
            subprocess.run(['systemctl', 'stop', 'tracksd'], check=True)
            # 3 kez ./tracks rollback
            for _ in range(3):
                subprocess.run(['./tracks', 'rollback'], check=True)
            # Python3 betiği durdur.py çalıştır
            subprocess.run(['python3', 'durdur.py'], check=True)
            print("İşlemler tamamlandı, döngüye devam ediliyor...")

    except Exception as e:
        print(f"Bir hata oluştu: {e}")
