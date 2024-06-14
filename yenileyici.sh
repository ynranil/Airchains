#!/bin/bash

# Color codes
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Flag file path
FLAG_FILE="/tmp/stop_flag"

# Log file path
LOG_FILE="/root/track.log"

# Create flag file before starting the loop
touch $FLAG_FILE

# Clear the log file at the start
echo "" > $LOG_FILE

# Command running in the loop
while true; do
    # Check if flag file exists, if not, break the loop
    if [ ! -f "$FLAG_FILE" ]; then
        echo -e "${YELLOW}Flag file not found, stopping the loop...${NC}"
        break
    fi

    # Timestamp
    TIMESTAMP=$(date +"%Y-%m-%d %H:%M:%S")

    # Restart the tracksd service
    sudo systemctl restart tracksd
    
    # Show output in color
    echo -e "${GREEN}Command executed at: ${YELLOW}${TIMESTAMP}${NC}"

    # Wait for 5 seconds to allow the service to stabilize
    sleep 5

    # Run journalctl command and save the output to log file, clearing previous logs
    echo -e "${GREEN}Saving logs...${NC}"
    sudo journalctl -u tracksd -fo cat > $LOG_FILE

    echo -e "${GREEN}Logs saved to ${LOG_FILE}.${NC}"
    
    # Wait for 15 minutes (900 seconds)
    sleep 900
done

echo -e "${GREEN}Loop successfully stopped.${NC}"
