import subprocess
import time
import signal
import os

while True:
    try:
        # Komutu başlat
        process = subprocess.Popen(['./tracks', 'start'])
        print("Komut çalıştırıldı, 10 dakika bekleniyor...")

        # 2 dakika bekle
        time.sleep(600)

        # Ctrl + C sinyali gönder (SIGINT)
        os.kill(process.pid, signal.SIGINT)
        print("Ctrl + C gönderildi, komut durduruluyor...")

        # Process'in sonlanmasını bekle
        process.wait()
        print("Komut durduruldu, döngüye devam ediliyor...")

        # Eğer rpc error hatası varsa işlemleri gerçekleştir
        stderr_output = process.stderr.read() if process.stderr else b''
        if b'rpc error' in stderr_output:
            print("rpc error hatası algılandı, işlemler gerçekleştiriliyor...")
            # systemctl stop tracksd
            subprocess.run(['systemctl', 'stop', 'tracksd'], check=True)
            # 3 kez ./tracks rollback
            for _ in range(3):
                subprocess.run(['./tracks', 'rollback'], check=True)
            # ./tracks start
            subprocess.run(['./tracks', 'start'], check=True)
            print("İşlemler tamamlandı, döngüye devam ediliyor...")

    except Exception as e:
        print(f"Bir hata oluştu: {e}")
