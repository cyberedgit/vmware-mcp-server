FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY src/ ./src/
# Required
ENV VMREST_USERNAME=""
ENV VMREST_PASSWORD=""
# Optional - set VMREST_HOST to the IP of the machine running vmrest
# when deploying in Docker/VM (vmrest runs on Windows host, not inside the container)
# Example: docker run -e VMREST_HOST=192.168.244.1 ...
ENV VMREST_HOST="localhost"
ENV VMREST_PORT="8697"
CMD ["node", "src/server.js"]