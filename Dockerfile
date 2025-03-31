# Use an official Node runtime as a parent image (Debian-based)
FROM node:18-slim

# Install Python and pip
RUN apt-get update && \
    apt-get install -y python3 python3-pip && \
    rm -rf /var/lib/apt/lists/*

# Copy and install backend dependencies
# Assuming your backend is in the "doodlemind-backend" directory
WORKDIR /app
COPY doodlemind-backend/ /app
RUN pip3 install --no-cache-dir --break-system-packages -r requirements.txt

# Copy and install frontend dependencies
# Assuming your frontend is in the "doodlemind-frontend" directory
WORKDIR /frontend
COPY doodlemind-frontend/ /frontend
RUN npm install

# Expose the ports for backend and frontend
# Flask (backend) runs on port 5004 and Next.js dev server typically on 3000
EXPOSE 5004 3000

# Copy the entrypoint script into the container
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

# Run the entrypoint script
CMD ["/entrypoint.sh"]
